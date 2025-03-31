'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function Header() {
  const { user, isLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  
  // デバッグ用: 認証状態が変わるたびにログ出力
  useEffect(() => {
    console.log('Header認証状態:', { user: user?.email, isAuthenticated: !!user, isLoading });
  }, [user, isLoading]);

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('ログアウト成功');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'ユーザー';

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold" onClick={closeMenu}>
              プロンプトバトル
            </Link>
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
              aria-label="メニュー"
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex md:items-center">
            <nav className="mr-6">
              <ul className="flex space-x-6">
                <li>
                  <Link href="/topics" className="text-white hover:text-indigo-200 transition font-medium">
                    お題一覧
                  </Link>
                </li>
                <li>
                  <Link href="/solo" className="text-white hover:text-indigo-200 transition font-medium">
                    ソロモード
                  </Link>
                </li>
                <li>
                  <Link href="/battles" className="text-white hover:text-indigo-200 transition font-medium">
                    対戦履歴
                  </Link>
                </li>
                <li>
                  <Link href="/ranking" className="text-white hover:text-indigo-200 transition font-medium">
                    ランキング
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="flex items-center">
              {isLoading ? (
                <div className="animate-pulse h-10 w-24 bg-indigo-300 rounded"></div>
              ) : user ? (
                <div className="flex items-center">
                  <span className="mr-4 text-white font-medium hidden sm:inline">
                    こんにちは、<Link href="/profile" className="text-white underline hover:text-indigo-200 transition">
                      {username}
                    </Link>さん
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-white text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition font-medium border border-white"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link 
                    href="/login" 
                    className="bg-transparent text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium border border-white"
                  >
                    ログイン
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-white text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition font-medium"
                  >
                    新規登録
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* モバイルメニュー */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-2">
            <nav className="mb-4">
              <ul className="flex flex-col space-y-3">
                <li>
                  <Link 
                    href="/topics" 
                    className="block text-white hover:text-indigo-200 transition font-medium"
                    onClick={closeMenu}
                  >
                    お題一覧
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/solo" 
                    className="block text-white hover:text-indigo-200 transition font-medium"
                    onClick={closeMenu}
                  >
                    ソロモード
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/battles" 
                    className="block text-white hover:text-indigo-200 transition font-medium"
                    onClick={closeMenu}
                  >
                    対戦履歴
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/ranking" 
                    className="block text-white hover:text-indigo-200 transition font-medium"
                    onClick={closeMenu}
                  >
                    ランキング
                  </Link>
                </li>
              </ul>
            </nav>

            <div>
              {isLoading ? (
                <div className="animate-pulse h-10 w-full bg-indigo-300 rounded"></div>
              ) : user ? (
                <div className="flex flex-col space-y-2">
                  <span className="text-white font-medium">
                    こんにちは、<Link href="/profile" className="text-white underline hover:text-indigo-200 transition" onClick={closeMenu}>
                      {username}
                    </Link>さん
                  </span>
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMenu();
                    }}
                    className="bg-white text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition font-medium border border-white w-full"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/login" 
                    className="bg-transparent text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium border border-white text-center"
                    onClick={closeMenu}
                  >
                    ログイン
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-white text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition font-medium text-center"
                    onClick={closeMenu}
                  >
                    新規登録
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
