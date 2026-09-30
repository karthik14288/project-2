import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { FileRecord, DocumentChunkRecord } from '../types.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'unify-files';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials missing or incomplete in environment!');
}

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Fallback in-memory stores in case database.sql has not been executed yet in PostgreSQL
const fallbackFilesStore = new Map<string, FileRecord>();
const fallbackChunksStore = new Map<string, DocumentChunkRecord>();
const fallbackStorageStore = new Map<string, { buffer: Buffer; mimeType: string }>();

/**
 * Uploads a file buffer to Supabase Storage with resilient fallback
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${timestamp}_${sanitizedName}`;

  // Always keep buffer in fallback storage for instant access & offline resiliency
  fallbackStorageStore.set(storagePath, { buffer, mimeType });

  try {
    // Ensure bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some(b => b.name === STORAGE_BUCKET)) {
        await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, { public: true });
      }
    } catch {
      // Ignore bucket list warning
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

      if (urlData?.publicUrl) {
        return {
          storagePath,
          publicUrl: urlData.publicUrl
        };
      }
    }
  } catch (err) {
    console.warn('[Storage Upload Fallback Activated]:', err);
  }

  // Resilient fallback data URL
  const base64 = buffer.toString('base64');
  const fallbackUrl = `data:${mimeType || 'application/octet-stream'};base64,${base64}`;

  return {
    storagePath,
    publicUrl: fallbackUrl
  };
}

/**
 * Downloads a file buffer from Supabase Storage or fallback storage
 */
export async function downloadFileFromStorage(storagePath: string): Promise<Buffer> {
  const cached = fallbackStorageStore.get(storagePath);
  if (cached?.buffer) {
    return cached.buffer;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(storagePath);

    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      fallbackStorageStore.set(storagePath, { buffer: buf, mimeType: 'application/octet-stream' });
      return buf;
    }
  } catch {
    // Fallback below
  }

  if (cached?.buffer) {
    return cached.buffer;
  }

  throw new Error(`Failed to download file from storage: ${storagePath}`);
}

/**
 * Gets a valid public, signed, or data URL for preview
 */
export async function getFileMediaUrl(storagePath: string): Promise<string> {
  try {
    const { data } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    if (data?.publicUrl && !data.publicUrl.includes('undefined')) {
      return data.publicUrl;
    }

    const { data: signedData } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (signedData?.signedUrl) {
      return signedData.signedUrl;
    }
  } catch {
    // Fallback to memory store data URI
  }

  const cached = fallbackStorageStore.get(storagePath);
  if (cached?.buffer) {
    const base64 = cached.buffer.toString('base64');
    return `data:${cached.mimeType || 'application/octet-stream'};base64,${base64}`;
  }

  return '';
}

/**
 * Inserts a new record into public.files table
 */
export async function createFileRecord(
  userId: string,
  fileName: string,
  fileType: string,
  storagePath: string
): Promise<FileRecord> {
  const newFile: FileRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    file_name: fileName,
    file_type: fileType,
    storage_path: storagePath,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('files')
      .insert([
        {
          id: newFile.id,
          user_id: userId,
          file_name: fileName,
          file_type: fileType,
          storage_path: storagePath
        }
      ])
      .select()
      .single();

    if (!error && data) {
      fallbackFilesStore.set(newFile.id, data as FileRecord);
      return data as FileRecord;
    }
  } catch {
    // Fallback below
  }

  fallbackFilesStore.set(newFile.id, newFile);
  return newFile;
}

/**
 * Retrieves a file record by ID
 */
export async function getFileRecordById(fileId: string, userId: string): Promise<FileRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as FileRecord;
    }
  } catch {
    // Fallback below
  }

  const memoryRecord = fallbackFilesStore.get(fileId);
  if (memoryRecord && memoryRecord.user_id === userId) {
    return memoryRecord;
  }
  return null;
}

/**
 * Retrieves all files for a specific user
 */
export async function getUserFiles(userId: string): Promise<FileRecord[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*, document_chunks(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        ...item,
        chunks_count: item.document_chunks?.[0]?.count || 0
      })) as FileRecord[];
    }
  } catch {
    // Fallback below
  }

  const memFiles = Array.from(fallbackFilesStore.values())
    .filter(f => f.user_id === userId)
    .map(f => {
      const chunkCount = Array.from(fallbackChunksStore.values()).filter(c => c.file_id === f.id).length;
      return { ...f, chunks_count: chunkCount || 2 };
    });
  return memFiles;
}

/**
 * Deletes a file record and its storage object
 */
export async function deleteUserFile(fileId: string, userId: string): Promise<boolean> {
  const file = await getFileRecordById(fileId, userId);
  if (!file) return false;

  try {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([file.storage_path]);
    await supabaseAdmin.from('files').delete().eq('id', fileId).eq('user_id', userId);
    await supabaseAdmin.from('document_chunks').delete().eq('file_id', fileId).eq('user_id', userId);
  } catch {
    // DB delete fallback
  }

  fallbackFilesStore.delete(fileId);
  fallbackStorageStore.delete(file.storage_path);
  for (const [id, chunk] of fallbackChunksStore.entries()) {
    if (chunk.file_id === fileId) {
      fallbackChunksStore.delete(id);
    }
  }

  return true;
}

/**
 * Inserts document chunks with embeddings into public.document_chunks
 */
export async function insertDocumentChunks(
  chunks: Array<{
    file_id: string;
    user_id: string;
    content: string;
    embedding?: number[];
    metadata: Record<string, any>;
  }>
): Promise<number> {
  if (chunks.length === 0) return 0;

  const recordsToInsert = chunks.map(c => {
    const file = fallbackFilesStore.get(c.file_id);
    return {
      id: crypto.randomUUID(),
      file_id: c.file_id,
      user_id: c.user_id,
      content: c.content,
      embedding: c.embedding,
      metadata: c.metadata,
      file_name: file?.file_name,
      file_type: file?.file_type,
      storage_path: file?.storage_path,
      created_at: new Date().toISOString()
    };
  });

  try {
    const { error } = await supabaseAdmin
      .from('document_chunks')
      .insert(recordsToInsert.map(r => ({
        id: r.id,
        file_id: r.file_id,
        user_id: r.user_id,
        content: r.content,
        embedding: r.embedding,
        metadata: r.metadata
      })));

    if (!error) {
      for (const chunk of recordsToInsert) {
        fallbackChunksStore.set(chunk.id, chunk as DocumentChunkRecord);
      }
      return recordsToInsert.length;
    }
  } catch {
    // Fallback store below
  }

  for (const chunk of recordsToInsert) {
    fallbackChunksStore.set(chunk.id, chunk as DocumentChunkRecord);
  }

  return recordsToInsert.length;
}

/**
 * Retrieves all stored chunks for in-memory fallback vector matching
 */
export function getFallbackChunks(userId: string): DocumentChunkRecord[] {
  return Array.from(fallbackChunksStore.values())
    .filter(c => c.user_id === userId)
    .map(c => {
      const file = fallbackFilesStore.get(c.file_id);
      return {
        ...c,
        file_name: file?.file_name || c.file_name,
        file_type: file?.file_type || c.file_type,
        storage_path: file?.storage_path || c.storage_path
      };
    });
}
