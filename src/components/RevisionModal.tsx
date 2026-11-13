import React, { useState } from 'react';
import { X, Upload, FileCode, CheckCircle2, AlertCircle, Info, ArrowUpRight } from 'lucide-react';
import { Document, AttachedFile } from '../types/dms';
import { useDms } from '../context/DmsContext';
import { uploadDocumentBinary, formatFileSize, detectFileExtensionType } from '../lib/r2Client';
import { isSupabaseConfigured } from '../lib/supabase';

interface RevisionModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { initiateRevision, r2Configured } = useDms();

  const [versionType, setVersionType] = useState<'major' | 'minor'>('major');
  const [revisionSummary, setRevisionSummary] = useState('');
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  if (!isOpen || !document) return null;

  // Calculate predicted new version
  const curVer = document.currentVersion || 'v1.0';
  const match = curVer.match(/^v?(\d+)\.(\d+)$/);
  const major = match ? parseInt(match[1], 10) : 1;
  const minor = match ? parseInt(match[2], 10) : 0;
  const nextMajorVer = `v${major + 1}.0`;
  const nextMinorVer = `v${major}.${minor + 1}`;
  const targetVersion = versionType === 'major' ? nextMajorVer : nextMinorVer;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawFile(file);
      setError('');
      setAttachedFile({
        name: file.name,
        size: formatFileSize(file.size),
        type: detectFileExtensionType(file.name),
        uploadDate: new Date().toLocaleDateString('zh-TW'),
      });
    }
  };

  const handleSubmit = async (submitForReview: boolean) => {
    if (!attachedFile) {
      setError('請選擇新版實體文件檔案');
      return;
    }
    if (!revisionSummary.trim()) {
      setError('請填寫本次改版修訂摘要說明（必填）');
      return;
    }

    let finalFile = attachedFile;
    if (rawFile && (r2Configured || isSupabaseConfigured())) {
      setUploading(true);
      setUploadProgress(0);
      try {
        const storedUrl = await uploadDocumentBinary(
          rawFile,
          document.docNumber,
          targetVersion,
          r2Configured,
          setUploadProgress
        );
        if (storedUrl) {
          finalFile = {
            ...attachedFile,
            fileUrl: storedUrl,
          };
        }
      } catch (err: any) {
        setError(err?.message || '上傳檔案失敗，請稍後再試');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    initiateRevision({
      docId: document.id,
      versionType,
      revisionSummary: revisionSummary.trim(),
      file: finalFile,
      submitForReview,
    });

    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                發起文件改版申請 (Initiate Revision)
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {document.docNumber} · {document.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Important Business Rule Explanation Box */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <span>核心業務規則提示：</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              改版審核期間，原先之 <strong>{curVer}</strong> 版仍維持「已生效」狀態供全體員工查閱；直到主管於「待我審核」中點擊「核准」，系統才會自動將本文件升版為 <strong>{targetVersion}</strong>，並將舊版 <strong>{curVer}</strong> 自動標記為「已作廢（歷史封存）」。
            </p>
          </div>

          {/* Version Selection */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              選擇改版升級級別：
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVersionType('major')}
                className={`p-3 text-left rounded-lg border transition-all ${
                  versionType === 'major'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">主版次升級 (Major)</span>
                  <span className="font-mono font-bold text-blue-700">{nextMajorVer}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  重大製程規格變更、重大量測參數修訂或標準法規更新。
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVersionType('minor')}
                className={`p-3 text-left rounded-lg border transition-all ${
                  versionType === 'minor'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">次版次修訂 (Minor)</span>
                  <span className="font-mono font-bold text-blue-700">{nextMinorVer}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  文字細節微調、局部公差寬裕度調整或勘誤更新。
                </p>
              </button>
            </div>
          </div>

          {/* File Upload for New Revision */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                上傳新版實體檔案 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {r2Configured
                  ? 'R2 / B2 雲端物件儲存已就緒'
                  : isSupabaseConfigured()
                  ? 'Supabase 試行儲存 (單檔 ≤ 50 MB)'
                  : '僅保留檔名紀錄'}
              </span>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-3.5 text-center bg-slate-50/50">
              <input
                type="file"
                id="revision-file-upload"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="revision-file-upload"
                className="cursor-pointer flex flex-col items-center gap-1"
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-700 text-xs">
                  點擊選擇更新後之新版檔案
                </span>
              </label>

              {attachedFile && (
                <div className="mt-2 p-1.5 bg-white rounded border border-slate-200 inline-flex items-center gap-2 text-xs">
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono font-medium text-slate-800">
                    {attachedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({attachedFile.size})
                  </span>
                </div>
              )}

              {uploading && (
                <div className="mt-2 max-w-xs mx-auto space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-blue-700">
                    <span>
                      {r2Configured ? '正在上傳新版至雲端物件儲存...' : '正在上傳新版至 Supabase 儲存空間...'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Revision Summary */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              本次改版修訂摘要 (必填，將呈現於審核紀錄與履歷中) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={revisionSummary}
              onChange={(e) => {
                setRevisionSummary(e.target.value);
                if (error) setError('');
              }}
              placeholder="請詳細說明本次改版原因（如：客戶要求、製程良率改善、變更管制參數...）"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-slate-900 outline-none"
            />
            {error && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            取消
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors disabled:opacity-50"
            >
              儲存為改版草稿
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{uploading ? `上傳中 (${uploadProgress}%)` : `送出改版審核 (${targetVersion})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
