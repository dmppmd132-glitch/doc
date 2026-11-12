import React from 'react';
import { X, Check, Shield, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useDms } from '../context/DmsContext';
import { User as UserType } from '../types/dms';

interface TeamDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamDirectoryModal: React.FC<TeamDirectoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { teamMembers, currentUser, setCurrentUser } = useDms();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>10人團隊成員名冊與角色權限矩陣 (RBAC Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500">
              點擊任一位成員右側的「切換身分」即可立即體驗不同角色的操作介面與審核流程。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* RBAC Rules Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 text-xs mb-1">
                <span>審核主管 (Approver) · 2人</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                全權限。擁有專屬「待我審核」看板，可執行「核准」（自動升版並將舊版封存作廢）與「退回（需填意見）」。
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs mb-1">
                <span>撰寫人 (Editor) · 5人</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                可新增文件、上傳附件、發起改版申請。送審期間舊版仍維持已生效供全公司查閱。可存取歷史作廢區。
              </p>
            </div>

            <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs mb-1">
                <span>一般員工 (Viewer) · 3人</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                僅能查閱與下載「已生效」的唯一最新版本。看不到草稿、審核中或已作廢文件，確保生產作業無誤。
              </p>
            </div>
          </div>

          {/* Members Table */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2">團隊成員列表</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 text-xs font-semibold">
                  <tr>
                    <th className="p-3">成員姓名 / 職稱</th>
                    <th className="p-3">所屬部門</th>
                    <th className="p-3">角色身分</th>
                    <th className="p-3">公務 Email</th>
                    <th className="p-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {teamMembers.map((member) => {
                    const isCurrent = currentUser.id === member.id;
                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-bold text-[11px] shrink-0`}
                            >
                              {member.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-medium">
                                    當前
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 text-[11px] block">
                                {member.title}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-medium text-slate-700">
                          {member.department}部
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              member.role === 'Approver'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : member.role === 'Editor'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {member.roleLabel}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {member.email}
                        </td>

                        <td className="p-3 text-right">
                          {isCurrent ? (
                            <span className="text-emerald-600 font-semibold text-xs inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              正在使用
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setCurrentUser(member);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded hover:border-slate-400 transition-colors inline-flex items-center gap-1"
                            >
                              <span>切換為此人</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
