-- ====================================================================
-- Unify: Cross-Modal AI Understanding Platform
-- Supabase PostgreSQL Schema with pgvector
-- ====================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT
);

-- 3. Files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Document Chunks table (Unified Vector Index)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 dimension (768)
  metadata JSONB DEFAULT '{}'::jsonb, -- Stores { "page": 2 } or { "timestamp": "00:01:23" } or { "location": "Sector 4" }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HNSW Vector Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- 6. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Profile Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Files Policies
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
CREATE POLICY "Users can insert their own files" 
ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
CREATE POLICY "Users can view their own files" 
ON public.files FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
CREATE POLICY "Users can delete their own files" 
ON public.files FOR DELETE USING (auth.uid() = user_id);

-- Document Chunks Policies
DROP POLICY IF EXISTS "Users can insert their own chunks" ON public.document_chunks;
CREATE POLICY "Users can insert their own chunks" 
ON public.document_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own chunks" ON public.document_chunks;
CREATE POLICY "Users can view their own chunks" 
ON public.document_chunks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chunks" ON public.document_chunks;
CREATE POLICY "Users can delete their own chunks" 
ON public.document_chunks FOR DELETE USING (auth.uid() = user_id);

-- 7. Automated Profile creation on user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Stored Procedure for Cosine Vector Similarity Search (Cross-Modal retrieval)
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  user_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT,
  file_name TEXT,
  file_type TEXT,
  storage_path TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.file_id,
    dc.user_id,
    dc.content,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::FLOAT AS similarity,
    f.file_name,
    f.file_type,
    f.storage_path
  FROM public.document_chunks dc
  JOIN public.files f ON dc.file_id = f.id
  WHERE (filter_user_id IS NULL OR dc.user_id = filter_user_id)
    AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 9. Storage bucket creation (if not existing)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('unify-files', 'unify-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'unify-files'
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'unify-files');

DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
CREATE POLICY "Allow authenticated downloads" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'unify-files');

DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
CREATE POLICY "Allow public downloads" 
ON storage.objects FOR SELECT TO anon 
USING (bucket_id = 'unify-files');
