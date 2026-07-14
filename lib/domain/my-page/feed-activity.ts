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
  sourceLabel: 'db_read_model' | 'mock_safe_fallback';
};

export type MyPageFeedActivityItem = {
  postPublicId: string;
  title: string;
  activityAt?: string;
  activityLabel: 'saved' | 'commented';
};
