import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User as UserIcon,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Database,
  Mail
} from 'lucide-react';
import { useDms } from '../context/DmsContext';
import { Role, Department } from '../types/dms';
import { isSupabaseConfigured } from '../lib/supabase';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { loginWithSupabase } = useDms();
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<Role>('Editor');
  const [department, setDepartment] = useState<Department>('QA');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabaseReady = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("登入按鈕被點擊了！", { name: name.trim(), passwordLength: password.length, isSignUp });
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !password) {
      console.warn("表單驗證未通過：名稱或密碼為空");
      setErrorMsg('請輸入成員名稱與密碼');
      return;
    }

    if (password.length < 6) {
      console.warn("表單驗證未通過：密碼長度小於 6");
      setErrorMsg('密碼長度至少需 6 個字元');
      return;
    }

    if (isSignUp && !email.trim()) {
      setErrorMsg('註冊新帳號請填寫電子信箱 (Email)');
      return;
    }

    setLoading(true);

    try {
      if (!supabaseReady) {
        setErrorMsg('尚未設定 Supabase 連線環境變數 (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)');
        return;
      }

      console.log("【發送 Supabase 請求】偵測到 VITE_SUPABASE_URL，正在向 Supabase 伺服器發送網路請求...");
      const res = await loginWithSupabase(
        name.trim(),
        password,
        isSignUp
          ? {
              name: name.trim(),
              email: email.trim(),
              title: title.trim() || '專員',
              role,
              department,
            }
          : undefined
      );
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(isSignUp ? '註冊成功！帳號已建立，正在載入權限...' : '驗證通過，正在進入系統...');
        setTimeout(() => onLoginSuccess(), 400);
      }
    } catch (err: any) {
      setErrorMsg(err.message || '登入程序發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-xs mb-3">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Apex DMS 文件審核管理系統
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            內部 SOP 與 SPEC 文件發布、升版審核與品質履歷管制中心
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg shadow-2xs text-xs flex items-start gap-2.5">
          <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-slate-600 leading-relaxed text-[11px]">
            {supabaseReady ? (
              <span className="text-emerald-700 font-medium">
                ✓ 已連線至 Supabase 專案，驗證與權限由 Supabase Auth / profiles 控管。
              </span>
            ) : (
              <div>
                <span className="font-semibold text-slate-800">
                  Supabase 尚未設定連線參數：
                </span>
                <span className="text-slate-500 block mt-0.5">
                  請於環境變數設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_PUBLISHABLE_KEY 後即可連線登入與同步雲端資料庫。
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6">
          {/* Tab: Sign In vs Sign Up */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
              }}
              className={`flex-1 pb-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
                !isSignUp
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              成員身分登入 (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg('');
              }}
              className={`flex-1 pb-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
                isSignUp
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              註冊新成員帳號 (Sign Up)
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Member Name */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                成員名稱 (Name)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="請輸入成員名稱或 Email"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-md outline-none transition-colors"
                />
              </div>
            </div>

            {/* Email (Required for Sign Up so Chinese names have valid auth email) */}
            {isSignUp && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  電子信箱 (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="請輸入公司信箱 (註冊後即可以上方成員姓名登入)"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-md outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                通行密碼 (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼（至少 6 碼）"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-md outline-none transition-colors"
                />
              </div>
            </div>

            {/* Additional Fields for Sign Up */}
            {isSignUp && (
              <>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">職務稱謂</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="如：品保部 協理、資深工程師、技術員"
                    required
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-md outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">指定角色</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-md outline-none text-xs"
                    >
                      <option value="Approver">審核主管 (Approver)</option>
                      <option value="Editor">撰寫人 (Editor)</option>
                      <option value="Viewer">一般員工 (Viewer)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">所屬部門</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as Department)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-md outline-none text-xs"
                    >
                      <option value="QA">QA</option>
                      <option value="ME">ME</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={() => console.log("按鈕原生 onClick 觸發！")}
              className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 relative z-10 cursor-pointer"
            >
              {loading ? (
                <span>驗證連線中...</span>
              ) : (
                <>
                  <span>{isSignUp ? '確認註冊並建立帳號' : '登入文管審核系統'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Apex Industrial Enterprise Document Management System · ISO 9001 Compliant
        </p>
      </div>
    </div>
  );
};
