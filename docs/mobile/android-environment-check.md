# Android Environment Check

Last checked: 2026-07-15

## Scope

This check records the current Windows machine readiness before generating the Android Capacitor platform.

It does not install Android Studio, create an `android/` folder, add native permissions, run an emulator, connect a physical phone, or change financial/product behavior.

## Result

Android platform generation is not ready on this machine yet.

Ready:

- Node.js: `v22.19.0`
- npm: `10.9.3`
- Capacitor CLI: `8.4.1`
- Java: `JAVA_HOME=C:\Program Files\Java\jdk-21`
- Capacitor project config: present at `capacitor.config.ts`
- Android and iOS native folders: not generated yet

Missing or not detected:

- Android Studio at `C:\Program Files\Android\Android Studio`
- Android Studio at `C:\Program Files (x86)\Android\Android Studio`
- Android SDK at `%LOCALAPPDATA%\Android\Sdk`
- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`
- `adb`
- `emulator`
- `sdkmanager`
- `avdmanager`
- API 24+ emulator image
- USB debugging device connection

## Commands Used

```powershell
Test-Path 'C:\Program Files\Android\Android Studio'
Test-Path 'C:\Program Files (x86)\Android\Android Studio'
$env:ANDROID_HOME
$env:ANDROID_SDK_ROOT
$env:JAVA_HOME
Get-Command adb -ErrorAction SilentlyContinue
Get-Command emulator -ErrorAction SilentlyContinue
Get-Command sdkmanager -ErrorAction SilentlyContinue
Get-Command avdmanager -ErrorAction SilentlyContinue
node --version
npm --version
npx cap --version
Test-Path "$env:LOCALAPPDATA\Android\Sdk"
```

## Required Before BK-413

Complete these outside Codex before running the Android scaffold task:

1. Install Android Studio 2025.2.1 or later.
2. Install Android SDK through Android Studio.
3. Install at least one API 24+ emulator image.
4. Ensure the Android SDK command-line tools are available.
5. Set `ANDROID_HOME` or `ANDROID_SDK_ROOT` if Android Studio does not expose the SDK tools on the path.
6. Confirm `adb`, `emulator`, `sdkmanager`, and `avdmanager` are available.
7. For physical-device smoke, enable USB debugging and verify `adb devices` lists the device.

## Safety Boundary

Until the missing items are resolved:

- Do not run `npx cap add android`.
- Do not add `@capacitor/android`.
- Do not generate or commit an `android/` project.
- Do not add native permissions.
- Do not add push, biometric unlock, secure storage, background jobs, broker, bank, payment, account-linking, real order, or real deposit behavior.

BK-413 can start only after this checklist is updated with a ready Android Studio/SDK/toolchain result.
