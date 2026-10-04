// Generated via `forge inspect ArunaFactory abi` from smart-contract commit
// 01dc2fbfe3a4f2c34e3ba8813a130ff7002ad928 (branch rc/sandbox-1, v2). Permissionless
// createVault, no canonical per-(pool, tenor) slot - see contract-integration-
// requirements.md Lampiran A.4 for the full shape and VaultParams struct.
export const arunaFactoryAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "positionManager_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "settlementToken_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "vaultDeployer_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "accumulatorDeployer_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "allowedTenors_",
        "type": "uint32[]",
        "internalType": "uint32[]"
      },
      {
        "name": "gap_",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "sampleInterval_",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "maxKeeperShareBps_",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "maxPokeBounty_",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "maxFinalizeBounty_",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "maxSettleBounty_",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "accumulatorDeployer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "accumulatorOf",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allVaults",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allVaultsLength",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowedTenors",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32[]",
        "internalType": "uint32[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createVault",
    "inputs": [
      {
        "name": "p",
        "type": "tuple",
        "internalType": "struct ArunaFactory.VaultParams",
        "components": [
          {
            "name": "pool",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "tenor",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "pricer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "valuer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "anchor",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "maxUtilizationBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "maxExcessVariance",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "ewmaAlphaBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "seedVariance",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "policyCap",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "keeperShareBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "pokeBounty",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "finalizeBounty",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "settleBounty",
            "type": "uint128",
            "internalType": "uint128"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "vault",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "gap",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isAllowedTenor",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isVault",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxFinalizeBounty",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxKeeperShareBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxPokeBounty",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxSettleBounty",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "positionManager",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "sampleInterval",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "settlementToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "vaultDeployer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "vaultsOf",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tenor",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "vaultsOfLength",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tenor",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "AccumulatorCreated",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "accumulator",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VaultCreated",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tenor",
        "type": "uint32",
        "indexed": true,
        "internalType": "uint32"
      },
      {
        "name": "vault",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "accumulator",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "gap",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "sampleInterval",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "params",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct ArunaFactory.VaultParams",
        "components": [
          {
            "name": "pool",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "tenor",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "pricer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "valuer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "anchor",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "maxUtilizationBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "maxExcessVariance",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "ewmaAlphaBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "seedVariance",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "policyCap",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "keeperShareBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "pokeBounty",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "finalizeBounty",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "settleBounty",
            "type": "uint128",
            "internalType": "uint128"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BadConfig",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BountyTooHigh",
    "inputs": [
      {
        "name": "bounty",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "max",
        "type": "uint128",
        "internalType": "uint128"
      }
    ]
  },
  {
    "type": "error",
    "name": "KeeperShareTooHigh",
    "inputs": [
      {
        "name": "keeperShareBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "max",
        "type": "uint16",
        "internalType": "uint16"
      }
    ]
  },
  {
    "type": "error",
    "name": "PoolLacksSettlementToken",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "PoolNotCanonical",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "canonical",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "TenorNotAllowed",
    "inputs": [
      {
        "name": "tenor",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  }
] as const;
