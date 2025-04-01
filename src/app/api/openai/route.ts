import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// サーバーサイドのみで実行される
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "デフォルトのキー（本番環境では置き換えてください）",
});

// AIレスポンス生成
export async function POST(request: NextRequest) {
  try {
    // APIキーチェック
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI APIキーが設定されていません');
      return NextResponse.json({ error: 'APIキーが設定されていません。環境変数を確認してください。' }, { status: 500 });
    }

    const { prompt, topic } = await request.json();

    if (!prompt || !topic) {
      return NextResponse.json(
        { error: 'プロンプトとお題が必要です' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // 最新のモデル指定に更新
      messages: [
        {
          role: 'system',
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
          role: 'user',
          content: `お題: ${topic}\n\nプロンプト: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      text: response.choices[0].message.content
    });
  } catch (error: unknown) {
    console.error('OpenAI API error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `AIの応答生成中にエラーが発生しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// 評価API
export async function PUT(request: NextRequest) {
  try {
    const { response1, response2, topic } = await request.json();

    if (!response1 || !response2 || !topic) {
      return NextResponse.json(
        { error: '両方の回答とお題が必要です' }, 
        { status: 400 }
      );
    }

    const evaluationResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // 最新のモデル指定に更新
      messages: [
        {
          role: 'system',
          content: `あなたはプロンプトの品質を評価する専門家です。以下の5つの基準に基づいて、AIに対するプロンプトの評価を行ってください。

1. **精度（Relevance）**: プロンプトが適切で、AIが正しく理解しやすいか？  
2. **出力の質（Quality）**: AIの回答が論理的で、まとまりがあり、適切な内容になっているか？  
3. **独自性（Creativity）**: 他の人と差別化できる工夫がされているか？  
4. **明確さ（Clarity）**: 不要な情報がなく、簡潔でわかりやすいプロンプトになっているか？  
5. **制約遵守（Adherence）**: お題の条件（例: 文体、構成など）を適切に指示できているか？  

【出力フォーマット】  
回答を詳しく分析し、以下のJSON形式で出力してください。
各評価項目は0-20の範囲で評価してください。
総合評価は含めないでください。アプリ側で計算します。

また、このお題に対する「模範的なプロンプト例」と「改善が必要なプロンプト例」を提示してください。

{
  "プレイヤー1": {
    "精度": <0-20の数値>,
    "出力の質": <0-20の数値>,
    "独自性": <0-20の数値>,
    "明確さ": <0-20の数値>,
    "制約遵守": <0-20の数値>,
    "コメント": "<プロンプトの良かった点・改善点>"
  },
  "プレイヤー2": {
    "精度": <0-20の数値>,
    "出力の質": <0-20の数値>,
    "独自性": <0-20の数値>,
    "明確さ": <0-20の数値>,
    "制約遵守": <0-20の数値>,
    "コメント": "<プロンプトの良かった点・改善点>"
  },
  "比較評価": "どちらのプロンプトがより優れているか、その理由を含めた総合的な評価（100-150字）",
  "winnerId": "player1 または player2（総合評価がより高い方）",
  "模範プロンプト例": "このお題に対する理想的なプロンプトの例（200-300字程度）",
  "悪いプロンプト例": "このお題に対する改善が必要なプロンプトの例（100-200字程度）"
}`
        },
        {
          role: 'user',
          content: `お題: ${topic}\n\nプロンプト1の回答: ${response1}\n\nプロンプト2の回答: ${response2}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const evaluationText = evaluationResponse.choices[0].message.content || '';
    let evaluationJson;
    
    try {
      evaluationJson = JSON.parse(evaluationText);
    } catch (error) {
      console.error('評価JSONの解析に失敗:', evaluationText);
      throw new Error('評価結果の形式が不正です');
    }
    
    // 各プレイヤーの総合評価を計算（各項目の合計値）
    const player1TotalScore = 
      (evaluationJson.プレイヤー1.精度 || 0) +
      (evaluationJson.プレイヤー1.出力の質 || 0) +
      (evaluationJson.プレイヤー1.独自性 || 0) +
      (evaluationJson.プレイヤー1.明確さ || 0) +
      (evaluationJson.プレイヤー1.制約遵守 || 0);
    
    const player2TotalScore = 
      (evaluationJson.プレイヤー2.精度 || 0) +
      (evaluationJson.プレイヤー2.出力の質 || 0) +
      (evaluationJson.プレイヤー2.独自性 || 0) +
      (evaluationJson.プレイヤー2.明確さ || 0) +
      (evaluationJson.プレイヤー2.制約遵守 || 0);
    
    // デバッグログ
    console.log('評価JSON:', JSON.stringify(evaluationJson, null, 2));
    console.log('プレイヤー1スコア:', evaluationJson.プレイヤー1);
    console.log('プレイヤー1合計:', player1TotalScore);
    console.log('プレイヤー2スコア:', evaluationJson.プレイヤー2);
    console.log('プレイヤー2合計:', player2TotalScore);
    
    // 総合評価をレスポンスJSONに追加
    evaluationJson.プレイヤー1.総合評価 = player1TotalScore;
    evaluationJson.プレイヤー2.総合評価 = player2TotalScore;
    
    // AIが提供したwinnerId、またはスコアから判断
    const winner = evaluationJson.winnerId || 
      (player1TotalScore > player2TotalScore ? 'player1' : 
       player2TotalScore > player1TotalScore ? 'player2' : 'tie');
    
    const evaluation = evaluationJson.比較評価 || evaluationJson.evaluation;

    return NextResponse.json({
      evaluation: evaluation,
      detailedEvaluation: {
        player1: evaluationJson.プレイヤー1,
        player2: evaluationJson.プレイヤー2,
        summary: evaluationJson.比較評価,
        goodExample: evaluationJson.模範プロンプト例,
        badExample: evaluationJson.悪いプロンプト例
      },
      winnerId: winner
    });
  } catch (error: unknown) {
    console.error('OpenAI API評価エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `評価中にエラーが発生しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
