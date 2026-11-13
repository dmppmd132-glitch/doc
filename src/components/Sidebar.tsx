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
  LogOut,
  KeyRound
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
  const { currentUser, pendingReviewCount, logout } = useDms();

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'Approver':
        return {
          label: '審核主管',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
        };
      case 'Editor':
        return {
          label: '撰寫人',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
        };
      case 'Viewer':
      default:
        return {
          label: '一般員工',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

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
                Supabase
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">SOP & SPEC 文件管理系統</p>
          </div>
        </div>
      </div>

      {/* Real Authenticated User Card (No Switcher) */}
      {currentUser && (
        <div className="p-3 mx-3 my-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              登入帳號資訊
            </span>
            <button
              onClick={() => {
                if (confirm('確定要登出系統嗎？')) {
                  logout();
                }
              }}
              className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>登出</span>
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
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser.department} · {currentUser.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button: Create Document */}
      <div className="px-3 mb-2">
        {currentUser?.role !== 'Viewer' ? (
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
            {currentUser?.role === 'Viewer' ? '已生效' : '全覽'}
          </span>
        </button>

        {/* 2. 待我審核 (Approver Only) */}
        {currentUser?.role === 'Approver' && (
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
        {currentUser?.role !== 'Viewer' && (
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
        {currentUser?.role !== 'Viewer' && (
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

        {/* 5. 組織名冊與權限表 (Read-only Directory) */}
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
            <span>組織名冊與權限表</span>
          </div>
          <span className="text-[10px] text-slate-500">RBAC</span>
        </button>
      </nav>

      {/* Role Permission Scope Hint */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>登入身分權限狀態</span>
        </div>
        <p className="leading-tight text-slate-500 text-[10px]">
          {currentUser?.role === 'Viewer' && '您以「一般員工」身分登入，僅能查閱公司最新「已生效」文件。'}
          {currentUser?.role === 'Editor' && '您以「撰寫人」身分登入，可起草文件與發起改版申請，送審期間舊版維持已生效。'}
          {currentUser?.role === 'Approver' && '您以「審核主管」身分登入，具備待辦審核、核准自動升版與舊版封存全權限。'}
        </p>
      </div>
    </aside>
  );
};
