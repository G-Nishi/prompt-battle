-- プロンプトバトル - データベーススキーマ再作成

-- テーブル作成前に既存のものがあれば削除（冪等性のため）
DROP TABLE IF EXISTS battles CASCADE;
DROP TABLE IF EXISTS solo_battles CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS topics CASCADE;

-- トピック（お題）テーブル
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- バトル（対戦）テーブル
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, active, completed
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  player1_prompt TEXT,
  player2_prompt TEXT,
  player1_response TEXT,
  player2_response TEXT,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 評価テーブル
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
  evaluation_data JSONB,
  player1_score INTEGER,
  player2_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ソロバトルテーブル
CREATE TABLE solo_battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  prompt TEXT,
  response TEXT,
  evaluation JSONB,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSポリシー設定（Row Level Security）
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_battles ENABLE ROW LEVEL SECURITY;

-- トピックポリシー
CREATE POLICY "誰でも閲覧可能" ON topics
  FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみ作成可能" ON topics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "作成者のみ更新可能" ON topics
  FOR UPDATE USING (auth.uid() = created_by);

-- バトルポリシー
CREATE POLICY "参加者と公開バトルは閲覧可能" ON battles
  FOR SELECT USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id OR 
    status = 'completed'
  );

CREATE POLICY "認証済みユーザーのみ作成可能" ON battles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "参加者のみ更新可能" ON battles
  FOR UPDATE USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

-- 評価ポリシー
CREATE POLICY "バトル参加者と完了バトルの評価は閲覧可能" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM battles b
      WHERE b.id = battle_id AND (
        auth.uid() = b.player1_id OR 
        auth.uid() = b.player2_id OR 
        b.status = 'completed'
      )
    )
  );

-- ソロバトルポリシー
CREATE POLICY "自分のソロバトルのみ閲覧可能" ON solo_battles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "認証済みユーザーのみソロバトル作成可能" ON solo_battles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- インデックス作成（パフォーマンス向上のため）
CREATE INDEX topics_created_by_idx ON topics(created_by);
CREATE INDEX battles_player1_id_idx ON battles(player1_id);
CREATE INDEX battles_player2_id_idx ON battles(player2_id);
CREATE INDEX battles_topic_id_idx ON battles(topic_id);
CREATE INDEX solo_battles_user_id_idx ON solo_battles(user_id);
CREATE INDEX solo_battles_topic_id_idx ON solo_battles(topic_id);
