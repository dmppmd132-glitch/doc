import React from 'react';
import {
  Edit3,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Trash2,
  FileText,
  FileCode,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Document, DocVersion } from '../types/dms';
import { useDms } from '../context/DmsContext';

interface MyDraftsViewProps {
  onSelectDocument: (doc: Document) => void;
  onOpenResubmit: (doc: Document, version: DocVersion) => void;
  onOpenCreate: () => void;
}

export const MyDraftsView: React.FC<MyDraftsViewProps> = ({
  onSelectDocument,
  onOpenResubmit,
  onOpenCreate,
}) => {
  const { documents, currentUser, deleteDocumentDraft } = useDms();

  // Find all drafts or pending versions created by or assigned
  // For practical ease, we show all drafts/returned items and in-review items
  const draftOrPendingItems = documents.flatMap((doc) => {
    return doc.versions
      .filter((v) => v.status === '草稿' || v.status === '審核中')
      .map((version) => ({ doc, version }));
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            我的草稿與送審申請 (My Drafts & Submissions)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            追蹤您起草中的文件、送審中案件，以及主管退回需補充修正之草稿。
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>起草新文件</span>
        </button>
      </div>

      {draftOrPendingItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <Edit3 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">目前無草稿或審核中申請</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            您可以隨時點擊「起草新文件」或針對現行已生效文件點擊「申請改版」。
          </p>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
          >
            立即起草文件
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {draftOrPendingItems.map(({ doc, version }) => {
            const isReturned = version.status === '草稿' && version.reviewComment;
            const isPending = version.status === '審核中';

            return (
              <div
                key={version.id}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-all space-y-3 ${
                  isReturned
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isPending
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                        {doc.docNumber}
                      </span>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                        {version.version}
                      </span>
                      {isReturned ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          已退回 (需補正修改)
                        </span>
                      ) : isPending ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          主管審核中
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          草稿編輯中
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {doc.department}部 · {doc.docType}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectDocument(doc)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>查看詳情</span>
                    </button>

                    {version.status === '草稿' && (
                      <button
                        onClick={() => onOpenResubmit(doc, version)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isReturned ? '修正後重新送審' : '送出主管審核'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Supervisor Return Comment (Prominent Red Callout) */}
                {isReturned && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>主管退回審核意見 (請依據此意見補正後重送)：</span>
                    </div>
                    <p className="text-rose-800 leading-relaxed font-normal">
                      {version.reviewComment}
                    </p>
                    {version.reviewedAt && (
                      <span className="text-[10px] text-rose-600 block mt-1">
                        退回主管：{version.approver} · 退回時間：{version.reviewedAt}
                      </span>
                    )}
                  </div>
                )}

                {/* Current Revision Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800">
                  <span className="font-semibold text-slate-600 text-[11px] block mb-0.5">
                    本次修訂摘要：
                  </span>
                  <p className="text-slate-700 leading-relaxed font-normal">
                    {version.revisionSummary}
                  </p>
                </div>

                {/* File Attachment & Submission Timestamp */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    <span>起草制定人：<strong className="text-slate-700">{version.author}</strong></span>
                    <span className="mx-2">·</span>
                    <span>最後更新：<span className="tabular-nums font-mono">{version.submittedAt}</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-700">{version.file.name}</span>
                    <span className="text-slate-400">({version.file.size})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
