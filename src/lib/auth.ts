import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';

// サーバーサイドのSupabaseクライアント（App Routerのサーバーコンポーネント用）
export const createServerSupabaseClient = (req: NextRequest) => {
  const cookieStore = req.cookies;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (errorOnSet) {
            // エラーを無視（読み取り専用のCookieストアの場合）
            console.debug('Cookie set failed (expected in middleware):', errorOnSet);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (errorOnRemove) {
            // エラーを無視（読み取り専用のCookieストアの場合）
            console.debug('Cookie remove failed (expected in middleware):', errorOnRemove);
          }
        },
      },
    }
  );
};

// クライアントサイドのSupabaseクライアント
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Route HandlerでAPIエンドポイントの認証に使用するSupabaseクライアント
export const createRouteHandlerSupabaseClient = (req: NextRequest) => {
  const cookieStore = req.cookies;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (errorOnSet) {
            // エラーを無視（読み取り専用のCookieストアの場合）
            console.debug('Cookie set failed (expected in middleware):', errorOnSet);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (errorOnRemove) {
            // エラーを無視（読み取り専用のCookieストアの場合）
            console.debug('Cookie remove failed (expected in middleware):', errorOnRemove);
          }
        },
      },
    }
  );
};
