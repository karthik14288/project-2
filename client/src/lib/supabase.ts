import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xtwkdxoprwaobzmfxxnn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Elr4C1guLTOvO3KLoevP_g_CIvCZeRN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Demo fallback user token key
const DEMO_USER_KEY = 'unify_demo_user';

export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return session.access_token;
  }
  
  // Check local demo session
  const demo = localStorage.getItem(DEMO_USER_KEY);
  if (demo) {
    try {
      const parsed = JSON.parse(demo);
      return parsed.token || null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return {
      id: user.id,
      email: user.email || 'user@unify.ai'
    };
  }

  // Check demo user
  const demo = localStorage.getItem(DEMO_USER_KEY);
  if (demo) {
    try {
      return JSON.parse(demo);
    } catch {
      return null;
    }
  }

  return null;
}

export function setDemoUser(email: string = 'demo.researcher@unify.ai') {
  const demoUser = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email,
    token: 'demo-bearer-token-verified-unify'
  };
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  return demoUser;
}

export function clearDemoUser() {
  localStorage.removeItem(DEMO_USER_KEY);
}
