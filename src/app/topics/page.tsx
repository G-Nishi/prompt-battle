'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { topicAPI } from '@/lib/api';
import { Topic } from '@/types';

export default function TopicsList() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const fetchedTopics = await topicAPI.getActiveTopics();
        setTopics(fetchedTopics);
      } catch (err) {
        console.error('お題の取得に失敗しました:', err);
        setError('お題の読み込み中にエラーが発生しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">お題一覧</h1>
          <p className="text-gray-600">
            プロンプト対決のためのお題を探して、対戦を始めましょう。
          </p>
        </div>
        <Link
          href="/topics/create"
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          新しいお題を作成
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : topics.length === 0 ? (
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">お題がありません</h3>
          <p className="mt-1 text-gray-500">
            まだお題が投稿されていません。最初のお題を作成しましょう！
          </p>
          <div className="mt-6">
            <Link
              href="/topics/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              お題を作成する
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-900">{topic.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{topic.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(topic.created_at).toLocaleDateString('ja-JP')}
                  </span>
                  <Link
                    href={`/battles/new?topic=${topic.id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm"
                  >
                    このお題で対戦
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
