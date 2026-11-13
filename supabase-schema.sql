-- ==============================================================================
-- Apex DMS - Supabase 資料庫完整結構與權限設定 (SQL Schema & RLS)
-- 請直接在 Supabase 控制台的 SQL Editor 中執行此指令碼
-- ==============================================================================

-- 1. 啟用 UUID 擴充功能
create extension if not exists "uuid-ossp";

-- 2. 建立使用者角色與設定檔表 (profiles)
-- 2. 若現有資料表已有舊資料，先將舊部門值自動清洗對應為 QA, ME, PM（避免被舊資料卡住）：
alter table public.profiles drop constraint if exists profiles_department_check;
update public.profiles 
set department = case 
  when department in ('品保', 'QA') then 'QA'
  when department in ('研發', '機構', 'ME') then 'ME'
  when department in ('管理', '業務', '生產', '專案', 'PM') then 'PM'
  else 'QA'
end;
alter table public.profiles alter column department set default 'QA';
alter table public.profiles add constraint profiles_department_check check (department in ('QA', 'ME', 'PM'));

alter table public.documents drop constraint if exists documents_department_check;
update public.documents 
set department = case 
  when department in ('品保', 'QA') then 'QA'
  when department in ('研發', '機構', 'ME') then 'ME'
  when department in ('管理', '業務', '生產', '專案', 'PM') then 'PM'
  else 'QA'
end;
alter table public.documents alter column department set default 'QA';
alter table public.documents add constraint documents_department_check check (department in ('QA', 'ME', 'PM'));

-- 2. 建立使用者角色與設定檔表 (profiles)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  title text default '專員',
  role text not null check (role in ('Approver', 'Editor', 'Viewer')),
  role_label text not null,
  department text not null default 'QA' check (department in ('QA', 'ME', 'PM')),
  avatar_color text default 'bg-slate-700',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 建立文件主檔表 (documents)
create table if not exists public.documents (
  id text primary key,
  doc_number text unique not null,
  title text not null,
  doc_type text not null check (doc_type in ('SOP', 'SPEC', '表單', '規範')),
  department text not null default 'QA' check (department in ('QA', 'ME', 'PM')),
  department_code text not null,
  current_version text not null default 'v1.0',
  status text not null check (status in ('草稿', '審核中', '已生效', '已作廢')),
  created_by text not null,
  created_by_id text not null,
  approved_by text,
  description text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 建立版本與審核履歷表 (document_versions)
create table if not exists public.document_versions (
  id text primary key,
  doc_id text references public.documents(id) on delete cascade not null,
  doc_number text not null,
  version text not null,
  title text not null,
  revision_summary text not null,
  file_name text not null,
  file_size text not null,
  file_type text not null,
  file_url text,
  status text not null check (status in ('草稿', '審核中', '已生效', '已作廢')),
  author text not null,
  author_id text not null,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  approver text,
  approver_id text,
  review_comment text,
  reviewed_at timestamp with time zone,
  effective_at timestamp with time zone,
  document_body jsonb
);

-- 5. 自動註冊觸發器：當 auth.users 新增使用者時自動同步至 public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    title,
    role,
    role_label,
    department,
    avatar_color
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'title', '工程師'),
    coalesce(new.raw_user_meta_data->>'role', 'Editor'),
    coalesce(new.raw_user_meta_data->>'role_label', '撰寫人'),
    coalesce(new.raw_user_meta_data->>'department', 'QA'),
    coalesce(new.raw_user_meta_data->>'avatar_color', 'bg-blue-600')
  )
  on conflict (id) do update set
    name = excluded.name,
    department = coalesce(new.raw_user_meta_data->>'department', public.profiles.department);
  return new;
end;
$$ language plpgsql security definer;

-- 綁定觸發器
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 補齊尚未寫入 profiles 的現有 auth.users 帳號
insert into public.profiles (
  id,
  email,
  name,
  title,
  role,
  role_label,
  department,
  avatar_color
)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'title', '工程師'),
  coalesce(u.raw_user_meta_data->>'role', 'Editor'),
  coalesce(u.raw_user_meta_data->>'role_label', '撰寫人'),
  case
    when (u.raw_user_meta_data->>'department') in ('QA', 'ME', 'PM') then (u.raw_user_meta_data->>'department')
    else 'QA'
  end,
  coalesce(u.raw_user_meta_data->>'avatar_color', 'bg-blue-600')
from auth.users u
on conflict (id) do nothing;

-- 5-1. 建立姓名登入查詢函式 (繞過未登入 anon 的 RLS 限制，僅回傳對應 Email)
create or replace function public.get_email_by_name(lookup_name text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(trim(name)) = lower(trim(lookup_name))
  limit 1;
$$;

grant execute on function public.get_email_by_name(text) to anon, authenticated;

-- 6. 開啟 Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

-- profiles 存取策略：允許登入頁(anon)依名稱反查 Email，且已登入成員可讀取成員資料、本人可更新自己資料
drop policy if exists "允許所有已登入成員讀取人員設定檔" on public.profiles;
drop policy if exists "允許登入查詢與已登入成員讀取人員設定檔" on public.profiles;
create policy "允許登入查詢與已登入成員讀取人員設定檔"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "允許使用者更新自己的設定檔" on public.profiles;
create policy "允許使用者更新自己的設定檔"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- documents 存取策略：
-- 一般員工 (Viewer) 只能查詢狀態為「已生效」的文件；主管與撰寫人可查詢所有
drop policy if exists "文件查詢權限控制" on public.documents;
create policy "文件查詢權限控制"
  on public.documents for select
  to authenticated
  using (
    status = '已生效'
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Approver', 'Editor')
    )
  );

drop policy if exists "文件新增權限（主管與撰寫人）" on public.documents;
create policy "文件新增權限（主管與撰寫人）"
  on public.documents for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Approver', 'Editor')
    )
  );

drop policy if exists "文件更新權限（主管與撰寫人）" on public.documents;
create policy "文件更新權限（主管與撰寫人）"
  on public.documents for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Approver', 'Editor')
    )
  );

-- document_versions 存取策略：
drop policy if exists "版本紀錄查詢權限控制" on public.document_versions;
create policy "版本紀錄查詢權限控制"
  on public.document_versions for select
  to authenticated
  using (
    status = '已生效'
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Approver', 'Editor')
    )
  );

drop policy if exists "版本紀錄新增權限" on public.document_versions;
create policy "版本紀錄新增權限"
  on public.document_versions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Approver', 'Editor')
    )
  );

drop policy if exists "版本紀錄更新審核權限" on public.document_versions;
create policy "版本紀錄更新審核權限"
  on public.document_versions for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Approver', 'Editor')
    )
  );
