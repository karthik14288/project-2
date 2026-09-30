export type DomainLens = 'Education' | 'Healthcare' | 'Agriculture';

export interface FileRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  created_at?: string;
  url?: string;
  chunks_count?: number;
}

export interface ChunkMetadata {
  location: string; // e.g. "01:24" (timestamp), "Page 3", "Sector 4", "Image"
  page?: number;
  timestamp?: string;
  sector?: string;
  [key: string]: any;
}

export interface ExtractedChunk {
  content: string;
  location: string;
  metadata?: ChunkMetadata;
}

export interface DocumentChunkRecord {
  id: string;
  file_id: string;
  user_id: string;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
  created_at?: string;
  // Join fields for citation retrieval
  file_name?: string;
  file_type?: string;
  storage_path?: string;
  similarity?: number;
}

export interface Citation {
  file_id: string;
  file_name: string;
  location: string;
  relevant_quote: string;
  file_type?: string;
  storage_path?: string;
  url?: string;
}

export interface ReasoningResult {
  answer_markdown: string;
  citations: Citation[];
  retrieved_chunks?: DocumentChunkRecord[];
}
