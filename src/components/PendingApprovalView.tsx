import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  AlertTriangle,
  User,
  Calendar,
  FileCode,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Document, DocVersion } from '../types/dms';
import { useDms } from '../context/DmsContext';

interface PendingApprovalViewProps {
  onSelectDocument: (doc: Document) => void;
  onOpenRejectModal: (doc: Document, version: DocVersion) => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  onSelectDocument,
  onOpenRejectModal,
}) => {
  const { documents, approveVersion, currentUser } = useDms();

  // Find all pending versions across documents
  const pendingItems = documents
    .map((doc) => {
      const pendingVer = doc.versions.find((v) => v.status === '審核中');
      return pendingVer ? { doc, version: pendingVer } : null;
    })
    .filter(Boolean) as { doc: Document; version: DocVersion }[];

  const handleApprove = (doc: Document, version: DocVersion) => {
    const isRevision = doc.versions.some((v) => v.status === '已生效');
    const msg = isRevision
      ? `確定核准【${doc.docNumber}】改版申請 ${version.version} 嗎？\n\n系統將自動：\n1. 將 ${version.version} 標記為「已生效」並成為全公司唯一最新版本。\n2. 將先前生效之版本自動標記為「已作廢（歷史封存）」。`
      : `確定核准新文件【${doc.docNumber}】${version.version} 正式發布生效嗎？`;

    if (confirm(msg)) {
      approveVersion(doc.id, version.id, '經主管審查無誤，核准發布生效。');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">
              待我審核看板 (Pending My Approval)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
              {pendingItems.length} 件待辦
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            主管專屬審核通道。核准後系統將自動升版並將舊版封存作廢；退回需填寫具體審核意見以便撰寫人修正。
          </p>
        </div>

        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 shrink-0">
          <div className="flex items-center gap-1.5 font-bold mb-0.5">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>主管審批授權：{currentUser?.name} ({currentUser?.title})</span>
          </div>
          <span className="text-[11px] text-purple-700">
            具備品保與研發規範之最終核准與退回權責。
          </span>
        </div>
      </div>

      {/* Pending Items List */}
      {pendingItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 mx-auto flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">目前無待審核的文件</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            所有送審文件皆已完成核准或退回。當撰寫人發起新文件或改版申請時，將在此處即時呈現。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingItems.map(({ doc, version }) => {
            const isRevision = doc.versions.some((v) => v.status === '已生效');
            const priorActiveVer = doc.versions.find((v) => v.status === '已生效');

            return (
              <div
                key={version.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                        {doc.docNumber}
                      </span>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded">
                        申請版次：{version.version}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {doc.docType}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        {doc.department}
                      </span>
                      {isRevision ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                          既有文件改版 (原 {priorActiveVer?.version} 仍生效中)
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          全新文件首次送審
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 pt-1">{doc.title}</h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectDocument(doc)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>線上審閱預覽</span>
                    </button>

                    <button
                      onClick={() => onOpenRejectModal(doc, version)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>退回修訂 (需填意見)</span>
                    </button>

                    <button
                      onClick={() => handleApprove(doc, version)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>核准發布 (自動升版)</span>
                    </button>
                  </div>
                </div>

                {/* Revision Summary Callout */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-950">
                  <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>本次修訂摘要 (撰寫人提交說明)：</span>
                  </div>
                  <p className="leading-relaxed">{version.revisionSummary}</p>
                </div>

                {/* Metadata & Attached File */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-4">
                    <span>
                      制定人：<strong className="text-slate-700">{version.author}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      送審時間：<span className="font-mono tabular-nums">{version.submittedAt}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-700 font-medium">
                      {version.file.name}
                    </span>
                    <span className="text-slate-400 font-mono">({version.file.size})</span>
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
