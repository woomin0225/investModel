# Capacitor Native App Plan

## Decision

As of 2026-07-15, investModel should start a native app packaging track instead of treating mobile access as web/PWA only.

The recommended path is Capacitor first:

- Keep the existing Next.js mobile/PWA product as the shared runtime.
- Package the app in an iOS/Android WebView shell for internal testing.
- Defer a React Native rewrite until WebView constraints clearly block product quality.
- Keep all real money movement, real brokerage orders, bank or broker account connections, secrets, paid external API keys, legal judgments, and final compliance copy out of scope.

## Why Capacitor First

Capacitor is the smallest next step from the current codebase because it can reuse the existing mobile UI, routing, PWA metadata, and mock/DB-backed read models.

React Native or Expo may become useful later, but they would require rebuilding the UI and duplicating domain contracts before the MVP has proven that a native component model is necessary.

## First Native App Target

The first target is an internal test app, not a public store release.

The app should:

- Open investModel as a phone-first app experience.
- Preserve the current bottom navigation, safe-area behavior, portrait layout, and 390px mobile structure.
- Display all mock, simulated, backtest, no-order, no-brokerage, and no-advice boundaries exactly as the web app does.
- Avoid native device permissions unless a separate task documents the need and security review.

The app should not:

- Submit to App Store or Play Store.
- Enable push notification delivery.
- Enable biometric unlock.
- Store tokens in native secure storage.
- Connect broker, bank, payment, or external financial accounts.
- Execute orders, fills, deposits, withdrawals, or settlements.

## Packaging Strategy

Phase 1: Native packaging scaffold

- Add Capacitor dependencies and config in a small follow-up task.
- Choose a development source strategy:
  - local development: `http://localhost:3000` or LAN URL for device testing
  - internal alpha: HTTPS staging URL after auth, privacy, and release gates are ready
- Do not add native permissions.

Phase 2: Android-first validation

- Generate the Android project first because the current development machine is Windows.
- Verify launch, navigation, safe area, bottom tabs, text fit, and back-button behavior.
- Run 390px visual structure smoke for the web runtime before packaging checks.

Phase 3: iOS validation

- Generate and test the iOS project on a Mac with Xcode.
- Recheck safe area, keyboard behavior, navigation, and app icon/splash assets.

Phase 4: Store readiness

- Only start store submission work after privacy policy, signing, update strategy, permissions, support process, and compliance copy are reviewed.
- Keep store review copy and final legal/financial disclaimers as `legal_review` until approved by the user or a qualified reviewer.

## Security And Compliance Gates

Native packaging itself is `security_review` because it introduces signing, device permissions, WebView policy, app update behavior, and store/privacy obligations.

Any task that touches the following must stop and create or link an Issue:

- real deposits, withdrawals, payments, or custody
- bank, broker, payment, exchange, or account linking
- real order execution, fills, settlement, or broker API calls
- secrets, production credentials, webhook secrets, paid data API keys, or private user data sources
- push notifications, biometric unlock, native secure storage, or background jobs
- final legal, suitability, risk, or investment-advice language

## Follow-Up Backlog Candidates

- Add Capacitor dependencies and minimal config.
- Add an Android app scaffold with no native permissions.
- Add a native launch QA checklist for 390px/PWA parity and Android WebView navigation.
- Add app icon and splash asset mapping from the existing PWA icon set.
- Add a store-readiness checklist, kept behind `security_review` and `legal_review`.
