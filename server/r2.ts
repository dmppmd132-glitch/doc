import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
  const bucketName = process.env.R2_BUCKET_NAME?.trim() || '';
  const region = process.env.R2_REGION?.trim() || 'auto';
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    region,
    endpoint,
  };
}

export function isR2Configured(): boolean {
  const { endpoint, accessKeyId, secretAccessKey, bucketName } = getR2Config();
  return Boolean(endpoint && accessKeyId && secretAccessKey && bucketName);
}

function createR2Client(): S3Client {
  const { endpoint, region, accessKeyId, secretAccessKey } = getR2Config();
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('雲端儲存 (R2 / Backblaze B2) 環境變數尚未設定完成');
  }
  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function verifySupabaseBearer(authHeader?: string): Promise<{ ok: boolean; error?: string }> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    // Allow when Supabase env is not mounted on server side
    return { ok: true };
  }

  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { ok: false, error: '未授權存取：缺少登入憑證 (Authorization Bearer Token)' };
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, error: '登入憑證無效或已過期，請重新登入' };
  }

  return { ok: true };
}

export async function createUploadPresignedUrl(params: {
  docNumber: string;
  version: string;
  fileName: string;
  contentType?: string;
}): Promise<{ uploadUrl: string; objectKey: string }> {
  const { bucketName } = getR2Config();
  const s3 = createR2Client();

  const safeDoc = (params.docNumber || 'DOC').replace(/[^a-zA-Z0-9._-\u4e00-\u9fff]/g, '_');
  const safeVer = (params.version || 'v1.0').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeFile = (params.fileName || 'document.bin').replace(/[/\\?%*:|"<>]/g, '_');

  const objectKey = `documents/${safeDoc}/${safeVer}/${Date.now()}_${safeFile}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: params.contentType || 'application/octet-stream',
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
  return { uploadUrl, objectKey };
}

export async function createDownloadPresignedUrl(params: {
  objectKey: string;
  fileName?: string;
}): Promise<{ downloadUrl: string }> {
  const { bucketName } = getR2Config();
  const s3 = createR2Client();

  const cleanKey = params.objectKey.replace(/^r2:\/\//, '');
  const fallbackName = cleanKey.split('/').pop() || 'document';
  const downloadName = params.fileName || fallbackName;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
  });

  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  return { downloadUrl };
}
