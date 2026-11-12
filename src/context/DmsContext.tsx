import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Document, DocVersion, AttachedFile, DocType, Department, DocStatus, Role } from '../types/dms';
import { TEAM_MEMBERS, INITIAL_DOCUMENTS, DEPARTMENT_CODES } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_DOCS = 'apex_dms_documents_v2';
const STORAGE_KEY_AUTH_USER = 'apex_dms_auth_user_v2';

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

interface SignUpMetadata {
  name: string;
  title: string;
  role: Role;
  department: Department;
}

interface DmsContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  teamMembers: User[];
  documents: Document[];
  pendingReviewCount: number;
  loginWithSupabase: (email: string, password: string, signUpData?: SignUpMetadata) => Promise<{ error?: string }>;
  loginWithLocal: (email: string, password?: string) => boolean;
  logout: () => Promise<void>;
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
  // Current user state (starts with saved user or null requiring login)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved auth user', e);
    }
    return TEAM_MEMBERS[0]; // Default logged-in user: 王建國 (Approver)
  });

  const isAuthenticated = currentUser !== null;

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

  // Check Supabase session on startup if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // Fetch user profile from Supabase profiles table
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data: profile, error }) => {
              if (profile && !error) {
                const userObj: User = {
                  id: profile.id,
                  name: profile.name,
                  title: profile.title,
                  role: profile.role,
                  roleLabel: profile.role_label,
                  department: profile.department,
                  email: profile.email,
                  avatarColor: profile.avatar_color || 'bg-slate-700',
                };
                setCurrentUser(userObj);
                localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
              }
            });
        }
      });
    }
  }, []);

  // Save documents to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documents));
    } catch (e) {
      console.error('Failed to save documents to storage', e);
    }
  }, [documents]);

  // Login with Supabase Auth (supports Name or Email)
  const loginWithSupabase = async (
    nameOrEmail: string,
    password: string,
    signUpData?: SignUpMetadata
  ): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { error: '尚未設定 Supabase 連線參數 (VITE_SUPABASE_URL)' };
    }

    if (signUpData) {
      // Sign up flow
      const signupEmail = nameOrEmail.includes('@')
        ? nameOrEmail.trim()
        : `${nameOrEmail.trim().toLowerCase()}@apex.internal`;

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          data: {
            name: signUpData.name || nameOrEmail.trim(),
            title: signUpData.title,
            role: signUpData.role,
            role_label:
              signUpData.role === 'Approver'
                ? '審核主管'
                : signUpData.role === 'Editor'
                ? '撰寫人'
                : '一般員工',
            department: signUpData.department,
            avatar_color:
              signUpData.role === 'Approver'
                ? 'bg-purple-600'
                : signUpData.role === 'Editor'
                ? 'bg-blue-600'
                : 'bg-slate-600',
          },
        },
      });

      if (error) return { error: error.message };
      if (data.user) {
        const userObj: User = {
          id: data.user.id,
          name: signUpData.name || nameOrEmail.trim(),
          title: signUpData.title,
          role: signUpData.role,
          roleLabel:
            signUpData.role === 'Approver'
              ? '審核主管'
              : signUpData.role === 'Editor'
              ? '撰寫人'
              : '一般員工',
          department: signUpData.department,
          email: data.user.email || signupEmail,
          avatarColor: 'bg-blue-600',
        };
        setCurrentUser(userObj);
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
      }
      return {};
    } else {
      console.log("【開始執行 Supabase 兩步驟登入】輸入識別值：", nameOrEmail);
      // 步驟 1：先從 profiles 資料表用「名稱 (name)」找出對應的真實 Email
      let userEmail = nameOrEmail.trim();

      if (!userEmail.includes('@')) {
        console.log("【步驟 1 發送 Network 請求】向 profiles 資料表查詢 Email...", { name: userEmail });
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, id, name, title, role, role_label, department, avatar_color')
          .eq('name', userEmail)
          .maybeSingle();

        console.log("【步驟 1 查詢結果】", { profileData, profileError });

        if (profileError || !profileData) {
          console.error('查詢 profiles 失敗：', profileError?.message);
          return { error: '查無此成員名稱，請確認輸入姓名是否正確或已於 Supabase profiles 建立' };
        }

        userEmail = profileData.email;
        console.log("【步驟 1 成功匹配 Email】", userEmail);
      }

      console.log("【步驟 2 發送 Network 請求】向 Supabase Auth 驗證密碼...", { email: userEmail });
      // 步驟 2：拿查到的 Email 與密碼去跟 Supabase Auth 驗證
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      console.log("【步驟 2 驗證結果】", { authData, authError });

      if (authError) {
        console.error('Supabase Auth 登入失敗：', authError.message);
        return {
          error:
            authError.message === 'Invalid login credentials'
              ? '密碼不正確，請重新確認'
              : authError.message,
        };
      }

      if (authData.user) {
        // 載入成員完整權限設定檔
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const role = profile?.role || 'Editor';
        const userObj: User = {
          id: authData.user.id,
          name: profile?.name || nameOrEmail.trim(),
          title: profile?.title || '專員',
          role: role,
          roleLabel:
            role === 'Approver' ? '審核主管' : role === 'Editor' ? '撰寫人' : '一般員工',
          department: (profile?.department as Department) || 'QA',
          email: authData.user.email || userEmail,
          avatarColor: profile?.avatar_color || 'bg-slate-700',
        };

        setCurrentUser(userObj);
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
      }
      return {};
    }
  };

  // Local simulated login with team accounts (supports Name or Email)
  const loginWithLocal = (nameOrEmail: string, _password?: string): boolean => {
    const q = nameOrEmail.trim().toLowerCase();
    const found = TEAM_MEMBERS.find(
      (m) =>
        m.name.toLowerCase() === q ||
        m.email.toLowerCase() === q ||
        m.email.split('@')[0].toLowerCase() === q
    );
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(found));
      return true;
    }
    return false;
  };

  // Logout
  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signout failed', e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  };

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

    const authorName = currentUser?.name || '未知撰寫人';
    const authorId = currentUser?.id || 'anonymous';

    const newVersion: DocVersion = {
      id: versionId,
      docId,
      docNumber,
      version: 'v1.0',
      title: input.title,
      revisionSummary: input.revisionSummary,
      file: input.file,
      status: initialStatus,
      author: authorName,
      authorId: authorId,
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
      createdBy: authorName,
      createdById: authorId,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
      description: input.description,
      versions: [newVersion],
    };

    setDocuments((prev) => [newDoc, ...prev]);

    // Async write to Supabase if configured
    if (isSupabaseConfigured()) {
      supabase.from('documents').insert({
        id: newDoc.id,
        doc_number: newDoc.docNumber,
        title: newDoc.title,
        doc_type: newDoc.docType,
        department: newDoc.department,
        department_code: newDoc.departmentCode,
        current_version: newDoc.currentVersion,
        status: newDoc.status,
        created_by: newDoc.createdBy,
        created_by_id: newDoc.createdById,
        description: newDoc.description,
      }).then(() => {
        supabase.from('document_versions').insert({
          id: newVersion.id,
          doc_id: newDoc.id,
          doc_number: newVersion.docNumber,
          version: newVersion.version,
          title: newVersion.title,
          revision_summary: newVersion.revisionSummary,
          file_name: newVersion.file.name,
          file_size: newVersion.file.size,
          file_type: newVersion.file.type,
          status: newVersion.status,
          author: newVersion.author,
          author_id: newVersion.authorId,
          document_body: newVersion.documentBody,
        });
      });
    }

    return newDoc;
  };

  // Initiate Revision (發起改版申請)
  const initiateRevision = (input: InitiateRevisionInput) => {
    const doc = documents.find((d) => d.id === input.docId);
    if (!doc) return;

    const hasUnfinishedVersion = doc.versions.some(
      (v) => v.status === '審核中' || v.status === '草稿'
    );
    if (hasUnfinishedVersion) {
      alert('該文件目前已有正在審核中或草稿階段的版本，無法重複發起改版申請。');
      return;
    }

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

    const authorName = currentUser?.name || '未知撰寫人';
    const authorId = currentUser?.id || 'anonymous';

    const newVersion: DocVersion = {
      id: versionId,
      docId: doc.id,
      docNumber: doc.docNumber,
      version: nextVersionStr,
      title: doc.title,
      revisionSummary: input.revisionSummary,
      file: input.file,
      status: initialStatus,
      author: authorName,
      authorId: authorId,
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
          versions: [newVersion, ...d.versions],
        };
      })
    );
  };

  // Approve Version (主管核准自動升版與舊版作廢)
  const approveVersion = (docId: string, versionId: string, comment?: string) => {
    const now = formatNow();
    const approverName = currentUser?.name || '審核主管';
    const approverId = currentUser?.id || 'approver';

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        const targetVersion = doc.versions.find((v) => v.id === versionId);
        if (!targetVersion) return doc;

        // Auto-archive previous active version
        const updatedVersions = doc.versions.map((ver) => {
          if (ver.id === versionId) {
            return {
              ...ver,
              status: '已生效' as DocStatus,
              approver: approverName,
              approverId: approverId,
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
          approvedBy: approverName,
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
    const approverName = currentUser?.name || '審核主管';
    const approverId = currentUser?.id || 'approver';

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        const updatedVersions = doc.versions.map((ver) => {
          if (ver.id === versionId) {
            return {
              ...ver,
              status: '草稿' as DocStatus,
              approver: approverName,
              approverId: approverId,
              reviewComment: `【退回意見】${comment.trim()}`,
              reviewedAt: now,
            };
          }
          return ver;
        });

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
              reviewComment: null,
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

  // Delete document draft
  const deleteDocumentDraft = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Reset to default seed data
  const resetToSeedData = () => {
    setDocuments(INITIAL_DOCUMENTS);
    setCurrentUser(TEAM_MEMBERS[0]);
    localStorage.removeItem(STORAGE_KEY_DOCS);
  };

  return (
    <DmsContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        teamMembers: TEAM_MEMBERS,
        documents,
        pendingReviewCount,
        loginWithSupabase,
        loginWithLocal,
        logout,
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
