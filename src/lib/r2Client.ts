import { supabase, isSupabaseConfigured } from './supabase';

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
    throw new Error(errBody.error || `取得 R2 上傳授權失敗 (${presignRes.status})`);
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
        reject(new Error(`上傳檔案至 Cloudflare R2 失敗 (HTTP ${xhr.status})，請確認 R2 CORS 設定`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('連線 Cloudflare R2 失敗，請確認 R2 Bucket CORS 是否已允許目前網域 PUT 上傳'));
    };

    xhr.send(file);
  });

  return objectKey;
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
    throw new Error(errBody.error || `取得 R2 下載連結失敗 (${res.status})`);
  }

  const { downloadUrl } = await res.json();
  return downloadUrl;
}
