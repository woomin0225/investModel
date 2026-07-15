# Design Sample UI Patterns

## Source Set

- Raw source folder: `design-samples/raw`
- Curated reference folder: `design-samples/selected`
- Selection date: 2026-07-16
- Scope: Korean mobile securities and finance app screenshots used only as pattern references for investModel. Do not copy logos, brand copy, exact layouts, account flows, brokerage order flows, or real-money affordances.

## Selected Screens

The selected folder keeps reusable motifs across Home, Discover Models, Realtime Signals, Portfolio, Feed, and My Page:

- Toss-like asset and discovery patterns: `KakaoTalk_20260709_195538631.png`, `_07`, `_08`, `_11`, `_13`, `_15`, `_17`
- KakaoPay Securities-like community, ranking, heatmap, empty-state, and asset patterns: `KakaoTalk_20260716_021501256_04`, `_08`, `_09`, `_10`, `_12`, `_15`, `_20`
- Search/order-density and empty-state patterns: `KakaoTalk_20260716_021505098_01`, `_04`, `_07`, `_08`
- KB/Shinhan-like market dashboard, ETF/theme, calendar, explainer, news, and ranking patterns: `KakaoTalk_20260716_021508192_05`, `_06`, `_11`, `_15`, `_16`, `_17`, `_18`, `_19`
- Additional high-value references from explorer review: `KakaoTalk_20260716_021501256_11`, `_14`, `KakaoTalk_20260716_021505098_25`, `_28`, `_29`, `KakaoTalk_20260716_021508192_03`, `_14`

## Reusable Patterns

1. **Quiet account summary header**
   Use a compact top balance/status block with primary value, small context text, and two to three plain actions. For investModel this should show selected `InvestmentModel`, simulated `MockDeposit`, and model status without implying real balance or deposit.

2. **Discovery rail above list**
   A horizontal topic rail or compact filter row works better than a large hero. Apply it to Discover Models and Signals for risk, market, asset class, and model state.

3. **Ranked signal cards**
   Several apps use numbered list rows with icon, title, source/context, and right-aligned movement. For investModel, use this for `SignalEvent` and model attention rankings while labeling them as observed inputs, not recommendations.

4. **Market heatmap as glanceable context**
   Heatmaps and tile grids are effective for dense market overview. For investModel, use simulated/mock heat tiles for model coverage or signal clusters, never live market claims before IS-004 is resolved.

5. **Feed cards with media and quick reactions**
   Feed screens combine a short source label, title, thumbnail, and lightweight actions. Use this for `FeedPost` insights, keeping return guarantees and buy/sell language out.

6. **Friendly empty states**
   Good empty states show one clear illustration/emoji-like cue, a short reason, and one safe CTA. Apply to no selected model, no saved feed, no alerts, no signal history, and no model analysis yet.

7. **Search suggestion chips**
   Search screens show recent query, recommended keywords, and category chips. Use for model search and signal search with safe terms such as markets, risk levels, or model mandates.

8. **Personalized service rows**
   Profile/service screens use grouped rows with concise descriptions. Apply to My Page for selected model, saved posts, notifications, simulated portfolio, and disclosure preferences.

9. **Small event/calendar strip**
   Investment calendars surface dates, labels, and tiny category pills. Use this for model review dates, signal refresh windows, mock rebalance checkpoints, and disclosure review reminders.

10. **Bottom navigation plus top icon bar**
    Most samples keep a bottom tab bar and a restrained top utility area. investModel should keep this mobile-first structure and avoid oversized first-screen banners.

11. **Dense table pattern only for blocked/simulated details**
    Order book and trading tables are visually useful for density but risky. If referenced, use them only for read-only, blocked, or simulated detail surfaces with explicit no-order labels.

12. **Theme/ranking sections**
    Theme ranking sections work well for topical browsing. Translate this to model themes, signal clusters, and feed topics rather than tradable recommendations.

13. **Why-it-moved explainer cards**
    A compact explanation card that answers "why did this move?" is useful for signals. For investModel this should show observed inputs such as price movement, news traffic, or mock model attention, and explicitly avoid buy/sell/hold language.

14. **Interest save instead of selection**
    Stars and lightweight interest actions are useful when the user is still browsing. Use them for saved models, saved feed posts, or watched signals. Do not make them look like selecting a model for real trading.

15. **Persistent safety boundary line**
    Several screens benefit from a short, stable footer or meta line. Use a calm sentence such as simulated, no live trading, no brokerage connection, and not investment advice instead of hashtag-like badge groups.

## Implementation Guardrails

- Keep `MockDeposit`, `TradeIntent`, `SignalEvent`, and `AllocationDecision` wording explicit.
- Do not introduce deposit, withdraw, order, buy, sell, fill, broker, or account-linking actions.
- Do not copy competitor branding, mascots, wording, or exact visual composition.
- Validate every UI task at 390px with safe-area and bottom-tab checks.
- If screenshots are untracked, automation may treat `design-samples/raw` and `design-samples/selected` as intentional user-provided reference assets, not a dirty-worktree blocker.

## Backlog Mapping

- Home summary header: BK-435
- Signal ranking and observation cards: BK-436
- Model search and topic chips: BK-437
- Feed card structure: BK-438
- Friendly empty states: BK-439
- Mock market context tiles: BK-440
- My Page grouped service rows: BK-441
- Review/rebalance calendar strip: BK-442
- Bottom navigation and top icon states: BK-443
- Read-only blocked/simulated dense detail pattern: BK-444
- Theme and signal cluster ranking: BK-445
