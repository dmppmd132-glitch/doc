import {
  isR2Configured,
  verifySupabaseBearer,
  createUploadPresignedUrl,
} from '../../server/r2.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: '尚未設定 Cloudflare R2 環境變數 (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME)',
      });
    }

    const auth = await verifySupabaseBearer(req.headers?.authorization);
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

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Vercel R2 presign-upload error:', err);
    return res.status(500).json({ error: err?.message || '產生 R2 上傳連結失敗' });
  }
}
