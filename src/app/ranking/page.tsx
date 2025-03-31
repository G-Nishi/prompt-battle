'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { User } from '@/types';

interface UserRanking extends User {
  total_battles: number;
  wins: number;
  win_rate: number;
}

interface Battle {
  id: number;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  status: string;
}

export default function RankingPage() {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRankings() {
      try {
        // 対戦データを取得
        const { data: battles, error: battlesError } = await supabase
          .from('battles')
          .select('*')
          .eq('status', 'completed')
          .not('winner_id', 'is', null);
        
        if (battlesError) throw battlesError;
        
        // ユーザーデータを取得
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*');
        
        if (usersError) throw usersError;
        
        // ランキングデータを計算
        const userStats: Record<string, { total: number; wins: number }> = {};
        
        // 各ユーザーの統計情報を初期化
        users.forEach((user: User) => {
          userStats[user.id] = { total: 0, wins: 0 };
        });
        
        // 対戦結果から勝敗を集計
        battles.forEach((battle: Battle) => {
          // プレイヤー1の統計
          if (userStats[battle.player1_id]) {
            userStats[battle.player1_id].total++;
            if (battle.winner_id === battle.player1_id) {
              userStats[battle.player1_id].wins++;
            }
          }
          
          // プレイヤー2の統計
          if (userStats[battle.player2_id]) {
            userStats[battle.player2_id].total++;
            if (battle.winner_id === battle.player2_id) {
              userStats[battle.player2_id].wins++;
            }
          }
        });
        
        // ランキングデータを作成
        const rankingData = users.map((user: User) => {
          const stats = userStats[user.id] || { total: 0, wins: 0 };
          const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
          
          return {
            ...user,
            total_battles: stats.total,
            wins: stats.wins,
            win_rate: winRate
          };
        });
        
        // 勝利数でソート
        rankingData.sort((a, b) => {
          // 勝利数が同じ場合は勝率で比較
          if (b.wins === a.wins) {
            return b.win_rate - a.win_rate;
          }
          return b.wins - a.wins;
        });
        
        setRankings(rankingData);
      } catch (err) {
        console.error('ランキングデータの取得に失敗しました:', err);
        setError('ランキングの読み込み中にエラーが発生しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
  }, [supabase]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ランキング</h1>
          <p className="text-gray-600">
            プロンプト対決の勝率や対戦数に基づいたユーザーランキングです。
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {rankings.length === 0 ? (
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
            <h3 className="mt-2 text-lg font-medium text-gray-900">まだランキングデータがありません</h3>
            <p className="mt-1 text-gray-500">
              対戦を行って、ランキングに名前を載せましょう！
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
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 text-center">
                    順位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    対戦数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    勝利数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    勝率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankings.filter(user => user.total_battles > 0).map((user, index) => (
                  <tr key={user.id} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-white rounded-full font-bold">1</span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-300 text-white rounded-full font-bold">2</span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-600 text-white rounded-full font-bold">3</span>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {user.total_battles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {user.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <div className="relative w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-indigo-600"
                            style={{ width: `${user.win_rate}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {user.win_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
