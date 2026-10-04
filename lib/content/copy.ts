export const brandCopy = {
  name: "Aruna",
  chainTag: "ARBITRUM ONE",
} as const;

export const sharedNavCopy = {
  markets: "Markets",
  protect: "Protect",
  underwrite: "Underwrite",
  proof: "Proof",
  demo: "Demo",
  cohortChip: (cohortId: number, timeLeft: string) => `Cohort ${cohortId} · settles in ${timeLeft}`,
} as const;

export const stepIndicatorCopy = {
  position: "POSITION",
  cover: "COVER",
  confirm: "CONFIRM",
} as const;

export const landingCopy = {
  nav: { useAruna: "Use Aruna" },
  hero: {
    eyebrow: "IMPERMANENT LOSS COVER · UNISWAP V3",
    heading: "Cover priced by how wildly price moves - not which way it went.",
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
      body: "Little variance accumulated. Little impermanent loss. No payout owed - and the premium reflected that up front.",
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
        "Choose a strike - the vol level above which cover starts paying.",
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
        "Your capital backs every policy that vault writes - never one LP's fate alone.",
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
        body: "LPs can never owe more than the premium - not at settlement, not on early exit. That bound is the product, not a setting.",
      },
    ],
  },
  footer: {
    disclaimer: "Cover is capped by vault capacity. Read the settlement method before buying.",
    proofLink: "Settlement proof →",
    statesReferenceLink: "UI states reference →",
    copyright: (year: number) => `© ${year} ${brandCopy.name}`,
  },
} as const;

export const marketsCopy = {
  heading: "Markets",
  subtitle: "Protect a position from volatility, or underwrite the capital that pays for it. One vault per pool.",
  noVaultLabel: "No vault deployed yet",
  underwriteToLaunchCta: "Underwrite to launch",
  protectCta: "Protect",
  underwriteCta: "Underwrite",
  fieldLabels: {
    status: "STATUS",
    pricingVol: "PRICING VOL",
    realizedVol: "REALIZED VOL",
    capacity: "FREE CAPACITY",
    lastCycle: "LAST CYCLE",
  },
  hints: {
    pricingVol:
      "The volatility the premium pricer charges against. A cohort's premium uses the snapshot taken when it started, so this can move ahead of what you would pay.",
    realizedVol:
      "Annualized volatility measured from the pool's own TWAP over the samples this vault has recorded.",
    capacity:
      "Capital that can still back new cover. Reserved capacity is already committed to live policies.",
    lastCycle:
      "Premiums collected minus claims paid in the latest completed cohort, as a share of that cohort's capital.",
  },
  noCompletedCycle: "No completed cycle yet",
  capacityOf: (total: string) => `of ${total}`,
  howItWorks: {
    heading: "How a market works",
    steps: [
      {
        title: "Underwriters fund a cohort",
        body: "Capital is committed for the whole cohort before it opens, and it backs every policy sold against it.",
      },
      {
        title: "LPs buy cover while it is open",
        body: "Cover is priced for the time left in the cohort and stops selling shortly before it ends.",
      },
      {
        title: "Everything settles at once",
        body: "When the cohort ends, realized variance decides payouts. Underwriters get back capital and premiums, minus claims.",
      },
    ],
  },
  howItWorksStorageKey: "aruna.markets.howItWorks.seen",
} as const;

export const marketDetailCopy = {
  backLink: "← All markets",
  // One sentence: what the cover pays on, and how the cohort and capacity bound it.
  // Kept within SSOT §7: no full protection, not an IL indemnity, and not continuous.
  describe: (tenor: string) =>
    `Cover pays on how much this pool's price moves, not which way it goes. Each cohort runs ${tenor}, and payouts are capped by the vault's capacity.`,
  statusLabel: "STATUS",
  protect: {
    role: "Liquidity provider",
    title: "Protect your LP position",
    description:
      "Pay a premium now and cap what volatility can cost your position. The maximum loss is set when you pay.",
    pricingVolLabel: "Pricing vol",
    pricingVolHint: marketsCopy.hints.pricingVol,
    buyUntilLabel: "Buy cover until",
    buyUntilClosed: "Closed",
    freeLabel: "Free capacity",
    note: "Payouts settle on the pool's TWAP, not the spot price, and can never exceed the cap set when you buy.",
    cta: "Protect a position",
    closedNote: (opensIn: string) => `Cover sales are closed for this cohort. The next one opens in ${opensIn}.`,
    notYetNote: (opensIn: string) => `Cover opens in ${opensIn}, when the next cohort starts.`,
  },
  underwrite: {
    role: "Underwriter",
    title: "Earn premiums as underwriter",
    description:
      "Deposit capital for a cohort. You keep its premiums minus any claims, and capital that is not used comes back at settlement.",
    lastCycleLabel: "Last cycle",
    lastCycleHint: marketsCopy.hints.lastCycle,
    noCycleYet: "None yet",
    depositsCloseLabel: "Deposits close",
    note: "Capital is locked until the cohort settles. When volatility spikes, claims can exceed premiums; the bound is the written capacity, not zero.",
    cta: "Deposit",
    closedNote: "Deposits for the next cohort are closed.",
  },
  volatility: {
    title: "Volatility",
    description: "Pricing vol is what premiums are based on. Realized vol is measured from this pool's TWAP samples over one cohort.",
    empty: "Realized volatility appears after the first samples of this cohort.",
    legendRealized: (window: string) => `Realized vol over the last ${window}`,
    legendStrike: "Dashed lines: strike levels",
    lastSample: "Last sample",
    recorded: (count: number) => `${count} samples recorded`,
    gaps: (count: number) => (count === 1 ? "1 gap in sampling" : `${count} gaps in sampling`),
  },
  capacity: {
    title: "Capacity",
    description: "Capital the vault can still back with new cover.",
    freeLabel: "Free",
    reservedLabel: "Reserved",
    totalLabel: "Total",
    note: "Reserved means already committed as the capped payout of a live policy. Only free capacity can be sold.",
  },
  history: {
    title: "Cohort history",
    description: "The latest completed cohorts. Net is premiums minus claims.",
    empty: "No cohort has completed yet.",
    columns: { cohort: "Cohort", capital: "Capital", premiums: "Premiums", claims: "Claims", result: "Result" },
  },
  howItWorks: {
    heading: "How a market works",
    storageKey: "aruna.markets.howItWorks.seen",
  },
} as const;

export const lpSelectPositionCopy = {
  heading: "Which position are you covering?",
  subtitle: "Cover attaches to one position NFT and stays with its owner. Co-ownership is not supported.",
  badgeInRange: "IN RANGE",
  badgeCovered: "COVERED",
  badgeHeld: "HELD - CLAIM",
  viewCoverCta: "View cover",
  claimHeldCta: "Claim position",
  badgeOutOfRange: "OUT OF RANGE",
  positionMeta: (lower: string, upper: string, fees: string) => `Range ${lower} – ${upper} · fees earned ${fees} USDC`,
  positionValueLabel: "POSITION VALUE",
  // Real on-chain quantities, shown with no price attached (see E8: this
  // testnet has no USD price feed, and the pool's own ratio isn't a
  // meaningful one either).
  feesOwedLabel: (amount0: string, symbol0: string, amount1: string, symbol1: string) =>
    `Fees owed ${amount0} ${symbol0} + ${amount1} ${symbol1}`,
  holdingsUnavailableLabel: "HOLDINGS",
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
    p1: "While covered, your position NFT is held by the vault and returns to you at settlement. Your trading fees stay yours - collect them any time from the cover page.",
    p2: "A position that sits out of range earns no fees but still carries variance risk, so it can still be covered.",
    p3: (timeLeft: string) =>
      `Cover runs to the end of the current cohort - ${timeLeft} from now - not for a fixed seven days from purchase.`,
    seeMarketLink: "See the market state first →",
  },
  myCoversCta: "My covers",
} as const;

export const lpMyCoversCopy = {
  heading: "My covers",
  subtitle: "Every cover you've bought, whether it's still running or already settled.",
  coverTitle: (coverId: string) => `Cover #${coverId}`,
  badgeActive: "ACTIVE",
  badgeCancelled: "CANCELLED",
  badgeRefunded: "REFUNDED",
  cardMeta: (pool: string, strikePercent: number, cap: string) =>
    `${pool} · strike ${strikePercent}% · cap ${cap} USDC`,
  premiumPaidLabel: "PREMIUM PAID",
  netResultLabel: "NET RESULT",
  pendingSettlement: "pending settlement",
  settledCaption: (date: string) => `settled ${date}`,
  cancelledCaption: "cancelled before settlement",
  viewCoverCta: "View cover",
  viewSettlementCta: "View settlement",
  emptyState: "You haven't bought any cover yet.",
  emptyStateCta: "Protect a position",
  backLink: "← Back to select a position",
} as const;

export const lpQuoteCopy = {
  heading: "Set your cover",
  // v2: no USD figure here - real positions have no price feed (see E8), and
  // there's no coverage amount to choose (cover is the whole position).
  headerMeta: (positionId: string, pool: string, cohortId: number, timeLeft: string) =>
    `Position #${positionId} · ${pool} · cohort ${cohortId} ends in ${timeLeft}`,
  strikeSectionLabel: "STRIKE - THE VOL LEVEL WHERE COVER STARTS PAYING",
  strikeSectionHint: "Lower strike, earlier payout, higher premium",
  premiumWord: "premium",
  strikeFootnote: (sampleInterval: string, timeLeft: string) =>
    `Realized volatility is measured from the pool's ${sampleInterval} TWAP over the remaining ${timeLeft} of the cohort and annualized for comparison.`,
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
  },
  quoteCard: {
    label: "YOUR QUOTE",
    youPayNow: "You pay now",
    unit: "USDC",
    disclaimer: "This is also the most you can lose. It cannot grow - not at settlement, not if you exit early.",
    rows: {
      strike: "Strike",
      maxPayout: "Maximum payout",
      chargedFor: "Charged for",
    },
    cta: "Review and buy",
  },
  capacityCheck: {
    label: "CAPACITY CHECK",
    statusOk: "Vault can back this cover",
    statusNotEnough: "Not enough free capacity for this cover",
    statusTooSmall: "Position too small for this cohort",
    tooSmallNote: (floorUsdc: string) =>
      `This cohort only accepts a maximum payout of at least ${floorUsdc} USDC per position. Pick a larger position, or wait for the next cohort.`,
    reservingCaption: (amount: string) => `reserving ${amount}`,
    freeCaption: (amount: string) => `${amount} free`,
    note: "Your maximum payout is locked out of the vault the moment you buy. No later buyer can claim it.",
  },
  notActiveNote: "This cohort isn't open for cover right now.",
} as const;

export const lpConfirmCopy = {
  heading: "Confirm and sign",
  plainTermsLabel: "IN PLAIN TERMS",
  plainTerms: (premium: string, pool: string, breakevenPercent: number, cap: string) =>
    `You pay ${premium} USDC today. You can never lose more than that. If ${pool} ends the cohort above ${breakevenPercent}% realized volatility, you get paid - up to ${cap} USDC.`,
  termsLabel: "TERMS BEING WRITTEN ON CHAIN",
  termsRows: {
    position: "Position",
    vault: "Vault",
    strike: "Strike",
    payoutCap: "Payout cap",
    settles: "Settles",
    oracle: "Oracle",
  },
  oracleValue: "Pool TWAP",
  // v2: the position NFT moves into the vault's escrow for the cover's
  // duration - not a detail to bury, since it's the biggest behavior change
  // from "just pay a premium".
  escrowNotice: {
    title: "Your position moves into the vault while covered",
    body: "Its liquidity can't be withdrawn or changed until the cover ends, is cancelled, or settles. Your trading fees stay 100% yours - collect them anytime from the Active page. Never send this NFT to the vault address any other way: outside this exact flow, it can never be recovered.",
  },
  warning: {
    title: "Read this before signing",
    body: (strikePercent: number, premium: string) =>
      `If realized volatility finishes at or below ${strikePercent}%, you receive nothing and the ${premium} USDC premium is gone. That is the expected outcome in a quiet week - it is what you are paying for in a violent one.`,
  },
  acknowledge: (cap: string) =>
    `I understand the premium is non-refundable, the payout is capped at ${cap} USDC, my position moves into the vault while covered, and settlement uses the pool's TWAP rather than spot price.`,
  txCard: {
    label: "THREE TRANSACTIONS",
    belowFloorNote: (floorUsdc: string) =>
      `The vault will reject this cover: its maximum payout is below the cohort's minimum of ${floorUsdc} USDC. Nothing is sent.`,
    approveUsdcTitle: (amount: string) => `Approve ${amount} USDC`,
    approveNftTitle: (tokenId: string) => `Approve position #${tokenId}`,
    approveNftBody: "Lets the vault pull this one position into escrow - nothing else.",
    buyCoverTitle: "Buy cover",
    buyCoverBody: (cap: string) => `Pays the premium, escrows your position, reserves ${cap} USDC of vault capacity, and mints your policy.`,
    rows: {
      premium: "Premium",
    },
    connectWalletCta: "Connect wallet",
    approveUsdcCta: (amount: string) => `Approve ${amount} USDC`,
    approveNftCta: "Approve position",
    buyCoverCta: "Sign and buy cover",
    processingCta: "Processing…",
    backCta: "Back to quote",
  },
  liveQuote: {
    label: "LIVE QUOTE",
    note: "This premium is read live from the vault each time you open this page - it isn't locked in until your buyCover transaction confirms. If realized volatility moved a lot in between, go back and re-quote.",
  },
} as const;

export const lpActiveCopy = {
  heading: (coverId: string) => `Cover #${coverId} · active`,
  badgeInTheMoney: "IN THE MONEY",
  meta: (positionId: string, pool: string, strikePercent: number, cap: string) =>
    `Position #${positionId} · ${pool} · strike ${strikePercent}% · cap ${cap} USDC`,
  settlesInLabel: "SETTLES IN",
  chartTitle: "Realized volatility vs your strike",
  legendRealized: "- realized",
  legendStrike: (strikePercent: number) => `-- strike ${strikePercent}%`,
  legendBreakeven: (breakevenPercent: number) => `-- breakeven ${breakevenPercent}%`,
  axisNowLabel: (elapsed: string) => `now · ${elapsed} in`,
  axisStartLabel: "cover start",
  payoutCapLabel: "payout cap",
  scenarioLabel: "WHAT SETTLEMENT PAYS AT DIFFERENT FINISHES",
  scenarioFootnote:
    "Net of the premium already paid. The last column is the cap - it does not rise beyond it, however violent the week gets.",
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
  // v2: the position NFT sits in escrow for the cover's duration (design
  // §5.5) - these are the only two actions the vault exposes on it before
  // settlement.
  manageCover: {
    label: "MANAGE THIS COVER",
    note: "Your position is held in escrow while this cover is active. You can still collect its trading fees anytime, or cancel the cover early.",
    collectFeesCta: "Collect fees",
    cancelCta: "Cancel cover",
    cancelWarning: "Cancelling returns your position now, but the premium stays with the cohort - it is not refunded.",
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
  badgeRefunded: "REFUNDED",
  refundLabel: "Premium refunded",
  refundedBody:
    "The cohort could not be measured (no keeper samples covered it), so the vault returned your full premium instead of settling a payout. Nothing else was owed either way.",
  coverSettled: (coverId: string, date: string) => `Cover #${coverId} · settled ${date}`,
  claim: {
    label: "HELD FOR YOU",
    balanceBody: (reason: "payout" | "refund" | "balance", amount: string) =>
      `Sending your ${reason === "balance" ? "balance" : reason} to your wallet failed, so the vault is holding ${amount} USDC for you. Claim it to your wallet.`,
    balanceCta: "Claim to wallet",
    positionBody:
      "Returning your Uniswap position NFT automatically failed, so the vault is holding it for you. Claim it back to your wallet.",
    positionCta: "Claim position",
  },
  netResultLabel: "Net result",
  unit: "USDC",
  paidOutBody: (volPercent: number, strikePercent: number, breakevenPercent: number) =>
    `Realized volatility finished at ${volPercent}%, above your ${strikePercent}% strike and above your ${breakevenPercent}% breakeven. The payout was transferred to your wallet automatically.`,
  noPayoutBody: (volPercent: number, strikePercent: number) =>
    `Realized volatility finished at ${volPercent}%, below your ${strikePercent}% strike. Nothing was owed. Your loss is the premium and not one cent more - the number you saw before you signed.`,
  paidOutRows: {
    finalRealizedVariance: "Final realized variance",
    strikeVariance: "Strike variance",
    excessTimesRate: (rate: string) => `Excess × ${rate} payout rate`,
    capApplied: "Cap applied",
    premiumPaid: "Premium paid",
  },
  capAppliedNo: (cap: string) => `no · cap was ${cap}`,
  capAppliedYes: (cap: string) => `yes · capped at ${cap}`,
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
  heading: "Underwrite",
  subtitle:
    "Commit capital that backs cover for LPs in one pool. You keep the premiums and pay the claims, up to the capacity your deposit supports.",
  myUnderwritingCta: "My underwriting",
  // Used by the underwriter dashboard, which shows the same cycle summary.
  historyCaption: (cumulativePercent: number, lossCount: number) =>
    `last 6 cycles · ${cumulativePercent >= 0 ? "+" : ""}${cumulativePercent}% cumulative, ${
      lossCount === 1 ? "1 loss" : `${lossCount} losses`
    }`,
  depositCta: "Deposit",
  listTitle: "Pools",
  rowCta: "Deposit",
  depositWindowLabel: "DEPOSITS",
  stats: {
    lastCycle: "LAST CYCLE",
    capital: "CAPITAL",
    utilization: "UTILIZATION",
    noCycleYet: "None yet",
  },
  risks: {
    label: "BEFORE YOU DEPOSIT",
    items: [
      "Capital is locked until the cohort settles. It cannot leave early.",
      "Claims come out of your share of the capital, in proportion to it.",
      "When volatility spikes, claims can exceed premiums. Your loss is bounded by the capacity written, not by zero.",
    ],
  },
  positions: {
    heading: "My positions",
    connectTitle: "Connect a wallet to see your underwriting",
    connectCta: "Connect wallet",
    emptyTitle: "You have not underwritten any cohort yet",
    emptyBody: "Deposit into an open cohort above. Your positions and their settlement will appear here.",
    columns: { market: "Market", cohort: "Cohort", capital: "Capital", share: "Share" },
    viewCta: "Open",
    recentCohorts: "Recent cohorts",
  },
  noMarkets: "No market is listed yet.",
  loading: "Loading markets…",
  loadError: "Could not load markets from the indexer.",
} as const;

export const uwMyPositionsCopy = {
  heading: "My underwriting",
  subtitle: "Every vault you've committed capital to, across every cohort.",
  cardMeta: (cohortId: number, sharePercent: number) => `cohort ${cohortId} · ${sharePercent.toFixed(2)}% share`,
  capitalLabel: "CAPITAL COMMITTED",
  markLabel: "MARK IF ENDS HERE",
  viewDashboardCta: "View dashboard",
  dashboardUnavailable: "Dashboard not modeled for this vault yet",
  emptyState: "You haven't underwritten any vault yet.",
  emptyStateCta: "Underwrite a vault",
  backLink: "← Back to vaults",
} as const;

export const uwDepositCopy = {
  backLink: "← All pools",
  heading: (pool: string) => `Deposit into ${pool}`,
  sections: { risks: "Before you deposit", history: "Recent cohorts", deposit: "Deposit" },
  windowLabel: "DEPOSIT WINDOW",
  closesIn: (time: string) => `closes in ${time}`,
  depositDescription: (cohortId: number, settlesOn: string) =>
    `Your capital joins cohort ${cohortId} and is locked until it settles on ${settlesOn}. What is left after claims comes back automatically.`,
  cohortRange: (cohortId: number, start: string, end: string) => `Cohort ${cohortId} · ${start} → ${end}`,
  amountLabel: "AMOUNT TO COMMIT FOR THIS CYCLE",
  unit: "USDC",
  quickHalf: "Half",
  quickMax: "Max",
  walletBalance: (amount: string) => `Wallet balance ${amount} USDC`,
  insufficientBalance: "Amount exceeds your wallet balance.",
  connectWalletCta: "Connect wallet",
  approveCta: "Approve USDC",
  processingCta: "Processing…",
  historyNote: "Past cycles say nothing about the next one. A single volatile cohort can erase several quiet ones.",
  positionCard: {
    label: (cohortId: number) => `YOUR POSITION IN COHORT ${cohortId}`,
    shareLabel: "Share of vault",
    rows: {
      yourCapital: "Your capital",
      vaultAfterDeposit: "Vault after deposit",
      lockedUntil: "Locked until",
      estPremiums: (cohortId: number) => `Est. premiums at cycle-${cohortId} pace`,
    },
    cta: "Deposit",
  },
  worstCase: {
    label: "WORST CASE, STATED PLAINLY",
    unit: "USDC",
    body: "If every policy the vault writes this cycle pays its full cap, your share of the claims is this. It is the floor of your outcome, not a forecast - and it is the number the payout cap exists to make finite.",
  },
  acknowledge: "I understand my capital is locked for the cycle and can be reduced by claims.",
} as const;

export const uwDashboardCopy = {
  heading: (pool: string) => `My underwriting · ${pool}`,
  meta: (cohortId: number, elapsed: string, tenor: string, sharePercent: number, totalCapital: string) =>
    `Cohort ${cohortId} · ${elapsed} of ${tenor} · ${sharePercent}% of a ${totalCapital} USDC vault`,
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
  bookUnit: (amount: string) => `policies · ${amount} capacity written`,
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
  badgeProfitableCycle: "PROFITABLE CYCLE",
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
  cycleFootnote: (paidOut: number, total: number, hitCapCount: number, netUsdc: number) => {
    const netSentence = netUsdc >= 0 ? "Premiums exceeded claims this cycle." : "Claims exceeded premiums this cycle.";
    const capSentence =
      hitCapCount > 0
        ? `${hitCapCount} ${hitCapCount === 1 ? "policy" : "policies"} paid at its cap.`
        : "No policy paid above its cap.";
    return `${paidOut} of ${total} policies finished above their strike. ${netSentence} ${capSentence}`;
  },
  claimsSplitLabel: "HOW CLAIMS WERE SPLIT",
  claimsSplitHeaders: ["UNDERWRITER", "SHARE", "PREMIUMS", "CLAIMS"],
  claimsSplitFootnote: "Nobody absorbed a policy alone. Every claim was divided by capital share, to the cent.",
  returnedLabel: "RETURNED TO YOU",
  unit: "USDC",
  rows: { capital: "Capital", premiums: "Premiums", claims: "Claims", net: "Net" },
  nextCycleLabel: "NEXT CYCLE",
  nextCycleBody: (cohortId: number, dateLabel: string) =>
    `Cohort ${cohortId} opens ${dateLabel}. Your capital is free until you commit it again - rolling is a choice, never a default.`,
  rollCta: (amount: string, cohortId: number) => `Roll ${amount} into cohort ${cohortId}`,
  rollDifferentCta: "Roll a different amount",
  withdrawCta: "Withdraw and stop",
  noSettledYet: "None of your underwriting has settled yet. It unlocks once the cohort you funded is finalized and settled.",
  noSettledCta: "Back to your dashboard",
  alreadyClosedNote: "You already withdrew or rolled this cohort's capital.",
} as const;

export const statesCopy = {
  pageHeading: "States that decide whether people trust this",
  pageSubtitle: "Every one of these is a moment where the product either keeps its promise out loud or quietly breaks it.",
  pageFootnote:
    "Every state above exists to keep one promise visible: the payout is capped by capital that already exists, and the LP's loss is capped by the premium.",
  backLink: "← Back to landing",
  toasts: {
    heading: "Toasts",
    subtitle: "One global notification for every flow, from connecting a wallet to a confirmed transaction.",
    successLabel: "Success",
    successTitle: "Wallet connected",
    successDescription: "0x7a4c…9f21 on Arbitrum Sepolia.",
    errorLabel: "Error",
    errorTitle: "Deposit failed",
    errorDescription: "You rejected the request in your wallet.",
    actionLabel: "With action",
    actionTitle: "Deposit confirmed",
    actionDescription: "1,000 USDC added to the current cohort.",
    actionLink: "View on Arbiscan",
    clearLabel: "Clear all",
  },
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
        "Only 4h 12m of cohort 12 remain. Cover bought now measures variance over those four hours only - the premium is small because the window is small.",
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
  // Shown instead of resultLabel while the cohort hasn't finalized - the
  // number above it is real, but it's a running extrapolation, not a
  // decided payout, and a short sample window makes it noisy.
  resultLabelInProgress: "REALIZED VOL SO FAR",
  inProgressCaption: (sampleCount: number, window: string) =>
    `Based on ${sampleCount} sample${sampleCount === 1 ? "" : "s"} over ${window} - narrows as more accumulate.`,
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
    body: "A spot price can be pushed for a single block with borrowed capital. That would fabricate variance, trigger payouts and drain the vault without any real volatility occurring. Reading the pool's own time-weighted observations makes that attack cost real money for a sustained period - which is no longer manipulation, it is volatility.",
  },
} as const;

export const walletCopy = {
  connect: "Connect wallet",
  connecting: "Connecting…",
  copyAddress: "Copy address",
  viewOnExplorer: "View on explorer",
  disconnect: "Disconnect",
  addressCopied: "Address copied",
  copyFailed: "Could not copy address",
  connectedTitle: "Wallet connected",
  disconnectedTitle: "Wallet disconnected",
  connectFailedTitle: "Could not connect wallet",
  disconnectFailedTitle: "Could not disconnect wallet",
  wrongNetworkTitle: "Wrong network",
  wrongNetworkBody: "Aruna runs on Arbitrum Sepolia. Approve the network switch in your wallet, then try again.",
  wrongNetworkChip: "Wrong network",
  switchFailedTitle: "Could not switch network",
  noWalletTitle: "No wallet found",
  noWalletBody: "Install a browser wallet such as MetaMask, then try again.",
  modalTitle: "Connect Wallet",
  installedBadge: "INSTALLED",
  installBadge: "INSTALL",
  connectingBadge: "CONNECTING…",
  noWalletDetected: "No wallet detected in this browser. Install one below, then reload this page.",
  suggestedHeading: "Get a wallet",
  helpLabel: "What is a wallet?",
  helpTitle: "What is a wallet?",
  helpBody: [
    "A wallet is an app that holds your account. Aruna never holds your funds: you approve every deposit and every cover in your own wallet.",
    "Connecting only shares your public address. Nothing moves until you confirm a transaction.",
  ],
  helpBack: "Back to wallets",
  closeLabel: "Close",
} as const;

export const demoCopy = {
  heading: "Demo console",
  subtitle:
    "Everything you need to run a full Aruna cycle yourself on Arbitrum Sepolia. Every action is a normal transaction from your own wallet.",
  sharedMarketWarning:
    "This is a shared testnet market. Prices, storms and keeper actions are visible to, and affect, every visitor.",
  timeline: {
    label: "COHORT TIMELINE",
    status: { FUNDING: "FUNDING", ACTIVE: "ACTIVE", SETTLING: "SETTLING", SETTLED: "SETTLED" },
    cohort: (id: number) => `Cohort ${id}`,
    policies: (count: number, cap: number | undefined) => (cap ? `${count} / ${cap} covers` : `${count} covers`),
    capital: (amount: string) => `${amount} USDC capital`,
    boundary: {
      starts: "Opens in",
      buyCutoff: "Last moment to buy cover in",
      ends: "Ends in",
    },
    needsKeeper: "Waiting for a keeper to settle it",
    settledNote: "Settled. Withdraw or roll from the underwriter settlement page.",
    fundingNote: "Deposit now to underwrite this cohort.",
  },
  keeper: {
    label: "KEEPER",
    body: "Anyone can move a cohort forward. A keeper bot also does this automatically, so these buttons are for the demo.",
    poke: "Record a sample",
    pokeIn: (countdown: string) => `Next sample in ${countdown}`,
    pokeReady: "A sample is due",
    finalize: (cohortId: number) => `Finalize cohort ${cohortId}`,
    settle: (cohortId: number, count: number) => `Settle ${count} ${count === 1 ? "cover" : "covers"} in cohort ${cohortId}`,
    nothing: "Nothing to finalize or settle right now.",
    recent: "RECENT KEEPER ACTIVITY",
    noEvents: "No keeper activity yet.",
  },
  faucet: {
    label: "FAUCET",
    body: "Mints test mUSDC and mWETH to your wallet and opens a Uniswap position in the market's pool, so you can protect it or underwrite right away.",
    cta: "Get test tokens and a position",
    running: "Working…",
    resume: "Resume",
    needGas: "Your wallet is low on Arbitrum Sepolia ETH, which pays for gas. Get some from a faucet first:",
    done: "Done. Your new position is ready.",
    doneLink: "Open Protect",
    steps: {
      mintUsdc: "Mint mUSDC",
      mintWeth: "Mint mWETH",
      approveUsdc: "Approve mUSDC for Uniswap",
      approveWeth: "Approve mWETH for Uniswap",
      mintPosition: "Create the Uniswap position",
    },
  },
  storm: {
    label: "STORM / CALM",
    body: "Storm pushes the pool's price back and forth every sample interval so volatility accumulates and covers can pay out. Calm leaves the price alone.",
    shared: "The price is shared by every visitor: your Storm moves the market for everyone, and anyone else's does the same to you.",
    tabOnly: "Storm only runs while this tab stays open.",
    calm: "Calm",
    storm: "Storm",
    burnerLabel: "Storm wallet (a throwaway key kept in this browser)",
    burnerHelp: "It signs the Storm transactions so you are not asked to confirm one every minute. Fund it with a little ETH once; it mints its own test tokens.",
    fund: "Fund it with 0.002 ETH",
    sweep: "Return ETH to my wallet",
    needsFunds: "Fund the Storm wallet to start.",
    connectFirst: "Connect your wallet to fund the Storm wallet.",
    logLabel: "ACTIVITY",
  },
} as const;
