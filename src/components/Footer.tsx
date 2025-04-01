'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-gray-800 py-8 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">プロンプトバトル</h3>
            <p className="text-gray-600">
              AIへのプロンプト精度で対決！あなたのプロンプトスキルを競い合おう。
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900">リンク</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-indigo-600 transition">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/topics" className="text-gray-600 hover:text-indigo-600 transition">
                  お題一覧
                </Link>
              </li>
              <li>
                <Link href="/battles" className="text-gray-600 hover:text-indigo-600 transition">
                  対戦履歴
                </Link>
              </li>
              <li>
                <Link href="/ranking" className="text-gray-600 hover:text-indigo-600 transition">
                  ランキング
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900">お問い合わせ</h3>
            <p className="text-gray-600">
              ご質問やフィードバックがありましたら、お気軽にお問い合わせください。
            </p>
            <Link 
              href="/contact" 
              className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p>&copy; {currentYear} プロンプトバトル. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
