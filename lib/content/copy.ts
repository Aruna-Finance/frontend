export const brandCopy = {
  name: "Aruna",
  chainTag: "ARBITRUM ONE",
} as const;

export const sharedNavCopy = {
  markets: "Markets",
  protect: "Protect",
  underwrite: "Underwrite",
  proof: "Proof",
  cohortChip: (cohortId: number, timeLeft: string) => `Cohort ${cohortId} · settles in ${timeLeft}`,
} as const;

export const stepIndicatorCopy = {
  position: "POSITION",
  cover: "COVER",
  confirm: "CONFIRM",
} as const;

export const landingCopy = {
  nav: { openApp: "Open app", connectWallet: "Connect wallet" },
  hero: {
    eyebrow: "IMPERMANENT LOSS COVER · UNISWAP V3",
    heading: "Cover priced by how wildly price moves — not which way it went.",
    body: "Impermanent loss is a function of variance. Strike-price options pay on direction, which is only a proxy. Aruna settles on realized variance read from the pool's own TWAP oracle.",
    ctaProtect: "Protect a position",
    ctaUnderwrite: "Underwrite a vault",
    liveCardLabel: (pool: string) => `LIVE · ${pool}`,
    realizedVolCaption: "realized vol, cohort to date",
    vaultCapacityFreeLabel: "VAULT CAPACITY FREE",
    cohortSettlesInLabel: (cohortId: number) => `COHORT ${cohortId} SETTLES IN`,
  },
  comparison: {
    heading: "Same start, same finish, different risk",
    body: "Both tokens go from $1.00 to $1.03 in a week. A direction-based instrument cannot tell them apart. Your LP position can.",
    calmDrift: {
      title: "Calm drift",
      volLabel: "realized vol 9.4%",
      body: "Little variance accumulated. Little impermanent loss. No payout owed — and the premium reflected that up front.",
    },
    whipsaw: {
      title: "Whipsaw",
      volLabel: "realized vol 63.7%",
      body: "Every swing is rebalanced against you. Variance is what drained the position, so variance is what the contract pays on.",
    },
  },
  twoSides: {
    heading: "Two sides, one vault, one weekly cycle",
    lp: {
      eyebrow: "LP · HEDGER",
      headline: "Pay a premium. That premium is your maximum loss.",
      steps: [
        "Pick the Uniswap position you already own.",
        "Choose a strike — the vol level above which cover starts paying.",
        "Pay once. Your downside is locked at that number from that second.",
        "At the end of the cycle, realized variance above the strike pays out, up to a cap fixed at purchase.",
      ],
      footnote: "Your pool trading fees stay 100% yours. Cover never touches them.",
    },
    uw: {
      eyebrow: "UNDERWRITER",
      headline: "Post capital for one cycle. Collect the premiums that cycle sells.",
      steps: [
        "Deposit into the vault of a single pool, for a single 7-day cycle.",
        "Your capital backs every policy that vault writes — never one LP's fate alone.",
        "Premiums and claims split proportionally to your share.",
        "At settlement you take back capital plus premiums, less claims paid.",
      ],
      footnote: "Zero-sum with LPs. No third-party subsidy, no emissions.",
    },
  },
  refuse: {
    heading: "What we refuse to do",
    cards: [
      {
        title: "No uncapped promise",
        body: "Every payout is capped by capital already sitting in the vault when you buy. If the capacity is not there, the cover is not sold.",
      },
      {
        title: "No spot price",
        body: "Settlement reads Uniswap v3 TWAP observations, sampled every 30 minutes. A flash-loan wick cannot manufacture variance.",
      },
      {
        title: "No surprise liability",
        body: "LPs can never owe more than the premium — not at settlement, not on early exit. That bound is the product, not a setting.",
      },
    ],
  },
  footer: {
    disclaimer: "Cover is capped by vault capacity. Read the settlement method before buying.",
    proofLink: "Settlement proof →",
    copyright: (year: number) => `© ${year} ${brandCopy.name}`,
  },
} as const;

export const marketsCopy = {
  heading: "Markets",
  subtitle: "One vault per pool. One cohort at a time. Cover is only sellable while free capacity remains.",
  chainFilter: { arbitrumOne: "Arbitrum One", allChains: "All chains" },
  tableHeaders: ["POOL", "COHORT", "REALIZED VOL", "VAULT CAPITAL", "FREE CAPACITY", "POLICIES", ""],
  openCta: "Open",
  seedCta: "Seed it",
  noVaultYetLabel: "No vault yet",
  howCohortWorks: {
    label: "HOW A COHORT WORKS",
    body: "Every vault runs fixed 7-day cycles. Underwriters commit capital for the whole cycle; LPs can join any day and are priced for the time that remains. Everything settles at once at the end.",
  },
  nextCohortOpens: {
    label: "NEXT COHORT OPENS",
    note: (cohortId: number) => `Underwriter deposits for cohort ${cohortId} are already open.`,
  },
} as const;

export const marketDetailCopy = {
  backLink: "← Markets",
  meta: (poolAddress: string, spot: string) => `Pool ${poolAddress} · spot ${spot} · TWAP window 30 min`,
  underwriteThisVaultCta: "Underwrite this vault",
  buyCoverCta: "Buy cover",
  cohortRangeLabel: (cohortId: number, startLabel: string, endLabel: string) =>
    `COHORT ${cohortId} · ${startLabel} → ${endLabel}`,
  timeLeftLabel: (timeLeft: string, taken: number, total: number) =>
    `${timeLeft} left · ${taken} of ${total} samples taken`,
  chartTitle: "Realized volatility, cohort to date",
  chartLegendRealized: (volPercent: number) => `— realized ${volPercent}%`,
  chartLegendStrikesOnOffer: "-- strikes on offer",
  axisNowLabel: "now",
  statLabels: {
    lastTwapSample: "LAST TWAP SAMPLE",
    missedSamples: "MISSED SAMPLES",
    priorCohortsAvg: "PRIOR 6 COHORTS, AVG",
  },
  vaultCapacity: {
    label: "VAULT CAPACITY",
    freeUnit: "USDC free",
    reservedCaption: (amount: string) => `${amount} reserved`,
    totalCaption: (amount: string) => `${amount} total`,
    note: "Reserved means already committed as the capped payout of a live policy. Only free capacity can be sold.",
  },
  premiumIndication: {
    label: "PREMIUM INDICATION · PER 10,000 USDC COVERED",
    strikeRowLabel: (strikePercent: number) => `Strike ${strikePercent}% vol`,
    note: "Shown for a full 7-day cycle. Joining mid-cycle is charged pro rata for the time left.",
  },
} as const;

export const lpSelectPositionCopy = {
  heading: "Which position are you covering?",
  subtitle: "Cover attaches to one position NFT and stays with its owner. Co-ownership is not supported.",
  badgeInRange: "IN RANGE",
  badgeOutOfRange: "OUT OF RANGE",
  positionMeta: (lower: string, upper: string, fees: string) => `Range ${lower} – ${upper} · fees earned ${fees} USDC`,
  positionValueLabel: "POSITION VALUE",
  selectCta: "Select",
  noVaultForPoolCta: "No vault for this pool",
  manualEntry: {
    prompt: "Position not listed? Paste the token ID directly.",
    label: "Token ID",
    placeholder: "482911",
    loadCta: "Load",
  },
  sidebar: {
    label: "BEFORE YOU CONTINUE",
    p1: "Cover does not move, lock or wrap your position. Your NFT stays in your wallet and your trading fees stay entirely yours.",
    p2: "A position that sits out of range earns no fees but still carries variance risk, so it can still be covered.",
    p3: (timeLeft: string) =>
      `Cover runs to the end of the current cohort — ${timeLeft} from now — not for a fixed seven days from purchase.`,
    seeMarketLink: "See the market state first →",
  },
} as const;

export const lpQuoteCopy = {
  heading: "Set your cover",
  headerMeta: (positionId: string, pool: string, value: string, cohortId: number, timeLeft: string) =>
    `Position #${positionId} · ${pool} · ${value} · cohort ${cohortId} ends in ${timeLeft}`,
  coverageLabel: "HOW MUCH OF THE POSITION TO COVER",
  unit: "USDC",
  quickPct25: "25%",
  quickPct50: "50%",
  quickMax: "Max",
  strikeSectionLabel: "STRIKE — THE VOL LEVEL WHERE COVER STARTS PAYING",
  strikeSectionHint: "Lower strike, earlier payout, higher premium",
  premiumWord: "premium",
  strikeFootnote: (timeLeft: string) =>
    `Realized volatility is measured from the pool's 30-minute TWAP over the remaining ${timeLeft} of the cohort and annualized for comparison.`,
  payoutChartTitle: "What you receive at settlement",
  payoutRateLabel: (rate: string) => `payout rate ${rate} USDC per unit of variance`,
  capLabel: (value: string) => `cap ${value}`,
  strikeLabel: (value: string) => `strike ${value}`,
  breakevenLabel: (value: string) => `breakeven ${value}`,
  axisZero: "0",
  axisXLabel: "realized volatility at settlement →",
  statLabels: {
    breakevenVol: "BREAKEVEN VOL",
    capReachedAt: "CAP REACHED AT",
    ifVolStaysAt: (currentVolPercent: number) => `IF VOL STAYS AT ${currentVolPercent}%`,
  },
  quoteCard: {
    label: "YOUR QUOTE",
    youPayNow: "You pay now",
    unit: "USDC",
    disclaimer: "This is also the most you can lose. It cannot grow — not at settlement, not if you exit early.",
    rows: {
      coveredAmount: "Covered amount",
      strike: "Strike",
      maxPayout: "Maximum payout",
      fullCyclePrice: "Full-cycle price",
      chargedFor: "Charged for",
    },
    cta: "Review and buy",
  },
  capacityCheck: {
    label: "CAPACITY CHECK",
    statusOk: "Vault can back this cover",
    reservingCaption: (amount: string) => `reserving ${amount}`,
    freeCaption: (amount: string) => `${amount} free`,
    note: "Your maximum payout is locked out of the vault the moment you buy. No later buyer can claim it.",
  },
} as const;

export const lpConfirmCopy = {
  heading: "Confirm and sign",
  plainTermsLabel: "IN PLAIN TERMS",
  plainTerms: (premium: string, pool: string, breakevenPercent: number, cap: string) =>
    `You pay ${premium} USDC today. You can never lose more than that. If ${pool} ends the cohort above ${breakevenPercent}% realized volatility, you get paid — up to ${cap} USDC.`,
  termsLabel: "TERMS BEING WRITTEN ON CHAIN",
  termsRows: {
    position: "Position",
    vault: "Vault",
    coveredAmount: "Covered amount",
    strike: "Strike",
    payoutRate: "Payout rate",
    payoutCap: "Payout cap",
    settles: "Settles",
    oracle: "Oracle",
  },
  oracleValue: "Pool TWAP, 30 min",
  warning: {
    title: "Read this before signing",
    body: (strikePercent: number, premium: string) =>
      `If realized volatility finishes at or below ${strikePercent}%, you receive nothing and the ${premium} USDC premium is gone. That is the expected outcome in a quiet week — it is what you are paying for in a violent one.`,
  },
  acknowledge: (cap: string) =>
    `I understand the premium is non-refundable, the payout is capped at ${cap} USDC, and settlement uses the pool's TWAP rather than spot price.`,
  txCard: {
    label: "TWO TRANSACTIONS",
    approve: (amount: string) => `Approve ${amount} USDC`,
    confirmed: (hash: string) => `Confirmed · ${hash}`,
    statusConfirmed: "Confirmed",
    statusPending: "Pending",
    buyCoverTitle: "Buy cover",
    buyCoverBody: (cap: string) => `Pays the premium, reserves ${cap} USDC of vault capacity and mints your policy.`,
    rows: {
      premium: "Premium",
      networkFee: "Est. network fee",
    },
    cta: "Sign and buy cover",
    backCta: "Back to quote",
  },
  quoteValidity: {
    label: "QUOTE VALIDITY",
    countdown: (time: string) => `re-prices in ${time}`,
    note: "Premium is pro-rated to the time left in the cohort, so it keeps falling as the cycle runs down.",
  },
} as const;

export const lpActiveCopy = {
  heading: (coverId: string) => `Cover #${coverId} · active`,
  badgeInTheMoney: "IN THE MONEY",
  meta: (positionId: string, pool: string, strikePercent: number, cap: string) =>
    `Position #${positionId} · ${pool} · strike ${strikePercent}% · cap ${cap} USDC`,
  settlesInLabel: "SETTLES IN",
  chartTitle: "Realized volatility vs your strike",
  legendRealized: "— realized",
  legendStrike: (strikePercent: number) => `-- strike ${strikePercent}%`,
  legendBreakeven: (breakevenPercent: number) => `-- breakeven ${breakevenPercent}%`,
  axisNowLabel: (dayNumber: number) => `now · day ${dayNumber}`,
  axisStartLabel: "cohort start",
  payoutCapLabel: "payout cap",
  scenarioLabel: "WHAT SETTLEMENT PAYS AT DIFFERENT FINISHES",
  scenarioFootnote:
    "Net of the premium already paid. The last column is the cap — it does not rise beyond it, however violent the week gets.",
  statLabels: {
    realizedVol: "REALIZED VOL",
    aboveStrikeBy: "ABOVE STRIKE BY",
    samplesTaken: "SAMPLES TAKEN",
    missedSamples: "MISSED SAMPLES",
  },
  markCard: {
    label: "MARK AT CURRENT PACE",
    unit: "USDC",
    note: "Indicative only. Nothing is owed until the cohort settles, and variance can still fall back below your strike.",
    rows: {
      gross: "Gross payout",
      premiumPaid: "Premium paid",
      maxLossRemaining: "Maximum loss remaining",
    },
  },
  oracleFeed: {
    label: "ORACLE FEED",
    tickPrefix: "tick",
    fullRecordLink: "Full sample record →",
  },
  atSettlement: {
    label: "AT SETTLEMENT",
    body: "Payouts are pulled automatically when the cohort closes. There is nothing to claim manually and no deadline to miss.",
    cta: "Preview settlement",
  },
} as const;

export const lpSettlementCopy = {
  heading: (cohortId: number) => `Cohort ${cohortId} settled`,
  subtitle: "The same screen, drawn for both possible endings. Only one of them ever renders for a given policy.",
  badgePaidOut: "PAID OUT",
  badgeNoPayout: "NO PAYOUT",
  coverSettled: (coverId: string, date: string) => `Cover #${coverId} · settled ${date}`,
  netResultLabel: "Net result",
  unit: "USDC",
  paidOutBody: (volPercent: number, strikePercent: number, breakevenPercent: number) =>
    `Realized volatility finished at ${volPercent}%, above your ${strikePercent}% strike and above your ${breakevenPercent}% breakeven. The payout was transferred to your wallet automatically.`,
  noPayoutBody: (volPercent: number, strikePercent: number) =>
    `Realized volatility finished at ${volPercent}%, below your ${strikePercent}% strike. Nothing was owed. Your loss is the premium and not one cent more — the number you saw before you signed.`,
  paidOutRows: {
    finalRealizedVariance: "Final realized variance",
    strikeVariance: "Strike variance",
    excessTimesRate: (rate: string) => `Excess × ${rate} payout rate`,
    capApplied: "Cap applied",
    premiumPaid: "Premium paid",
  },
  capAppliedNo: (cap: string) => `no · cap was ${cap}`,
  noPayoutRows: {
    finalRealizedVariance: "Final realized variance",
    strikeVariance: "Strike variance",
    excess: "Excess",
    capacityReleased: "Capacity released to vault",
    premiumPaid: "Premium paid",
  },
  excessNone: "none",
  feesNote: (fees: string) =>
    `Your pool fees for the week were ${fees} USDC and are untouched by this. Quiet weeks are when cover costs you and the position earns.`,
  ctaCoverAgain: (cohortId: number) => `Cover again for cohort ${cohortId}`,
  ctaVerify: "Verify",
} as const;

export const uwVaultsCopy = {
  heading: "Underwrite a vault",
  subtitle:
    "You sell variance cover to every LP in one pool for one week. Premiums are yours; claims come out of your capital. Your exposure is bounded by the capacity the vault has already written.",
  myUnderwritingCta: "My underwriting",
  cohortOpenBadge: (cohortId: number) => `COHORT ${cohortId} OPEN`,
  vaultMeta: (underwriterCount: number, date: string) =>
    `${underwriterCount} underwriters · deposits fund the cycle starting ${date}`,
  historyCaption: (cumulativePercent: number, lossCount: number) =>
    `last 6 cycles · ${cumulativePercent >= 0 ? "+" : ""}${cumulativePercent}% cumulative, ${
      lossCount === 1 ? "1 loss" : `${lossCount} losses`
    }`,
  noVaultMeta: "correlated pair, historically low variance and low premium",
  statLabels: {
    capital: "CAPITAL",
    utilization: "UTILIZATION",
    premiumsCycle: (cohortId: number) => `PREMIUMS, CYCLE ${cohortId}`,
  },
  depositCta: "Deposit",
  infoCards: [
    {
      title: "Your capital is pooled",
      body: "It backs every policy the vault writes, proportionally. You are never the sole counterparty to one LP's bad week.",
    },
    {
      title: "It is locked for the cycle",
      body: "Policies were sold against it, so it cannot leave before settlement. Deposit only what you can leave for seven days.",
    },
    {
      title: "Losses are real",
      body: "In a violent week claims can exceed premiums by a wide margin. The bound is the written capacity, not zero.",
    },
  ],
} as const;

export const uwDepositCopy = {
  backLink: "← Vaults",
  heading: (pool: string) => `Deposit into ${pool}`,
  cohortRange: (cohortId: number, start: string, end: string) => `Cohort ${cohortId} · ${start} → ${end}`,
  amountLabel: "AMOUNT TO COMMIT FOR THIS CYCLE",
  unit: "USDC",
  quickHalf: "Half",
  quickMax: "Max",
  walletBalance: (amount: string) => `Wallet balance ${amount} USDC`,
  minimumDeposit: (amount: string) => `Minimum deposit ${amount} USDC`,
  signUpLabel: "WHAT YOU ARE SIGNING UP FOR",
  signUpSteps: [
    (date: string) =>
      `Your capital joins the vault before the cycle opens and is locked until settlement on ${date}. There is no early withdrawal, because policies are sold against it.`,
    () => "Every premium the vault collects during the cycle is split by share. Every claim it pays is deducted the same way.",
    () => "At settlement the remainder is returned automatically. You choose then whether to roll into the next cycle.",
  ],
  historyLabel: (amount: string) => `HOW THE LAST SIX CYCLES WOULD HAVE TREATED ${amount}`,
  historyFootnote:
    "Past cycles say nothing about the next one. A single week above 50% realized vol erases more than these six added.",
  positionCard: {
    label: (cohortId: number) => `YOUR POSITION IN COHORT ${cohortId}`,
    shareLabel: "Share of vault",
    rows: {
      yourCapital: "Your capital",
      vaultAfterDeposit: "Vault after deposit",
      lockedUntil: "Locked until",
      estPremiums: (cohortId: number) => `Est. premiums at cycle-${cohortId} pace`,
    },
    cta: "Approve and deposit",
  },
  worstCase: {
    label: "WORST CASE, STATED PLAINLY",
    unit: "USDC",
    body: "If every policy the vault writes this cycle pays its full cap, your share of the claims is this. It is the floor of your outcome, not a forecast — and it is the number the payout cap exists to make finite.",
  },
  acknowledge: "I understand my capital is locked for the cycle and can be reduced by claims.",
} as const;

export const uwDashboardCopy = {
  heading: (pool: string) => `My underwriting · ${pool}`,
  meta: (cohortId: number, day: number, sharePercent: number, totalCapital: string) =>
    `Cohort ${cohortId} · day ${day} of 7 · ${sharePercent}% of a ${totalCapital} USDC vault`,
  settlesInLabel: "SETTLES IN",
  statLabels: {
    capitalCommitted: "CAPITAL COMMITTED",
    premiumsEarned: "PREMIUMS EARNED SO FAR",
    claimsAtCurrentPace: "CLAIMS AT CURRENT PACE",
    markIfEndsHere: "MARK IF IT ENDS HERE",
  },
  scenarioTitle: "Where this cycle lands, by finishing volatility",
  scenarioShare: (sharePercent: number) => `your ${sharePercent}% share`,
  tableHeaders: ["VOL FINISH", "VAULT CLAIMS", "VAULT NET", "YOUR NET"],
  everyCapHitLabel: "every cap hit",
  scenarioFootnote:
    "The bottom row is the hard floor. It is bounded only because every policy was sold with a cap reserved against real capital.",
  bookLabel: "BOOK YOU ARE BACKING",
  bookUnit: "policies · {amount} capacity written",
  strikeRowLabel: (strikePercent: number) => `Strike ${strikePercent}%`,
  policiesCapacity: (count: number, amount: string) => `${count} policies · ${amount}`,
  historyLabel: "CYCLE HISTORY, THIS VAULT",
  // Catatan: kalimat ini spesifik untuk contoh vault WETH/USDC 0.05% di mockup
  // (5 siklus untung, 1 rugi, dari 6 siklus). Lihat lib/content/copy-rules.md.
  historyFootnote:
    "Five up, one down, +3.57% cumulative. This is a carry business: small wins most weeks, a large loss occasionally.",
  seeLastSettlementCta: "See last settlement",
} as const;

export const uwSettlementCopy = {
  heading: (cohortId: number) => `Cohort ${cohortId} settled`,
  badgeLosingCycle: "LOSING CYCLE",
  meta: (pool: string, volPercent: number, date: string) => `${pool} · final realized vol ${volPercent}% · settled ${date}`,
  verifyCta: "Verify the settlement",
  cycleLabel: "THE VAULT'S CYCLE",
  statLabels: {
    capitalAtOpen: "Capital at open",
    premiumsCollected: "Premiums collected",
    claimsPaid: "Claims paid",
    cycleResult: "Cycle result",
  },
  splitPremiumsIn: "premiums in",
  splitClaimsOut: "claims out",
  cycleFootnote: (paidOut: number, total: number, priorLosingCohortId: number) =>
    `${paidOut} of ${total} policies finished above their strike. Claims exceeded premiums for the first time since cohort ${priorLosingCohortId}. No policy paid above its cap, and no capital beyond the vault was touched.`,
  claimsSplitLabel: "HOW CLAIMS WERE SPLIT",
  claimsSplitHeaders: ["UNDERWRITER", "SHARE", "PREMIUMS", "CLAIMS"],
  claimsSplitFootnote: "Nobody absorbed a policy alone. Every claim was divided by capital share, to the cent.",
  returnedLabel: "RETURNED TO YOU",
  unit: "USDC",
  rows: { capital: "Capital", premiums: "Premiums", claims: "Claims", net: "Net" },
  nextCycleLabel: "NEXT CYCLE",
  nextCycleBody: (cohortId: number) =>
    `Cohort ${cohortId} opens at 08:00 UTC. Your capital is free until you commit it again — rolling is a choice, never a default.`,
  rollCta: (amount: string, cohortId: number) => `Roll ${amount} into cohort ${cohortId}`,
  rollDifferentCta: "Roll a different amount",
  withdrawCta: "Withdraw and stop",
} as const;

export const statesCopy = {
  pageHeading: "States that decide whether people trust this",
  pageSubtitle: "Every one of these is a moment where the product either keeps its promise out loud or quietly breaks it.",
  pageFootnote:
    "Every state above exists to keep one promise visible: the payout is capped by capital that already exists, and the LP's loss is capped by the premium.",
  backLink: "← Back to landing",
  cards: {
    notEnoughCapacity: {
      title: "Not enough capacity",
      tag: "BLOCKING",
      message: "This vault can back 427,500 USDC of payouts right now. You asked for 600,000.",
      actions: ["Buy 427,500 instead", "Notify me when capacity opens"],
      footnote: "Never queue an unbacked promise. Offer the amount that is real, or nothing.",
    },
    cohortNearlyOver: {
      title: "Cohort nearly over",
      tag: "WARNING",
      message:
        "Only 4h 12m of cohort 12 remain. Cover bought now measures variance over those four hours only — the premium is small because the window is small.",
      actions: ["Buy for 4h · 12.40 USDC", "Wait for cohort 13"],
      footnote: "Cheap is not the same as good value. Say what the money actually buys.",
    },
    oracleSamplesMissed: {
      title: "Oracle samples missed",
      tag: "INTEGRITY",
      message:
        "3 of the last 48 TWAP samples were not recorded on time. Measured variance may understate the real move over that window.",
      gapsLine: "Gaps: 14:01, 14:31, 15:01 UTC · backfilled from pool observations at 15:12",
      footnote: "Both sides see this, always. A settlement feed that hides its own gaps is not a feed anyone should settle against.",
    },
    betweenCycles: {
      title: "Between cycles",
      tag: "TRANSIENT",
      message:
        "Cohort 12 is settling. Payouts and capital returns are being written now; cohort 13 opens for deposits the moment it finishes.",
      progressCaption: "29 of 47 policies settled",
      footnote: "Show progress, not a spinner. People are watching their money move.",
    },
    noPositionsFound: {
      title: "No positions found",
      tag: "EMPTY",
      message: "This wallet holds no Uniswap v3 positions in a pool that has a vault.",
      actions: ["Paste a token ID", "Switch wallet"],
      footnote: "An empty state is still a path forward, not a dead end.",
    },
    noVaultForPool: {
      title: "No vault for this pool",
      tag: "EMPTY",
      message:
        "ARB/USDC 0.30% has no underwriters yet, so no cover can be written on it. Cover exists only where somebody has put capital behind it.",
      actions: ["Seed the first vault", "Request this pool"],
      footnote: "The two-sided nature is the honest explanation. Say it rather than showing a broken market.",
    },
    quoteExpired: {
      title: "Quote expired",
      tag: "RETRY",
      message: "Your quote was priced for 3d 21h of cover. Time has moved on, so the premium has fallen to 374.20 USDC.",
      actions: ["Use the new price"],
      footnote: "Re-pricing downward still needs consent. Never silently change what someone is signing.",
    },
    wrongNetwork: {
      title: "Wrong network",
      tag: "BLOCKING",
      message: "Your wallet is on Ethereum mainnet. These vaults live on Arbitrum One.",
      actions: ["Switch to Arbitrum One"],
      footnote: "Block early, at the first screen, not at the signature.",
    },
  },
} as const;

export const proofCopy = {
  heading: (cohortId: number) => `Settlement proof · cohort ${cohortId}`,
  subtitle: "Every number that decided a payout, and where it came from. Anyone can recompute this from public chain data without trusting us.",
  downloadCsvCta: "Download samples (CSV)",
  viewExplorerCta: "View on explorer",
  sampleTableTitle: "TWAP sample record",
  sampleTableMeta: (recorded: number, total: number, gaps: number) => `${recorded} of ${total} recorded · ${gaps} gaps`,
  tableHeaders: ["TIME (UTC)", "MEAN TICK", "Δ TICK", "SQUARED LOG RETURN"],
  hiddenRows: (count: number) => `${count} rows hidden`,
  derivationLabel: "HOW THE FINAL NUMBER IS DERIVED",
  derivationFootnote:
    "Ticks are already log prices, so no price conversion enters the computation. Nothing here reads spot price at any point.",
  placeholderFootnote: "Sample figures shown for layout. Contract references below are placeholders until deployment.",
  resultLabel: "SETTLEMENT RESULT",
  unit: "realized vol",
  rows: {
    policiesSettled: "Policies settled",
    paidOut: "Paid out",
    totalClaims: "Total claims",
    hitTheirCap: "Hit their cap",
  },
  contractsLabel: "CONTRACTS",
  whyTwap: {
    label: "WHY TWAP AND NOT SPOT",
    body: "A spot price can be pushed for a single block with borrowed capital. That would fabricate variance, trigger payouts and drain the vault without any real volatility occurring. Reading the pool's own time-weighted observations makes that attack cost real money for a sustained period — which is no longer manipulation, it is volatility.",
  },
} as const;
