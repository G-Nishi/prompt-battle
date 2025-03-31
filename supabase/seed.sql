-- テストデータ投入用スクリプト
-- 注意: このスクリプトを実行する前に、既にユーザー登録が完了している必要があります
-- ユーザーIDは実際のユーザーIDに置き換えてください

-- テスト用変数の設定
DO $$
DECLARE
  test_user1_id UUID;
  test_user2_id UUID;
  topic1_id UUID;
  topic2_id UUID;
  battle1_id UUID;
BEGIN
  -- 既存のユーザーIDを取得（実際の環境に合わせて変更してください）
  -- 自分で作成したユーザーのIDを使用
  SELECT id INTO test_user1_id FROM auth.users LIMIT 1;
  
  -- テスト用の2人目のユーザーを作成
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES ('test_user@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', NOW(), NOW(), NOW())
  RETURNING id INTO test_user2_id;
  
  -- usersテーブルにも追加
  INSERT INTO users (id, email, username, created_at)
  VALUES 
    (test_user2_id, 'test_user@example.com', 'テストユーザー', NOW());
  
  -- お題データを追加
  INSERT INTO topics (title, description, created_by, is_active)
  VALUES 
    ('地球温暖化対策について提案する', '気候変動問題に対して、個人や企業、政府が取るべき効果的な対策についての提案を作成してください。具体的なアイデアと、それが環境にどのような影響を与えるかを説明してください。', test_user1_id, true),
    ('AIの倫理的な使用方法について議論する', '人工知能技術の進化に伴い生じる倫理的な問題と、AIの責任ある使用方法について議論してください。プライバシー、雇用、バイアス、安全性などの観点から考察を深めてください。', test_user1_id, true),
    ('未来の教育システムを設計する', '10年後の教育システムはどのようになっているべきでしょうか？テクノロジーの活用、カリキュラム、学習環境など、理想的な教育システムの青写真を描いてください。', test_user1_id, true)
  RETURNING id INTO topic1_id;
  
  -- 2つ目のトピックIDを取得
  SELECT id INTO topic2_id FROM topics WHERE title = 'AIの倫理的な使用方法について議論する';
  
  -- 対戦データを追加
  INSERT INTO battles (topic_id, player1_id, player2_id, status)
  VALUES 
    (topic1_id, test_user1_id, test_user2_id, 'waiting')
  RETURNING id INTO battle1_id;
  
  -- 既に完了している対戦のサンプル
  INSERT INTO battles (
    topic_id, player1_id, player2_id, 
    player1_prompt, player2_prompt, 
    player1_response, player2_response, 
    winner_id, status)
  VALUES (
    topic2_id, test_user1_id, test_user2_id,
    'あなたはAI倫理の専門家です。AIの倫理的使用について、プライバシー保護と技術革新のバランスを重視した見解を示してください。具体的な事例と対策を含めて説明してください。', 
    'あなたはAI倫理学者です。AIの倫理的課題について、人間中心の価値観を基盤として、社会的影響と個人の権利の観点から分析してください。様々な立場からの意見を含めて、バランスの取れた見解を示してください。',
    'AIの倫理的使用におけるプライバシー保護と技術革新のバランスは極めて重要な課題です。具体的な事例として、顔認識技術があります。この技術は犯罪捜査や本人確認などに有用である一方、無断での監視やプロファイリングに使われる恐れもあります。対策としては、オプトイン同意の徹底、データ最小化原則の適用、匿名化技術の活用などが挙げられます。また、AIシステムの判断過程の透明性を高めるために、説明可能なAI（XAI）の開発も進めるべきです。法的枠組みとしては、EUのGDPRのようなプライバシー保護法制と、業界の自主規制を組み合わせることで、イノベーションを阻害せずにプライバシーを守ることができます。重要なのは、技術開発の早い段階から倫理的考慮を組み込む「Ethics by Design」のアプローチです。',
    'AIの倫理的課題を人間中心の価値観から分析すると、複数の重要な側面が浮かび上がります。社会的影響としては、AIによる意思決定システムが公平性を欠く場合、特定のグループに対する差別を強化・拡大する可能性があります。例えば、採用AIが過去のデータに基づいて学習すると、既存のジェンダーや人種バイアスを増幅することが実証されています。個人の権利の観点では、AIによる監視技術の普及によって、「監視されていないことの権利」が侵害される懸念があります。他方、病気の早期発見などで命を救うAI技術もあり、完全な規制はかえって人間の福祉を損なう恐れもあります。バランスの取れたアプローチとしては、(1)AIの意思決定に人間の監督を組み込む「Human in the loop」の原則、(2)AI開発者の多様性確保、(3)定期的な倫理的監査の実施、(4)被影響者を含むマルチステークホルダーの対話が重要です。技術の発展と人間の尊厳を両立させるには、継続的かつ包括的な取り組みが不可欠です。',
    test_user2_id, 'completed'
  );
  
  -- 評価データを追加
  INSERT INTO evaluations (battle_id, evaluation_text, winner_id)
  VALUES (
    (SELECT id FROM battles WHERE topic_id = topic2_id),
    '両方の回答を詳細に分析した結果、回答2がより優れていると判断します。理由としては：

1. 包括性：回答2は社会的影響と個人の権利という二つの主要な観点から分析しており、より包括的なアプローチをとっています。
2. 具体性：回答2は「採用AIにおけるバイアス」など、AIの倫理的問題の具体例をより詳細に説明しています。
3. バランス：回答2は「病気の早期発見などで命を救うAI技術」のようなAIの利点にも言及しつつ、多角的な視点を提供しています。
4. 解決策の実用性：「Human in the loop」原則や「AI開発者の多様性確保」など、より実装可能な解決策を提案しています。
5. 論理構成：問題提起から分析、そして解決策へと論理的に議論が展開されています。

回答1も技術的視点から優れた分析を行っていますが、回答2はより多角的で人間中心の視点を提供しており、倫理的議論においてより価値の高いアプローチを示しています。

よって、回答2の勝利とします。',
    test_user2_id
  );
  
END $$;
