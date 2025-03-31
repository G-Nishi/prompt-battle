// 環境変数のテスト用スクリプト
require('dotenv').config({ path: './.env.local' });

console.log('環境変数テスト');
console.log('===============================');

// OpenAI APIキーのテスト
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  console.log('✅ OpenAI APIキー: 設定されています');
  // APIキーの一部だけを表示（セキュリティのため）
  const maskedKey = openaiKey.substring(0, 8) + '...' + openaiKey.substring(openaiKey.length - 4);
  console.log(`   キーの一部: ${maskedKey}`);
} else {
  console.log('❌ OpenAI APIキー: 設定されていません');
}

// Supabase URLのテスト
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  console.log('✅ Supabase URL: 設定されています');
  console.log(`   URL: ${supabaseUrl}`);
} else {
  console.log('⚠️ Supabase URL: 設定されていません（必要に応じて設定してください）');
}

// Supabase匿名キーのテスト
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (supabaseKey) {
  console.log('✅ Supabase匿名キー: 設定されています');
  // キーの一部だけを表示（セキュリティのため）
  const maskedKey = supabaseKey.substring(0, 8) + '...' + supabaseKey.substring(supabaseKey.length - 4);
  console.log(`   キーの一部: ${maskedKey}`);
} else {
  console.log('⚠️ Supabase匿名キー: 設定されていません（必要に応じて設定してください）');
}

console.log('\n環境変数テスト完了');
console.log('===============================');
console.log('アプリを起動するには、以下のコマンドを実行してください:');
console.log('npm run dev');
