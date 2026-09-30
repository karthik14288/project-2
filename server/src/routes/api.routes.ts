import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadFileHandler } from '../controllers/upload.controller.js';
import { ingestFileHandler } from '../controllers/ingest.controller.js';
import { queryHandler } from '../controllers/query.controller.js';
import { listFilesHandler, deleteFileHandler, getFileMediaHandler } from '../controllers/files.controller.js';

const router = Router();

// Multer configured for memory buffer with 50MB limit per file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max limit as specified in Section 9
  }
});

// All API endpoints protected by Supabase JWT verification
router.use(requireAuth);

// 1. Upload file (multipart/form-data)
router.post('/upload', upload.single('file'), uploadFileHandler);

// 2. Ingest file (Multimodal extraction + pgvector embedding)
router.post('/ingest', ingestFileHandler);

// 3. Query reasoning engine (Vector search + Gemini RAG + Citations)
router.post('/query', queryHandler);

// 4. File management endpoints
router.get('/files', listFilesHandler);
router.get('/files/:id/media', getFileMediaHandler);
router.delete('/files/:id', deleteFileHandler);

export default router;
