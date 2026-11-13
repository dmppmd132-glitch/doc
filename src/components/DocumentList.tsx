import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  ChevronDown,
  LayoutGrid,
  List,
  Sparkles,
  ArrowUpDown,
  Building,
  Tag
} from 'lucide-react';
import { Document, DocType, Department, AttachedFile } from '../types/dms';
import { useDms } from '../context/DmsContext';

interface DocumentListProps {
  onSelectDocument: (doc: Document) => void;
  onInitiateRevision: (doc: Document) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const DOC_TYPES: Array<DocType | '全部'> = ['全部', 'SOP', 'SPEC', '表單', '規範'];
const DEPARTMENTS: Array<Department | '全部部門'> = [
  '全部部門',
  'QA',
  'ME',
  'PM',
];

export const DocumentList: React.FC<DocumentListProps> = ({
  onSelectDocument,
  onInitiateRevision,
  searchQuery,
  onSearchChange,
}) => {
  const { currentUser, documents, getActiveVersion, getPendingVersion, downloadDocumentFile } = useDms();

  const [selectedType, setSelectedType] = useState<string>('全部');
  const [selectedDept, setSelectedDept] = useState<string>('全部部門');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'updated' | 'docNumber' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter documents based on role and filters
  const visibleDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Role enforcement:
      // Viewer (一般員工) ONLY sees '已生效' documents!
      if (currentUser?.role === 'Viewer') {
        if (doc.status !== '已生效') return false;
      }

      // 2. Doc Type filter
      if (selectedType !== '全部' && doc.docType !== selectedType) {
        return false;
      }

      // 3. Department filter
      if (selectedDept !== '全部部門' && doc.department !== selectedDept) {
        return false;
      }

      // 4. Search query (docNumber, title, description, revisionSummary of any version)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = doc.docNumber.toLowerCase().includes(q);
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchAuthor = doc.createdBy.toLowerCase().includes(q);
        const matchDesc = doc.description?.toLowerCase().includes(q) || false;
        const matchSummaries = doc.versions.some((v) =>
          v.revisionSummary.toLowerCase().includes(q)
        );

        if (!matchNumber && !matchTitle && !matchAuthor && !matchDesc && !matchSummaries) {
          return false;
        }
      }

      return true;
    });
  }, [documents, currentUser?.role, selectedType, selectedDept, searchQuery]);

  // Sort documents
  const sortedDocuments = useMemo(() => {
    return [...visibleDocuments].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'updated') {
        comparison = a.updatedAt.localeCompare(b.updatedAt);
      } else if (sortBy === 'docNumber') {
        comparison = a.docNumber.localeCompare(b.docNumber);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [visibleDocuments, sortBy, sortOrder]);

  const handleDownloadQuick = async (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    const activeVer = getActiveVersion(doc) || doc.versions[0];
    if (activeVer) {
      await downloadDocumentFile(doc, activeVer);
    }
  };

  const activeCount = documents.filter((d) => d.status === '已生效').length;
  const inReviewCount = documents.filter((d) =>
    d.versions.some((v) => v.status === '審核中')
  ).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Top Welcome / Notice Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-bold text-slate-900">
              文件總覽 (Documents Overview)
            </h1>
            {currentUser?.role === 'Viewer' && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                一般員工模式：嚴格僅展示最新已生效正本
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {currentUser?.role === 'Viewer'
              ? '您僅可查閱全公司已通過主管審核生效之最新正式 SOP 與 SPEC 文件，確保生產線與檢驗依循唯一最新基準。'
              : '管理全公司研發、品保、生產、管理、業務各項標準作業程序與工程規格書，具備完整版次追蹤與主管審核升版機制。'}
          </p>
        </div>

        {/* Quick Stats Pill Counters */}
        <div className="flex items-center gap-4 text-xs shrink-0">
          <div className="text-right">
            <span className="text-slate-400 text-[11px] block">已生效正式文件</span>
            <span className="font-mono font-bold text-slate-900 text-base tabular-nums">
              {activeCount} 件
            </span>
          </div>
          {currentUser?.role !== 'Viewer' && (
            <div className="text-right pl-4 border-l border-slate-200">
              <span className="text-amber-600 text-[11px] block">審核改版進行中</span>
              <span className="font-mono font-bold text-amber-700 text-base tabular-nums">
                {inReviewCount} 件
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        {/* Row 1: Document Type Tabs & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Doc Type Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {DOC_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedType === t
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* View Mode Toggle & Sort Control */}
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none text-slate-700"
              >
                <option value="updated">最後更新日期</option>
                <option value="docNumber">文件編號</option>
                <option value="title">文件名稱</option>
              </select>
            </div>

            {/* Table / Cards toggle */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                title="表格清單視圖"
                className={`p-1 rounded ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="卡片網格視圖"
                className={`p-1 rounded ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Department Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            部門篩選：
          </span>
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}

          {(selectedType !== '全部' || selectedDept !== '全部部門' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('全部');
                setSelectedDept('全部部門');
                onSearchChange('');
              }}
              className="ml-auto text-[11px] text-rose-600 hover:text-rose-800 underline font-medium"
            >
              清除所有篩選條件
            </button>
          )}
        </div>
      </div>

      {/* Main Document Content */}
      {sortedDocuments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">查無符合條件的文件</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              目前篩選或搜尋條件未匹配任何紀錄，請嘗試調整關鍵字或切換不同部門分類。
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedType('全部');
              setSelectedDept('全部部門');
              onSearchChange('');
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            重設篩選條件
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <tr>
                <th className="py-3 px-4">文件編號</th>
                <th className="py-3 px-4">文件名稱 / 修訂摘要</th>
                <th className="py-3 px-3">類型</th>
                <th className="py-3 px-3">部門</th>
                <th className="py-3 px-3 text-center">最新生效版次</th>
                <th className="py-3 px-3">狀態</th>
                <th className="py-3 px-3">制定人 / 核准主管</th>
                <th className="py-3 px-4">最後更新</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDocuments.map((doc) => {
                const pendingVer = getPendingVersion(doc);
                const activeVer = getActiveVersion(doc);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Doc Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {doc.docNumber}
                    </td>

                    {/* Title & Revision Summary */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {activeVer?.revisionSummary || doc.description}
                      </div>
                    </td>

                    {/* Doc Type */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.docType}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-slate-700 font-medium">{doc.department}</span>
                    </td>

                    {/* Active Version */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {doc.currentVersion}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {doc.status === '已生效' ? (
                        <div className="inline-flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            已生效
                          </span>
                          {/* If there's an ongoing revision under review and currentUser is Editor or Approver */}
                          {currentUser?.role !== 'Viewer' && pendingVer && (
                            <span
                              title={`改版申請中 (${pendingVer.version})`}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200"
                            >
                              改版中({pendingVer.version})
                            </span>
                          )}
                        </div>
                      ) : doc.status === '審核中' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          審核中
                        </span>
                      ) : doc.status === '草稿' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          草稿
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          已作廢
                        </span>
                      )}
                    </td>

                    {/* Author / Approver */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      <div>{doc.createdBy}</div>
                      {doc.approvedBy && (
                        <div className="text-[10px] text-slate-400">核准: {doc.approvedBy}</div>
                      )}
                    </td>

                    {/* Updated At */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {doc.updatedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectDocument(doc)}
                          title="查看詳情與線上預覽"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDownloadQuick(e, doc)}
                          title="下載檔案"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Editor / Approver can initiate revision directly */}
                        {currentUser?.role !== 'Viewer' &&
                          doc.status === '已生效' &&
                          !pendingVer && (
                            <button
                              onClick={() => onInitiateRevision(doc)}
                              className="px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                            >
                              改版
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocuments.map((doc) => {
            const pendingVer = getPendingVersion(doc);
            const activeVer = getActiveVersion(doc);

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                      {doc.docNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {doc.department} · {doc.docType}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {activeVer?.revisionSummary || doc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">
                      {doc.currentVersion}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {doc.status}
                    </span>
                    {currentUser?.role !== 'Viewer' && pendingVer && (
                      <span className="px-1 py-0.2 rounded text-[10px] font-mono bg-amber-50 text-amber-700">
                        改版中
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {doc.updatedAt.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
