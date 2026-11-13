import { User, Document } from '../types/dms';

export const DEPARTMENT_CODES: Record<string, string> = {
  'QA': 'QA',
  'ME': 'ME',
  'PM': 'PM',
};

// 已清空預設測試成員，人員名冊直接從 Supabase public.profiles 同步載入
export const TEAM_MEMBERS: User[] = [];

// 已清空預設示範文件，系統起始為空白狀態並從 Supabase 即時載入
export const INITIAL_DOCUMENTS: Document[] = [];
