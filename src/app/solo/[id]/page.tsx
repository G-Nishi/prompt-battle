'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { topicAPI } from '@/lib/api';
import { Topic } from '@/types';
import Link from 'next/link';

type Props = {
  params: {
    id: string;
  };
};

// 日本語キーを使用した評価結果の型定義
interface JapaneseEvaluation {
  '精度': number;
  '出力の質': number;
  '独自性': number;
  '明確さ': number;
  '制約遵守': number;
  '総合評価': number;
  'コメント': string;
}

export default function SoloBattlePage({ params }: Props) {
  // クライアントコンポーネントでのパラメーターアクセス
  // 1. paramsプロパティから変数を作成する方法
  const id = params?.id;
  // バックアップ: IDが取得できない場合に備えて
  const router = useRouter();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<JapaneseEvaluation | null>(null);

  useEffect(() => {
    if (!id) {
      setError('トピックIDが指定されていません。');
      setLoading(false);
      return;
    }

    async function fetchTopic() {
      try {
        setLoading(true);
        console.log('トピックID:', id);
        const fetchedTopic = await topicAPI.getTopic(id);
        
        if (!fetchedTopic) {
          console.error('お題が見つかりません:', id);
          setError('指定されたお題が見つかりませんでした。');
          setLoading(false);
          return;
        }
        
        setTopic(fetchedTopic);
      } catch (err) {
        console.error('お題の取得に失敗しました:', err);
        setError('お題の読み込み中にエラーが発生しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    const checkAuth = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('認証エラー:', error.message);
          setError('認証エラーが発生しました: ' + error.message);
          return;
        }
        
        if (!data.session) {
          console.log('ログインしていません。ログインページにリダイレクトします');
          if (id) {
            router.push('/login?redirect=/solo/' + id);
          } else {
            router.push('/login?redirect=/solo');
          }
          return;
        }
        
        fetchTopic();
      } catch (error) {
        console.error('認証チェック中にエラーが発生しました:', error instanceof Error ? error.message : error);
        setError('認証エラーが発生しました。ログインし直してください。');
        setLoading(false);
      }
    };

    checkAuth();
  }, [id, router]);

  // カスタムスタイルをheadに追加
  useEffect(() => {
    // 既存のスタイルタグがあれば削除
    const existingStyle = document.getElementById('custom-textarea-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 新しいスタイルタグを作成
    const style = document.createElement('style');
    style.id = 'custom-textarea-style';
    style.innerHTML = `
      #solo-prompt-textarea {
        background-color: white !important;
        color: #0000ff !important;
      }
      #solo-prompt-textarea::placeholder {
        color: #666666 !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);

    // クリーンアップ関数
    return () => {
      const styleToRemove = document.getElementById('custom-textarea-style');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  // プロンプト送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }

    if (!topic) {
      setError('お題情報が取得できませんでした');
      return;
    }

    try {
      setEvaluating(true);
      setError(null);
      
      const response = await fetch('/api/solo/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          topicId: topic.id,
          topicTitle: topic.title,
          topicDescription: topic.description
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'プロンプト評価に失敗しました');
      }
      
      setResponse(data.response);
      setEvaluation(data.evaluation);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: unknown) {
      console.error('プロンプト評価エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      setError(`プロンプト評価に失敗しました: ${errorMessage}`);
    } finally {
      setEvaluating(false);
    }
  };

  // 別のお題に挑戦
  const handleTryAnotherTopic = () => {
    router.push('/solo');
  };

  // 同じお題に再挑戦
  const handleRetry = () => {
    setPrompt('');
    setResponse(null);
    setEvaluation(null);
    setError(null);
  };

  // プログレスバー表示
  const ScoreProgress = ({ score, label, color }: { score: number, label: string, color: string }) => {
    // 0-10スケールから0-20スケールに変換（OpenAI APIは0-10で評価）
    const displayScore = Math.round(score * 2);
    
    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-gray-700 font-medium">{label}</span>
          <span className="text-gray-700">{displayScore}/20</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${color}`} 
            style={{ width: `${displayScore * 5}%` }} 
          >
            {/* 0-20を0-100%に変換 */}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/solo" className="text-purple-600 hover:text-purple-800 transition-colors">
          ← ソロモードトップに戻る
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded mb-6"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      ) : topic ? (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">{topic.title}</h1>
            <p className="text-gray-700 whitespace-pre-line">{topic.description}</p>
          </div>
          
          {response && evaluation ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800">評価結果</h2>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 text-gray-700">あなたのプロンプト:</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <p className="whitespace-pre-line text-gray-900 font-medium">{prompt}</p>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 text-gray-700">AIの応答:</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="whitespace-pre-line text-gray-900 font-medium">{response}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-700">スコア評価:</h3>
                
                <ScoreProgress 
                  score={evaluation['精度']} 
                  label="お題との関連性" 
                  color="bg-blue-600" 
                />
                
                <ScoreProgress 
                  score={evaluation['独自性']} 
                  label="創造性と独自性" 
                  color="bg-purple-600" 
                />
                
                <ScoreProgress 
                  score={evaluation['明確さ']} 
                  label="明確さと具体性" 
                  color="bg-green-600" 
                />
                
                <ScoreProgress 
                  score={evaluation['制約遵守']} 
                  label="効果的な指示" 
                  color="bg-orange-500" 
                />
                
                <div className="mt-4 flex items-center">
                  <div className="text-xl font-bold mr-3">合計: {Math.round(evaluation['総合評価'] * 10)}/100</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full">
                    <div 
                      className={`h-4 rounded-full ${
                        Math.round(evaluation['総合評価'] * 10) >= 80 ? 'bg-green-600' : 
                        Math.round(evaluation['総合評価'] * 10) >= 60 ? 'bg-blue-600' : 
                        Math.round(evaluation['総合評価'] * 10) >= 40 ? 'bg-yellow-500' : 'bg-red-600'
                      }`} 
                      style={{ width: `${Math.round(evaluation['総合評価'] * 10)}%` }}
                    >
                      {/* 0-10を0-100%に変換 */}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-2 text-gray-700">評価コメント:</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="whitespace-pre-line text-gray-900 font-medium">{evaluation['コメント']}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleRetry}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  同じお題でもう一度挑戦
                </button>
                
                <button
                  onClick={handleTryAnotherTopic}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  別のお題に挑戦
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800">プロンプトを作成</h2>
              <p className="mb-6 text-gray-600">
                上記のお題に対してあなたのプロンプトを入力してください。AIがあなたのプロンプトに基づいて回答し、評価します。
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="solo-prompt-textarea" className="block text-gray-700 font-medium mb-2">
                    プロンプト:
                  </label>
                  <textarea
                    id="solo-prompt-textarea"
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="お題に沿ったプロンプトを入力..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-black placeholder-gray-700"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={evaluating}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {evaluating ? '評価中...' : 'プロンプトを送信して評価を受ける'}
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-800">お題が見つかりませんでした。別のお題を選択してください。</p>
          <button
            onClick={() => router.push('/solo')}
            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            お題一覧に戻る
          </button>
        </div>
      )}
    </div>
  );
}
