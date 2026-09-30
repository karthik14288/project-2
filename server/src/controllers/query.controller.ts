import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { QueryRequestSchema } from '../schemas.js';
import { generateEmbedding, synthesizeCrossModalAnswer } from '../services/gemini.service.js';
import { searchSimilarChunks } from '../services/vector.service.js';
import { getFileMediaUrl } from '../services/supabase.service.js';

export async function queryHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User ID missing from verified session' });
      return;
    }

    // Strict Zod Validation
    const validation = QueryRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
      return;
    }

    const { query, lens, matchThreshold, limit } = validation.data;

    console.log(`[Query] Generating query embedding for: "${query}" (Lens: ${lens})...`);
    const queryEmbedding = await generateEmbedding(query);

    // Retrieve cross-modal chunks via vector similarity (filtered by userId)
    console.log(`[Query] Performing vector similarity search in document_chunks for user ${userId}...`);
    const retrievedChunks = await searchSimilarChunks(
      queryEmbedding,
      userId,
      matchThreshold,
      limit
    );

    console.log(`[Query] Retrieved ${retrievedChunks.length} matching cross-modal chunks.`);

    // Synthesize structured cross-modal answer with verifiable citation trails
    const reasoningResult = await synthesizeCrossModalAnswer(
      query,
      lens,
      retrievedChunks
    );

    // Hydrate citations with playable / viewable media URLs
    const hydratedCitations = await Promise.all(
      reasoningResult.citations.map(async citation => {
        let mediaUrl = citation.url;
        if (!mediaUrl && citation.storage_path) {
          try {
            mediaUrl = await getFileMediaUrl(citation.storage_path);
          } catch {
            // Keep empty if url generation failed
          }
        }
        return {
          ...citation,
          url: mediaUrl
        };
      })
    );

    res.status(200).json({
      success: true,
      answer_markdown: reasoningResult.answer_markdown,
      citations: hydratedCitations,
      retrieved_chunks_count: retrievedChunks.length,
      retrieved_chunks: retrievedChunks.map(c => ({
        id: c.id,
        file_id: c.file_id,
        file_name: c.file_name,
        file_type: c.file_type,
        location: c.metadata?.location || 'General',
        content: c.content,
        similarity: c.similarity
      }))
    });
  } catch (err: any) {
    console.error('[Query Handler Error]:', err);
    res.status(500).json({
      error: 'Query Synthesis Failed',
      message: err.message || 'An error occurred during cross-modal reasoning'
    });
  }
}
