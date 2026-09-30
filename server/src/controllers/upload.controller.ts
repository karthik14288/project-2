import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { uploadFileToStorage, createFileRecord } from '../services/supabase.service.js';

export async function uploadFileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User ID missing from verified session' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Bad Request', message: 'No file uploaded. Expected multipart field "file"' });
      return;
    }

    // Supported formats check: .pdf, .mp3, .mp4, .wav, .jpg, .png, etc.
    const allowedExtensions = ['.pdf', '.mp3', '.mp4', '.wav', '.jpg', '.jpeg', '.png', '.txt'];
    const originalName = file.originalname || 'uploaded_document';
    const isAllowed = allowedExtensions.some(ext => originalName.toLowerCase().endsWith(ext)) ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/pdf';

    if (!isAllowed) {
      res.status(400).json({
        error: 'Unsupported File Type',
        message: 'Only PDF, MP3, MP4, WAV, JPG, and PNG files are supported.'
      });
      return;
    }

    // Upload to Supabase Storage
    const { storagePath, publicUrl } = await uploadFileToStorage(
      file.buffer,
      originalName,
      file.mimetype,
      userId
    );

    // Create record in Supabase DB
    const fileRecord = await createFileRecord(
      userId,
      originalName,
      file.mimetype,
      storagePath
    );

    res.status(201).json({
      success: true,
      message: 'File successfully uploaded to Supabase Storage and registered',
      file: {
        ...fileRecord,
        url: publicUrl
      }
    });
  } catch (err: any) {
    console.error('[Upload Handler Error]:', err);
    res.status(500).json({
      error: 'Upload Failed',
      message: err.message || 'An error occurred while uploading file'
    });
  }
}
