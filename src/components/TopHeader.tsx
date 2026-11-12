import React, { useState } from 'react';
import { useDms } from '../context/DmsContext';
import { NavTab } from './Sidebar';
import { ChevronDown, Search, Plus, Shield, UserCheck } from 'lucide-react';
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
  onOpenTeamModal,
  searchQuery,
  onSearchChange,
}) => {
  const { currentUser, setCurrentUser, teamMembers } = useDms();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
        return '10人團隊名單與權限表';
    }
  };

  const getRoleText = (role: Role) => {
    switch (role) {
      case 'Approver':
        return '審核主管';
      case 'Editor':
        return '撰寫人';
      case 'Viewer':
        return '一般員工';
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between gap-8 select-none shrink-0">
      {/* Zone 1: Breadcrumb Trail (Single Line) */}
      <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap shrink-0">
        <span className="font-semibold text-slate-900 tracking-tight text-sm">
          Apex DMS
        </span>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">{getBreadcrumbTitle()}</span>
      </div>

      {/* Zone 2: Quick Search and Fast Role Switch Shortcuts */}
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

        {/* Quick 1-click test pills for 3 key representative roles */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0 text-[11px] text-slate-500">
          <span className="text-[10px] text-slate-400">快速切換測試:</span>
          {/* 王建國 (Approver) */}
          <button
            onClick={() => setCurrentUser(teamMembers[0])}
            title="切換至 王建國 (審核主管)"
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
              currentUser.id === teamMembers[0].id
                ? 'bg-purple-100 text-purple-800 font-medium'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            主管(王)
          </button>
          {/* 林哲宇 (Editor) */}
          <button
            onClick={() => setCurrentUser(teamMembers[2])}
            title="切換至 林哲宇 (撰寫人)"
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
              currentUser.id === teamMembers[2].id
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            撰寫(林)
          </button>
          {/* 陳俊霖 (Viewer) */}
          <button
            onClick={() => setCurrentUser(teamMembers[7])}
            title="切換至 陳俊霖 (一般員工)"
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
              currentUser.id === teamMembers[7].id
                ? 'bg-slate-200 text-slate-900 font-medium'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            員工(陳)
          </button>
        </div>
      </div>

      {/* Zone 3: 1 Primary Action / User Switcher */}
      <div className="flex items-center gap-3 shrink-0 relative">
        {currentUser.role !== 'Viewer' && (
          <button
            onClick={onOpenCreate}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增文件</span>
          </button>
        )}

        {/* User Profile Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <div
              className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
            >
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-semibold text-slate-900 block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                {getRoleText(currentUser.role)}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Switching Menu */}
          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-900">選擇團隊成員切換身分</p>
                  <p className="text-[10px] text-slate-500">測試不同權限 (主管 / 撰寫人 / 員工)</p>
                </div>

                <div className="py-1">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setCurrentUser(member);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors text-xs ${
                        currentUser.id === member.id ? 'bg-slate-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full ${member.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}
                        >
                          {member.name.slice(0, 1)}
                        </div>
                        <div className="truncate">
                          <span className="font-medium text-slate-900 block truncate">
                            {member.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {member.department}部 · {member.title}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {member.roleLabel}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenTeamModal();
                    }}
                    className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-1"
                  >
                    查看完整 10 人權限分配表 →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
