# Phone Device Check Guide

BK-157 keeps the real-phone verification path for IS-003 in one place. Automation can prepare and pre-check the local URL, but only a user with the phone can complete the final device check.

## Scope

- Target app path: `/invest-model`
- Preferred phone test URL from the latest pre-check: `http://192.168.45.66:3000/invest-model`
- Local machine URL: `http://127.0.0.1:3000/invest-model`
- Required device condition: phone and development machine on the same Wi-Fi network
- Related open issue: IS-003

## Before Opening On Phone

1. Confirm the development server is running on port `3000`.
2. Confirm the PC can open `http://127.0.0.1:3000/invest-model`.
3. Confirm the LAN URL responds on the PC: `http://192.168.45.66:3000/invest-model`.
4. Keep the phone on the same Wi-Fi as the PC.
5. If the PC network address changes, replace `192.168.45.66` with the current IPv4 address.

## Phone Check Steps

Open this URL on the phone browser:

```text
http://192.168.45.66:3000/invest-model
```

Then check these screens:

| Screen | Path | What To Check |
| --- | --- | --- |
| Home | `/invest-model` | Page loads in Korean by default, bottom tabs are visible, mock/simulated wording is visible. |
| Discover Models | `/invest-model/models` | Model cards fit the screen, risk/backtest labels are visible, no text overlaps. |
| Model Detail | `/invest-model/models/quant-us-leverage-alpha` | Risk, mandate, limitation, and disclosure sections are not hidden below performance. |
| Realtime Signals | `/invest-model/signals` | Signal rows wrap cleanly and do not look like buy/sell/hold recommendations. |
| Feed Insights | `/invest-model/feed` | Feed cards scroll smoothly and keep informational/placeholder wording visible. |
| Portfolio | `/invest-model/portfolio` | Mock portfolio and `MockDeposit` wording do not look like real cash or brokerage holdings. |
| Admin Review | `/invest-model/admin/reviews` | Dense admin rows remain readable on mobile width. |

## Interaction Checklist

- Scroll each page from top to bottom.
- Tap every bottom tab once.
- Use the language toggle and confirm Korean remains the default when the URL has no `?lang=en`.
- Rotate the phone once if practical, then return to portrait.
- Confirm no card, button, tab, or badge text overlaps.
- Confirm the browser bottom toolbar does not hide the app bottom tab permanently.
- Confirm finance-like UI keeps mock, simulated, backtest, placeholder, or pre-order simulation labels.

## Pass Criteria

The check can pass only when:

- The phone can open the LAN URL without a tunnel or account login.
- The five main user screens and the admin review list render without blank screens.
- Bottom tabs are tappable and not blocked by the browser safe area.
- No horizontal scrolling is required for normal reading.
- No real deposit, real order, brokerage account, guaranteed return, or legal approval wording appears.

## If It Fails

| Symptom | First Check |
| --- | --- |
| Phone cannot open the URL | Confirm both devices are on the same Wi-Fi and the PC firewall allows port `3000`. |
| PC LAN URL works but phone does not | Re-check the PC IPv4 address and router guest-network isolation. |
| Page loads but styles are broken | Hard refresh the phone browser and restart the dev server. |
| Bottom tabs are hidden | Capture the phone model, browser, and whether the browser address bar is collapsed. |
| Text overlaps | Capture the screen, URL, language, and approximate viewport size. |

## Reporting Back

When the phone check is complete, record:

- Phone model and browser
- URL used
- Pass/fail for each screen
- Any screenshots of overlap, clipping, or blocked taps
- Whether Korean default and English `?lang=en` both worked

IS-003 should remain open until this user-side phone check is completed and recorded.
