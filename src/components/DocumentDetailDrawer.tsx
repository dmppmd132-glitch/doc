import React, { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  History,
  FileCode,
  Calendar,
  User,
  Shield,
  FileCheck,
  ArrowRight,
  Send,
  Printer,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { Document, DocVersion, AttachedFile } from '../types/dms';
import { useDms } from '../context/DmsContext';

interface DocumentDetailDrawerProps {
  document: Document | null;
  onClose: () => void;
  onInitiateRevision: (doc: Document) => void;
  onOpenRejectModal: (doc: Document, version: DocVersion) => void;
  onOpenResubmit: (doc: Document, version: DocVersion) => void;
}

export const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  document,
  onClose,
  onInitiateRevision,
  onOpenRejectModal,
  onOpenResubmit,
}) => {
  const { currentUser, approveVersion, getActiveVersion, getPendingVersion } = useDms();
  const [activeTab, setActiveTab] = useState<'preview' | 'history' | 'files'>('preview');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  if (!document) return null;

  const activeVer = getActiveVersion(document);
  const pendingVer = getPendingVersion(document);

  // Selected version for preview (defaults to active version, or pending, or first version)
  const currentPreviewVersion =
    document.versions.find((v) => v.id === selectedVersionId) ||
    activeVer ||
    pendingVer ||
    document.versions[0];

  const handleDownload = (file: AttachedFile) => {
    // Generate text/csv blob for download demonstration
    const blobContent = `--- APEX DMS 企業文件下載 ---\n文件編號: ${document.docNumber}\n文件名稱: ${document.title}\n版次: ${currentPreviewVersion.version}\n檔案名稱: ${file.name}\n下載人員: ${currentUser?.name || '使用者'} (${currentUser?.title || '專員'})\n下載時間: ${new Date().toLocaleString('zh-TW')}\n\n[文件內文摘要]\n修訂摘要: ${currentPreviewVersion.revisionSummary}\n\n(此檔案由 Apex DMS 自動產製數位水簽正本)`;
    const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.[^/.]+$/, '') + '_正本下載.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '已生效':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            已生效 (正式發布)
          </span>
        );
      case '審核中':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            審核中 (待主管簽核)
          </span>
        );
      case '草稿':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            草稿 / 已退回
          </span>
        );
      case '已作廢':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            已作廢 (歷史封存)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col z-10 h-full border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                {document.docNumber}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                {document.docType}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {document.department}
              </span>
              {getStatusBadge(document.status)}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {document.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
              <span>目前最新生效版次：<strong className="text-slate-800 font-mono">{document.currentVersion}</strong></span>
              <span aria-hidden="true">·</span>
              <span>制定人：<strong className="text-slate-800">{document.createdBy}</strong></span>
              {document.approvedBy && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>核准主管：<strong className="text-slate-800">{document.approvedBy}</strong></span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>最後更新：<span className="tabular-nums">{document.updatedAt}</span></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar: Approver Approval / Reject / Editor Revision */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Version Switcher if multiple versions exist */}
            <span className="text-xs text-slate-500 font-medium">檢視版次：</span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-300">
              {document.versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors ${
                    currentPreviewVersion.id === v.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v.version} {v.status === '已生效' ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* APPROVER ACTIONS: If this document has a version in '審核中' */}
            {currentUser?.role === 'Approver' && pendingVer && (
              <>
                <button
                  onClick={() => onOpenRejectModal(document, pendingVer)}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                >
                  退回修訂 (需填意見)
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `確定核准【${document.docNumber}】${pendingVer.version} 嗎？\n\n核准後：\n1. 該版本將立即成為「已生效」唯一正本。\n2. 原先生效之舊版本將自動被系統標記為「已作廢 (歷史封存)」。`
                      )
                    ) {
                      approveVersion(document.id, pendingVer.id);
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>核准發布 (自動升版並封存舊版)</span>
                </button>
              </>
            )}

            {/* EDITOR / APPROVER ACTION: Initiate Revision on Active Document */}
            {currentUser?.role !== 'Viewer' &&
              document.status === '已生效' &&
              !pendingVer && (
                <button
                  onClick={() => onInitiateRevision(document)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>發起改版申請</span>
                </button>
              )}

            {/* EDITOR ACTION: Resubmit returned draft */}
            {currentUser?.role !== 'Viewer' &&
              currentPreviewVersion.status === '草稿' && (
                <button
                  onClick={() => onOpenResubmit(document, currentPreviewVersion)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>編輯並重新送審</span>
                </button>
              )}

            {/* Download File */}
            <button
              onClick={() => handleDownload(currentPreviewVersion.file)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>下載實體附件</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>線上文件預覽 ({currentPreviewVersion.version})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>版次變更歷史與審核紀錄 ({document.versions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>附件檔案 ({currentPreviewVersion.file.name})</span>
          </button>
        </div>

        {/* Tab 1: Online Document Preview */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
            {/* Version banner if previewing superseded or pending version */}
            {currentPreviewVersion.status === '已作廢' && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">注意：您正在檢視已作廢之歷史封存版次 ({currentPreviewVersion.version})</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    此版本已被最新版 {document.currentVersion} 取代。依據品質政策，現行作業請務必依據最新生效版本。
                  </p>
                </div>
              </div>
            )}

            {currentPreviewVersion.status === '審核中' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">此版本 ({currentPreviewVersion.version}) 目前處於「主管審核中」階段</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    在主管核准前，一般員工查閱該文件時將維持呈現舊版，直到審核通過自動升版替換。
                  </p>
                </div>
              </div>
            )}

            {currentPreviewVersion.reviewComment && (
              <div className="mb-4 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900">
                <span className="font-semibold block mb-0.5">主管審核意見：</span>
                <p className="text-[11px] text-blue-800">{currentPreviewVersion.reviewComment}</p>
                {currentPreviewVersion.reviewedAt && (
                  <span className="text-[10px] text-blue-600 block mt-1">
                    審核人：{currentPreviewVersion.approver} · 審核時間：{currentPreviewVersion.reviewedAt}
                  </span>
                )}
              </div>
            )}

            {/* Document Reader Container (A4 Styled Paper Format) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-8 max-w-3xl mx-auto space-y-6">
              {/* ISO 9001 Header Matrix */}
              <div className="border border-slate-300 rounded-md overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-300 p-2 text-center font-semibold text-slate-700">
                  <div className="border-r border-slate-300">文件編號</div>
                  <div className="border-r border-slate-300">文件版次</div>
                  <div className="border-r border-slate-300">管制等級</div>
                  <div>生效日期</div>
                </div>
                <div className="grid grid-cols-4 p-2 text-center font-mono text-slate-800">
                  <div className="border-r border-slate-300 font-bold">{document.docNumber}</div>
                  <div className="border-r border-slate-300">{currentPreviewVersion.version}</div>
                  <div className="border-r border-slate-300">內部機密 (Level 2)</div>
                  <div className="tabular-nums">
                    {currentPreviewVersion.effectiveAt || '待核准生效'}
                  </div>
                </div>
              </div>

              {/* Revision Summary Callout */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">
                  本次修訂摘要 (Revision Summary)：
                </div>
                <div className="text-xs text-slate-800 leading-relaxed">
                  {currentPreviewVersion.revisionSummary}
                </div>
              </div>

              {/* Section 1: Purpose & Scope */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-200">
                  1.0 作業目的與適用範圍 (Purpose & Scope)
                </h3>
                <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p>
                    <strong>1.1 目的：</strong>
                    {currentPreviewVersion.documentBody?.purpose || document.description}
                  </p>
                  <p>
                    <strong>1.2 範圍：</strong>
                    {currentPreviewVersion.documentBody?.scope ||
                      `適用於本公司 ${document.department} 所有標準作業流程與檢驗工程規範。`}
                  </p>
                </div>
              </div>

              {/* Section 2: Responsibilities */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-200">
                  2.0 權責劃分 (Responsibilities)
                </h3>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pl-1">
                  {currentPreviewVersion.documentBody?.responsibilities?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  )) || (
                    <>
                      <li>制定人員：負責草擬文件，並依現行製程與客戶規格維持最新內容。</li>
                      <li>審核主管：負責實質審查技術可行性與法規合規性，核准發布生效。</li>
                      <li>執行人員：嚴格按照本文件規定之檢驗要點如實記錄。</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Section 3: Procedures */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-200">
                  3.0 標準作業程序步驟 (Standard Procedures)
                </h3>
                <div className="space-y-2.5">
                  {(
                    currentPreviewVersion.documentBody?.procedures || [
                      {
                        step: 1,
                        title: '前置準備與規格確認',
                        content: '確認生產工單代碼、批次與料號無誤，並點檢作業工具是否校驗合格。',
                        keyCheck: '點檢儀校標籤效期',
                      },
                      {
                        step: 2,
                        title: '關鍵參數量測與記錄',
                        content: '依據公差表進行三點取樣測量，數值填寫於管制圖中。',
                        keyCheck: '連續 3 批無超出管制界線',
                      },
                    ]
                  ).map((proc) => (
                    <div
                      key={proc.step}
                      className="p-3 bg-slate-50/60 rounded border border-slate-200/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          步驟 {proc.step}：{proc.title}
                        </span>
                        {proc.keyCheck && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            查驗重點：{proc.keyCheck}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed">{proc.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Specifications & Tolerance Table if available */}
              {currentPreviewVersion.documentBody?.specTable && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-200">
                    4.0 規格檢驗與公差判定表 (Inspection Criteria)
                  </h3>
                  <table className="w-full text-xs border border-slate-200 rounded text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2 border-b border-slate-200">管制項目</th>
                        <th className="p-2 border-b border-slate-200">標準值</th>
                        <th className="p-2 border-b border-slate-200">公差容許範圍</th>
                        <th className="p-2 border-b border-slate-200">檢驗量具與方法</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentPreviewVersion.documentBody.specTable.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-900">{row.param}</td>
                          <td className="p-2 font-mono text-slate-700">{row.standard}</td>
                          <td className="p-2 font-mono text-slate-600">{row.tolerance}</td>
                          <td className="p-2 text-slate-600">{row.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Digital Signatures Footer */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">文件起草/修訂人</span>
                  <div className="font-semibold text-slate-900 mt-1">{currentPreviewVersion.author}</div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    送審時間：{currentPreviewVersion.submittedAt}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">權責核准主管</span>
                  <div className="font-semibold text-slate-900 mt-1">
                    {currentPreviewVersion.approver || '(待主管審批)'}
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    核准生效：{currentPreviewVersion.reviewedAt || '審核中'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Version History and Review Audit Trail */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  完整版次變更歷史與歷次審核紀錄
                </h3>
                <p className="text-xs text-slate-500">
                  本文件共計 {document.versions.length} 個修訂版次紀錄，主管核准後自動將前一版封存作廢。
                </p>
              </div>
            </div>

            {/* Timeline List */}
            <div className="space-y-3">
              {document.versions.map((ver, idx) => {
                const isSelected = currentPreviewVersion.id === ver.id;
                return (
                  <div
                    key={ver.id}
                    className={`bg-white border rounded-xl p-4 transition-all ${
                      isSelected
                        ? 'border-slate-900 shadow-xs ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                          {ver.version}
                        </span>
                        {getStatusBadge(ver.status)}
                        {idx === 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-medium">
                            最新記錄
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVersionId(ver.id);
                            setActiveTab('preview');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <span>預覽此版</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mandatory Revision Summary */}
                    <div className="bg-slate-50 rounded-lg p-3 my-2 border border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        本次修訂摘要 (必填)：
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-normal">
                        {ver.revisionSummary}
                      </p>
                    </div>

                    {/* Audit Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">制定人員：</span>
                        <span className="font-medium text-slate-800">{ver.author}</span>
                        <span className="text-slate-400 ml-2">送審：</span>
                        <span className="tabular-nums font-mono text-[11px]">{ver.submittedAt}</span>
                      </div>

                      <div>
                        <span className="text-slate-400">審核主管：</span>
                        <span className="font-medium text-slate-800">
                          {ver.approver || '—'}
                        </span>
                        {ver.reviewedAt && (
                          <>
                            <span className="text-slate-400 ml-2">時間：</span>
                            <span className="tabular-nums font-mono text-[11px]">{ver.reviewedAt}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Review Comments if any */}
                    {ver.reviewComment && (
                      <div className="mt-2.5 p-2.5 rounded bg-slate-100 text-xs text-slate-700 border border-slate-200">
                        <strong className="text-slate-900">主管審核意見：</strong>
                        <span className="ml-1">{ver.reviewComment}</span>
                      </div>
                    )}

                    {/* Attached File Bar */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{ver.file.name}</span>
                        <span className="text-slate-400">({ver.file.size})</span>
                      </div>
                      <button
                        onClick={() => handleDownload(ver.file)}
                        className="text-[11px] text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 hover:underline"
                      >
                        <Download className="w-3 h-3" />
                        <span>下載檔案</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Attached Physical Files */}
        {activeTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">實體附件檔案下載專區</h3>
            <p className="text-xs text-slate-500">
              支援 PDF、Word (.docx)、Excel (.xlsx) 等格式。所有下載均具備內部安全認證。
            </p>

            <div className="space-y-3">
              {document.versions.map((v) => (
                <div
                  key={v.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                      {v.file.type}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 font-mono">
                          {v.file.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {v.version}
                        </span>
                        {getStatusBadge(v.status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        檔案大小：{v.file.size} · 上傳日期：{v.file.uploadDate} · 上傳人：{v.author}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(v.file)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>下載文件</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
