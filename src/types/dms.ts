export type Role = 'Viewer' | 'Editor' | 'Approver';

export type DocType = 'SOP' | 'SPEC' | '表單' | '規範';

export type Department = 'QA' | 'ME' | 'PM';

export type DepartmentCode = 'QA' | 'ME' | 'PM' | string;

export type DocStatus = '草稿' | '審核中' | '已生效' | '已作廢';

export interface User {
  id: string;
  name: string;
  title: string;
  role: Role;
  roleLabel: string;
  department: Department;
  email: string;
  avatarColor: string;
}

export interface AttachedFile {
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'xlsx';
  uploadDate: string;
  contentPreview?: string;
}

export interface DocVersion {
  id: string;
  docId: string;
  docNumber: string;
  version: string; // e.g. 'v1.0', 'v2.0'
  title: string;
  revisionSummary: string; // 必填修訂摘要
  file: AttachedFile;
  status: DocStatus;
  author: string;
  authorId: string;
  submittedAt: string;
  approver?: string | null;
  approverId?: string | null;
  reviewComment?: string | null; // 主管審核意見
  reviewedAt?: string | null;
  effectiveAt?: string | null;
  documentBody?: {
    purpose: string;
    scope: string;
    responsibilities: string[];
    procedures: { step: number; title: string; content: string; keyCheck?: string }[];
    specTable?: { param: string; standard: string; tolerance: string; method: string }[];
  };
}

export interface Document {
  id: string;
  docNumber: string; // e.g. SOP-QA-001
  title: string;
  docType: DocType;
  department: Department;
  departmentCode: DepartmentCode;
  currentVersion: string; // Latest active version or draft version
  status: DocStatus; // Overall document status
  createdBy: string;
  createdById: string;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  description: string;
  versions: DocVersion[]; // Complete version history
}

export interface FilterState {
  search: string;
  docType: string;
  department: string;
  status: string;
}
