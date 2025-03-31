import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">プロンプトバトル</h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            あなたのプロンプトスキルを競い合おう！AIに最適な回答を出させるプロンプトで対決する新感覚ゲーム
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/battles/new"
              className="bg-white text-indigo-600 hover:bg-indigo-100 px-6 py-3 rounded-md font-bold text-lg transition"
            >
              対戦を始める
            </Link>
            <Link
              href="/topics"
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3 rounded-md font-bold text-lg transition"
            >
              お題を見る
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">プロンプトバトルの特徴</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">リアルタイム対決</h3>
              <p className="text-gray-600 text-center">
                プロンプトを作成し、相手と競い合うスリリングな対決を楽しめます。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">AIによる公平な判定</h3>
              <p className="text-gray-600 text-center">
                AIが両者のプロンプトを評価し、より優れた結果を出した方を勝者として判定します。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">様々なお題</h3>
              <p className="text-gray-600 text-center">
                多様なカテゴリからお題を選択できます。自分でオリジナルのお題を作成することも可能です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">プロンプトバトルの遊び方</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center mb-4">
                <span className="font-bold">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">アカウント登録</h3>
              <p className="text-gray-600">
                まずは簡単な登録からスタート。メールアドレスと基本情報を入力するだけで、すぐに対戦を始められます。
              </p>
            </div>
            <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-center">アカウント登録イメージ</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12 md:flex-row-reverse">
            <div className="order-1 md:order-2">
              <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center mb-4">
                <span className="font-bold">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">お題を選ぶ</h3>
              <p className="text-gray-600">
                様々なカテゴリからお題を選択。テクノロジー、社会問題、エンターテイメントなど、多様なテーマから選べます。
              </p>
            </div>
            <div className="order-2 md:order-1 bg-gray-200 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-center">お題選択イメージ</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center mb-4">
                <span className="font-bold">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">プロンプトを作成</h3>
              <p className="text-gray-600">
                選んだお題に対して、AIから最適な回答を引き出すためのプロンプトを作成します。あなたのプロンプト設計スキルが試されます。
              </p>
            </div>
            <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-center">プロンプト作成イメージ</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="order-1 md:order-2">
              <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center mb-4">
                <span className="font-bold">4</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">結果を確認</h3>
              <p className="text-gray-600">
                両者のプロンプトによって生成されたAI回答を比較し、AIによる判定結果を確認。評価理由も詳しく表示されます。
              </p>
            </div>
            <div className="order-2 md:order-1 bg-gray-200 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-center">結果確認イメージ</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">今すぐプロンプトバトルを始めよう！</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            あなたのプロンプトスキルを競い、AIとの対話技術を磨きましょう。友達を招待して対戦することもできます！
          </p>
          <Link
            href="/register"
            className="bg-white text-indigo-600 hover:bg-indigo-100 px-8 py-4 rounded-md font-bold text-lg transition inline-block"
          >
            無料で登録する
          </Link>
        </div>
      </section>
    </div>
  );
}
