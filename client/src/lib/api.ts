import { getAuthToken } from './supabase.js';
import { DomainLens, FileItem, Citation, RetrievedChunk } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : ''
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file: FileItem;
}

export interface IngestResponse {
  success: boolean;
  message: string;
  fileId: string;
  fileName: string;
  chunksCount: number;
  chunks: Array<{ content: string; location: string }>;
}

export interface QueryResponse {
  success: boolean;
  answer_markdown: string;
  citations: Citation[];
  retrieved_chunks_count: number;
  retrieved_chunks: RetrievedChunk[];
}

export async function uploadFileApi(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/upload`);
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          reject(new Error(response.message || response.error || 'Upload failed'));
        }
      } catch (e) {
        reject(new Error(`Failed to parse upload response: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.send(formData);
  });
}

export async function ingestFileApi(fileId: string): Promise<IngestResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileId })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Ingestion failed');
  }

  return data;
}

export async function queryReasoningEngineApi(
  query: string,
  lens: DomainLens
): Promise<QueryResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/query`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, lens })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Query failed');
  }

  return data;
}

export async function fetchUserFilesApi(): Promise<FileItem[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/files`, {
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to fetch files');
  }

  return data.files || [];
}

export async function deleteUserFileApi(fileId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/files/${fileId}`, {
    method: 'DELETE',
    headers
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Failed to delete file');
  }
}
