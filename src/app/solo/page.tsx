'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topic } from '@/types';
import { topicAPI } from '@/lib/api';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function SoloPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  // トピック一覧取得
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const data = await topicAPI.getTopics();
        setTopics(data);
      } catch (error) {
        console.error('トピック取得エラー:', error);
        setError('お題の取得に失敗しました。後ほど再度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // AIによるお題生成
  const handleGenerateTopic = async () => {
    try {
      setGenerating(true);
      setError(null);
      const newTopic = await topicAPI.generateTopic();
      setTopics([newTopic, ...topics]);
      // 生成したお題へ自動移動
      router.push(`/solo/${newTopic.id}`);
    } catch (error) {
      console.error('お題生成エラー:', error);
      setError('お題の生成に失敗しました。後ほど再度お試しください。');
    } finally {
      setGenerating(false);
    }
  };

  // ログイン状態をチェック
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login?redirect=/solo');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ソロモード</h1>
      
      <div className="mb-8">
        <p className="mb-4">
          ソロモードでは、選んだお題に対してあなたのプロンプトを投稿し、AIによる評価を受けることができます。
          自分のプロンプト力を磨いて、より良いプロンプトを作る練習をしましょう。
        </p>
        
        <button
          onClick={handleGenerateTopic}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {generating ? '生成中...' : 'AIにお題を作ってもらう'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg p-6 h-48 animate-pulse"></div>
          ))
        ) : topics.length > 0 ? (
          topics.map((topic) => (
            <Link
              href={`/solo/${topic.id}`}
              key={topic.id}
              className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow transition-all"
            >
              <h2 className="text-xl font-bold mb-2">{topic.title}</h2>
              <p className="text-gray-700 line-clamp-3">{topic.description}</p>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">お題が見つかりませんでした。「AIにお題を作ってもらう」をクリックしてお題を生成してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}
