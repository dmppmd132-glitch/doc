import React from 'react';
import {
  Archive,
  FileText,
  Eye,
  Download,
  AlertTriangle,
  History,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { Document, DocVersion, AttachedFile } from '../types/dms';
import { useDms } from '../context/DmsContext';

interface ArchivedViewProps {
  onSelectDocument: (doc: Document) => void;
}

export const ArchivedView: React.FC<ArchivedViewProps> = ({ onSelectDocument }) => {
  const { documents, currentUser } = useDms();

  // Find all versions with status '已作廢'
  const archivedItems = documents.flatMap((doc) => {
    return doc.versions
      .filter((v) => v.status === '已作廢')
      .map((version) => ({ doc, version }));
  });

  const handleDownload = (doc: Document, version: DocVersion) => {
    const blobContent = `APEX DMS - 歷史已作廢文件封存檔\n文件編號: ${doc.docNumber}\n文件名稱: ${doc.title}\n版次: ${version.version} (已作廢封存)\n現行最新生效版次: ${doc.currentVersion}\n下載人員: ${currentUser.name}\n\n修訂摘要: ${version.revisionSummary}\n主管備註: ${version.reviewComment || '無'}`;
    const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `[已作廢]_${doc.docNumber}_${version.version}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">
              歷史作廢與封存區 (Archived & Superseded Versions)
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              主管與撰寫人專屬查閱區
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            當主管核准新版次時，系統自動將前一版標記為「已作廢（歷史封存）」，以供品質稽核、法規追溯與變更履歷查驗。
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-slate-400 block">歷史封存舊版總數</span>
          <span className="font-mono font-bold text-slate-800 text-base tabular-nums">
            {archivedItems.length} 份歷史版次
          </span>
        </div>
      </div>

      {archivedItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <Archive className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">目前尚無已作廢之歷史版次</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            當任何文件完成改版審核並經主管「核准」時，舊有生效版本將自動封存於此。
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">原文件編號</th>
                <th className="py-3 px-4">作廢歷史版次</th>
                <th className="py-3 px-4">文件名稱 / 原修訂摘要</th>
                <th className="py-3 px-3">部門</th>
                <th className="py-3 px-3">現行生效版次</th>
                <th className="py-3 px-4">作廢狀態說明</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {archivedItems.map(({ doc, version }) => (
                <tr
                  key={version.id}
                  onClick={() => onSelectDocument(doc)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {doc.docNumber}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      {version.version} (已作廢)
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-md">
                    <div className="font-semibold text-slate-800">{doc.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {version.revisionSummary}
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    {doc.department}部
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200 text-xs">
                      {doc.currentVersion} (已替換)
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                    <div className="flex items-center gap-1 text-rose-700">
                      <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{version.reviewComment || `已被 ${doc.currentVersion} 替代封存`}</span>
                    </div>
                    {version.effectiveAt && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        曾生效於：{version.effectiveAt}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"
                        title="查看歷史詳細紀錄"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc, version)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"
                        title="下載作廢版次存檔"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
