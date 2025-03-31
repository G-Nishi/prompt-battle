'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { battleAPI, userAPI, topicAPI } from '@/lib/api';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { Battle, Topic, User, Evaluation } from '@/types';

interface BattleDetailProps {
  params: {
    id: string;
  };
}

export default function BattleDetail({ params }: BattleDetailProps) {
  const { id } = params;
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [battle, setBattle] = useState<Battle | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [player1, setPlayer1] = useState<User | null>(null);
  const [player2, setPlayer2] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ユーザーが対戦の参加者かどうか
  const isParticipant = currentUser && battle && 
    (battle.player1_id === currentUser.id || battle.player2_id === currentUser.id);
  
  // 現在のユーザーがプレイヤー1かどうか
  const isPlayer1 = currentUser && battle && battle.player1_id === currentUser.id;
  
  // 現在のユーザーがプレイヤー2かどうか
  const isPlayer2 = currentUser && battle && battle.player2_id === currentUser.id;
  
  // 現在のユーザーのプロンプトが送信済みかどうか
  const hasSubmittedPrompt = isPlayer1 
    ? battle?.player1_prompt 
    : (isPlayer2 ? battle?.player2_prompt : false);

  useEffect(() => {
    async function fetchBattleDetails() {
      try {
        // 現在のユーザーを取得
        const user = await userAPI.getCurrentUser();
        setCurrentUser(user);

        // 対戦情報を取得
        const { battle, evaluation } = await battleAPI.getBattleDetail(id);
        setBattle(battle);
        setEvaluation(evaluation);

        if (battle) {
          // お題情報を取得
          const topics = await topicAPI.getTopics();
          const foundTopic = topics.find(t => t.id === battle.topic_id);
          setTopic(foundTopic || null);

          // プレイヤー情報を取得
          const { data: player1Data } = await supabase
            .from('users')
            .select('*')
            .eq('id', battle.player1_id)
            .single();
          setPlayer1(player1Data as User);

          const { data: player2Data } = await supabase
            .from('users')
            .select('*')
            .eq('id', battle.player2_id)
            .single();
          setPlayer2(player2Data as User);
        }
      } catch (err) {
        console.error('対戦詳細の取得に失敗しました:', err);
        setError('対戦情報の読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchBattleDetails();
    
    // リアルタイム更新をリッスン
    const battleSubscription = supabase
      .channel('battle-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${id}`
      }, async (payload) => {
        // 対戦情報を更新
        const { battle, evaluation } = await battleAPI.getBattleDetail(id);
        setBattle(battle);
        setEvaluation(evaluation);
      })
      .subscribe();
    
    return () => {
      // クリーンアップ時にサブスクリプションを解除
      battleSubscription.unsubscribe();
    };
  }, [id, supabase]);

  // プロンプト送信
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }
    
    if (!battle || !topic || !currentUser) {
      setError('対戦情報が取得できません');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // プロンプトを送信
      await battleAPI.submitPrompt(
        battle.id,
        currentUser.id,
        prompt,
        topic.title
      );
      
      // プロンプト入力欄をクリア
      setPrompt('');
      
      // 対戦情報を再取得
      const { battle: updatedBattle, evaluation: updatedEvaluation } = await battleAPI.getBattleDetail(id);
      setBattle(updatedBattle);
      setEvaluation(updatedEvaluation);
      
    } catch (err) {
      console.error('プロンプト送信エラー:', err);
      setError('プロンプトの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!battle || !topic) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">対戦が見つかりませんでした。</p>
        </div>
        <Link href="/battles" className="text-indigo-600 hover:underline">
          対戦一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* 対戦ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">プロンプト対決</h1>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-indigo-600">{topic.title}</p>
              <p className="text-gray-600">{topic.description}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                battle.status === 'waiting' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : battle.status === 'in_progress' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {{
                  'waiting': '対戦待ち',
                  'in_progress': '対戦中',
                  'completed': '対戦終了'
                }[battle.status]}
              </span>
            </div>
          </div>
        </div>
        
        {/* 対戦者情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow-md ${battle.winner_id === battle.player1_id ? 'bg-green-50 border border-green-200' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                {player1?.username.charAt(0).toUpperCase() || 'P1'}
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg">
                  {player1?.username || 'プレイヤー1'}
                  {isPlayer1 && <span className="ml-2 text-sm text-gray-500">(あなた)</span>}
                  {battle.winner_id === battle.player1_id && <span className="ml-2 text-sm text-green-600">🏆 勝者</span>}
                </h3>
                <p className="text-sm text-gray-500">{player1?.email}</p>
              </div>
            </div>
            
            {battle.player1_prompt && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-1">プロンプト:</h4>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{battle.player1_prompt}</p>
                </div>
              </div>
            )}
            
            {battle.player1_response && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-1">AI回答:</h4>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-60 overflow-y-auto">
                  <p className="text-gray-800 whitespace-pre-wrap">{battle.player1_response}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className={`p-6 rounded-lg shadow-md ${battle.winner_id === battle.player2_id ? 'bg-green-50 border border-green-200' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                {player2?.username.charAt(0).toUpperCase() || 'P2'}
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg">
                  {player2?.username || 'プレイヤー2'}
                  {isPlayer2 && <span className="ml-2 text-sm text-gray-500">(あなた)</span>}
                  {battle.winner_id === battle.player2_id && <span className="ml-2 text-sm text-green-600">🏆 勝者</span>}
                </h3>
                <p className="text-sm text-gray-500">{player2?.email}</p>
              </div>
            </div>
            
            {battle.player2_prompt && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-1">プロンプト:</h4>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{battle.player2_prompt}</p>
                </div>
              </div>
            )}
            
            {battle.player2_response && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-1">AI回答:</h4>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-60 overflow-y-auto">
                  <p className="text-gray-800 whitespace-pre-wrap">{battle.player2_response}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 評価結果 */}
        {evaluation && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">評価結果</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-2">審査員による評価:</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{evaluation.evaluation_text}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium">勝者: </span>
                <span className="ml-2 font-bold">
                  {evaluation.winner_id === battle.player1_id
                    ? player1?.username || 'プレイヤー1'
                    : player2?.username || 'プレイヤー2'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* プロンプト入力 */}
        {isParticipant && battle.status !== 'completed' && !hasSubmittedPrompt && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">プロンプトを作成</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form onSubmit={handleSubmitPrompt}>
                <div className="mb-4">
                  <label htmlFor="prompt" className="block text-gray-700 font-medium mb-2">
                    お題「{topic.title}」に対するプロンプト:
                  </label>
                  <textarea
                    id="prompt"
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="AIに最適な回答をさせるためのプロンプトを入力してください..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    お題に対して、AIから最適な回答を引き出すための効果的なプロンプトを作成してください。
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !prompt.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:bg-indigo-400"
                  >
                    {submitting ? 'プロンプト送信中...' : 'プロンプトを送信'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* 待機中メッセージ */}
        {isParticipant && battle.status === 'in_progress' && hasSubmittedPrompt && !evaluation && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  プロンプトを送信しました。相手の入力を待っています...
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <Link
            href="/battles"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            対戦一覧に戻る
          </Link>
          
          {battle.status === 'completed' && (
            <Link
              href="/battles/new"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              新しい対戦を始める
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
