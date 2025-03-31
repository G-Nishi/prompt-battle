'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { topicAPI } from '@/lib/api';

export default function CreateTopic() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabaseClient());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      setError('タイトルと説明は必須です');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // お題を作成
      await topicAPI.createTopic({
        title,
        description,
        created_by: user.id,
        is_active: true
      });
      
      // お題一覧ページにリダイレクト
      router.push('/topics');
      router.refresh();
    } catch (error) {
      console.error('お題作成エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setError(`お題の作成に失敗しました: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">新しいお題を作成</h1>
          <p className="text-gray-600">
            他のプレイヤーと対戦するための新しいお題を作成します。魅力的なお題を考えて、面白い対決を生み出しましょう！
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
              お題タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例: 「地球温暖化対策について提案する」"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              簡潔で明確なタイトルを付けましょう（50文字以内）
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              お題の説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="お題の詳細な説明を入力してください。具体的なコンテキストや評価ポイントなどを含めると良いでしょう。"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              詳細な説明を提供すると、より質の高い対決が期待できます（500文字以内）
            </p>
          </div>
          
          <div className="flex justify-between">
            <Link
              href="/topics"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:bg-indigo-400"
            >
              {loading ? '作成中...' : 'お題を作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
