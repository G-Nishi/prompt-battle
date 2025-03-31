'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { battleAPI, userAPI, topicAPI } from '@/lib/api';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { Battle, Topic, User, Evaluation } from '@/types';

// クライアントコンポーネントのprops型
interface BattleDetailClientProps {
  id: string;
}

export default function BattleDetailClient({ id }: BattleDetailClientProps) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [battle, setBattle] = useState<Battle | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [player1, setPlayer1] = useState<User | null>(null);
  const [player2, setPlayer2] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ユーザーが対戦の参加者かどうか
  const isParticipant = currentUser && battle && 
    (battle.player1_id === currentUser.id || battle.player2_id === currentUser.id);
  
  // 現在のユーザーがプレイヤー1かどうか
  const isPlayer1 = currentUser && battle && battle.player1_id === currentUser.id;
  
  // 対戦情報の取得
  useEffect(() => {
    const fetchBattleDetails = async () => {
      try {
        setLoading(true);
        
        // ユーザー情報を取得
        const user = await userAPI.getCurrentUser();
        setCurrentUser(user);
        
        // 対戦情報を取得
        const { battle, evaluation } = await battleAPI.getBattleDetail(id);
        setBattle(battle);
        setEvaluation(evaluation);
        
        if (battle) {
          // お題情報を取得
          const topic = await topicAPI.getTopic(battle.topic_id);
          setTopic(topic);
          
          // プレイヤー情報を取得
          const player1 = await userAPI.getUser(battle.player1_id);
          const player2 = await userAPI.getUser(battle.player2_id);
          setPlayer1(player1);
          setPlayer2(player2);
        }
      } catch (error) {
        console.error('対戦情報取得エラー:', error);
        setError('対戦情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBattleDetails();
    
    // リアルタイム更新をリッスン
    const battleSubscription = supabase
      .channel('battle-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${id}`
      }, async () => {
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
  
  // カスタムスタイルをheadに追加
  useEffect(() => {
    // 既存のスタイルタグがあれば削除
    const existingStyle = document.getElementById('battle-textarea-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 新しいスタイルタグを作成
    const style = document.createElement('style');
    style.id = 'battle-textarea-style';
    style.innerHTML = `
      #battle-prompt-textarea {
        background-color: white !important;
        color: #0000ff !important;
      }
      #battle-prompt-textarea::placeholder {
        color: #666666 !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);

    // クリーンアップ関数
    return () => {
      const styleToRemove = document.getElementById('battle-textarea-style');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);
  
  // プロンプト送信処理
  const handleSubmitPrompt = async () => {
    if (!prompt.trim() || !battle || !currentUser || !topic) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // プロンプトを送信
      const isPlayer1 = battle.player1_id === currentUser.id;
      const playerId = isPlayer1 ? 'player1' : 'player2';
      
      await battleAPI.submitPrompt(battle.id, playerId, prompt, topic.title);
      
      // フォームをリセット
      setPrompt('');
      
    } catch (error) {
      console.error('プロンプト送信エラー:', error);
      setError('プロンプトの送信に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center my-8">読み込み中...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 my-4">{error}</div>;
  }
  
  if (!battle || !topic) {
    return <div>対戦が見つかりません。</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">対戦詳細</h1>
      
      {/* お題情報 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">お題: {topic.title}</h2>
        <p className="text-gray-700">{topic.description}</p>
      </div>
      
      {/* 対戦状況 */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">
            {player1?.username} vs {player2?.username}
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {battle.status === 'waiting' && '待機中'}
            {battle.status === 'in_progress' && '進行中'}
            {battle.status === 'completed' && '完了'}
          </div>
        </div>
        
        {/* プレイヤー1の情報 */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">{player1?.username}のプロンプト:</h3>
          {battle.player1_prompt ? (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-900 font-medium">{battle.player1_prompt}</p>
            </div>
          ) : (
            <div className="text-gray-500">まだプロンプトが送信されていません</div>
          )}
          
          {battle.player1_response && (
            <>
              <h3 className="font-semibold mt-4 mb-2">AIの回答:</h3>
              <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap">
                <p className="text-gray-900 font-medium">{battle.player1_response}</p>
              </div>
            </>
          )}
        </div>
        
        {/* プレイヤー2の情報 */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">{player2?.username}のプロンプト:</h3>
          {battle.player2_prompt ? (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-900 font-medium">{battle.player2_prompt}</p>
            </div>
          ) : (
            <div className="text-gray-500">まだプロンプトが送信されていません</div>
          )}
          
          {battle.player2_response && (
            <>
              <h3 className="font-semibold mt-4 mb-2">AIの回答:</h3>
              <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap">
                <p className="text-gray-900 font-medium">{battle.player2_response}</p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 評価結果 */}
      {evaluation && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">評価結果</h2>
          
          {/* 勝者表示 */}
          <div className="mb-6 bg-white p-4 rounded-md border border-yellow-300">
            <p className="text-lg font-bold text-center">
              勝者: {evaluation.winner_id === battle?.player1_id ? player1?.username : player2?.username}
            </p>
          </div>
          
          {/* 詳細評価 */}
          {evaluation.detailed_evaluation ? (
            <div className="space-y-6">
              {/* プレイヤー1の評価 */}
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold mb-2 text-gray-800">{player1?.username}の評価:</h3>
                <p className="text-gray-700">{evaluation.detailed_evaluation.player1}</p>
              </div>
              
              {/* プレイヤー2の評価 */}
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold mb-2 text-gray-800">{player2?.username}の評価:</h3>
                <p className="text-gray-700">{evaluation.detailed_evaluation.player2}</p>
              </div>
              
              {/* 総合評価 */}
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold mb-2 text-gray-800">総合評価:</h3>
                <p className="text-gray-700">{evaluation.detailed_evaluation.summary}</p>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              <p className="text-gray-800 font-medium">{evaluation.evaluation_text}</p>
            </div>
          )}
          
          {/* 評価基準の説明 */}
          <div className="mt-6 bg-yellow-100 p-3 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">評価基準:</h4>
            <ul className="list-disc list-inside text-sm text-yellow-800">
              <li><span className="font-medium">具体性</span>: より具体的で詳細な回答を引き出しているか</li>
              <li><span className="font-medium">効率性</span>: プロンプトの長さに対する回答の質と量のバランス</li>
              <li><span className="font-medium">正確性</span>: 得られた回答がお題に対して正確で適切か</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* プロンプト入力フォーム（参加者かつ対戦が完了していない場合のみ表示） */}
      {isParticipant && battle.status !== 'completed' && (
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">プロンプトを送信</h2>
          
          {/* 自分のプロンプトが既に送信済みかチェック */}
          {(isPlayer1 && battle.player1_prompt) || (!isPlayer1 && battle.player2_prompt) ? (
            <div className="text-gray-700">プロンプトは既に送信されています。相手の入力を待っています...</div>
          ) : (
            <div>
              <textarea
                id="battle-prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 border rounded-md mb-3"
                rows={5}
                placeholder="AIに指示するプロンプトを入力してください..."
                disabled={submitting}
              />
              <button
                onClick={handleSubmitPrompt}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                disabled={!prompt.trim() || submitting}
              >
                {submitting ? '送信中...' : 'プロンプトを送信'}
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between mt-6">
        <Link href="/battles" className="text-blue-500 hover:underline">
          対戦一覧に戻る
        </Link>
      </div>
    </div>
  );
}
