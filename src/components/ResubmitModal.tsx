import React, { useState } from 'react';
import { X, Upload, FileCode, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { Document, DocVersion, AttachedFile } from '../types/dms';
import { useDms } from '../context/DmsContext';

interface ResubmitModalProps {
  document: Document | null;
  version: DocVersion | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResubmitModal: React.FC<ResubmitModalProps> = ({
  document,
  version,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { resubmitDraft } = useDms();
  const [summary, setSummary] = useState(version ? version.revisionSummary : '');
  const [file, setFile] = useState<AttachedFile>(
    version ? version.file : {
      name: 'revised_file.pdf',
      size: '2.5 MB',
      type: 'pdf',
      uploadDate: new Date().toLocaleDateString('zh-TW'),
    }
  );
  const [error, setError] = useState('');

  if (!isOpen || !document || !version) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      let fType: 'pdf' | 'docx' | 'xlsx' = 'pdf';
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext === 'docx' || ext === 'doc') fType = 'docx';
      else if (ext === 'xlsx' || ext === 'xls') fType = 'xlsx';

      setFile({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: fType,
        uploadDate: new Date().toLocaleDateString('zh-TW'),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError('修訂摘要為必填項目');
      return;
    }

    resubmitDraft(document.id, version.id, summary.trim(), file);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  編輯並重新送出審核 (Resubmit Review)
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {document.docNumber} · {version.version}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {/* Show supervisor's previous rejection note */}
            {version.reviewComment && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>主管前次審核退回意見：</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed font-normal">
                  {version.reviewComment}
                </p>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                更新本次修訂摘要 (請說明針對退回意見所做的修改) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-slate-900 outline-none"
              />
              {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                替換修正後的實體檔案 (選填，若無更動可保留原檔)
              </label>
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span className="font-mono text-slate-800">{file.name}</span>
                  <span className="text-slate-500">({file.size})</span>
                </div>
                <label className="cursor-pointer px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700">
                  重新選擇檔案
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.doc,.xlsx,.xls"
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>重新送出主管審核</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
