// ユーザー情報の型定義
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  avatar_url?: string;
}

// お題の型定義
export interface Topic {
  id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

// 対戦の型定義
export interface Battle {
  id: string;
  topic_id: string;
  player1_id: string;
  player2_id: string;
  player1_prompt?: string;
  player2_prompt?: string;
  player1_response?: string;
  player2_response?: string;
  winner_id?: string;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// AIの回答評価の型定義
export interface Evaluation {
  id: string;
  battle_id: string;
  evaluation_text: string;
  winner_id: string;
  created_at: string;
  // 詳細評価情報（オプショナル）
  detailed_evaluation?: {
    player1: string;  // プレイヤー1の評価
    player2: string;  // プレイヤー2の評価
    summary: string;  // 総合評価
    模範プロンプト例?: string; // 模範的なプロンプトの例
    悪いプロンプト例?: string; // 改善が必要なプロンプトの例
  };
}

// ソロモードの対戦記録の型定義
export interface SoloBattle {
  id: string;
  user_id: string;
  topic_id: string;
  prompt: string;
  response: string;
  evaluation: string;
  score: number;
  created_at: string;
  updated_at: string;
}

// ソロモードの評価結果の型定義
export interface SoloEvaluation {
  relevance: number;
  creativity: number;
  clarity: number;
  effectiveness: number;
  total: number;
  comment: string;
}
