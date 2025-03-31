-- Supabaseのテーブル設定スクリプト

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSポリシーの設定（Row Level Security）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ユーザーは自分自身のプロフィールを更新可能" ON users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "誰でもユーザープロフィールを閲覧可能" ON users
  FOR SELECT USING (true);

-- お題テーブル
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSポリシーの設定
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "作成者のみお題を編集可能" ON topics
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "誰でもお題を閲覧可能" ON topics
  FOR SELECT USING (true);
CREATE POLICY "認証済みユーザーのみお題を作成可能" ON topics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 対戦テーブル
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) NOT NULL,
  player1_id UUID REFERENCES users(id) NOT NULL,
  player2_id UUID REFERENCES users(id) NOT NULL,
  player1_prompt TEXT,
  player2_prompt TEXT,
  player1_response TEXT,
  player2_response TEXT,
  winner_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('waiting', 'in_progress', 'completed')) DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSポリシーの設定
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "参加者は対戦情報を更新可能" ON battles
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "誰でも対戦情報を閲覧可能" ON battles
  FOR SELECT USING (true);
CREATE POLICY "認証済みユーザーのみ対戦を作成可能" ON battles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 評価テーブル
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) NOT NULL,
  evaluation_text TEXT NOT NULL,
  winner_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSポリシーの設定
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "対戦参加者のみ評価を更新可能" ON evaluations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT player1_id FROM battles WHERE id = battle_id
      UNION
      SELECT player2_id FROM battles WHERE id = battle_id
    )
  );
CREATE POLICY "誰でも評価結果を閲覧可能" ON evaluations
  FOR SELECT USING (true);
CREATE POLICY "対戦参加者のみ評価を作成可能" ON evaluations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT player1_id FROM battles WHERE id = battle_id
      UNION
      SELECT player2_id FROM battles WHERE id = battle_id
    )
  );

-- 更新時間を自動的に更新するトリガーを設定
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_battles_updated_at
BEFORE UPDATE ON battles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_evaluations_updated_at
BEFORE UPDATE ON evaluations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- インデックスの設定（パフォーマンス向上のため）
CREATE INDEX idx_battles_players ON battles(player1_id, player2_id);
CREATE INDEX idx_battles_topic ON battles(topic_id);
CREATE INDEX idx_evaluations_battle ON evaluations(battle_id);
CREATE INDEX idx_topics_creator ON topics(created_by);
