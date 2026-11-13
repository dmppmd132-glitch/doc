import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Document, DocVersion, AttachedFile, DocType, Department, DocStatus, Role } from '../types/dms';
import { DEPARTMENT_CODES } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { checkR2Status, getR2DownloadUrl } from '../lib/r2Client';

const STORAGE_KEY_DOCS = 'apex_dms_documents_v3';
const STORAGE_KEY_AUTH_USER = 'apex_dms_auth_user_v3';

function formatNow(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatDbTimestamp(ts?: string | null): string {
  if (!ts) return formatNow();
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
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
  email?: string;
  title: string;
  role: Role;
  department: Department;
}

interface DmsContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  r2Configured: boolean;
  teamMembers: User[];
  documents: Document[];
  pendingReviewCount: number;
  loginWithSupabase: (email: string, password: string, signUpData?: SignUpMetadata) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  generateDocNumber: (docType: DocType, department: Department) => string;
  createDocument: (input: CreateDocInput) => Document;
  initiateRevision: (input: InitiateRevisionInput) => void;
  approveVersion: (docId: string, versionId: string, comment?: string) => void;
  rejectVersion: (docId: string, versionId: string, comment: string) => void;
  resubmitDraft: (docId: string, versionId: string, summary: string, file?: AttachedFile) => void;
  saveDraft: (docId: string, versionId: string, data: Partial<DocVersion>) => void;
  deleteDocumentDraft: (docId: string) => void;
  downloadDocumentFile: (doc: Document, version: DocVersion) => Promise<void>;
  getActiveVersion: (doc: Document) => DocVersion | undefined;
  getPendingVersion: (doc: Document) => DocVersion | undefined;
}

const DmsContext = createContext<DmsContextType | null>(null);

export const DmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up legacy v2 demo cache & check R2 status on mount
  const [r2Configured, setR2Configured] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem('apex_dms_documents_v2');
      localStorage.removeItem('apex_dms_auth_user_v2');
    } catch {
      // ignore storage access errors
    }
    checkR2Status().then((status) => {
      setR2Configured(status.configured);
    });
  }, []);

  // Current user state (starts as null, requiring real login)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved auth user', e);
    }
    return null;
  });

  const isAuthenticated = currentUser !== null;

  // Real team members loaded from Supabase profiles
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Documents state (starts completely empty)
  const [documents, setDocuments] = useState<Document[]>(() => {
    if (isSupabaseConfigured()) {
      return [];
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved documents', e);
    }
    return [];
  });

  // Load real profiles & documents from Supabase
  const loadSupabaseWorkspace = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (!profilesErr && profilesData) {
        const mappedMembers: User[] = profilesData.map((p: any) => ({
          id: p.id,
          name: p.name,
          title: p.title || '專員',
          role: p.role as Role,
          roleLabel:
            p.role_label ||
            (p.role === 'Approver' ? '審核主管' : p.role === 'Editor' ? '撰寫人' : '一般員工'),
          department: p.department as Department,
          email: p.email,
          avatarColor: p.avatar_color || 'bg-slate-700',
        }));
        setTeamMembers(mappedMembers);
      }

      const { data: docsData, error: docsErr } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      const { data: versData, error: versErr } = await supabase
        .from('document_versions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!docsErr && docsData) {
        const versionsByDocId: Record<string, DocVersion[]> = {};
        if (!versErr && versData) {
          versData.forEach((v: any) => {
            const mappedVer: DocVersion = {
              id: v.id,
              docId: v.doc_id,
              docNumber: v.doc_number,
              version: v.version,
              title: v.title,
              revisionSummary: v.revision_summary,
              file: {
                name: v.file_name,
                size: v.file_size,
                type: (v.file_type || 'pdf') as AttachedFile['type'],
                uploadDate: formatDbTimestamp(v.submitted_at),
                fileUrl: v.file_url || undefined,
              },
              status: v.status as DocStatus,
              author: v.author,
              authorId: v.author_id,
              submittedAt: formatDbTimestamp(v.submitted_at),
              approver: v.approver,
              approverId: v.approver_id,
              reviewComment: v.review_comment,
              reviewedAt: v.reviewed_at ? formatDbTimestamp(v.reviewed_at) : null,
              effectiveAt: v.effective_at ? formatDbTimestamp(v.effective_at) : null,
              documentBody: v.document_body || undefined,
            };
            if (!versionsByDocId[v.doc_id]) {
              versionsByDocId[v.doc_id] = [];
            }
            versionsByDocId[v.doc_id].push(mappedVer);
          });
        }

        const mappedDocs: Document[] = docsData.map((d: any) => ({
          id: d.id,
          docNumber: d.doc_number,
          title: d.title,
          docType: d.doc_type as DocType,
          department: d.department as Department,
          departmentCode: d.department_code,
          currentVersion: d.current_version,
          status: d.status as DocStatus,
          createdBy: d.created_by,
          createdById: d.created_by_id,
          approvedBy: d.approved_by,
          createdAt: formatDbTimestamp(d.created_at),
          updatedAt: formatDbTimestamp(d.updated_at),
          description: d.description || '',
          versions: versionsByDocId[d.id] || [],
        }));

        setDocuments(mappedDocs);
      }
    } catch (err) {
      console.error('Failed to load Supabase workspace:', err);
    }
  };

  // Check Supabase session on startup if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
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
                loadSupabaseWorkspace();
              }
            });
        } else {
          setCurrentUser(null);
          setDocuments([]);
          setTeamMembers([]);
          localStorage.removeItem(STORAGE_KEY_AUTH_USER);
        }
      });
    }
  }, []);

  // Save documents to local storage only in non-Supabase mode
  useEffect(() => {
    if (isSupabaseConfigured()) return;
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
      const rawEmail = (signUpData.email || nameOrEmail).trim();
      const signupEmail = rawEmail.includes('@')
        ? rawEmail
        : `${rawEmail.toLowerCase()}@apex.internal`;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
        return { error: '註冊帳號請填寫有效的 Email 格式（例如 name@company.com）' };
      }

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
        await loadSupabaseWorkspace();
      }
      return {};
    } else {
      console.log("【開始執行 Supabase 兩步驟登入】輸入識別值：", nameOrEmail);
      // 步驟 1：先從 profiles 資料表用「名稱 (name)」找出對應的真實 Email
      let userEmail = nameOrEmail.trim();

      if (!userEmail.includes('@')) {
        const cleanName = userEmail;
        console.log("【步驟 1 發送 Network 請求】向 profiles 資料表查詢 Email...", { name: cleanName });
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, id, name, title, role, role_label, department, avatar_color')
          .ilike('name', cleanName)
          .limit(1)
          .maybeSingle();

        console.log("【步驟 1 查詢結果】", { profileData, profileError });

        if (profileData?.email) {
          userEmail = profileData.email;
        } else {
          // 備援：透過 SECURITY DEFINER RPC 函式查詢，繞過未登入(anon) RLS 讀取限制
          console.log("【步驟 1B】嘗試透過 get_email_by_name RPC 查詢...", { lookup_name: cleanName });
          const { data: rpcEmail, error: rpcError } = await supabase.rpc('get_email_by_name', {
            lookup_name: cleanName,
          });
          console.log("【步驟 1B RPC 結果】", { rpcEmail, rpcError });

          if (rpcEmail && typeof rpcEmail === 'string') {
            userEmail = rpcEmail;
          } else {
            const detail = rpcError?.message || profileError?.message || '';
            console.error('查詢 profiles 失敗：', { profileError, rpcError });
            if (detail) {
              return {
                error: `依姓名查詢失敗 (${detail})。請確認已在 Supabase SQL Editor 執行最新授權 SQL。`,
              };
            }
            return {
              error: `資料庫查詢正常，但 profiles 資料表中找不到姓名「${cleanName}」。請至 Supabase > Table Editor > profiles 確認該帳號的 name 欄位內容。`,
            };
          }
        }

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
        await loadSupabaseWorkspace();
      }
      return {};
    }
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
    setDocuments([]);
    setTeamMembers([]);
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
          file_url: newVersion.file.fileUrl || null,
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

    if (isSupabaseConfigured()) {
      const isoNow = new Date().toISOString();
      supabase
        .from('documents')
        .update({ updated_at: isoNow })
        .eq('id', doc.id)
        .then(() => {
          supabase.from('document_versions').insert({
            id: newVersion.id,
            doc_id: doc.id,
            doc_number: newVersion.docNumber,
            version: newVersion.version,
            title: newVersion.title,
            revision_summary: newVersion.revisionSummary,
            file_name: newVersion.file.name,
            file_size: newVersion.file.size,
            file_type: newVersion.file.type,
            file_url: newVersion.file.fileUrl || null,
            status: newVersion.status,
            author: newVersion.author,
            author_id: newVersion.authorId,
            submitted_at: isoNow,
            document_body: newVersion.documentBody,
          });
        });
    }
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

        if (isSupabaseConfigured()) {
          const isoNow = new Date().toISOString();
          supabase
            .from('documents')
            .update({
              current_version: targetVersion.version,
              status: '已生效',
              approved_by: approverName,
              updated_at: isoNow,
            })
            .eq('id', docId)
            .then();

          updatedVersions.forEach((v) => {
            if (v.id === versionId) {
              supabase
                .from('document_versions')
                .update({
                  status: '已生效',
                  approver: approverName,
                  approver_id: approverId,
                  review_comment: v.reviewComment,
                  reviewed_at: isoNow,
                  effective_at: isoNow,
                })
                .eq('id', v.id)
                .then();
            } else if (v.status === '已作廢') {
              supabase
                .from('document_versions')
                .update({
                  status: '已作廢',
                  review_comment: v.reviewComment,
                })
                .eq('id', v.id)
                .then();
            }
          });
        }

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
        const nextDocStatus: DocStatus = hasActiveVer ? '已生效' : '草稿';

        if (isSupabaseConfigured()) {
          const isoNow = new Date().toISOString();
          supabase
            .from('documents')
            .update({ status: nextDocStatus, updated_at: isoNow })
            .eq('id', docId)
            .then();
          supabase
            .from('document_versions')
            .update({
              status: '草稿',
              approver: approverName,
              approver_id: approverId,
              review_comment: `【退回意見】${comment.trim()}`,
              reviewed_at: isoNow,
            })
            .eq('id', versionId)
            .then();
        }

        return {
          ...doc,
          status: nextDocStatus,
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
        const nextDocStatus: DocStatus = hasActiveVer ? '已生效' : '審核中';

        if (isSupabaseConfigured()) {
          const isoNow = new Date().toISOString();
          const targetVer = updatedVersions.find((v) => v.id === versionId);
          supabase
            .from('documents')
            .update({ status: nextDocStatus, updated_at: isoNow })
            .eq('id', docId)
            .then();
          if (targetVer) {
            supabase
              .from('document_versions')
              .update({
                status: '審核中',
                revision_summary: summary,
                file_name: targetVer.file.name,
                file_size: targetVer.file.size,
                file_type: targetVer.file.type,
                file_url: targetVer.file.fileUrl || null,
                submitted_at: isoNow,
                review_comment: null,
              })
              .eq('id', versionId)
              .then();
          }
        }

        return {
          ...doc,
          status: nextDocStatus,
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

        if (isSupabaseConfigured()) {
          const isoNow = new Date().toISOString();
          supabase.from('documents').update({ updated_at: isoNow }).eq('id', docId).then();
          const updatePayload: Record<string, any> = {};
          if (data.revisionSummary !== undefined) updatePayload.revision_summary = data.revisionSummary;
          if (data.title !== undefined) updatePayload.title = data.title;
          if (data.documentBody !== undefined) updatePayload.document_body = data.documentBody;
          if (Object.keys(updatePayload).length > 0) {
            supabase.from('document_versions').update(updatePayload).eq('id', versionId).then();
          }
        }

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
    if (isSupabaseConfigured()) {
      supabase.from('documents').delete().eq('id', docId).then();
    }
  };

  // Download file (uses Cloudflare R2 Presigned URL when fileUrl is present)
  const downloadDocumentFile = async (doc: Document, version: DocVersion) => {
    if (version.file.fileUrl) {
      try {
        const downloadUrl = await getR2DownloadUrl(version.file.fileUrl, version.file.name);
        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = version.file.name;
        link.rel = 'noopener noreferrer';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        return;
      } catch (err: any) {
        alert(err?.message || '從 Cloudflare R2 下載檔案失敗，請確認環境變數設定');
        return;
      }
    }

    // Fallback summary when no binary file was uploaded to R2
    const blobContent = `--- APEX DMS 文件摘要 ---\n文件編號: ${doc.docNumber}\n文件名稱: ${doc.title}\n版次: ${version.version}\n檔案名稱: ${version.file.name}\n下載人員: ${currentUser?.name || '使用者'}\n下載時間: ${new Date().toLocaleString('zh-TW')}\n\n[修訂摘要]\n${version.revisionSummary}\n\n(提示：此版本建立時未上傳實體原檔至 Cloudflare R2)`;
    const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = version.file.name.replace(/\.[^/.]+$/, '') + '_摘要.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DmsContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        r2Configured,
        teamMembers,
        documents,
        pendingReviewCount,
        loginWithSupabase,
        logout,
        generateDocNumber,
        createDocument,
        initiateRevision,
        approveVersion,
        rejectVersion,
        resubmitDraft,
        saveDraft,
        deleteDocumentDraft,
        downloadDocumentFile,
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
