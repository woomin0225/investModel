-- investModel MySQL schema planning script.
-- This script supports the AI model investment marketplace goal and avoids real brokerage order execution.

CREATE DATABASE IF NOT EXISTS invest_model
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE invest_model;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  display_name VARCHAR(100) NULL,
  role ENUM('user', 'creator', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_public_id (public_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB;

CREATE TABLE model_creators (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT NULL,
  verification_status ENUM('unverified', 'pending', 'verified', 'rejected', 'suspended') NOT NULL DEFAULT 'unverified',
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_model_creators_user_id (user_id),
  KEY idx_model_creators_verification_status (verification_status),
  CONSTRAINT fk_model_creators_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE investment_models (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(120) NOT NULL,
  creator_id BIGINT UNSIGNED NOT NULL,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(160) NOT NULL,
  status ENUM('draft', 'pending_review', 'approved', 'live', 'paused', 'suspended', 'retired') NOT NULL DEFAULT 'draft',
  visibility ENUM('private', 'marketplace', 'hidden') NOT NULL DEFAULT 'private',
  current_version_id BIGINT UNSIGNED NULL,
  short_description VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  retired_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_investment_models_public_id (public_id),
  UNIQUE KEY uq_investment_models_slug (slug),
  KEY idx_investment_models_creator_id (creator_id),
  KEY idx_investment_models_status_visibility (status, visibility),
  KEY idx_investment_models_current_version_id (current_version_id),
  CONSTRAINT fk_investment_models_creator_id FOREIGN KEY (creator_id) REFERENCES model_creators(id)
) ENGINE=InnoDB;

CREATE TABLE model_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(120) NOT NULL,
  model_id BIGINT UNSIGNED NOT NULL,
  version_label VARCHAR(60) NOT NULL,
  strategy_summary TEXT NOT NULL,
  target_markets VARCHAR(500) NOT NULL,
  asset_universe_summary VARCHAR(700) NOT NULL,
  rebalance_frequency VARCHAR(80) NULL,
  input_data_summary TEXT NULL,
  forbidden_scope TEXT NULL,
  model_artifact_status ENUM('metadata_only', 'uploaded', 'quarantined', 'approved', 'rejected') NOT NULL DEFAULT 'metadata_only',
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_from DATETIME NULL,
  retired_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_model_versions_public_id (public_id),
  UNIQUE KEY uq_model_versions_model_label (model_id, version_label),
  KEY idx_model_versions_artifact_status (model_artifact_status),
  KEY idx_model_versions_created_by_user_id (created_by_user_id),
  CONSTRAINT fk_model_versions_model_id FOREIGN KEY (model_id) REFERENCES investment_models(id),
  CONSTRAINT fk_model_versions_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

ALTER TABLE investment_models
  ADD CONSTRAINT fk_investment_models_current_version_id
  FOREIGN KEY (current_version_id) REFERENCES model_versions(id);

CREATE TABLE model_risk_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_version_id BIGINT UNSIGNED NOT NULL,
  risk_level ENUM('low', 'medium', 'high', 'very_high') NOT NULL,
  leverage_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  derivative_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  short_selling_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  concentration_limit_pct DECIMAL(5,2) NULL,
  expected_volatility_note VARCHAR(500) NULL,
  max_drawdown_note VARCHAR(500) NULL,
  risk_summary TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_model_risk_profiles_version_id (model_version_id),
  KEY idx_model_risk_profiles_level_leverage (risk_level, leverage_allowed),
  CONSTRAINT fk_model_risk_profiles_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id)
) ENGINE=InnoDB;

CREATE TABLE model_disclosures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_version_id BIGINT UNSIGNED NOT NULL,
  disclosure_type ENUM('risk', 'performance', 'limitation', 'legal_placeholder') NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  requires_legal_review BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_model_disclosures_version_type (model_version_id, disclosure_type),
  KEY idx_model_disclosures_legal_review (requires_legal_review),
  KEY idx_model_disclosures_reviewed_by (reviewed_by_user_id),
  CONSTRAINT fk_model_disclosures_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id),
  CONSTRAINT fk_model_disclosures_reviewed_by FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE portfolio_mandates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_version_id BIGINT UNSIGNED NOT NULL,
  allowed_markets VARCHAR(700) NOT NULL,
  allowed_asset_classes VARCHAR(700) NOT NULL,
  forbidden_assets TEXT NULL,
  min_cash_pct DECIMAL(5,2) NULL,
  max_single_position_pct DECIMAL(5,2) NULL,
  leverage_policy VARCHAR(500) NULL,
  rebalance_policy VARCHAR(700) NULL,
  user_override_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_portfolio_mandates_version_id (model_version_id),
  CONSTRAINT fk_portfolio_mandates_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id)
) ENGINE=InnoDB;

CREATE TABLE compliance_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_id BIGINT UNSIGNED NOT NULL,
  model_version_id BIGINT UNSIGNED NULL,
  review_type ENUM('model_approval', 'disclosure', 'performance_claim', 'incident') NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'changes_requested') NOT NULL DEFAULT 'pending',
  reviewer_user_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_compliance_reviews_model_status (model_id, status),
  KEY idx_compliance_reviews_version_type (model_version_id, review_type),
  KEY idx_compliance_reviews_reviewer (reviewer_user_id),
  CONSTRAINT fk_compliance_reviews_model_id FOREIGN KEY (model_id) REFERENCES investment_models(id),
  CONSTRAINT fk_compliance_reviews_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id),
  CONSTRAINT fk_compliance_reviews_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE model_performance_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_version_id BIGINT UNSIGNED NOT NULL,
  period_label VARCHAR(40) NOT NULL,
  cumulative_return_pct DECIMAL(8,4) NULL,
  volatility_pct DECIMAL(8,4) NULL,
  max_drawdown_pct DECIMAL(8,4) NULL,
  benchmark_symbol VARCHAR(30) NULL,
  is_backtest BOOLEAN NOT NULL DEFAULT TRUE,
  measured_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_model_performance_version_period (model_version_id, period_label, measured_at),
  CONSTRAINT fk_model_performance_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id)
) ENGINE=InnoDB;

CREATE TABLE market_instruments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  symbol VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  asset_type ENUM('stock', 'etf', 'bond', 'cash', 'index') NOT NULL,
  market VARCHAR(30) NOT NULL,
  exchange VARCHAR(60) NULL,
  currency CHAR(3) NOT NULL,
  is_leveraged BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_market_instruments_symbol_market (symbol, market),
  KEY idx_market_instruments_asset_market (asset_type, market)
) ENGINE=InnoDB;

CREATE TABLE user_model_selections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(120) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  model_id BIGINT UNSIGNED NOT NULL,
  model_version_id BIGINT UNSIGNED NOT NULL,
  status ENUM('active', 'paused', 'revoked') NOT NULL DEFAULT 'active',
  risk_acknowledged_at DATETIME NULL,
  selected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_model_selections_public_id (public_id),
  KEY idx_user_model_selections_user_status (user_id, status),
  KEY idx_user_model_selections_model_version (model_id, model_version_id),
  CONSTRAINT fk_user_model_selections_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_model_selections_model_id FOREIGN KEY (model_id) REFERENCES investment_models(id),
  CONSTRAINT fk_user_model_selections_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id)
) ENGINE=InnoDB;

CREATE TABLE mock_deposits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KRW',
  status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  source_type ENUM('mock', 'external_placeholder') NOT NULL DEFAULT 'mock',
  memo VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_mock_deposits_user_status (user_id, status),
  CONSTRAINT fk_mock_deposits_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE portfolios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  model_selection_id BIGINT UNSIGNED NOT NULL,
  cash_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_market_value DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'KRW',
  status ENUM('mock_active', 'paused', 'closed') NOT NULL DEFAULT 'mock_active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_portfolios_user_status (user_id, status),
  KEY idx_portfolios_model_selection_id (model_selection_id),
  CONSTRAINT fk_portfolios_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_portfolios_model_selection_id FOREIGN KEY (model_selection_id) REFERENCES user_model_selections(id)
) ENGINE=InnoDB;

CREATE TABLE portfolio_positions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  portfolio_id BIGINT UNSIGNED NOT NULL,
  instrument_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(24,8) NOT NULL DEFAULT 0,
  average_price DECIMAL(18,6) NULL,
  market_value DECIMAL(18,2) NULL,
  as_of DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_portfolio_positions_portfolio_instrument (portfolio_id, instrument_id),
  KEY idx_portfolio_positions_as_of (as_of),
  KEY idx_portfolio_positions_instrument_id (instrument_id),
  CONSTRAINT fk_portfolio_positions_portfolio_id FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
  CONSTRAINT fk_portfolio_positions_instrument_id FOREIGN KEY (instrument_id) REFERENCES market_instruments(id)
) ENGINE=InnoDB;

CREATE TABLE allocation_decisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_version_id BIGINT UNSIGNED NOT NULL,
  portfolio_id BIGINT UNSIGNED NOT NULL,
  decision_status ENUM('draft', 'policy_checked', 'blocked', 'ready_for_simulation') NOT NULL DEFAULT 'draft',
  rationale TEXT NOT NULL,
  input_snapshot_json JSON NULL,
  policy_result_json JSON NULL,
  decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_allocation_decisions_model_time (model_version_id, decided_at),
  KEY idx_allocation_decisions_portfolio_time (portfolio_id, decided_at),
  CONSTRAINT fk_allocation_decisions_model_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id),
  CONSTRAINT fk_allocation_decisions_portfolio_id FOREIGN KEY (portfolio_id) REFERENCES portfolios(id)
) ENGINE=InnoDB;

CREATE TABLE trade_intents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  allocation_decision_id BIGINT UNSIGNED NOT NULL,
  portfolio_id BIGINT UNSIGNED NOT NULL,
  instrument_id BIGINT UNSIGNED NOT NULL,
  intent_type ENUM('buy', 'sell', 'hold', 'rebalance') NOT NULL,
  target_quantity DECIMAL(24,8) NULL,
  target_value DECIMAL(18,2) NULL,
  status ENUM('pending_policy_check', 'approved_for_simulation', 'blocked', 'cancelled') NOT NULL DEFAULT 'pending_policy_check',
  blocked_reason VARCHAR(700) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trade_intents_allocation_decision_id (allocation_decision_id),
  KEY idx_trade_intents_portfolio_status (portfolio_id, status),
  KEY idx_trade_intents_instrument_id (instrument_id),
  CONSTRAINT fk_trade_intents_allocation_decision_id FOREIGN KEY (allocation_decision_id) REFERENCES allocation_decisions(id),
  CONSTRAINT fk_trade_intents_portfolio_id FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
  CONSTRAINT fk_trade_intents_instrument_id FOREIGN KEY (instrument_id) REFERENCES market_instruments(id)
) ENGINE=InnoDB;

CREATE TABLE market_price_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  instrument_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(80) NOT NULL,
  price DECIMAL(18,6) NOT NULL,
  volume DECIMAL(24,4) NULL,
  captured_at DATETIME NOT NULL,
  source_url VARCHAR(1000) NULL,
  PRIMARY KEY (id),
  KEY idx_market_price_instrument_time (instrument_id, captured_at),
  KEY idx_market_price_provider (provider),
  CONSTRAINT fk_market_price_instrument_id FOREIGN KEY (instrument_id) REFERENCES market_instruments(id)
) ENGINE=InnoDB;

CREATE TABLE news_sources (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  source_type ENUM('news', 'social', 'filing', 'traffic') NOT NULL,
  base_url VARCHAR(1000) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE news_articles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  news_source_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NULL,
  summary TEXT NULL,
  tickers_json JSON NULL,
  published_at DATETIME NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_articles_source_id (news_source_id),
  KEY idx_news_articles_published_at (published_at),
  CONSTRAINT fk_news_articles_source_id FOREIGN KEY (news_source_id) REFERENCES news_sources(id)
) ENGINE=InnoDB;

CREATE TABLE news_traffic_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  news_article_id BIGINT UNSIGNED NULL,
  keyword VARCHAR(160) NULL,
  traffic_score DECIMAL(10,4) NOT NULL,
  mention_count INT NULL,
  captured_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_news_traffic_keyword_time (keyword, captured_at),
  KEY idx_news_traffic_article_id (news_article_id),
  CONSTRAINT fk_news_traffic_article_id FOREIGN KEY (news_article_id) REFERENCES news_articles(id)
) ENGINE=InnoDB;

CREATE TABLE model_signal_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_version_id BIGINT UNSIGNED NOT NULL,
  signal_type ENUM('news_traffic', 'price_trend', 'macro', 'risk') NOT NULL,
  title VARCHAR(220) NOT NULL,
  summary TEXT NULL,
  score DECIMAL(8,4) NULL,
  source_article_id BIGINT UNSIGNED NULL,
  source_instrument_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_model_signal_version_time (model_version_id, created_at),
  KEY idx_model_signal_type_score (signal_type, score),
  KEY idx_model_signal_source_article_id (source_article_id),
  KEY idx_model_signal_source_instrument_id (source_instrument_id),
  CONSTRAINT fk_model_signal_version_id FOREIGN KEY (model_version_id) REFERENCES model_versions(id),
  CONSTRAINT fk_model_signal_source_article_id FOREIGN KEY (source_article_id) REFERENCES news_articles(id),
  CONSTRAINT fk_model_signal_source_instrument_id FOREIGN KEY (source_instrument_id) REFERENCES market_instruments(id)
) ENGINE=InnoDB;

CREATE TABLE feed_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_id BIGINT UNSIGNED NULL,
  author_user_id BIGINT UNSIGNED NULL,
  post_type ENUM('model_comment', 'market_insight', 'notice') NOT NULL,
  title VARCHAR(220) NOT NULL,
  body TEXT NOT NULL,
  visibility ENUM('public', 'selected_users', 'admin_only') NOT NULL DEFAULT 'public',
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_feed_posts_model_time (model_id, published_at),
  KEY idx_feed_posts_type_visibility (post_type, visibility),
  KEY idx_feed_posts_author_user_id (author_user_id),
  CONSTRAINT fk_feed_posts_model_id FOREIGN KEY (model_id) REFERENCES investment_models(id),
  CONSTRAINT fk_feed_posts_author_user_id FOREIGN KEY (author_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_actor_time (actor_user_id, created_at),
  KEY idx_audit_logs_action (action),
  CONSTRAINT fk_audit_logs_actor_user_id FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
