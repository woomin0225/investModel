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

## Selected Reference Tag Map

Use this map when creating new Backlog rows from selected screenshots. The filename group is the stable reference key; dependencies still belong in the sheet's `dependencies` column as `BK-###;BK-###`, while rationale and safety notes belong in `notes`.

| File group | Primary screen tags | Reusable pattern | Safety conversion |
| --- | --- | --- | --- |
| `KakaoTalk_20260709_195538631.png`, `_01`, `_02`, `_03`, `_04`, `_05`, `_06` | Home; Portfolio; My Page | Compact asset summary, service rows, account-like status blocks, profile utilities | Convert balances to selected-model status and `MockDeposit`; never copy account, deposit, withdrawal, broker, or exact service wording. |
| `KakaoTalk_20260709_195538631_07`, `_08`, `_09`, `_10`, `_13`, `_14`, `_15` | Models; Signals; Portfolio | Model/stock ranking rows, discovery cards, interest/save rows, ranked lists | Convert stock rankings to model themes, signal clusters, and saved-model states; avoid buy/sell/order affordances and return-promise copy. |
| `KakaoTalk_20260709_195538631_11`, `_12`, `_16`, `_17`, `_18`, `_19` | Feed; Signals; Home | Feed cards, realtime issue lists, news thumbnails, why-it-moved summaries | Use for `FeedPost` and observed `SignalEvent` explanations only; do not reuse brand labels, news copy, recommendation language, or exact composition. |
| `KakaoTalk_20260716_021501256_04`, `_08`, `_09`, `_10`, `_11`, `_12` | Signals; Home; Portfolio | Community/ranking density, heatmap tiles, top-mover rows, realtime issue modules | Keep market data simulated until IS-004 is resolved; label any dense market view as mock, observed, or read-only. |
| `KakaoTalk_20260716_021501256_14`, `_15`, `_20` | My Page; Feed; Portfolio | Empty states, interest lists, service entry grids, friendly onboarding cards | Replace product promotions with safe model-discovery CTAs; no real rewards, account connection, or investment advice framing. |
| `KakaoTalk_20260716_021505098_01`, `_04`, `_07`, `_08` | Search; Signals; Portfolio | Search filters, dense chart/detail panels, bottom action bars, empty rows | Use only for model/signal search and blocked simulated details; any order-like control must become disabled, read-only, or safety copy. |
| `KakaoTalk_20260716_021505098_25`, `_28`, `_29` | Feed; Models; Home | Summary cards, thematic rankings, compact illustrated sections | Convert mascot/illustration tone to neutral investModel visuals; no copied characters, slogans, or brand-specific card copy. |
| `KakaoTalk_20260716_021508192_03`, `_05`, `_06`, `_11`, `_14`, `_15`, `_16`, `_17`, `_18`, `_19` | Home; Models; Signals; Feed; Portfolio | ETF/theme dashboards, calendar strips, explainer cards, ranking modules, tagged news rows | Translate tradeable product surfaces into model metadata, mock review dates, signal context, and feed topics; avoid broker, deposit, order, and account-linking flows. |

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
