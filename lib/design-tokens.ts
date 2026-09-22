export const arunaTokens = {
  color: {
    canvas: "#0E0F12",
    header: "#121419",
    surface: "#16181D",
    surfaceRaised: "#1C2027",
    surfaceRow: "#1A1D23",

    border: "#2A2E36",
    borderSubtle: "#22262D",
    borderDanger: "#5A3230",
    borderWarning: "#5A4A30",
    borderSuccess: "#2E4A3E",

    foreground: "#ECEAE5",
    foregroundSecondary: "#B9BEC6",
    foregroundMuted: "#98A0AB",
    onAccent: "#16120B",

    accent: "#E08A4A",
    accentHover: "#EFA469",
    accentSoft: "#241A11",

    positive: "#6BBFA4",
    positiveSoft: "#163027",

    negative: "#E39189",
    negativeSoft: "#351C1B",
    negativeSoftForeground: "#E4C6C3",
  },

  chart: {
    grid: "#3A3F48",
    gridStrike: "#4A4034",
    gridBreakeven: "#31554A",
    gridNeutral: "#5A5348",
    barPositive: "#2E4A3E",
    barNegative: "#4A2C2A",
    barCritical: "#D97066",
  },

  font: {
    display: "var(--font-display)",
    body: "var(--font-body)",
    mono: "var(--font-mono)",
  },

  fontSize: {
    display: {
      hero: "68px",
      sectionTitle: "38px",
      pageTitle: "36px",
      pageTitleCompact: "34px",
      resultNumber: "56px",
      cardHeadline: "28px",
      cardHeadlineSm: "27px",
      brand: "26px",
      brandCompact: "24px",
    },
    body: {
      lg: "19px",
      md: "16px",
      base: "15px",
      sm: "14.5px",
      xs: "14px",
      xxs: "13.5px",
      xxxs: "13px",
      micro: "12px",
      label: "11px",
    },
    mono: {
      xxl7: "46px",
      xxl6: "40px",
      xxl5: "38px",
      xxl4: "34px",
      xxl3: "30px",
      xxl2: "28px",
      xl: "26px",
      lg: "24px",
      md: "22px",
      base: "21px",
      sm: "20px",
      xs: "19px",
      xxs: "17px",
      xxxs: "16px",
      data: "15px",
      dataSm: "14px",
      small: "13px",
      tiny: "12px",
      micro: "11px",
    },
  },

  radius: {
    progressThin: "3px",
    progress: "4px",
    badge: "6px",
    control: "8px",
    button: "10px",
    card: "14px",
    cardLg: "16px",
    full: "9999px",
  },

  space: {
    pageX: "32px",
    pageXLg: "48px",
    header: "64px",
    headerLg: "72px",
    cardPaddingSm: "20px",
    cardPadding: "24px",
    cardPaddingLg: "28px",
  },
} as const;

export type ArunaTokens = typeof arunaTokens;
