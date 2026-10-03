// Generated via `forge inspect VarianceAccumulator abi` from smart-contract commit
// 01dc2fbfe3a4f2c34e3ba8813a130ff7002ad928 (branch rc/sandbox-1, v2).
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
          },
          {
            "name": "elapsed",
            "type": "uint16",
            "internalType": "uint16"
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
    "name": "tryPoke",
    "inputs": [],
    "outputs": [
      {
        "name": "added",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "nonpayable"
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
