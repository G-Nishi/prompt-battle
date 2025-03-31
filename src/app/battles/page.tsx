'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { battleAPI, userAPI, topicAPI } from '@/lib/api';
import { Battle, Topic, User } from '@/types';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function BattlesList() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    async function fetchBattles() {
      try {
        // ユーザー情報を取得
        const user = await userAPI.getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setCurrentUser(user);

        // お題を取得
        const fetchedTopics = await topicAPI.getTopics();
        const topicsMap: Record<string, Topic> = {};
        fetchedTopics.forEach(topic => {
          topicsMap[topic.id] = topic;
        });
        setTopics(topicsMap);

        // ユーザーの対戦履歴を取得
        const fetchedBattles = await battleAPI.getUserBattles(user.id);
        setBattles(fetchedBattles);

        // 対戦参加者の情報を取得
        const userIds = new Set<string>();
        fetchedBattles.forEach(battle => {
          userIds.add(battle.player1_id);
          userIds.add(battle.player2_id);
        });

        const usersMap: Record<string, User> = {};
        for (const userId of userIds) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (data) {
            usersMap[userId] = data as User;
          }
        }
        setUsers(usersMap);

      } catch (err) {
        console.error('対戦履歴の取得に失敗しました:', err);
        setError('対戦履歴の読み込み中にエラーが発生しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    }

    fetchBattles();
  }, [router, supabase]);

  // 対戦ステータスに応じたラベルと色を取得
  const getBattleStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting':
        return { label: '対戦待ち', color: 'bg-yellow-100 text-yellow-800' };
      case 'in_progress':
        return { label: '対戦中', color: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return { label: '対戦終了', color: 'bg-green-100 text-green-800' };
      default:
        return { label: '不明', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // 対戦相手の情報を取得
  const getOpponent = (battle: Battle) => {
    if (!currentUser) return null;
    const opponentId = battle.player1_id === currentUser.id ? battle.player2_id : battle.player1_id;
    return users[opponentId];
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">対戦履歴</h1>
          <p className="text-gray-600">
            これまでの対戦結果とプロンプト履歴を確認できます。
          </p>
        </div>
        <Link
          href="/battles/new"
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          新しい対戦を始める
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {battles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">対戦履歴がありません</h3>
          <p className="mt-1 text-gray-500">
            まだ対戦を行っていません。新しい対戦を始めましょう！
          </p>
          <div className="mt-6">
            <Link
              href="/battles/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              対戦を始める
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  お題
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  対戦相手
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  結果
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日時
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {battles.map((battle) => {
                const statusInfo = getBattleStatusInfo(battle.status);
                const opponent = getOpponent(battle);
                const isWinner = battle.winner_id === currentUser?.id;
                const isLoser = battle.winner_id && battle.winner_id !== currentUser?.id;
                
                return (
                  <tr key={battle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {topics[battle.topic_id]?.title || 'お題が見つかりません'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {opponent?.username.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {opponent?.username || '不明なユーザー'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {battle.status === 'completed' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isWinner 
                            ? 'bg-green-100 text-green-800' 
                            : isLoser 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isWinner ? '勝利' : isLoser ? '敗北' : '引き分け'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(battle.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/battles/${battle.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        詳細を見る
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
