// データクリアスクリプト
// 使用方法: node clear-data.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase接続
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function clearData() {
  try {
    console.log('データ削除を開始...');

    // 依存関係のある順にデータを削除
    console.log('評価データを削除中...');
    await supabase.from('evaluations').delete().neq('id', '');
    
    console.log('対戦データを削除中...');
    await supabase.from('battles').delete().neq('id', '');
    
    console.log('お題データを削除中...');
    await supabase.from('topics').delete().neq('id', '');
    
    console.log('ユーザーデータを削除中...');
    await supabase.from('users').delete().neq('id', '');
    
    // 注意: 認証ユーザーの削除はサービスロールキーが必要で、通常はダッシュボードから行うべき
    console.log('データ削除が完了しました');
  } catch (error) {
    console.error('データ削除エラー:', error);
  }
}

clearData();
