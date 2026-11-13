import {
  isR2Configured,
  verifySupabaseBearer,
  createDownloadPresignedUrl,
} from '../../server/r2.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: '尚未設定 Cloudflare R2 環境變數',
      });
    }

    const auth = await verifySupabaseBearer(req.headers?.authorization);
    if (!auth.ok) {
      return res.status(401).json({ error: auth.error });
    }

    const { objectKey, fileName } = req.body || {};
    if (!objectKey) {
      return res.status(400).json({ error: '缺少檔案識別鍵 (objectKey)' });
    }

    const result = await createDownloadPresignedUrl({ objectKey, fileName });
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Vercel R2 presign-download error:', err);
    return res.status(500).json({ error: err?.message || '產生 R2 下載連結失敗' });
  }
}
