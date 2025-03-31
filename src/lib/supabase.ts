import { createClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient, createServerSupabaseClient, createRouteHandlerSupabaseClient } from './auth';

// 認証関連の機能をエクスポート
export { 
  createBrowserSupabaseClient, 
  createServerSupabaseClient,
  createRouteHandlerSupabaseClient 
};

// レガシーサーバーコンポーネント用のSupabaseクライアント
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
