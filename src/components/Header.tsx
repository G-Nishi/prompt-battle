'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { User } from '@/types';

export default function Header() {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setUser(data as User);
        }
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/" className="text-2xl font-bold">
              プロンプトバトル
            </Link>
            <nav className="ml-8 hidden md:block">
              <ul className="flex space-x-6">
                <li>
                  <Link href="/topics" className="hover:text-indigo-200 transition">
                    お題一覧
                  </Link>
                </li>
                <li>
                  <Link href="/battles" className="hover:text-indigo-200 transition">
                    対戦履歴
                  </Link>
                </li>
                <li>
                  <Link href="/ranking" className="hover:text-indigo-200 transition">
                    ランキング
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center">
            {loading ? (
              <div className="animate-pulse h-10 w-24 bg-indigo-300 rounded"></div>
            ) : user ? (
              <div className="flex items-center">
                <Link href="/profile" className="mr-4 hover:text-indigo-200 transition">
                  {user.username || 'プロフィール'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-100 transition"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link 
                  href="/login" 
                  className="bg-white text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-100 transition"
                >
                  ログイン
                </Link>
                <Link 
                  href="/register" 
                  className="bg-indigo-800 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
