import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Document, DocVersion } from '../types/dms';
import { useDms } from '../context/DmsContext';

interface RejectReviewModalProps {
  document: Document | null;
  version: DocVersion | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RejectReviewModal: React.FC<RejectReviewModalProps> = ({
  document,
  version,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { rejectVersion } = useDms();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !document || !version) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('退回必須填寫審核意見與修改要求（必填）');
      return;
    }

    rejectVersion(document.id, version.id, comment.trim());
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
          <div className="px-6 py-4 border-b border-slate-200 bg-rose-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  主管退回審查 (Return for Revision)
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {document.docNumber} · 版次 {version.version}
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
            <div className="p-3 bg-slate-100 rounded-lg text-slate-700 space-y-1">
              <span className="text-[11px] text-slate-500 block">待審核文件與作者：</span>
              <p className="font-semibold text-slate-900">{document.title}</p>
              <p className="text-[11px] text-slate-500">
                制定人：{version.author} · 修訂摘要：{version.revisionSummary}
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                主管退回意見與修改要求 <span className="text-rose-500">* (必填)</span>
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (error) setError('');
                }}
                placeholder="請具體說明未通過原因及撰寫人需補正之項目（如：抽樣規格未依據最新規範、測試公差計算錯誤、需補齊附件等）..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-rose-600 outline-none"
              />
              {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
              <p className="text-[11px] text-slate-500 mt-1">
                此意見將直接通知撰寫人，並完整留存於該文件的歷次審核紀錄中。
              </p>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>確認退回給撰寫人</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
