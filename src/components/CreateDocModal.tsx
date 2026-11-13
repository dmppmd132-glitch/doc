import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';
import { DocType, Department, AttachedFile } from '../types/dms';
import { useDms } from '../context/DmsContext';
import { uploadFileToR2, formatFileSize, detectFileExtensionType } from '../lib/r2Client';

interface CreateDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (docId: string) => void;
}

const DOC_TYPES: DocType[] = ['SOP', 'SPEC', '表單', '規範'];
const DEPARTMENTS: Department[] = ['QA', 'ME', 'PM'];

export const CreateDocModal: React.FC<CreateDocModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createDocument, generateDocNumber, r2Configured } = useDms();

  const [docType, setDocType] = useState<DocType>('SOP');
  const [department, setDepartment] = useState<Department>('QA');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [revisionSummary, setRevisionSummary] = useState('初版發布，建立各項標準操作指引與檢驗項目。');

  // Real File upload state
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const [errors, setErrors] = useState<{ title?: string; summary?: string; file?: string }>({});

  if (!isOpen) return null;

  const previewDocNumber = generateDocNumber(docType, department);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawFile(file);
      setUploadError('');
      setErrors((prev) => ({ ...prev, file: undefined }));

      setAttachedFile({
        name: file.name,
        size: formatFileSize(file.size),
        type: detectFileExtensionType(file.name),
        uploadDate: new Date().toLocaleDateString('zh-TW'),
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: { title?: string; summary?: string; file?: string } = {};
    if (!title.trim()) {
      newErrors.title = '請輸入文件名稱';
    }
    if (!attachedFile) {
      newErrors.file = '請選擇要上傳的實體文件檔案';
    }
    if (!revisionSummary.trim()) {
      newErrors.summary = '「本次修訂摘要」為必填欄位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (submitForReview: boolean) => {
    if (!validate() || !attachedFile) return;

    setUploadError('');
    let finalFile: AttachedFile = attachedFile;

    if (rawFile && r2Configured) {
      setUploading(true);
      setUploadProgress(0);
      try {
        const objectKey = await uploadFileToR2(rawFile, previewDocNumber, 'v1.0', setUploadProgress);
        finalFile = {
          ...attachedFile,
          fileUrl: objectKey,
        };
      } catch (err: any) {
        setUploadError(err?.message || '上傳檔案至 Cloudflare R2 失敗');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const newDoc = createDocument({
      title: title.trim(),
      docType,
      department,
      description: description.trim(),
      revisionSummary: revisionSummary.trim(),
      file: finalFile,
      submitForReview,
    });

    onClose();
    onSuccess(newDoc.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">新增內部 SOP / SPEC 文件</h3>
            <p className="text-xs text-slate-500">
              系統將自動分配標準文件編號並建立初始版本 (v1.0)。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Document Type & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                文件類型 (Doc Type) <span className="text-rose-500">*</span>
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs focus:bg-white focus:border-slate-900 outline-none"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} ({t === 'SOP' ? '標準作業程序' : t === 'SPEC' ? '工程規格書' : t})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                所屬部門 (Department) <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs focus:bg-white focus:border-slate-900 outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generated Doc Number Preview */}
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">系統自動生成之文件編號：</span>
              <span className="text-sm font-mono font-bold text-slate-900">
                {previewDocNumber}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-300 font-mono">
              初始版次：v1.0
            </span>
          </div>

          {/* Title */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              文件名稱 (Document Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：高溫回焊爐溫控程序標準、車載通訊模組硬體規格書"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-slate-900 outline-none"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              文件簡述與範圍 (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="說明此文件的主要目的、適用對象與涵蓋之產品線..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-slate-900 outline-none"
            />
          </div>

          {/* File Upload Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                上傳實體文件檔案 (支援 PDF、Word、Excel、圖檔或壓縮檔) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {r2Configured ? 'Cloudflare R2 雲端儲存已就緒' : '尚未設定 R2 僅保留檔名紀錄'}
              </span>
            </div>
            <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-4 text-center bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-1.5"
              >
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="font-medium text-slate-700">點擊選擇實體檔案上傳</span>
                <span className="text-[10px] text-slate-500">
                  支援 PDF、Word、Excel、PPT、CAD 圖檔或 ZIP 等任意格式
                </span>
              </label>

              {attachedFile && (
                <div className="mt-3 p-2 bg-white rounded border border-slate-200 inline-flex items-center gap-2 text-xs">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span className="font-mono font-medium text-slate-800">
                    {attachedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({attachedFile.size})
                  </span>
                </div>
              )}

              {uploading && (
                <div className="mt-3 max-w-xs mx-auto space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-blue-700">
                    <span>正在上傳至 Cloudflare R2...</span>
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
            {(errors.file || uploadError) && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{uploadError || errors.file}</span>
              </p>
            )}
          </div>

          {/* Mandatory Revision Summary */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              本次修訂摘要 (Revision Summary) <span className="text-rose-500">* (必填)</span>
            </label>
            <textarea
              rows={2}
              value={revisionSummary}
              onChange={(e) => setRevisionSummary(e.target.value)}
              placeholder="請詳細敘述本次發起或修改之重點項目（此內容將永久記錄於審核軌跡中）..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-slate-900 outline-none"
            />
            {errors.summary && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.summary}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
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
              {uploading ? '上傳中...' : '儲存為草稿'}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{uploading ? `上傳中 (${uploadProgress}%)` : '送出主管審核'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
