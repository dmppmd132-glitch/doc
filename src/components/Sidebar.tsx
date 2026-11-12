import React from 'react';
import {
  FileText,
  Clock,
  Edit3,
  Archive,
  Users,
  Plus,
  ShieldCheck,
  Building2,
  FileCode,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useDms } from '../context/DmsContext';
import { Role } from '../types/dms';

export type NavTab = 'overview' | 'pending' | 'drafts' | 'archived' | 'team';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenCreate: () => void;
  onOpenTeamModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenCreate,
  onOpenTeamModal,
}) => {
  const { currentUser, pendingReviewCount, resetToSeedData } = useDms();

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Approver':
        return {
          label: '審核主管',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          desc: '擁有全權限與核准/退回功能',
        };
      case 'Editor':
        return {
          label: '撰寫人',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          desc: '可起草、上傳與發起改版申請',
        };
      case 'Viewer':
        return {
          label: '一般員工',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          desc: '僅能查閱與下載已生效文件',
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              Apex DMS
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                10-Team
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">SOP & SPEC 文件管理系統</p>
          </div>
        </div>
      </div>

      {/* Current User & Role Card */}
      <div className="p-3 mx-3 my-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-slate-500">當前登入身分</span>
          <button
            onClick={onOpenTeamModal}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-0.5"
          >
            快速切換
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-xs font-semibold shrink-0`}
          >
            {currentUser.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${roleInfo.color}`}
              >
                {roleInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {currentUser.department}部 · {currentUser.title}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button: Create Document */}
      <div className="px-3 mb-2">
        {currentUser.role !== 'Viewer' ? (
          <button
            onClick={onOpenCreate}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增 SOP / SPEC 文件</span>
          </button>
        ) : (
          <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500">一般員工僅限查閱已生效文件</span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {/* 1. 文件總覽 */}
        <button
          onClick={() => onTabChange('overview')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            currentTab === 'overview'
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>文件總覽</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {currentUser.role === 'Viewer' ? '已生效' : '全覽'}
          </span>
        </button>

        {/* 2. 待我審核 (Approver Only) */}
        {currentUser.role === 'Approver' && (
          <button
            onClick={() => onTabChange('pending')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'pending'
                ? 'bg-purple-50 text-purple-900 font-semibold border border-purple-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>待我審核</span>
            </div>
            {pendingReviewCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                {pendingReviewCount}
              </span>
            )}
          </button>
        )}

        {/* 3. 我的草稿與申請 (Editor / Approver) */}
        {currentUser.role !== 'Viewer' && (
          <button
            onClick={() => onTabChange('drafts')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'drafts'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Edit3 className="w-4 h-4 text-slate-500" />
              <span>我的草稿與申請</span>
            </div>
          </button>
        )}

        {/* 4. 歷史作廢區 (Editor / Approver Only) */}
        {currentUser.role !== 'Viewer' && (
          <button
            onClick={() => onTabChange('archived')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'archived'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-slate-500" />
              <span>歷史作廢區</span>
            </div>
            <span className="text-[10px] text-slate-500">歷史封存</span>
          </button>
        )}

        {/* 5. 團隊成員與權限表 */}
        <button
          onClick={() => onTabChange('team')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            currentTab === 'team'
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-slate-500" />
            <span>10人團隊權限表</span>
          </div>
          <span className="text-[10px] text-slate-500">RBAC</span>
        </button>
      </nav>

      {/* Role Permission Scope Hint */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>權限範圍摘要</span>
        </div>
        <p className="leading-tight text-slate-500 text-[10px]">
          {currentUser.role === 'Viewer' && '您處於一般員工檢視模式，僅能查看公司最新「已生效」文件，確保執行唯一正本。'}
          {currentUser.role === 'Editor' && '您可起草新增 SOP/SPEC、發起改版申請，送審期間舊版將維持已生效直到主管核准。'}
          {currentUser.role === 'Approver' && '您具備主管核准與退回權限。核准新版時系統將自動升版並將舊版標記為歷史作廢。'}
        </p>

        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('確定要還原至系統初始示範資料嗎？')) {
                resetToSeedData();
              }
            }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="w-3 h-3" />
            <span>還原預設示範資料</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
