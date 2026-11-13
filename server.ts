import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import {
  isR2Configured,
  getR2Config,
  verifySupabaseBearer,
  createUploadPresignedUrl,
  createDownloadPresignedUrl,
} from './server/r2.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json());

  // R2 status endpoint
  app.get('/api/r2/status', (_req, res) => {
    const { bucketName } = getR2Config();
    res.json({
      configured: isR2Configured(),
      bucket: isR2Configured() ? bucketName : null,
    });
  });

  // Generate Presigned Upload URL for direct browser -> R2 upload
  app.post('/api/r2/presign-upload', async (req, res) => {
    try {
      if (!isR2Configured()) {
        return res.status(503).json({
          error: '尚未設定 Cloudflare R2 環境變數 (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME)',
        });
      }

      const auth = await verifySupabaseBearer(req.headers.authorization);
      if (!auth.ok) {
        return res.status(401).json({ error: auth.error });
      }

      const { docNumber, version, fileName, contentType } = req.body || {};
      if (!fileName) {
        return res.status(400).json({ error: '缺少檔案名稱 (fileName)' });
      }

      const result = await createUploadPresignedUrl({
        docNumber: docNumber || 'DOC',
        version: version || 'v1.0',
        fileName,
        contentType,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('R2 presign-upload error:', err);
      return res.status(500).json({ error: err?.message || '產生 R2 上傳連結失敗' });
    }
  });

  // Generate Presigned Download URL for direct browser <- R2 download
  app.post('/api/r2/presign-download', async (req, res) => {
    try {
      if (!isR2Configured()) {
        return res.status(503).json({
          error: '尚未設定 Cloudflare R2 環境變數',
        });
      }

      const auth = await verifySupabaseBearer(req.headers.authorization);
      if (!auth.ok) {
        return res.status(401).json({ error: auth.error });
      }

      const { objectKey, fileName } = req.body || {};
      if (!objectKey) {
        return res.status(400).json({ error: '缺少檔案識別鍵 (objectKey)' });
      }

      const result = await createDownloadPresignedUrl({ objectKey, fileName });
      return res.json(result);
    } catch (err: any) {
      console.error('R2 presign-download error:', err);
      return res.status(500).json({ error: err?.message || '產生 R2 下載連結失敗' });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname ?? '.', 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex DMS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
