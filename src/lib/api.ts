import { Battle, Evaluation, Topic, User } from '@/types';
import { createBrowserSupabaseClient } from './supabase';
import { supabase } from './supabase';
import { generateAIResponse, evaluateResponses } from './openai';

// ユーザー関連API
export const userAPI = {
  // 現在のユーザーを取得
  getCurrentUser: async (): Promise<User> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      // 認証情報を取得
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw authError || new Error('ユーザー情報が取得できません');
      }
      
      console.log('Auth User:', user);
      
      // プロフィール情報を取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profileData) {
        // ユーザー情報だけを返す（プロファイルがまだない場合）
        return {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || 'ユーザー',
          created_at: user.created_at || new Date().toISOString()
        };
      }
      
      // プロファイル情報とマージしたものを返す
      return {
        ...profileData,
        email: user.email || ''
      } as User;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      throw error;
    }
  },

  // ユーザー名で検索
  searchUsers: async (query: string): Promise<User[]> => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${query}%`);
    
    return data || [];
  },

  // ユーザーIDでユーザー情報を取得
  getUser: async (userId: string): Promise<User | null> => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    return data;
  }
};

// お題関連API
export const topicAPI = {
  // お題一覧を取得
  getTopics: async (): Promise<Topic[]> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      console.error('お題一覧取得エラー:', error);
      throw error;
    }
  },

  // お題詳細を取得
  getTopic: async (topicId: string): Promise<Topic | null> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      console.log('お題取得開始:', topicId);
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .maybeSingle();
      
      if (error) {
        console.error('お題詳細取得エラー（Supabase）:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('お題取得成功:', data ? 'データあり' : 'データなし');
      return data;
    } catch (error: unknown) {
      // エラーの詳細情報をログに出力
      if (error instanceof Error) {
        console.error('お題詳細取得エラー:', error.message, error.stack);
      } else {
        console.error('お題詳細取得エラー（不明）:', JSON.stringify(error));
      }
      throw error;
    }
  },

  // アクティブなお題一覧を取得
  getActiveTopics: async (): Promise<Topic[]> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('アクティブお題取得エラー:', error.message, error.details);
        throw error;
      }
      
      return data || [];
    } catch (error: unknown) {
      // エラーの詳細情報をログに出力
      if (error instanceof Error) {
        console.error('アクティブお題取得エラー:', error.message, error.stack);
      } else {
        console.error('アクティブお題取得エラー（不明）:', JSON.stringify(error));
      }
      throw error;
    }
  },

  // お題作成
  createTopic: async (title: string, description: string): Promise<Topic> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const user = await userAPI.getCurrentUser();
      
      const { data, error } = await supabase
        .from('topics')
        .insert([
          {
            title,
            description,
            created_by: user.id,
            is_active: true
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('お題の作成に失敗しました');
      }
      
      return data[0] as Topic;
    } catch (error: unknown) {
      console.error('お題作成エラー:', error);
      throw error;
    }
  },
  
  // AIによるお題生成
  generateTopic: async (): Promise<Topic> => {
    try {
      const response = await fetch('/api/topics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `お題の生成に失敗しました: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.topic) {
        throw new Error('生成されたお題データがありません');
      }
      
      return data.topic as Topic;
    } catch (error: unknown) {
      // より詳細なエラー情報を表示
      if (error instanceof Error) {
        console.error('お題生成エラー:', error.message, error.stack);
      } else {
        console.error('お題生成エラー（不明）:', error);
      }
      throw error;
    }
  }
};

// 対戦関連API
export const battleAPI = {
  // 対戦一覧を取得
  getBattles: async (): Promise<Battle[]> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      console.error('対戦一覧取得エラー:', error);
      throw error;
    }
  },

  // 特定ユーザーの対戦一覧を取得
  getUserBattles: async (userId: string): Promise<Battle[]> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('ユーザー対戦履歴取得エラー:', error.message, error.details);
        throw error;
      }
      
      return data || [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('ユーザー対戦履歴取得エラー:', error.message, error.stack);
      } else {
        console.error('ユーザー対戦履歴取得エラー（不明）:', JSON.stringify(error));
      }
      throw error;
    }
  },

  // 対戦詳細を取得
  getBattleDetail: async (battleId: string): Promise<{ battle: Battle; evaluation: Evaluation | null }> => {
    // 対戦情報を取得
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();
    
    if (battleError) throw battleError;
    
    // 評価情報を取得
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('battle_id', battleId)
      .maybeSingle();
    
    if (evalError) console.error('評価情報取得エラー:', evalError);
    
    return { battle, evaluation };
  },

  // 新規対戦を作成
  createBattle: async (topicId: string, opponent_id: string): Promise<Battle> => {
    const user = await userAPI.getCurrentUser();
    if (!user) throw new Error('ログインが必要です');
    
    const { data, error } = await supabase
      .from('battles')
      .insert([
        {
          topic_id: topicId,
          player1_id: user.id,
          player2_id: opponent_id,
          status: 'waiting'
        }
      ])
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('対戦の作成に失敗しました');
    }
    
    return data[0] as Battle;
  },

  // プロンプトを送信
  submitPrompt: async (battleId: string, playerId: string, prompt: string, topicTitle: string): Promise<string> => {
    const user = await userAPI.getCurrentUser();
    if (!user) throw new Error('ログインが必要です');
    
    // 自分のプレイヤー番号を確認（player1かplayer2か）
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();
    
    if (battleError || !battle) throw new Error('対戦情報が見つかりません');
    
    // 自分のプレイヤー番号を確認
    let playerNumber: 1 | 2;
    if (battle.player1_id === user.id) {
      playerNumber = 1;
    } else if (battle.player2_id === user.id) {
      playerNumber = 2;
    } else {
      throw new Error('この対戦に参加していません');
    }
    
    // プロンプトを保存
    const { error: promptError } = await supabase
      .from('battles')
      .update({
        [`player${playerNumber}_prompt`]: prompt,
        [`player${playerNumber}_submitted`]: true,
      })
      .eq('id', battleId);
    
    if (promptError) throw promptError;
    
    // 両方のプレイヤーが提出したかチェック
    const { data: updatedBattle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();
    
    if (!updatedBattle) throw new Error('対戦情報が見つかりません');
    
    // 両方のプレイヤーが提出済みなら、AIに評価してもらう
    if (updatedBattle.player1_submitted && updatedBattle.player2_submitted) {
      try {
        // 対戦のステータスを更新
        await supabase
          .from('battles')
          .update({
            status: 'evaluating'
          })
          .eq('id', battleId);
        
        // AIの応答を生成
        const response1 = await generateAIResponse(updatedBattle.player1_prompt || '', topicTitle);
        const response2 = await generateAIResponse(updatedBattle.player2_prompt || '', topicTitle);
        
        // AIによる評価
        const evaluation = await evaluateResponses(
          response1, 
          response2, 
          topicTitle
        );
        
        // バトルの更新
        await supabase
          .from('battles')
          .update({
            player1_response: response1,
            player2_response: response2,
            winner_id: evaluation.winnerId === 'player1' ? updatedBattle.player1_id : updatedBattle.player2_id,
            status: 'completed'
          })
          .eq('id', battleId);
        
        // 評価を保存
        await supabase
          .from('evaluations')
          .insert([{
            battle_id: battleId,
            player1_score: 0, // スコアはAPIからは返ってこないため固定値
            player2_score: 0, // スコアはAPIからは返ってこないため固定値
            reasoning: evaluation.evaluation,
            created_at: new Date().toISOString()
          }]);
        
        return 'complete';
      } catch (error) {
        console.error('評価処理エラー:', error);
        
        // エラー時はバトルのステータスを更新
        await supabase
          .from('battles')
          .update({
            status: 'error'
          })
          .eq('id', battleId);
          
        throw error;
      }
    }
    
    return 'waiting';
  }
};

// ソロモード関連API
export const soloAPI = {
  // ソロバトル履歴を取得
  getSoloBattles: async (): Promise<{ id: string; topic: Topic; created_at: string }[]> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const user = await userAPI.getCurrentUser();
      
      const { data, error } = await supabase
        .from('solo_battles')
        .select('*, topics(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ソロバトル履歴取得エラー:', error);
      throw error;
    }
  },
  
  // 特定のソロバトルを取得
  getSoloBattle: async (id: string): Promise<{ id: string; topic: Topic; created_at: string } | null> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('solo_battles')
        .select('*, topics(*)')
        .eq('id', id)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ソロバトル取得エラー:', error);
      throw error;
    }
  }
};
