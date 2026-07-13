/**
 * investModel 디자인 토큰은 Figma 모바일 초기 구조와 design-harness 관찰값을 코드에서 재사용하기 위한 기준입니다.
 * 모바일 셸, 카드, 배지, 하단 탭 구현은 이 값을 우선 사용합니다.
 */
export const investModelDesignTokens = {
  color: {
    background: '#f7f9fc',
    backgroundSoft: '#f2f6ff',
    surface: '#ffffff',
    surfaceMuted: '#f4f6fa',
    border: '#e9eef5',
    primary: '#2f80ed',
    primarySoft: '#eaf3ff',
    primaryStrong: '#1b64d8',
    positive: '#16885a',
    positiveSoft: '#e8f7ef',
    risk: '#f04452',
    riskSoft: '#fff0f2',
    warning: '#f5a524',
    warningSoft: '#fff7df',
    text: '#202632',
    textMuted: '#7d8796',
    textDisabled: '#a5adba'
  },
  typography: {
    fontFamily:
      'Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    screenTitle: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 700
    },
    sectionTitle: {
      fontSize: '22px',
      lineHeight: '30px',
      fontWeight: 700
    },
    cardTitle: {
      fontSize: '17px',
      lineHeight: '24px',
      fontWeight: 650
    },
    body: {
      fontSize: '15px',
      lineHeight: '22px',
      fontWeight: 400
    },
    caption: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 500
    }
  },
  radius: {
    mobileCard: '8px',
    control: '8px',
    badge: '999px'
  },
  shadow: {
    card: '0 12px 32px rgb(32 38 50 / 0.08)',
    nav: '0 -12px 28px rgb(32 38 50 / 0.08)'
  },
  spacing: {
    screenX: '20px',
    screenTop: '18px',
    sectionGap: '20px',
    cardGap: '12px',
    cardPadding: '16px',
    bottomNavHeight: '72px',
    touchTarget: '44px'
  },
  layout: {
    mobileFrameWidth: '390px',
    mobileFrameMinHeight: '100dvh'
  }
} as const;

export type InvestModelDesignTokens = typeof investModelDesignTokens;
