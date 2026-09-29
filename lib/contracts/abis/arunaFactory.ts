// Full compiled ABI for ArunaFactory, copied verbatim from indexer/abis/ (Foundry
// build artifact via the indexer's own codegen). Refresh from there if the
// contract is redeployed or changed — do not hand-edit this file.
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
      }
    ],
    "stateMutability": "nonpayable"
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
            "name": "sampleInterval",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "twapWindow",
            "type": "uint32",
            "internalType": "uint32"
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
    "name": "vaultOf",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
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
        "indexed": false,
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
    "type": "error",
    "name": "BadConfig",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VaultExists",
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
      },
      {
        "name": "existing",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const;
