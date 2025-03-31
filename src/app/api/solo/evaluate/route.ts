import { NextResponse, NextRequest } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/auth';
import OpenAI from 'openai';

// OpenAI設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, topicId, topicTitle, topicDescription } = await request.json();
    
    // 入力検証
    if (!prompt || !topicId || !topicTitle) {
      return NextResponse.json({ error: '必要なパラメータが不足しています' }, { status: 400 });
    }
    
    // 認証確認
    const supabase = createRouteHandlerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // AIによるプロンプト応答生成
    let response: string;
    try {
      const responseCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `あなたは高度な文章生成AIです。  
与えられた「お題」と「ユーザーのプロンプト」に従い、適切な回答を生成してください。  

【入力情報】  
- **お題**: AIが出題したお題  
- **プロンプト**: ユーザーが考えた指示  

【回答のルール】  
1. **プロンプトに忠実に従うこと**  
   - 文体、長さ、形式などの指示を正確に守る。  
2. **一貫性と論理性を保つこと**  
   - 物語の場合、ストーリーの流れを自然にする。  
   - 説明の場合、明確で分かりやすい文章にする。  
3. **創造性を発揮すること**  
   - 指示の範囲内で、可能な限り独自性を持たせる。  
4. **簡潔で明瞭な文章を作ること**  
   - 余計な冗長表現を避け、分かりやすくする。  

【出力フォーマット】  
AIの回答のみを出力してください。  

【入力例】  
お題: 「ゴシックホラー風に学校の日常を描写してください」  
プロンプト: 「19世紀ヨーロッパのゴシックホラー小説風に、登場人物が謎の教師の秘密を探る物語を100文字以内で書いてください」  

【出力例】  
霧深い学び舎に響く謎の足音。黒衣の教師は幽霊か、それとも禁じられた知識を守る者なのか？

このルールに従い、適切な回答を生成してください。`
          },
          {
            role: "user",
            content: `お題: ${topicTitle}\n${topicDescription || ''}\n\nプロンプト: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      response = responseCompletion.choices[0].message.content || '';
      if (!response) {
        throw new Error('AIからの応答が空です');
      }
    } catch (error: unknown) {
      console.error('AIレスポンス生成エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return NextResponse.json(
        { error: `AIの応答生成に失敗しました: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    // AIによる評価生成
    let evaluation: { 
      "精度": number;
      "出力の質": number;
      "独自性": number;
      "明確さ": number;
      "制約遵守": number;
      "総合評価": number;
      "コメント": string;
    };
    try {
      const evaluationCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `あなたはAIによるプロンプト評価システムです。  
ユーザーがAIに対して「プロンプトの精度を競うゲーム」のために作成したプロンプトを評価してください。  
以下の情報が与えられます。  

- **お題**: AIが出題したお題  
- **プロンプト**: ユーザーが考えたプロンプト  
- **AIの回答**: ユーザーのプロンプトに基づいてAIが生成した回答  

【評価基準】  
1. **精度（Relevance）**: プロンプトが適切で、AIが正しく理解しやすいか？  
2. **出力の質（Quality）**: AIの回答が論理的で、まとまりがあり、適切な内容になっているか？  
3. **独自性（Creativity）**: 他の人と差別化できる工夫がされているか？  
4. **明確さ（Clarity）**: 不要な情報がなく、簡潔でわかりやすいプロンプトになっているか？  
5. **制約遵守（Adherence）**: お題の条件（例: 文体、構成など）を適切に指示できているか？  

【入力データ例】
お題: 「ゴシックホラー風に学校の日常を描写してください」
プロンプト: 「19世紀ヨーロッパのゴシックホラー小説風に、登場人物が謎の教師の秘密を探る物語を100文字以内で書いてください」
AIの回答: 「霧深い学び舎に響く謎の足音。黒衣の教師は幽霊か、それとも禁じられた知識を守る者なのか？」

【評価例】
{
  "精度": 9,
  "出力の質": 8,
  "独自性": 7,
  "明確さ": 10,
  "制約遵守": 9,
  "総合評価": 8.6,
  "コメント": "的確な指示が含まれ、簡潔にまとまっている。物語の方向性をより詳細に指定するとさらに良い結果が得られる可能性あり。"
}

【出力フォーマット】  
以下のJSON形式で出力してください。  

{
  "精度": <0-10の数値>,
  "出力の質": <0-10の数値>,
  "独自性": <0-10の数値>,
  "明確さ": <0-10の数値>,
  "制約遵守": <0-10の数値>,
  "総合評価": <各スコアの平均>,
  "コメント": "<プロンプトの良かった点・改善点>"
}

この評価基準に従い、与えられたプロンプトとAIの回答を評価してください。`
          },
          {
            role: "user",
            content: `お題: ${topicTitle}\n${topicDescription || ''}\n\nプロンプト: ${prompt}\n\nAIの応答: ${response}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });
      
      // 評価結果の解析
      const evaluationContent = evaluationCompletion.choices[0].message.content;
      if (!evaluationContent) {
        throw new Error('評価結果が空です');
      }
      
      evaluation = JSON.parse(evaluationContent);
    } catch (error: unknown) {
      console.error('評価生成エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return NextResponse.json(
        { error: `プロンプト評価に失敗しました: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    // ソロバトル記録をデータベースに保存
    try {
      const { data: soloBattle, error } = await supabase
        .from('solo_battles')
        .insert([
          {
            user_id: user.id,
            topic_id: topicId,
            prompt: prompt,
            response: response,
            evaluation: JSON.stringify(evaluation),
            score: evaluation["総合評価"]
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('ソロバトル記録エラー:', error);
        return NextResponse.json({ error: `記録の保存に失敗しました: ${error.message}` }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        soloBattle,
        response,
        evaluation
      });
    } catch (error: unknown) {
      console.error('データベース保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return NextResponse.json(
        { error: `記録の保存に失敗しました: ${errorMessage}` },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error('ソロバトルエラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `ソロバトル処理に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
