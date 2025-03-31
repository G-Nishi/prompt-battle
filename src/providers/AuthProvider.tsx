'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase';

// コンテキストの型定義
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

// デフォルト値
const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
};

// コンテキストの作成
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// カスタムフック
export const useAuth = () => useContext(AuthContext);

// プロバイダーコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createBrowserSupabaseClient());

  // セッションのリフレッシュ関数
  const refreshSession = useCallback(async () => {
    try {
      console.log('セッション更新開始');
      setIsLoading(true);
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('セッション取得エラー:', error);
        setSession(null);
        setUser(null);
      } else if (currentSession) {
        console.log('セッション取得成功:', currentSession.user?.email);
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        console.log('セッション無し');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('セッション更新エラー:', error);
    } finally {
      setIsLoading(false);
      console.log('セッション更新完了');
    }
  }, [supabase.auth]);

  // サインアウト関数
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  // 初回マウント時
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshSession();
    });

    // 初期ロード時にもセッション確認
    refreshSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession, supabase.auth]);

  // コンテキスト値
  const value = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
