import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for frontend applications
app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing with generous payload limits
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Unify Backend API',
    version: '1.0.0'
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Unify Backend API',
    version: '1.0.0'
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API route does not exist'
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: 'Payload Too Large',
      message: 'Uploaded file exceeds the maximum 50MB limit.'
    });
    return;
  }

  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Unify AI Platform Server is running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
