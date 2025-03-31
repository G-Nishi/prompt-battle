// OpenAIクライアントの初期化
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

/**
 * プロンプトに基づいてAIの回答を生成する
 * @param prompt ユーザーのプロンプト
 * @param topic お題
 * @returns AIの生成テキスト
 */
export async function generateAIResponse(prompt: string, topic: string): Promise<string> {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, topic }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'AIの応答生成中にエラーが発生しました');
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    throw new Error('AIの回答生成中にエラーが発生しました');
  }
}

/**
 * 二つのAI回答を評価し、どちらが優れているかを判断する
 * @param response1 プレイヤー1の回答
 * @param response2 プレイヤー2の回答
 * @param topic お題
 * @returns 評価結果と勝者
 */
export async function evaluateResponses(
  response1: string,
  response2: string,
  topic: string
): Promise<{ evaluation: string; winnerId: 'player1' | 'player2' }> {
  try {
    const response = await fetch('/api/openai', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response1, response2, topic }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '評価中にエラーが発生しました');
    }

    const data = await response.json();
    return {
      evaluation: data.evaluation,
      winnerId: data.winnerId,
    };
  } catch (error) {
    console.error('OpenAI API 評価エラー:', error);
    throw new Error('評価中にエラーが発生しました');
  }
}

// 評価テキストから勝者を抽出する
// 注：この関数はAPI Routeに移動したため削除
