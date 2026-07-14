-- Feed interaction seed for investModel.
--
-- Apply this file only as a complete tracked seed file. Do not copy individual
-- statements into a MySQL console for one-off edits.
--
-- Scope:
-- - Creates one local sample user when the database is empty.
-- - Creates informational FeedPost rows and sample user interaction state.
-- - Does not create real investment advice, real orders, broker links, or
--   external traffic/search data.

SET @seed_user_public_id := 'user_demo_001';
SET @seed_user_email := 'demo-user@investmodel.local';

INSERT INTO users (public_id, name, email, password_hash, role)
SELECT
  @seed_user_public_id,
  'Demo User',
  @seed_user_email,
  'mock_password_hash_not_for_login',
  'member'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE public_id = @seed_user_public_id
);

SET @seed_user_id := (
  SELECT id FROM users WHERE public_id = @seed_user_public_id LIMIT 1
);

SET @seed_model_id := (
  SELECT MIN(id) FROM investment_models
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_001',
  @seed_model_id,
  @seed_user_id,
  'market_context',
  '뉴스 트래픽이 반도체 공급망 키워드에 몰린 하루',
  '여러 공개 뉴스 맥락에서 반도체 공급망과 장비 투자 키워드가 함께 언급된 sample commentary입니다. 이 글은 정보성 관찰이며 매수, 매도, 보유 또는 리밸런싱 지시가 아닙니다.',
  'public',
  '2026-07-14 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_001'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_002',
  @seed_model_id,
  @seed_user_id,
  'model_note',
  'AI 칩 headline 가속 신호를 읽는 모델 노트',
  '모델 노트 sample은 신호 점수의 구성 요소를 설명하기 위한 읽기 자료입니다. 검색량, 뉴스 언급, 가격 추세는 모두 seed 기반 mock 관찰이며 실제 외부 API나 실시간 투자 판단을 뜻하지 않습니다.',
  'public',
  '2026-07-14 09:12:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_002'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_003',
  @seed_model_id,
  @seed_user_id,
  'risk_note',
  '가격 추세와 뉴스 과열이 동시에 보일 때의 위험 노트',
  '위험 노트 sample은 변동성, 데이터 지연, headline 편향을 함께 표시하기 위한 더미 글입니다. 손실 가능성과 불확실성을 설명하며 특정 거래 행동을 권하지 않습니다.',
  'public',
  '2026-07-14 09:24:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_003'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_004',
  @seed_model_id,
  @seed_user_id,
  'review_note',
  '운영자 검토가 필요한 표현을 분리한 샘플 노트',
  '검토 노트 sample은 FeedPost가 정보성 코멘터리인지 확인하는 운영 흐름을 위한 더미 데이터입니다. 법률 적합성 확정이나 수익 보장을 의미하지 않습니다.',
  'public',
  '2026-07-14 09:36:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_004'
);

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_mock_001',
  fp.id,
  NULL,
  @seed_user_id,
  '뉴스 트래픽과 가격 추세를 같이 보면 맥락을 더 잘 읽을 수 있겠네요. 이 댓글도 sample 토론 데이터입니다.',
  'visible',
  '2026-07-14 09:45:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_001'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_mock_001'
  );

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_mock_002',
  fp.id,
  parent.id,
  @seed_user_id,
  '맞아요. 그래서 화면에서는 score breakdown과 출처를 같이 보여줘야 할 것 같습니다.',
  'visible',
  '2026-07-14 09:48:00'
FROM feed_posts fp
JOIN feed_post_comments parent
  ON parent.public_id = 'feed_comment_mock_001'
WHERE fp.public_id = 'feed_mock_001'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_mock_002'
  );

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_mock_003',
  fp.id,
  NULL,
  @seed_user_id,
  'risk note는 좋아요 수와 별개로 항상 보조 설명을 붙이는 쪽이 안전해 보입니다.',
  'visible',
  '2026-07-14 09:55:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_003'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_mock_003'
  );

INSERT INTO feed_post_reactions (post_id, user_id, reaction_type, status, created_at)
SELECT fp.id, @seed_user_id, 'like', 'active', '2026-07-14 10:00:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_001', 'feed_mock_002', 'feed_mock_003')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_reactions r
    WHERE r.post_id = fp.id
      AND r.user_id = @seed_user_id
      AND r.reaction_type = 'like'
  );

INSERT INTO feed_post_saves (post_id, user_id, status, saved_at)
SELECT fp.id, @seed_user_id, 'saved', '2026-07-14 10:05:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_002', 'feed_mock_003')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_saves s
    WHERE s.post_id = fp.id
      AND s.user_id = @seed_user_id
  );

INSERT INTO feed_post_reads (post_id, user_id, read_at)
SELECT fp.id, @seed_user_id, '2026-07-14 10:10:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_001', 'feed_mock_002', 'feed_mock_003')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_reads rd
    WHERE rd.post_id = fp.id
      AND rd.user_id = @seed_user_id
  );

-- Representative verification query:
-- SELECT
--   fp.public_id,
--   fp.post_type,
--   COUNT(DISTINCT c.id) AS comment_count,
--   COUNT(DISTINCT r.id) AS like_count,
--   MAX(CASE WHEN s.status = 'saved' THEN 1 ELSE 0 END) AS saved_by_seed_user,
--   MAX(CASE WHEN rd.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_by_seed_user
-- FROM feed_posts fp
-- LEFT JOIN feed_post_comments c ON c.post_id = fp.id AND c.status = 'visible'
-- LEFT JOIN feed_post_reactions r
--   ON r.post_id = fp.id AND r.reaction_type = 'like' AND r.status = 'active'
-- LEFT JOIN feed_post_saves s ON s.post_id = fp.id AND s.user_id = @seed_user_id
-- LEFT JOIN feed_post_reads rd ON rd.post_id = fp.id AND rd.user_id = @seed_user_id
-- WHERE fp.public_id LIKE 'feed_mock_%'
-- GROUP BY fp.public_id, fp.post_type
-- ORDER BY fp.published_at DESC;
