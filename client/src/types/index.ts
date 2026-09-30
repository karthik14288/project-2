export type DomainLens = 'Education' | 'Healthcare' | 'Agriculture';

export interface FileItem {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  created_at: string;
  url?: string;
  chunks_count?: number;
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

export interface RetrievedChunk {
  id: string;
  file_id: string;
  file_name?: string;
  file_type?: string;
  location: string;
  content: string;
  similarity?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  retrieved_chunks?: RetrievedChunk[];
  lens?: DomainLens;
}

export interface UserSession {
  id: string;
  email: string;
  accessToken: string;
}
