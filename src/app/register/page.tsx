'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    
    // メールアドレスのフォーマット検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('有効なメールアドレス形式を入力してください');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // API経由で登録処理を実行
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'アカウント登録に失敗しました');
      }
      
      console.log('登録成功:', data);
      
      // 成功メッセージを表示
      alert('アカウント登録が完了しました！ログインページに移動します。');
      
      // ログインページへリダイレクト
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (error) {
      console.error('登録処理エラー:', error);
      // エラーオブジェクトの詳細情報を出力
      if (error instanceof Error) {
        console.error('エラー詳細:', { 
          message: error.message, 
          name: error.name, 
          stack: error.stack 
        });
        setError(`アカウント登録に失敗しました: ${error.message}`);
      } else if (typeof error === 'object' && error !== null) {
        // オブジェクトの場合はJSONに変換して詳細を出力
        try {
          console.error('エラー詳細 (オブジェクト):', JSON.stringify(error));
          // 安全にプロパティにアクセス
          const errorObj = error as Record<string, unknown>;
          const errorMsg = 
            typeof errorObj.message === 'string' ? errorObj.message : 
            typeof errorObj.error === 'string' ? errorObj.error : 
            JSON.stringify(error);
          setError(`アカウント登録に失敗しました: ${errorMsg}`);
        } catch (e) {
          console.error('エラー出力中にエラー:', e);
          setError('アカウント登録に失敗しました: 不明なエラーが発生しました');
        }
      } else {
        console.error('未知のエラー形式:', typeof error);
        setError('アカウント登録に失敗しました: 不明なエラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md dark:bg-white">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウント登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              すでにアカウントをお持ちの方はこちら
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                ユーザー名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-700 text-black bg-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="ユーザー名"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-700 text-black bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-700 text-black bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                style={{ color: 'black', backgroundColor: 'white' }}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                パスワード（確認）
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-700 text-black bg-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード（確認）"
                style={{ color: 'black', backgroundColor: 'white' }}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? '登録中...' : 'アカウント登録'}
            </button>
          </div>
          
          <div className="text-sm text-center text-gray-600">
            <p>
              登録することで、
              <Link href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                利用規約
              </Link>
              と
              <Link href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
                プライバシーポリシー
              </Link>
              に同意したことになります。
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
