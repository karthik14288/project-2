import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { IngestRequestSchema } from '../schemas.js';
import { getFileRecordById, downloadFileFromStorage, insertDocumentChunks } from '../services/supabase.service.js';
import { extractMultimodalChunks, generateEmbedding } from '../services/gemini.service.js';

export async function ingestFileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User ID missing from verified session' });
      return;
    }

    // Validate request body
    const parseResult = IngestRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: parseResult.error.errors.map(e => e.message).join(', ')
      });
      return;
    }

    const { fileId } = parseResult.data;

    // Fetch file record
    const fileRecord = await getFileRecordById(fileId, userId);
    if (!fileRecord) {
      res.status(404).json({
        error: 'Not Found',
        message: 'File record not found or does not belong to the authenticated user'
      });
      return;
    }

    // Download file buffer from Supabase Storage
    const fileBuffer = await downloadFileFromStorage(fileRecord.storage_path);

    // Multimodal AI Extraction with timestamps/pages/sectors
    console.log(`[Ingest] Extracting multimodal chunks for "${fileRecord.file_name}" (${fileRecord.file_type})...`);
    const extractedChunks = await extractMultimodalChunks(
      fileBuffer,
      fileRecord.file_type,
      fileRecord.file_name
    );

    if (extractedChunks.length === 0) {
      res.status(422).json({
        error: 'Extraction Warning',
        message: 'Could not extract readable chunks from this file'
      });
      return;
    }

    // Generate 768-dimensional embeddings for each chunk
    console.log(`[Ingest] Vectorizing ${extractedChunks.length} chunks via Gemini Embedding...`);
    const chunksToInsert = await Promise.all(
      extractedChunks.map(async chunk => {
        const embedding = await generateEmbedding(chunk.content);
        return {
          file_id: fileId,
          user_id: userId,
          content: chunk.content,
          embedding,
          metadata: {
            location: chunk.location,
            ...chunk.metadata
          }
        };
      })
    );

    // Persist into Supabase document_chunks (unified index)
    const insertedCount = await insertDocumentChunks(chunksToInsert);

    res.status(200).json({
      success: true,
      message: `Successfully ingested and indexed ${insertedCount} multimodal chunks`,
      fileId,
      fileName: fileRecord.file_name,
      chunksCount: insertedCount,
      chunks: extractedChunks
    });
  } catch (err: any) {
    console.error('[Ingest Handler Error]:', err);
    res.status(500).json({
      error: 'Ingest Failed',
      message: err.message || 'An error occurred during file ingestion and vectorization'
    });
  }
}
