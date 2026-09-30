import { z } from 'zod';

export const DomainLensSchema = z.enum(['Education', 'Healthcare', 'Agriculture']);

export const QueryRequestSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters').max(1000, 'Query cannot exceed 1000 characters'),
  lens: DomainLensSchema,
  userId: z.string().uuid().optional(), // Injected securely by Auth middleware
  matchThreshold: z.number().min(0).max(1).optional().default(0.0),
  limit: z.number().int().min(1).max(30).optional().default(10)
});

export const IngestRequestSchema = z.object({
  fileId: z.string().uuid('Invalid file ID format')
});

export const ExtractedChunkSchema = z.object({
  content: z.string().min(1, 'Chunk content cannot be empty'),
  location: z.string().default('General')
});

export const ExtractedChunksListSchema = z.array(ExtractedChunkSchema);

export const CitationSchema = z.object({
  file_id: z.string().default(''),
  file_name: z.string().default('Unknown Source'),
  location: z.string().default('Unknown Location'),
  relevant_quote: z.string().default('')
});

export const ReasoningResultSchema = z.object({
  answer_markdown: z.string().min(1, 'Reasoning answer cannot be empty'),
  citations: z.array(CitationSchema).default([])
});

export type QueryRequestInput = z.infer<typeof QueryRequestSchema>;
export type IngestRequestInput = z.infer<typeof IngestRequestSchema>;
export type ExtractedChunkOutput = z.infer<typeof ExtractedChunkSchema>;
export type CitationOutput = z.infer<typeof CitationSchema>;
export type ReasoningResultOutput = z.infer<typeof ReasoningResultSchema>;
