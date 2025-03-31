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
}
