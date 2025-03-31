import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// サーバーサイドのみで実行される
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AIレスポンス生成
export async function POST(request: NextRequest) {
  try {
    const { prompt, topic } = await request.json();

    if (!prompt || !topic) {
      return NextResponse.json(
        { error: 'プロンプトとお題が必要です' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4', // または希望するモデル
      messages: [
        {
          role: 'system',
          content: `あなたは次のお題に対して応答する必要があります: ${topic}`
        },
        {
          role: 'user',
          content: prompt
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
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `あなたは文章の評価者です。2つの回答を比較し、どちらがお題「${topic}」に対してより優れた回答かを判断してください。`
        },
        {
          role: 'user',
          content: `お題: ${topic}\n\n回答1: ${response1}\n\n回答2: ${response2}\n\n上記2つの回答を詳細に分析し、どちらがより優れているか判断してください。その理由も説明してください。結論として「よって、回答1の勝利とします。」または「よって、回答2の勝利とします。」と明確に記述してください。`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const evaluationText = evaluationResponse.choices[0].message.content || '';
    const winner = determineWinner(evaluationText);

    return NextResponse.json({
      evaluation: evaluationText,
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

// 評価テキストから勝者を抽出する
function determineWinner(evaluationText: string): 'player1' | 'player2' {
  const lowerCaseText = evaluationText.toLowerCase();
  
  if (lowerCaseText.includes('回答1の勝利') || 
      lowerCaseText.includes('回答１の勝利') ||
      lowerCaseText.includes('回答 1 の勝利')) {
    return 'player1';
  } else if (lowerCaseText.includes('回答2の勝利') || 
             lowerCaseText.includes('回答２の勝利') ||
             lowerCaseText.includes('回答 2 の勝利')) {
    return 'player2';
  }
  
  // デフォルト値（テキスト分析が不明確な場合）
  return Math.random() > 0.5 ? 'player1' : 'player2';
}
