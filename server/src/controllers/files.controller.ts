import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getUserFiles, deleteUserFile, getFileRecordById, getFileMediaUrl } from '../services/supabase.service.js';

export async function listFilesHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User ID missing from verified session' });
      return;
    }

    const files = await getUserFiles(userId);

    // Attach public URLs
    const filesWithUrls = await Promise.all(
      files.map(async file => {
        let url = file.url;
        if (!url && file.storage_path) {
          try {
            url = await getFileMediaUrl(file.storage_path);
          } catch {
            url = '';
          }
        }
        return {
          ...file,
          url
        };
      })
    );

    res.status(200).json({
      success: true,
      files: filesWithUrls
    });
  } catch (err: any) {
    console.error('[List Files Error]:', err);
    res.status(500).json({
      error: 'Failed to retrieve files',
      message: err.message
    });
  }
}

export async function deleteFileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!fileId) {
      res.status(400).json({ error: 'Bad Request', message: 'Missing file id parameter' });
      return;
    }

    const deleted = await deleteUserFile(fileId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found', message: 'File not found or permission denied' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'File and associated chunks deleted successfully'
    });
  } catch (err: any) {
    console.error('[Delete File Error]:', err);
    res.status(500).json({
      error: 'Failed to delete file',
      message: err.message
    });
  }
}

export async function getFileMediaHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const file = await getFileRecordById(fileId, userId);
    if (!file) {
      res.status(404).json({ error: 'Not Found', message: 'File not found' });
      return;
    }

    const url = await getFileMediaUrl(file.storage_path);
    res.status(200).json({
      success: true,
      url,
      file_name: file.file_name,
      file_type: file.file_type
    });
  } catch (err: any) {
    console.error('[Get Media URL Error]:', err);
    res.status(500).json({
      error: 'Failed to generate media URL',
      message: err.message
    });
  }
}
