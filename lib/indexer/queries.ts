// GraphQL documents against the indexer schema (indexer/ponder.schema.ts).
// Kept as plain strings (no codegen) to match the indexer README's own
// examples one-to-one, so a schema diff is easy to spot by eye.

// `isTest: false` per the indexer's own rule: short-tenor vaults used for
// testing stay indexed but are never shown to users. 8 cohorts is enough
// headroom to cover the 6-cohort history plus the current and next cohort,
// which are always the highest ids and so always included in a desc order.
export const VAULTS_QUERY = /* GraphQL */ `
  query Vaults {
    vaults(where: { isTest: false }) {
      items {
        address
        pool
        accumulator
        settlementToken
        tenor
        anchor
        maxUtilizationBps
        maxExcessVariance
        isTest
        cohorts(orderBy: "cohortId", orderDirection: "desc", limit: 8) {
          items {
            cohortId
            startsAt
            endsAt
            totalCapital
            reserved
            premiumsCollected
            claimsPaid
            totalVarNotional
            totalMaxPayout
            policyCount
            settledCount
            paidCount
            noPayoutCount
            hitCapCount
            underwriterCount
            finalized
            startIndex
            endIndex
            finalSumSq
            finalizedAt
          }
        }
      }
    }
  }
`;

// Singular `vault(address)` — unlike `vaults(where: { isTest: false })`, this
// is NOT filtered by isTest, because a page reached by address (a wallet's
// own underwriting position, a policy's own vault) must resolve regardless of
// whether that vault is publicly listed on /markets.
export const VAULT_BY_ADDRESS_QUERY = /* GraphQL */ `
  query VaultByAddress($address: String!) {
    vault(address: $address) {
      address
      pool
      accumulator
      settlementToken
      tenor
      anchor
      maxUtilizationBps
      maxExcessVariance
      isTest
      cohorts(orderBy: "cohortId", orderDirection: "desc", limit: 8) {
        items {
          cohortId
          startsAt
          endsAt
          totalCapital
          reserved
          premiumsCollected
          claimsPaid
          totalVarNotional
          totalMaxPayout
          policyCount
          settledCount
          paidCount
          noPayoutCount
          hitCapCount
          underwriterCount
          finalized
          startIndex
          endIndex
          finalSumSq
          finalizedAt
        }
      }
    }
  }
`;

export const POLICIES_BY_OWNER_QUERY = /* GraphQL */ `
  query PoliciesByOwner($owner: String!) {
    policys(where: { owner: $owner }, orderBy: "boughtAt", orderDirection: "desc") {
      items {
        vault
        policyId
        cohortId
        owner
        positionTokenId
        premium
        maxPayout
        varNotional
        strikeAnnualized
        coveredSeconds
        startIndex
        startSumSq
        settled
        payout
        payoutParked
        boughtAt
        settledAt
        cohortRef {
          startsAt
          endsAt
          finalized
          finalSumSq
        }
      }
    }
  }
`;

export const POLICIES_BY_POSITION_QUERY = /* GraphQL */ `
  query PoliciesByPosition($positionTokenId: BigInt!) {
    policys(
      where: { positionTokenId: $positionTokenId }
      orderBy: "cohortId"
      orderDirection: "desc"
    ) {
      items {
        vault
        policyId
        cohortId
        owner
        positionTokenId
        premium
        maxPayout
        varNotional
        strikeAnnualized
        coveredSeconds
        startIndex
        startSumSq
        settled
        payout
        payoutParked
        boughtAt
        settledAt
        cohortRef {
          startsAt
          endsAt
          finalized
          finalSumSq
        }
      }
    }
  }
`;

export const UNDERWRITER_POSITIONS_BY_WALLET_QUERY = /* GraphQL */ `
  query UnderwriterPositionsByWallet($wallet: String!) {
    underwriterPositions(where: { wallet: $wallet }) {
      items {
        vault
        cohortId
        wallet
        deposit
        principal
        rolledIn
        rolledOut
        withdrawnNet
        cohortRef {
          startsAt
          endsAt
          totalCapital
          premiumsCollected
          claimsPaid
          finalized
        }
      }
    }
  }
`;

// Singular `cohort(vault, cohortId)` — one specific cohort's own aggregates
// plus its strike-bucket book and underwriter positions, per the indexer
// README's own documented example for the UW dashboard/settlement pages.
export const COHORT_DETAIL_QUERY = /* GraphQL */ `
  query CohortDetail($vault: String!, $cohortId: Float!) {
    cohort(vault: $vault, cohortId: $cohortId) {
      startsAt
      endsAt
      totalCapital
      reserved
      premiumsCollected
      claimsPaid
      totalVarNotional
      totalMaxPayout
      policyCount
      settledCount
      paidCount
      noPayoutCount
      hitCapCount
      finalized
      finalSumSq
      finalizedAt
      strikeBuckets {
        items {
          strikeAnnualized
          policyCount
          totalVarNotional
          totalMaxPayout
          totalPremium
        }
      }
      positions {
        items {
          wallet
          principal
          deposit
          rolledIn
          rolledOut
          withdrawnNet
        }
      }
      policies {
        items {
          policyId
          owner
          premium
          maxPayout
          varNotional
          strikeAnnualized
          coveredSeconds
          startIndex
          startSumSq
          settled
          payout
        }
      }
    }
  }
`;

export const SAMPLES_QUERY = /* GraphQL */ `
  query Samples($accumulator: String!, $limit: Int) {
    samples(
      where: { accumulator: $accumulator }
      orderBy: "index"
      orderDirection: "asc"
      limit: $limit
    ) {
      items {
        index
        timestamp
        avgTick
        cumulativeSumSq
        increment
      }
    }
  }
`;
