import { createClient } from '@supabase/supabase-js';

// Support modern Publishable key or Anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    !supabaseUrl.includes('YOUR_PROJECT_ID')
  );
};

// Create a Supabase client instance (or a dummy client if not yet configured)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
