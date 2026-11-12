import React, { useState, useEffect } from 'react';
import { DmsProvider, useDms } from './context/DmsContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DocumentList } from './components/DocumentList';
import { PendingApprovalView } from './components/PendingApprovalView';
import { MyDraftsView } from './components/MyDraftsView';
import { ArchivedView } from './components/ArchivedView';
import { DocumentDetailDrawer } from './components/DocumentDetailDrawer';
import { CreateDocModal } from './components/CreateDocModal';
import { RevisionModal } from './components/RevisionModal';
import { RejectReviewModal } from './components/RejectReviewModal';
import { ResubmitModal } from './components/ResubmitModal';
import { TeamDirectoryModal } from './components/TeamDirectoryModal';
import { Document, DocVersion } from './types/dms';
import { CheckCircle2, AlertCircle } from 'lucide-react';

function DmsApp() {
  const { currentUser, documents } = useDms();

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revisionDoc, setRevisionDoc] = useState<Document | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ doc: Document; version: DocVersion } | null>(null);
  const [resubmitTarget, setResubmitTarget] = useState<{ doc: Document; version: DocVersion } | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // If user switches role to Viewer while on an unauthorized tab, bounce them back to overview
  useEffect(() => {
    if (currentUser.role === 'Viewer') {
      if (currentTab === 'pending' || currentTab === 'drafts' || currentTab === 'archived') {
        setCurrentTab('overview');
      }
    } else if (currentUser.role === 'Editor') {
      if (currentTab === 'pending') {
        setCurrentTab('overview');
      }
    }
  }, [currentUser.role, currentTab]);

  // Find currently opened document
  const selectedDocument = selectedDocId
    ? documents.find((d) => d.id === selectedDocId) || null
    : null;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'team') {
            setIsTeamModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader
          currentTab={currentTab}
          onOpenCreate={() => setIsCreateOpen(true)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* View Routing */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentTab === 'overview' && (
            <DocumentList
              onSelectDocument={(doc) => setSelectedDocId(doc.id)}
              onInitiateRevision={(doc) => setRevisionDoc(doc)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentTab === 'pending' && currentUser.role === 'Approver' && (
            <PendingApprovalView
              onSelectDocument={(doc) => setSelectedDocId(doc.id)}
              onOpenRejectModal={(doc, version) => setRejectTarget({ doc, version })}
            />
          )}

          {currentTab === 'drafts' && currentUser.role !== 'Viewer' && (
            <MyDraftsView
              onSelectDocument={(doc) => setSelectedDocId(doc.id)}
              onOpenResubmit={(doc, version) => setResubmitTarget({ doc, version })}
              onOpenCreate={() => setIsCreateOpen(true)}
            />
          )}

          {currentTab === 'archived' && currentUser.role !== 'Viewer' && (
            <ArchivedView onSelectDocument={(doc) => setSelectedDocId(doc.id)} />
          )}
        </main>
      </div>

      {/* Document Detail Drawer */}
      <DocumentDetailDrawer
        document={selectedDocument}
        onClose={() => setSelectedDocId(null)}
        onInitiateRevision={(doc) => setRevisionDoc(doc)}
        onOpenRejectModal={(doc, version) => setRejectTarget({ doc, version })}
        onOpenResubmit={(doc, version) => setResubmitTarget({ doc, version })}
      />

      {/* Create Document Modal */}
      <CreateDocModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(docId) => {
          setSelectedDocId(docId);
          showToast('成功建立文件！已送出主管審核流程。');
        }}
      />

      {/* Revision Modal */}
      <RevisionModal
        document={revisionDoc}
        isOpen={!!revisionDoc}
        onClose={() => setRevisionDoc(null)}
        onSuccess={() => {
          showToast('改版申請已送出！在主管核准前，全公司同仁仍能查閱原生效版本。');
        }}
      />

      {/* Reject Review Modal */}
      <RejectReviewModal
        document={rejectTarget?.doc || null}
        version={rejectTarget?.version || null}
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSuccess={() => {
          showToast('文件已退回撰寫人草稿匣，並已記錄退回意見。');
        }}
      />

      {/* Resubmit Modal */}
      <ResubmitModal
        document={resubmitTarget?.doc || null}
        version={resubmitTarget?.version || null}
        isOpen={!!resubmitTarget}
        onClose={() => setResubmitTarget(null)}
        onSuccess={() => {
          showToast('修正後的草稿已重新送出主管審核！');
        }}
      />

      {/* Team Directory & RBAC Matrix Modal */}
      <TeamDirectoryModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DmsProvider>
      <DmsApp />
    </DmsProvider>
  );
}
