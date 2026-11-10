import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}_${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 120 * 1024 * 1024, // 120MB limit for high-definition MP4 videos
  },
});

// JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files statically with range support for video streaming
app.use('/uploads', express.static(uploadsDir));

// API Endpoint: Upload Media (QR image or 9:16 MP4 video)
app.post('/api/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// API Endpoint: Delete file
app.post('/api/delete', (req: Request, res: Response): void => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
    res.json({ success: true });
    return;
  }

  const filename = path.basename(url);
  const targetPath = path.resolve(uploadsDir, filename);

  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
    } catch (e) {
      console.warn('File deletion error:', e);
    }
  }

  res.json({ success: true });
});

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
