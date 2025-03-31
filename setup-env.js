const fs = require('fs');
const readline = require('readline');

// 対話型インターフェイスを作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 環境変数ファイルのパス
const envFilePath = './.env.local';

console.log('プロンプトバトルアプリの環境設定を行います');
console.log('-------------------------------------');
console.log('入力された情報は.env.localファイルに保存され、APIキーなどの設定に使用されます。');
console.log('このファイルはGitリポジトリにコミットされません。\n');

// 質問を順番に行い、回答を保存する
rl.question('OpenAI APIキーを入力してください: ', (openaiKey) => {
  rl.question('Supabase URLを入力してください (なければEnterキーを押してください): ', (supabaseUrl) => {
    rl.question('Supabase匿名キーを入力してください (なければEnterキーを押してください): ', (supabaseKey) => {
      // 環境変数ファイルの内容を作成
      const envContent = `# 環境設定 - ${new Date().toISOString()}
# このファイルは.gitignoreに含まれており、リポジトリにコミットされません

# OpenAI API設定
OPENAI_API_KEY=${openaiKey}

# Supabase設定
${supabaseUrl ? `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}` : '# NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseプロジェクトのURL'}
${supabaseKey ? `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}` : '# NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase匿名キー'}
`;

      // ファイルに書き込み
      fs.writeFileSync(envFilePath, envContent);
      console.log(`\n環境設定が完了しました。設定は ${envFilePath} に保存されました。`);
      console.log('アプリを起動するには、以下のコマンドを実行してください:');
      console.log('npm run dev');
      
      rl.close();
    });
  });
});
