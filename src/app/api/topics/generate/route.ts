import { NextResponse, NextRequest } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/auth';
import OpenAI from 'openai';

// OpenAI設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// APIキーチェック
function checkApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI APIキーが設定されていません');
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // APIキーチェック
    if (!checkApiKey()) {
      return NextResponse.json({ 
        error: 'APIキーが設定されていません。環境変数を確認してください。' 
      }, { status: 500 });
    }

    // 認証確認 - Next.js App Router方式
    const supabase = createRouteHandlerSupabaseClient(request);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('認証エラー:', authError);
      return NextResponse.json(
        { error: 'ユーザー認証に失敗しました' },
        { status: 401 }
      );
    }
    
    // AIによるお題生成
    let topicData: {title: string; description: string};
    try {
      console.log('OpenAI APIリクエスト開始...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `あなたは創造的な「お題生成AI」です。  
プレイヤーがAIに対するプロンプトの精度を競うゲームのため、プロンプトの良し悪しが明確に分かれる「お題」を1つ生成してください。

【厳守事項】
- 「未来」に関するテーマは絶対に生成しないでください（「未来の〇〇」「2050年の〇〇」などのテーマは禁止）
- 連続して同じカテゴリのお題を出さないでください
- 時間軸のバランスを考慮し、過去・現在・架空世界など、様々な時間軸からお題を選択してください
- すでにゲームで多用されている「ペット」「都市」「日常」といったテーマは避けてください

【お題のカテゴリ】（以下から必ず1つ選び、偏りがないようにしてください）
- ビジネス：企画書作成、市場分析、新製品提案、交渉シナリオ、ビジネスモデル設計など
- 教育：学習教材開発、効果的な説明手法、知識伝達、教育プログラム設計など
- エンターテインメント：物語創作、キャラクター設計、謎解き問題、ゲームシナリオなど
- 技術：技術説明文、トラブルシューティング、問題解決アプローチ、仕様書作成など
- 芸術：芸術作品解説、芸術表現手法、創作手順、批評文、芸術史など
- 社会問題：社会課題分析、解決策提案、政策立案、社会調査手法など
- コミュニケーション：説得文、スピーチ原稿、交渉戦略、感情表現文など
- 自然・環境：自然現象説明、生態系解説、環境保全手法、自然体験設計など
- 歴史・文化：歴史イベント解説、文化比較、伝統解説、歴史的仮説など
- 料理・食文化：レシピ開発、料理技法解説、食文化分析、食体験設計など
- 健康・医療：健康アドバイス、医療情報解説、症状説明、予防法解説など
- 旅行・冒険：旅行計画、冒険シナリオ、地域紹介、文化体験設計など

【お題の条件】  
- 簡潔で分かりやすいもの  
- プロンプトの質によって結果に明確な差が出るような複雑さを持つもの
- 単なる指示ではなく、工夫や創意が必要なもの
- 具体的な指示と抽象的な指示の違いが表れるもの
- 細部の指定がある場合とない場合で結果が大きく異なるもの
- 文章生成に適したもの（物語、説明、要約、対話、文体指定など）

【良いプロンプトと悪いプロンプトの差が出やすいお題の例】
- 特定の専門分野の説明（医学、法律、技術など）を初心者にわかりやすく説明
- 複数の制約条件がある創作タスク（特定の単語を使用/不使用、特定の文体、長さ制限など）
- 感情や雰囲気の表現が求められるもの（怖い話、感動的なスピーチなど）
- 対象読者や状況設定が重要な役割を果たす文章作成

【出力フォーマット】  
以下のJSON形式で出力してください:
{
  "title": "お題のタイトル（簡潔に）",
  "description": "お題の説明（50〜100字程度）"
}`
          },
          {
            role: "user",
            content: "プロンプトバトル用の新しいお題を生成してください。プレイヤーが工夫を凝らしたプロンプトを考えられるような、魅力的なお題をお願いします。"
          }
        ],
        temperature: 0.9,
        max_tokens: 300
      }).catch(error => {
        console.error('OpenAI API呼び出しエラー:', error);
        throw new Error(`お題生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      });
      
      // レスポンスの解析
      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error('AIからの応答が空です');
      }
      
      console.log('OpenAI応答:', responseContent); // デバッグ用
      
      // マークダウンコードブロックの削除
      let cleanedResponse = responseContent;
      
      // ```json や ``` などのマークダウン記法を削除
      cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      console.log('クリーニング後:', cleanedResponse); // デバッグ用
      
      try {
        topicData = JSON.parse(cleanedResponse) as {title: string; description: string};
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
        console.error('解析しようとした文字列:', cleanedResponse);
        return NextResponse.json({ 
          error: `JSONの解析に失敗しました: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          rawText: cleanedResponse
        }, { status: 500 });
      }
      
      // 基本的な検証
      if (!topicData.title || !topicData.description) {
        return NextResponse.json({ 
          error: '生成されたお題が不完全です', 
          rawData: topicData 
        }, { status: 500 });
      }
    } catch (error: unknown) {
      console.error('お題生成エラー詳細:', error);
      
      // エラーメッセージの抽出
      let errorMessage = '不明なエラー';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('エラー種別:', error.name);
        console.error('スタックトレース:', error.stack);
      }
      
      return NextResponse.json(
        { error: `お題の生成に失敗しました: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    // お題をデータベースに保存
    try {
      const { data: topic, error } = await supabase
        .from('topics')
        .insert([
          {
            title: topicData.title,
            description: topicData.description,
            created_by: user.id,
            is_active: true
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('お題保存エラー:', error);
        return NextResponse.json({ error: `お題の保存に失敗しました: ${error.message}` }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        topic
      });
    } catch (error: unknown) {
      console.error('データベース保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return NextResponse.json(
        { error: `お題の保存に失敗しました: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('全体エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `お題生成処理に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
