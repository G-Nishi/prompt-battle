'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { topicAPI, battleAPI, userAPI } from '@/lib/api';
import { Topic, User } from '@/types';

// メインコンテンツをSuspenseでラップするためのコンポーネント
function BattleCreator() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [opponentEmail, setOpponentEmail] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topic');

  useEffect(() => {
    async function initialize() {
      try {
        // 現在のユーザーを取得
        const user = await userAPI.getCurrentUser();
        if (!user) {
          // ログインしていない場合はログインページへリダイレクト
          router.push('/login');
          return;
        }
        setCurrentUser(user);
        
        // お題一覧を取得
        const fetchedTopics = await topicAPI.getActiveTopics();
        setTopics(fetchedTopics);
        
        // URLからトピックIDが指定されている場合は選択する
        if (topicId) {
          setSelectedTopic(topicId);
        }
        
      } catch (err) {
        console.error('初期化エラー:', err);
        setError('データの読み込み中にエラーが発生しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [router, topicId]);

  // ユーザー検索
  const searchUsers = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    try {
      setSearching(true);
      const results = await userAPI.searchUsers(searchTerm);
      // 自分自身を除外
      const filteredResults = results.filter(user => user.id !== currentUser?.id);
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('ユーザー検索エラー:', err);
    } finally {
      setSearching(false);
    }
  };

  // 対戦相手を選択
  const selectOpponent = (user: User) => {
    setSelectedOpponent(user);
    setOpponentEmail('');
    setSearchTerm('');
    setSearchResults([]);
  };

  // 対戦を作成
  const handleCreateBattle = async () => {
    if (!selectedTopic) {
      setError('お題を選択してください');
      return;
    }

    if (!selectedOpponent && !opponentEmail) {
      setError('対戦相手を選択または招待してください');
      return;
    }

    try {
      setLoading(true);
      
      let opponent: User | null = selectedOpponent;
      
      // メールアドレスで相手を招待する場合
      if (!opponent && opponentEmail) {
        // メールアドレスでユーザーを検索
        const users = await userAPI.searchUsers(opponentEmail);
        opponent = users.find(user => user.email === opponentEmail) || null;
        
        // ユーザーが見つからない場合は仮のユーザー情報を作成
        // 実際のアプリでは招待機能を実装する必要があります
        if (!opponent) {
          setError('指定されたメールアドレスのユーザーが見つかりません');
          setLoading(false);
          return;
        }
      }
      
      if (!opponent || !currentUser) {
        setError('対戦相手または現在のユーザー情報が取得できません');
        setLoading(false);
        return;
      }
      
      // 対戦作成
      const battle = await battleAPI.createBattle(
        selectedTopic,
        opponent.id
      );
      
      // 対戦ページにリダイレクト
      router.push(`/battles/${battle.id}`);
      
    } catch (err) {
      console.error('対戦作成エラー:', err);
      setError('対戦の作成に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">新しい対戦を作成</h1>
          <p className="text-gray-600">
            お題を選択して、友達と対戦を始めましょう。最高のプロンプトで勝負！
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="topic" className="block text-gray-700 font-medium mb-2">
              お題を選択 <span className="text-red-500">*</span>
            </label>
            <select
              id="topic"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
              required
            >
              <option value="">お題を選択してください</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              対戦で使用するお題を選択してください。
              <Link href="/topics/create" className="text-indigo-600 hover:underline">
                新しいお題を作成
              </Link>
              することもできます。
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              対戦相手を選択
            </label>
            
            {selectedOpponent ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {selectedOpponent.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{selectedOpponent.username}</p>
                    <p className="text-sm text-gray-500">{selectedOpponent.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOpponent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ユーザー名で検索..."
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black placeholder-gray-500"
                    />
                    <button
                      type="button"
                      onClick={searchUsers}
                      disabled={searching || searchTerm.length < 3}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                      {searching ? '検索中...' : '検索'}
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-300 rounded-md shadow-sm max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => selectOpponent(user)}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-2">
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center mb-4">
                  <hr className="flex-grow border-t border-gray-300" />
                  <span className="px-3 text-gray-500 text-sm">または</span>
                  <hr className="flex-grow border-t border-gray-300" />
                </div>
                
                <div>
                  <input
                    type="email"
                    value={opponentEmail}
                    onChange={(e) => setOpponentEmail(e.target.value)}
                    placeholder="対戦相手のメールアドレスを入力..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black placeholder-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    メールアドレスで対戦相手を招待することもできます。招待されたユーザーには通知が送られます。
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-between">
            <Link
              href="/battles"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              キャンセル
            </Link>
            <button
              type="button"
              onClick={handleCreateBattle}
              disabled={loading || (!selectedTopic || (!selectedOpponent && !opponentEmail))}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:bg-indigo-400"
            >
              {loading ? '作成中...' : '対戦を作成する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// メインページコンポーネント - Suspenseでラップ
export default function CreateBattle() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
      <BattleCreator />
    </Suspense>
  );
}
