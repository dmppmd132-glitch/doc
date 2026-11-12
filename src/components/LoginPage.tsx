import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User as UserIcon,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Database
} from 'lucide-react';
import { useDms } from '../context/DmsContext';
import { Role, Department } from '../types/dms';
import { isSupabaseConfigured } from '../lib/supabase';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { loginWithSupabase, loginWithLocal } = useDms();
  const [isSignUp, setIsSignUp] = useState(false);

  // Form fields: Name and Password as requested
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<Role>('Editor');
  const [department, setDepartment] = useState<Department>('研發');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabaseReady = isSupabaseConfigured();

  const handleQuickFill = (presetName: string) => {
    setName(presetName);
    setPassword('apex1234');
    setErrorMsg('');
  };

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

    setLoading(true);

    try {
      if (supabaseReady) {
        console.log("【發送 Supabase 請求】偵測到 VITE_SUPABASE_URL，正在向 Supabase 伺服器發送網路請求...");
        const res = await loginWithSupabase(
          name.trim(),
          password,
          isSignUp ? { name: name.trim(), title: title.trim() || '專員', role, department } : undefined
        );
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(isSignUp ? '註冊成功！帳號已建立，正在載入權限...' : '驗證通過，正在進入系統...');
          setTimeout(() => onLoginSuccess(), 400);
        }
      } else {
        console.warn(
          "【注意：當前為本機模擬模式，無 Network 請求】\n" +
          "目前專案尚未在環境變數 (.env) 中設定有效的 VITE_SUPABASE_URL 與 VITE_SUPABASE_PUBLISHABLE_KEY。\n" +
          "因此系統走內部成員模擬驗證（不會向外部網路發送 fetch 請求）。\n" +
          "若需在 Network 分頁看見 Supabase 網路請求，請建立 .env 檔案填入真實的 Supabase 專案網址與 Key！"
        );
        // Local simulation with team accounts by Name
        const success = loginWithLocal(name.trim(), password);
        if (success) {
          setSuccessMsg('驗證成功，正在進入系統...');
          setTimeout(() => onLoginSuccess(), 300);
        } else {
          setErrorMsg('查無此成員名稱或密碼不正確。請輸入如「王建國」、「林哲宇」或「陳俊霖」，或點擊下方測試按鈕快速帶入。');
        }
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
                  Supabase 整合模式啟動中：
                </span>
                <span className="text-slate-500 block mt-0.5">
                  已內建 `@supabase/supabase-js` 客戶端。設定環境變數即可即時同步雲端資料庫；亦可使用下方預設 10 人成員名稱直接登入驗證。
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
                  placeholder="請輸入成員姓名 (如：王建國、林哲宇、陳俊霖)"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-md outline-none transition-colors"
                />
              </div>
            </div>

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
                      <option value="研發">研發部 (RD)</option>
                      <option value="品保">品保部 (QA)</option>
                      <option value="生產">生產部 (PR)</option>
                      <option value="管理">管理部 (MG)</option>
                      <option value="業務">業務部 (SL)</option>
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

          {/* Quick Fill by Member Name */}
          {!isSignUp && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                成員名稱快速帶入（點擊自動填寫名稱與密碼）：
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('王建國')}
                  className="w-full p-2 bg-purple-50 hover:bg-purple-100/70 border border-purple-200 rounded text-left flex items-center justify-between text-[11px] text-purple-900 transition-colors"
                >
                  <div>
                    <strong className="block text-purple-950">王建國 (審核主管 · 品保部)</strong>
                    <span className="text-purple-700 font-mono text-[10px]">密碼預設: apex1234</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200/80 font-medium text-purple-800">
                    具核准/退回權限
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('林哲宇')}
                  className="w-full p-2 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 rounded text-left flex items-center justify-between text-[11px] text-blue-900 transition-colors"
                >
                  <div>
                    <strong className="block text-blue-950">林哲宇 (撰寫人 · 研發部)</strong>
                    <span className="text-blue-700 font-mono text-[10px]">密碼預設: apex1234</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200/80 font-medium text-blue-800">
                    可起草與改版送審
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('陳俊霖')}
                  className="w-full p-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded text-left flex items-center justify-between text-[11px] text-slate-800 transition-colors"
                >
                  <div>
                    <strong className="block text-slate-900">陳俊霖 (一般員工 · 生產線)</strong>
                    <span className="text-slate-600 font-mono text-[10px]">密碼預設: apex1234</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 font-medium text-slate-700">
                    僅可查閱已生效正本
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Apex Industrial Enterprise Document Management System · ISO 9001 Compliant
        </p>
      </div>
    </div>
  );
};
