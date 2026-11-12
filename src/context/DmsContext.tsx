import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Document, DocVersion, AttachedFile, DocType, Department, DocStatus } from '../types/dms';
import { TEAM_MEMBERS, INITIAL_DOCUMENTS, DEPARTMENT_CODES } from '../data/initialData';

const STORAGE_KEY_DOCS = 'apex_dms_documents_v1';
const STORAGE_KEY_USER = 'apex_dms_current_user_v1';

function formatNow(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

interface CreateDocInput {
  title: string;
  docType: DocType;
  department: Department;
  revisionSummary: string;
  file: AttachedFile;
  description: string;
  submitForReview: boolean;
  procedures?: { step: number; title: string; content: string; keyCheck?: string }[];
  specTable?: { param: string; standard: string; tolerance: string; method: string }[];
}

interface InitiateRevisionInput {
  docId: string;
  versionType?: 'major' | 'minor';
  revisionSummary: string;
  file: AttachedFile;
  submitForReview: boolean;
}

interface DmsContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  teamMembers: User[];
  documents: Document[];
  pendingReviewCount: number;
  generateDocNumber: (docType: DocType, department: Department) => string;
  createDocument: (input: CreateDocInput) => Document;
  initiateRevision: (input: InitiateRevisionInput) => void;
  approveVersion: (docId: string, versionId: string, comment?: string) => void;
  rejectVersion: (docId: string, versionId: string, comment: string) => void;
  resubmitDraft: (docId: string, versionId: string, summary: string, file?: AttachedFile) => void;
  saveDraft: (docId: string, versionId: string, data: Partial<DocVersion>) => void;
  deleteDocumentDraft: (docId: string) => void;
  resetToSeedData: () => void;
  getActiveVersion: (doc: Document) => DocVersion | undefined;
  getPendingVersion: (doc: Document) => DocVersion | undefined;
}

const DmsContext = createContext<DmsContextType | null>(null);

export const DmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state (default: 王建國 - Approver)
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const found = TEAM_MEMBERS.find((u) => u.id === JSON.parse(saved));
        if (found) return found;
      }
    } catch (e) {
      console.warn('Failed to load saved user', e);
    }
    return TEAM_MEMBERS[0]; // 王建國 (Approver)
  });

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user.id));
    } catch (e) {
      console.error(e);
    }
  };

  // Documents state
  const [documents, setDocuments] = useState<Document[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved documents', e);
    }
    return INITIAL_DOCUMENTS;
  });

  // Save documents to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documents));
    } catch (e) {
      console.error('Failed to save documents to storage', e);
    }
  }, [documents]);

  // Red badge: documents with a version in "審核中"
  const pendingReviewCount = documents.reduce((acc, doc) => {
    const hasPending = doc.versions.some((v) => v.status === '審核中');
    return hasPending ? acc + 1 : acc;
  }, 0);

  // Generate Document Number e.g. SOP-QA-002
  const generateDocNumber = (docType: DocType, department: Department): string => {
    const prefix = docType;
    const deptCode = DEPARTMENT_CODES[department] || 'GEN';
    const targetPrefix = `${prefix}-${deptCode}-`;

    let maxNum = 0;
    documents.forEach((d) => {
      if (d.docNumber.startsWith(targetPrefix)) {
        const parts = d.docNumber.split('-');
        const numPart = parseInt(parts[2], 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextSerial = String(maxNum + 1).padStart(3, '0');
    return `${targetPrefix}${nextSerial}`;
  };

  const getActiveVersion = (doc: Document): DocVersion | undefined => {
    return doc.versions.find((v) => v.status === '已生效');
  };

  const getPendingVersion = (doc: Document): DocVersion | undefined => {
    return doc.versions.find((v) => v.status === '審核中');
  };

  // Create new document (Editor / Approver)
  const createDocument = (input: CreateDocInput): Document => {
    const now = formatNow();
    const docNumber = generateDocNumber(input.docType, input.department);
    const docId = `doc-${Date.now()}`;
    const versionId = `ver-${Date.now()}-v10`;
    const initialStatus: DocStatus = input.submitForReview ? '審核中' : '草稿';

    const newVersion: DocVersion = {
      id: versionId,
      docId,
      docNumber,
      version: 'v1.0',
      title: input.title,
      revisionSummary: input.revisionSummary,
      file: input.file,
      status: initialStatus,
      author: currentUser.name,
      authorId: currentUser.id,
      submittedAt: now,
      approver: null,
      approverId: null,
      reviewComment: null,
      reviewedAt: null,
      effectiveAt: null,
      documentBody: {
        purpose: input.description || `${input.title} 之標準作業目的。`,
        scope: `適用於本公司 ${input.department} 部門相關工程人員與作業人員。`,
        responsibilities: [
          `${input.department} 制定人：負責撰寫與維護本規範。`,
          '審核主管：負責審查正確性與品質合規。',
        ],
        procedures: input.procedures || [
          { step: 1, title: '準備與工件核對', content: '確認作業圖面、版本編號與料號一致。', keyCheck: '無缺料與污損' },
          { step: 2, title: '標準程序執行', content: '嚴格按照本文件規定之參數與檢驗步驟執行。', keyCheck: '如實記錄量測數值' },
          { step: 3, title: '完工確認與簽章', content: '填寫對應點檢紀錄表單並交由品保確認。', keyCheck: '雙人複核' },
        ],
        specTable: input.specTable || [
          { param: '作業環境標準', standard: '無塵室 Class 10000', tolerance: '溫度 23±3°C / 濕度 50±10%', method: '溫濕度連續記錄器' },
        ],
      },
    };

    const newDoc: Document = {
      id: docId,
      docNumber,
      title: input.title,
      docType: input.docType,
      department: input.department,
      departmentCode: DEPARTMENT_CODES[input.department],
      currentVersion: 'v1.0',
      status: initialStatus,
      createdBy: currentUser.name,
      createdById: currentUser.id,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
      description: input.description,
      versions: [newVersion],
    };

    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  // Initiate Revision (發起改版申請)
  const initiateRevision = (input: InitiateRevisionInput) => {
    const doc = documents.find((d) => d.id === input.docId);
    if (!doc) return;

    // Check if there is already a version in '審核中' or '草稿'
    const hasUnfinishedVersion = doc.versions.some(
      (v) => v.status === '審核中' || v.status === '草稿'
    );
    if (hasUnfinishedVersion) {
      alert('該文件目前已有正在審核中或草稿階段的版本，無法重複發起改版申請。');
      return;
    }

    // Determine next version number
    const activeVer = getActiveVersion(doc);
    let nextVersionStr = 'v2.0';
    if (activeVer) {
      const match = activeVer.version.match(/^v?(\d+)\.(\d+)$/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        if (input.versionType === 'minor') {
          nextVersionStr = `v${major}.${minor + 1}`;
        } else {
          nextVersionStr = `v${major + 1}.0`;
        }
      }
    }

    const now = formatNow();
    const versionId = `ver-${Date.now()}-${nextVersionStr.replace('.', '')}`;
    const initialStatus: DocStatus = input.submitForReview ? '審核中' : '草稿';

    const newVersion: DocVersion = {
      id: versionId,
      docId: doc.id,
      docNumber: doc.docNumber,
      version: nextVersionStr,
      title: doc.title,
      revisionSummary: input.revisionSummary,
      file: input.file,
      status: initialStatus,
      author: currentUser.name,
      authorId: currentUser.id,
      submittedAt: now,
      approver: null,
      approverId: null,
      reviewComment: null,
      reviewedAt: null,
      effectiveAt: null,
      documentBody: activeVer?.documentBody
        ? JSON.parse(JSON.stringify(activeVer.documentBody))
        : undefined,
    };

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== doc.id) return d;
        return {
          ...d,
          updatedAt: now,
          // CRITICAL: Document status keeps showing current active version to general employees!
          // We add the new version to versions array.
          versions: [newVersion, ...d.versions],
        };
      })
    );
  };

  // Approve Version (主管核准自動升版與舊版作廢)
  const approveVersion = (docId: string, versionId: string, comment?: string) => {
    const now = formatNow();

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        const targetVersion = doc.versions.find((v) => v.id === versionId);
        if (!targetVersion) return doc;

        // Auto-archive previous active version:
        // Any version that was '已生效' now becomes '已作廢' (歷史封存)
        const updatedVersions = doc.versions.map((ver) => {
          if (ver.id === versionId) {
            return {
              ...ver,
              status: '已生效' as DocStatus,
              approver: currentUser.name,
              approverId: currentUser.id,
              reviewComment: comment || '經審查無誤，核准發布生效。',
              reviewedAt: now,
              effectiveAt: now,
            };
          }
          if (ver.status === '已生效') {
            return {
              ...ver,
              status: '已作廢' as DocStatus,
              reviewComment: ver.reviewComment
                ? `${ver.reviewComment}（已被 ${targetVersion.version} 取代封存）`
                : `已被新版本 ${targetVersion.version} 取代封存`,
            };
          }
          return ver;
        });

        return {
          ...doc,
          currentVersion: targetVersion.version,
          status: '已生效' as DocStatus,
          approvedBy: currentUser.name,
          updatedAt: now,
          versions: updatedVersions,
        };
      })
    );
  };

  // Reject Version (主管退回，需填寫退回意見)
  const rejectVersion = (docId: string, versionId: string, comment: string) => {
    if (!comment || !comment.trim()) {
      alert('退回必須填寫審核意見說明！');
      return;
    }

    const now = formatNow();

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        const updatedVersions = doc.versions.map((ver) => {
          if (ver.id === versionId) {
            return {
              ...ver,
              status: '草稿' as DocStatus, // Returned to draft
              approver: currentUser.name,
              approverId: currentUser.id,
              reviewComment: `【退回意見】${comment.trim()}`,
              reviewedAt: now,
            };
          }
          return ver;
        });

        // If the document has an existing active version (e.g. revision v2.0 was rejected while v1.0 is still active),
        // keep doc status as '已生效'. If this is a brand new doc (only has this rejected version), doc status becomes '草稿'.
        const hasActiveVer = updatedVersions.some((v) => v.status === '已生效');

        return {
          ...doc,
          status: hasActiveVer ? '已生效' : '草稿',
          updatedAt: now,
          versions: updatedVersions,
        };
      })
    );
  };

  // Resubmit Draft (重新送審)
  const resubmitDraft = (
    docId: string,
    versionId: string,
    summary: string,
    file?: AttachedFile
  ) => {
    const now = formatNow();
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        const updatedVersions = doc.versions.map((ver) => {
          if (ver.id === versionId) {
            return {
              ...ver,
              status: '審核中' as DocStatus,
              revisionSummary: summary,
              file: file || ver.file,
              submittedAt: now,
              reviewComment: null, // Clear past reject note or keep record
            };
          }
          return ver;
        });

        const hasActiveVer = updatedVersions.some((v) => v.status === '已生效');

        return {
          ...doc,
          status: hasActiveVer ? '已生效' : '審核中',
          updatedAt: now,
          versions: updatedVersions,
        };
      })
    );
  };

  // Save Draft changes
  const saveDraft = (docId: string, versionId: string, data: Partial<DocVersion>) => {
    const now = formatNow();
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const updatedVersions = doc.versions.map((ver) => {
          if (ver.id === versionId) {
            return { ...ver, ...data };
          }
          return ver;
        });
        return {
          ...doc,
          updatedAt: now,
          versions: updatedVersions,
        };
      })
    );
  };

  // Delete document draft (only if doc is completely draft with no active version)
  const deleteDocumentDraft = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Reset to default seed data
  const resetToSeedData = () => {
    setDocuments(INITIAL_DOCUMENTS);
    setCurrentUser(TEAM_MEMBERS[0]);
    localStorage.removeItem(STORAGE_KEY_DOCS);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  return (
    <DmsContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        teamMembers: TEAM_MEMBERS,
        documents,
        pendingReviewCount,
        generateDocNumber,
        createDocument,
        initiateRevision,
        approveVersion,
        rejectVersion,
        resubmitDraft,
        saveDraft,
        deleteDocumentDraft,
        resetToSeedData,
        getActiveVersion,
        getPendingVersion,
      }}
    >
      {children}
    </DmsContext.Provider>
  );
};

export const useDms = () => {
  const context = useContext(DmsContext);
  if (!context) {
    throw new Error('useDms must be used within a DmsProvider');
  }
  return context;
};
