import { supabase, isSupabaseConfigured } from './supabase';

export const SUPABASE_STORAGE_BUCKET = 'dms-files';
export const SUPABASE_MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB Free Tier limit

export interface R2StatusResponse {
  configured: boolean;
  bucket: string | null;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (isSupabaseConfigured()) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function detectFileExtensionType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'docx';
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'xlsx';
  return ext || 'file';
}

export async function checkR2Status(): Promise<R2StatusResponse> {
  try {
    const res = await fetch('/api/r2/status');
    if (!res.ok) return { configured: false, bucket: null };
    return await res.json();
  } catch {
    return { configured: false, bucket: null };
  }
}

export async function uploadFileToR2(
  file: File,
  docNumber: string,
  version: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const headers = await getAuthHeaders();

  const presignRes = await fetch('/api/r2/presign-upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      docNumber,
      version,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    }),
  });

  if (!presignRes.ok) {
    const errBody = await presignRes.json().catch(() => ({}));
    throw new Error(errBody.error || `取得 R2 / B2 上傳授權失敗 (${presignRes.status})`);
  }

  const { uploadUrl, objectKey } = await presignRes.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`上傳檔案至雲端物件儲存失敗 (HTTP ${xhr.status})，請確認 Bucket CORS 設定`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('連線雲端物件儲存失敗，請確認 Bucket CORS 是否已允許目前網域 PUT 上傳'));
    };

    xhr.send(file);
  });

  return objectKey;
}

export async function uploadFileToSupabase(
  file: File,
  docNumber: string,
  version: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('尚未設定 Supabase 連線環境變數');
  }

  if (file.size > SUPABASE_MAX_FILE_BYTES) {
    throw new Error(
      `目前使用 Supabase 免費版試行儲存，單檔上限為 50 MB（此檔案大小為 ${formatFileSize(
        file.size
      )}）。若需上傳超過 50 MB 的檔案，請改接 Backblaze B2 或 Cloudflare R2。`
    );
  }

  if (onProgress) onProgress(15);

  const safeDoc = (docNumber || 'DOC').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeVer = (version || 'v1.0').replace(/[^a-zA-Z0-9._-]/g, '_');
  const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
  const asciiBase = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 48);
  const finalName = `${Date.now()}_${asciiBase || 'document'}${ext}`;
  const storagePath = `documents/${safeDoc}/${safeVer}/${finalName}`;

  if (onProgress) onProgress(35);

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    if (
      error.message?.toLowerCase().includes('bucket') ||
      error.message?.toLowerCase().includes('not found')
    ) {
      throw new Error(
        `Supabase 尚未建立「${SUPABASE_STORAGE_BUCKET}」儲存桶，請先於 Supabase SQL Editor 執行最新 supabase-schema.sql（或手動建立 dms-files Bucket）。`
      );
    }
    throw new Error(`上傳至 Supabase Storage 失敗：${error.message}`);
  }

  if (onProgress) onProgress(100);
  return `sb://${SUPABASE_STORAGE_BUCKET}/${storagePath}`;
}

export async function uploadDocumentBinary(
  file: File,
  docNumber: string,
  version: string,
  r2Configured: boolean,
  onProgress?: (percent: number) => void
): Promise<string | undefined> {
  if (r2Configured) {
    return uploadFileToR2(file, docNumber, version, onProgress);
  }
  if (isSupabaseConfigured()) {
    return uploadFileToSupabase(file, docNumber, version, onProgress);
  }
  return undefined;
}

export async function getR2DownloadUrl(objectKey: string, fileName: string): Promise<string> {
  const headers = await getAuthHeaders();

  const res = await fetch('/api/r2/presign-download', {
    method: 'POST',
    headers,
    body: JSON.stringify({ objectKey, fileName }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `取得 R2 / B2 下載連結失敗 (${res.status})`);
  }

  const { downloadUrl } = await res.json();
  return downloadUrl;
}

export async function getSupabaseDownloadUrl(sbUri: string, fileName: string): Promise<string> {
  const stripped = sbUri.replace(/^sb:\/\//, '');
  const slashIdx = stripped.indexOf('/');
  if (slashIdx === -1) {
    throw new Error('無效的 Supabase Storage 檔案路徑');
  }
  const bucket = stripped.slice(0, slashIdx);
  const path = stripped.slice(slashIdx + 1);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 900, { download: fileName });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || '產生 Supabase 檔案下載連結失敗');
  }

  return data.signedUrl;
}
