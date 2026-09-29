// Full compiled ABI for VarianceAccumulator, copied verbatim from indexer/abis/ (Foundry
// build artifact via the indexer's own codegen). Refresh from there if the
// contract is redeployed or changed — do not hand-edit this file.
export const varianceAccumulatorAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "pool_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "sampleInterval_",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "twapWindow_",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "gapStats",
    "inputs": [],
    "outputs": [
      {
        "name": "gapCount",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "maxGapSeconds",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "indexAtOrBefore",
    "inputs": [
      {
        "name": "ts",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
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
    "name": "lastSampleAt",
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
    "name": "poke",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "pool",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IUniswapV3PoolMinimal"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "sampleAt",
    "inputs": [
      {
        "name": "i",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct IVarianceAccumulator.Sample",
        "components": [
          {
            "name": "timestamp",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "tickCumulative",
            "type": "int56",
            "internalType": "int56"
          },
          {
            "name": "avgTick",
            "type": "int24",
            "internalType": "int24"
          },
          {
            "name": "cumulativeSumSq",
            "type": "uint128",
            "internalType": "uint128"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "sampleCount",
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
    "name": "twapWindow",
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
    "type": "event",
    "name": "Poked",
    "inputs": [
      {
        "name": "index",
        "type": "uint32",
        "indexed": true,
        "internalType": "uint32"
      },
      {
        "name": "timestamp",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "avgTick",
        "type": "int24",
        "indexed": false,
        "internalType": "int24"
      },
      {
        "name": "cumulativeSumSq",
        "type": "uint128",
        "indexed": false,
        "internalType": "uint128"
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
    "name": "IndexOutOfRange",
    "inputs": [
      {
        "name": "index",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "count",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "error",
    "name": "IntervalNotElapsed",
    "inputs": [
      {
        "name": "nextAllowedAt",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "error",
    "name": "NoSampleAtOrBefore",
    "inputs": [
      {
        "name": "ts",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  }
] as const;
