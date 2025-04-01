import { NextResponse, NextRequest } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/auth';
import OpenAI from 'openai';

// Edge Runtimeを指定して、タイムアウト制限を緩和
export const runtime = 'edge';

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

    // リクエストから必要なデータを取得
    const { prompt, topicId, topicTitle, topicDescription } = await request.json();
    
    if (!prompt || !topicId || !topicTitle) {
      return NextResponse.json(
        { error: 'プロンプト、お題ID、お題タイトルが必要です' },
        { status: 400 }
      );
    }
    
    // Supabaseクライアント
    const supabase = createRouteHandlerSupabaseClient(request);
    
    // ユーザー認証情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('認証エラー:', authError);
      return NextResponse.json(
        { error: 'ユーザー認証に失敗しました' },
        { status: 401 }
      );
    }
    
    // AIレスポンス生成
    let response;
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
AIの回答のみを出力してください。`
          },
          {
            role: "user",
            content: `お題: ${topicTitle}\n${topicDescription || ''}\n\nプロンプト: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }).catch(error => {
        console.error('OpenAI API呼び出しエラー:', error);
        throw new Error(`AIレスポンスの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
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
      "コメント": string;
    };
    try {
      const evaluationCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `あなたはプロンプトの品質を評価する専門家です。
ユーザーがAIに対して作成したプロンプトを効率的に評価してください。
以下の情報が与えられます。  

- **お題**: AIが出題したお題  
- **プロンプト**: ユーザーが考えたプロンプト  
- **AIの回答**: ユーザーのプロンプトに基づいてAIが生成した回答  

【評価基準（各0-20点）】  
- **精度**: プロンプトが適切で、AIが正しく理解しやすいか
- **出力の質**: AIの回答が論理的で内容が適切か
- **独自性**: 工夫された独創的なプロンプトか
- **明確さ**: 簡潔でわかりやすいプロンプトか
- **制約遵守**: お題の条件を適切に指示できているか

【出力形式】以下のシンプルなJSON形式で出力してください。コメントは簡潔に。
{
  "精度": <0-20の数値>,
  "出力の質": <0-20の数値>,
  "独自性": <0-20の数値>,
  "明確さ": <0-20の数値>,
  "制約遵守": <0-20の数値>,
  "コメント": "<短い評価コメント（50字以内）>"
}`
          },
          {
            role: "user",
            content: `お題: ${topicTitle}\n${topicDescription || ''}\n\nプロンプト: ${prompt}\n\nAIの応答: ${response}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }).catch(error => {
        console.error('OpenAI評価API呼び出しエラー:', error);
        throw new Error(`評価の生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      });
      
      // 評価結果の解析
      const evaluationContent = evaluationCompletion.choices[0].message.content;
      if (!evaluationContent) {
        throw new Error('評価結果が空です');
      }
      
      console.log('OpenAI評価応答:', evaluationContent); // デバッグ用
      
      // マークダウンコードブロックの削除
      let cleanedEvaluation = evaluationContent;
      
      // ```json や ``` などのマークダウン記法を削除
      cleanedEvaluation = cleanedEvaluation.replace(/```json/g, '').replace(/```/g, '').trim();
      
      console.log('クリーニング後評価:', cleanedEvaluation); // デバッグ用
      
      try {
        evaluation = JSON.parse(cleanedEvaluation);
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
        console.error('解析しようとした文字列:', cleanedEvaluation);
        return NextResponse.json({ 
          error: `評価JSONの解析に失敗しました: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          rawText: cleanedEvaluation
        }, { status: 500 });
      }
    
    } catch (error: unknown) {
      console.error('評価生成エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return NextResponse.json(
        { error: `プロンプト評価に失敗しました: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    // スコア計算と結果の保存
    try {
      console.log('評価結果:', evaluation); // デバッグ用

      // スコアが小数点の場合は整数に変換
      let scoreValue = (evaluation["精度"] + evaluation["出力の質"] + evaluation["独自性"] + evaluation["明確さ"] + evaluation["制約遵守"]) / 5;
      // 整数型のカラムに保存するため、小数点以下を切り捨てて整数に変換
      const intScore = Math.floor(scoreValue);

      console.log('変換前スコア:', scoreValue, '変換後スコア:', intScore); // デバッグ用
      
      const { data: soloBattle, error } = await supabase
        .from('solo_battles')
        .insert([
          {
            user_id: user.id,
            topic_id: topicId,
            prompt: prompt,
            response: response,
            evaluation: JSON.stringify(evaluation),
            score: intScore // 整数値に変換
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
