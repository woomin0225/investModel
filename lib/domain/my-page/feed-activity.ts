export type MyPageFeedActivitySummary = {
  userPublicId: string;
  savedCount: number;
  commentCount: number;
  latestSavedAt?: string;
  latestCommentAt?: string;
  latestSavedPostTitle?: string;
  latestCommentPostTitle?: string;
  recentSavedPosts: MyPageFeedActivityItem[];
  recentCommentPosts: MyPageFeedActivityItem[];
  activityRows?: MyPageActivityRow[];
  sourceLabel: 'db_read_model' | 'mock_safe_fallback';
};

export type MyPageFeedActivityItem = {
  postPublicId: string;
  title: string;
  activityAt?: string;
  activityLabel: 'saved' | 'commented';
};

export type MyPageActivityRowType =
  | 'saved_feed'
  | 'comment'
  | 'notification';

export type MyPageActivityRow = {
  activityPublicId: string;
  userPublicId: string;
  activityType: MyPageActivityRowType;
  sourcePublicId: string;
  title: string;
  bodyPreview?: string;
  activityAt: string;
  sourceLabel: 'db_seed_projection' | 'deterministic_fixture';
  sourceMeta: {
    sourceTables: string[];
    userScoped: true;
    inAppReadModelOnly: true;
    accountLinkage: false;
    realDeposit: false;
    realOrder: false;
    brokerageConnection: false;
    externalDelivery: false;
    paidExternalApi: false;
    financialAdvice: false;
  };
};

export type MyPageActivityReadModel = {
  generatedFrom: 'db_seed_projection' | 'deterministic_fixture';
  userPublicId: string;
  rows: MyPageActivityRow[];
  counts: Record<MyPageActivityRowType, number>;
  safetySummary: string;
};
