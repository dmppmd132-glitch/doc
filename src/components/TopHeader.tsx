import React from 'react';
import { useDms } from '../context/DmsContext';
import { NavTab } from './Sidebar';
import { Search, Plus, LogOut, Shield } from 'lucide-react';
import { Role } from '../types/dms';

interface TopHeaderProps {
  currentTab: NavTab;
  onOpenCreate: () => void;
  onOpenTeamModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onOpenCreate,
  searchQuery,
  onSearchChange,
}) => {
  const { currentUser, logout } = useDms();

  const getBreadcrumbTitle = () => {
    switch (currentTab) {
      case 'overview':
        return '文件總覽與檢索';
      case 'pending':
        return '待我審核看板';
      case 'drafts':
        return '我的草稿與送審申請';
      case 'archived':
        return '歷史作廢與封存區';
      case 'team':
        return '10人組織名冊與權限表';
    }
  };

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'Approver':
        return {
          label: '審核主管',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'Editor':
        return {
          label: '撰寫人',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'Viewer':
      default:
        return {
          label: '一般員工',
          color: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between gap-8 select-none shrink-0">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap shrink-0">
        <span className="font-semibold text-slate-900 tracking-tight text-sm">
          Apex DMS
        </span>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">{getBreadcrumbTitle()}</span>
      </div>

      {/* Zone 2: Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="全站搜尋：文件編號 (如 SOP-QA-001)、名稱、修訂摘要、制定人..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-md outline-none transition-colors"
          />
        </div>
      </div>

      {/* Zone 3: Real Authenticated Identity & Sign Out Action */}
      <div className="flex items-center gap-3 shrink-0">
        {currentUser?.role !== 'Viewer' && (
          <button
            onClick={onOpenCreate}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增文件</span>
          </button>
        )}

        {/* Real User Profile Pill (No Switcher) */}
        {currentUser && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div
              className={`w-7 h-7 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-[11px] font-bold shrink-0`}
            >
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block leading-tight">
                {currentUser.department} · {currentUser.email}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                if (confirm('確定要登出目前帳號嗎？')) {
                  logout();
                }
              }}
              title="登出帳號"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
