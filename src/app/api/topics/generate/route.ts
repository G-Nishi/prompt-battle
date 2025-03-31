import { NextResponse, NextRequest } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/auth';
import OpenAI from 'openai';

// OpenAI設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "デフォルトのキー（本番環境では置き換えてください）",
});

export async function POST(request: NextRequest) {
  try {
    // 認証確認 - Next.js App Router方式
    const supabase = createRouteHandlerSupabaseClient(request);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // AIによるお題生成
    let topicData: {title: string; description: string};
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `あなたは創造的な「お題生成AI」です。  
プレイヤーがAIに対するプロンプトの精度を競うゲームのため、プロンプトの工夫が求められる「お題」を1つ生成してください。  

【お題の条件】  
- 簡潔で分かりやすいもの  
- 曖昧さがあり、工夫次第で結果が変わるもの  
- 文章生成に適したもの（物語、説明、要約、対話、文体指定など）

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
        temperature: 0.7,
        max_tokens: 300
      });
      
      // レスポンスの解析
      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error('AIからの応答が空です');
      }
      
      topicData = JSON.parse(responseContent) as {title: string; description: string};
      
      // 基本的な検証
      if (!topicData.title || !topicData.description) {
        throw new Error('生成されたお題が不完全です');
      }
    } catch (error: unknown) {
      console.error('お題生成エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
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
      
      return NextResponse.json({ success: true, topic });
    } catch (error: unknown) {
      console.error('データベース保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return NextResponse.json(
        { error: `お題の保存に失敗しました: ${errorMessage}` },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error('お題生成処理エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `お題の生成処理に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
