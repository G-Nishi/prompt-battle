// サーバーコンポーネント
import BattleDetailClient from './battle-detail-client';
import { Metadata } from 'next';
import { Suspense } from 'react';
import React from 'react';

interface PageParams {
  id: string;
}

type Props = {
  params: PageParams;
};

// メタデータ生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Next.js 15.xでのサーバーコンポーネントでのパラメータ処理
  const id = params?.id;
  
  return {
    title: `バトル詳細 #${id}`,
    description: 'プロンプトバトルの詳細ページです',
  };
}

// ページコンポーネント
export default async function BattlePage({ params }: Props) {
  // Next.js 15.xでのサーバーコンポーネントでのパラメータ処理
  const id = params?.id;
  
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <BattleDetailClient id={id} />
    </Suspense>
  );
}
