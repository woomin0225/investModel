# My Page Entry Path

Decision: keep the investModel bottom navigation at five core tabs: Home,
Models, Signals, Feed, and Invest. My Page is reached through the header
profile action that links to `/invest-model/my`.

Rationale:

- A sixth bottom tab makes the 390px mobile navigation harder to scan and
  increases the chance of cramped labels.
- My Page is an account and activity utility, while the bottom tabs remain the
  primary investment exploration and monitoring flows.
- The current My Page route stays home-adjacent with `activeTab="home"` because
  it summarizes user-scoped account, activity, and notification read models.

Safety boundary:

- My Page may show mock-safe user profile, saved FeedPost, comment, read, and
  notification read-model state.
- It must not imply a real brokerage account, real deposit or withdrawal, real
  order execution, legal advice, or investment recommendation.
