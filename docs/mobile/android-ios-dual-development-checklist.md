# Android And iOS Dual Development Checklist

Last checked: 2026-07-15

## Goal

Build investModel as one shared Next.js mobile runtime packaged through Capacitor for both Android and iOS.

The first target is internal device testing, not App Store or Play Store release.

## Platform Approach

- Shared app: existing Next.js mobile/PWA routes under `/invest-model`.
- Native shell: Capacitor Android and iOS projects.
- Android first on the current Windows machine.
- iOS in parallel only on a Mac with Xcode.
- No native permissions in the first shell unless a separate security-reviewed task adds them.

## Current Official Requirements Snapshot

Capacitor 8 environment setup currently requires:

- Android: Android Studio and Android SDK. Android Studio installs the required JDK.
- Android Studio minimum for Capacitor 8: Android Studio 2025.2.1.
- Android runtime support: API 24+ and an updated Android WebView.
- iOS: Mac with Xcode 26.0+ and Xcode Command Line Tools.
- iOS runtime support: iOS 15+ through WKWebView.
- iOS dependency manager: Swift Package Manager by default in Capacitor 8. CocoaPods is optional.
- App Store uploads since 2026-04-28: Xcode 26 or later with current platform SDKs.

Sources:

- Capacitor Environment Setup: https://capacitorjs.com/docs/getting-started/environment-setup
- Capacitor Android: https://capacitorjs.com/docs/android
- Capacitor iOS: https://capacitorjs.com/docs/ios
- Android Studio: https://developer.android.com/studio
- Apple upcoming requirements: https://developer.apple.com/news/upcoming-requirements/

## Local Development Machines

### Windows Machine

Use for:

- Next.js app development.
- Capacitor configuration.
- Android project generation.
- Android emulator and Android physical device testing.

Needed:

- Node.js and the repo package manager.
- Android Studio 2025.2.1+.
- Android SDK installed through Android Studio.
- Android emulator image API 24+.
- USB debugging enabled on a physical Android phone when device testing.
- Git access for branch, commit, and push.

Not enough for:

- Building or running iOS.
- Opening Xcode projects.
- App Store/TestFlight submission.

### Mac Machine

Use for:

- Everything the Windows machine can do, plus iOS.
- iOS simulator testing.
- iPhone device testing.
- Xcode archive, signing, TestFlight, and App Store Connect work when approved.

Needed:

- Xcode 26.0+.
- Xcode Command Line Tools installed with `xcode-select --install`.
- Apple ID signed in to Xcode for local device signing.
- Apple Developer Program membership for TestFlight or App Store distribution.
- Optional Homebrew and CocoaPods only if a plugin or legacy setup requires CocoaPods.

## Project Setup Checklist

Do these in small Backlog items, not all at once:

- Add `@capacitor/core` and `@capacitor/cli`.
- Add `capacitor.config.ts`.
- Decide WebView source strategy:
  - local device testing can use a LAN-accessible dev server
  - internal alpha should use an HTTPS staging URL
  - bundled static export is a separate feasibility task because the current app uses Next.js routes and APIs
- Add `@capacitor/android`.
- Run `npx cap add android`.
- Add `@capacitor/ios` on a Mac.
- Run `npx cap add ios` on a Mac.
- Keep Android and iOS native projects permission-free at first.
- Add native build folders only after confirming generated files and repository size are acceptable.

## Android Test Checklist

Environment:

- Android Studio opens the generated `android/` project.
- Android SDK and emulator are installed.
- At least one API 24+ emulator exists.
- At least one physical Android phone is available for smoke testing.
- USB debugging is enabled for physical device testing.

Commands:

```bash
npx tsc --noEmit
npm run test:pwa-manifest
npx cap sync android
npx cap run android
```

Manual checks:

- App launches into investModel.
- Bottom navigation is visible and not hidden by the system navigation area.
- Back button behavior is predictable.
- 390px-equivalent layout has no overlapping text.
- Model, Signals, Feed, Portfolio, Notifications, and My Page routes open.
- Mock/simulated/no-order/no-brokerage/no-advice boundaries are still visible.
- No native permission prompt appears.
- Offline or server-unavailable state does not imply financial data loss or real account failure.

## iOS Test Checklist

Environment:

- Mac is available.
- Xcode 26.0+ is installed.
- Xcode Command Line Tools are installed.
- iOS simulator can boot.
- Optional physical iPhone is available.
- Apple ID is available for local device signing.
- Apple Developer Program membership is available only when TestFlight or App Store testing starts.

Commands:

```bash
npx tsc --noEmit
npm run test:pwa-manifest
npx cap sync ios
npx cap run ios
```

Manual checks:

- App launches into investModel in simulator.
- iPhone safe areas are respected.
- Keyboard does not cover important controls.
- Swipe/back navigation does not trap the user.
- Route reloads preserve expected state boundaries.
- App icon and splash assets are not distorted.
- Mock/simulated/no-order/no-brokerage/no-advice boundaries are still visible.
- No native permission prompt appears.

## Shared QA Gate

Before calling the native shell ready for internal testing:

- `npx tsc --noEmit` passes.
- PWA manifest smoke passes.
- 390px visual structure smoke passes for the web runtime.
- Android emulator smoke passes.
- Android physical phone smoke passes.
- iOS simulator smoke passes.
- iPhone physical smoke passes when a device is available.
- No permission prompt appears.
- No store submission, push, biometric, native secure storage, or payment/account feature is enabled.
- IS-001 and IS-004 are still treated as open blockers for production build/live external data, not for internal native shell planning.

## Store Readiness Gate

Do not start store release work until separate tasks cover:

- App name, bundle id, package id, icons, splash assets.
- Signing and release key custody.
- Privacy policy.
- App Store Connect / Play Console account ownership.
- Age rating and content declarations.
- Financial services wording review.
- Support contact and incident process.
- Update and rollback strategy.
- Permission and SDK inventory.
- Legal review for final risk/disclosure copy.

## Not Allowed In The First Native Shell

- Real deposits, withdrawals, payments, or custody.
- Real brokerage or bank account linking.
- Real buy/sell orders, executions, fills, or settlement.
- Paid external market/news/search APIs.
- Production secrets or webhook secrets.
- Push notifications.
- Biometric unlock.
- Native secure token storage.
- Final legal, suitability, or investment advice wording.

## Next Small Work Units

- Add Capacitor dependencies and config with no platforms generated.
- Add Android platform and run emulator smoke.
- Add iOS platform on Mac and run simulator smoke.
- Add app icon/splash asset mapping.
- Add native QA script or checklist runner for web-runtime prerequisites.
