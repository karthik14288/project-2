import { supabaseAdmin, getFallbackChunks } from './supabase.service.js';
import { DocumentChunkRecord } from '../types.js';

/**
 * Calculates cosine similarity between two numeric vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Searches for the most relevant document chunks matching the query embedding
 * Uses pgvector cosine similarity function in Supabase with in-memory fallback
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  userId: string,
  threshold = 0.0,
  limit = 10
): Promise<DocumentChunkRecord[]> {
  try {
    // Attempt pgvector search via Supabase RPC function match_document_chunks
    const { data, error } = await supabaseAdmin.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: userId
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as DocumentChunkRecord[];
    }
  } catch {
    // Continue to resilient local vector calculation
  }

  // Fallback: Query all chunks for this user from DB or memory and calculate cosine similarity
  try {
    const { data: dbChunks, error: dbErr } = await supabaseAdmin
      .from('document_chunks')
      .select('*, files(file_name, file_type, storage_path)')
      .eq('user_id', userId);

    let chunksToScore: DocumentChunkRecord[] = [];

    if (!dbErr && dbChunks && dbChunks.length > 0) {
      chunksToScore = dbChunks.map((c: any) => ({
        id: c.id,
        file_id: c.file_id,
        user_id: c.user_id,
        content: c.content,
        embedding: c.embedding,
        metadata: c.metadata,
        created_at: c.created_at,
        file_name: c.files?.file_name,
        file_type: c.files?.file_type,
        storage_path: c.files?.storage_path
      }));
    } else {
      // Memory cache chunks
      chunksToScore = getFallbackChunks(userId);
    }

    if (chunksToScore.length === 0) {
      return [];
    }

    // Rank chunks by cosine similarity
    const scoredChunks = chunksToScore
      .map(chunk => {
        let sim = 0.5;
        if (chunk.embedding && chunk.embedding.length > 0) {
          sim = calculateCosineSimilarity(queryEmbedding, chunk.embedding);
        }
        return {
          ...chunk,
          similarity: sim
        };
      })
      .filter(chunk => (chunk.similarity ?? 0) >= threshold)
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, limit);

    return scoredChunks;
  } catch (err: any) {
    console.error('[Vector Search Error]:', err);
    return [];
  }
}
