import { supabase } from './supabase';
import { User, Topic, Battle, Evaluation } from '@/types';
import { generateAIResponse, evaluateResponses } from './openai';

// ユーザー関連API
export const userAPI = {
  // 現在のログインユーザーを取得
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return data as User | null;
  },

  // ユーザー名で検索
  searchUsers: async (query: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data as User[];
  }
};

// お題関連API
export const topicAPI = {
  // お題一覧を取得
  getTopics: async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Topic[];
  },

  // アクティブなお題一覧を取得
  getActiveTopics: async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Topic[];
  },

  // お題を作成
  createTopic: async (topic: Omit<Topic, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('topics')
      .insert([topic])
      .select()
      .single();

    if (error) throw error;
    return data as Topic;
  }
};

// 対戦関連API
export const battleAPI = {
  // 対戦一覧を取得
  getBattles: async () => {
    const { data, error } = await supabase
      .from('battles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Battle[];
  },

  // ユーザーの対戦履歴を取得
  getUserBattles: async (userId: string) => {
    const { data, error } = await supabase
      .from('battles')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Battle[];
  },

  // 対戦を作成
  createBattle: async (battle: Omit<Battle, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('battles')
      .insert([battle])
      .select()
      .single();

    if (error) throw error;
    return data as Battle;
  },

  // プロンプトを送信
  submitPrompt: async (battleId: string, playerId: string, prompt: string, topicTitle: string) => {
    // どちらのプレイヤーか判断
    const { data: battle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (!battle) throw new Error('対戦が見つかりません');

    const isPlayer1 = battle.player1_id === playerId;
    const isPlayer2 = battle.player2_id === playerId;

    if (!isPlayer1 && !isPlayer2) throw new Error('この対戦に参加していません');

    const field = isPlayer1 ? 'player1_prompt' : 'player2_prompt';
    const responseField = isPlayer1 ? 'player1_response' : 'player2_response';

    // AIからの回答を生成
    const aiResponse = await generateAIResponse(prompt, topicTitle);

    // プロンプトとAI回答を保存
    const { error } = await supabase
      .from('battles')
      .update({ 
        [field]: prompt,
        [responseField]: aiResponse,
        status: 'in_progress'
      })
      .eq('id', battleId);

    if (error) throw error;

    // 両方のプレイヤーが回答済みか確認
    const { data: updatedBattle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (updatedBattle && updatedBattle.player1_response && updatedBattle.player2_response) {
      // 両方の回答が揃ったら評価を実施
      await battleAPI.evaluateBattle(battleId, topicTitle);
    }

    return aiResponse;
  },

  // 対戦結果を評価
  evaluateBattle: async (battleId: string, topicTitle: string) => {
    // 対戦情報を取得
    const { data: battle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (!battle) throw new Error('対戦が見つかりません');
    if (!battle.player1_response || !battle.player2_response) {
      throw new Error('両方のプレイヤーの回答が必要です');
    }

    // 回答を評価
    const { evaluation, winnerId } = await evaluateResponses(
      battle.player1_response,
      battle.player2_response,
      topicTitle
    );

    // 勝者を判定
    const winner = winnerId === 'player1' ? battle.player1_id : battle.player2_id;

    // 評価結果を保存
    const { data: evaluationData, error: evaluationError } = await supabase
      .from('evaluations')
      .insert([{
        battle_id: battleId,
        evaluation_text: evaluation,
        winner_id: winner
      }])
      .select()
      .single();

    if (evaluationError) throw evaluationError;

    // 対戦ステータスを更新
    const { error: battleError } = await supabase
      .from('battles')
      .update({
        winner_id: winner,
        status: 'completed'
      })
      .eq('id', battleId);

    if (battleError) throw battleError;

    return evaluationData as Evaluation;
  },

  // 対戦詳細を取得
  getBattleDetail: async (battleId: string) => {
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError) throw battleError;

    // 評価情報も取得
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('battle_id', battleId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116は「結果なし」のエラーコード
      console.error('評価情報取得エラー:', error);
    }

    return {
      battle: battle as Battle,
      evaluation: evaluation as Evaluation | null
    };
  }
};
