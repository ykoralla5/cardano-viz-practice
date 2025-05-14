const dummyPools = [
  {
    id: "pool1",
    ticker: "SUNNY",
    name: "Sunrise Pool",
    stake: 250000000,        // in Lovelace (1 ADA = 1,000,000 Lovelace)
    blocksMinted: 30,
    activeDelegators: 150,
    country: "US",
    saturation: 0.45,        // 45% saturated
    epoch: 455
  },
  {
    id: "pool2",
    ticker: "MOON",
    name: "Moonbase Stake",
    stake: 650000000,
    blocksMinted: 90,
    activeDelegators: 900,
    country: "DE",
    saturation: 0.90,
    epoch: 455
  },
  {
    id: "pool3",
    ticker: "WAVE",
    name: "WaveStaking",
    stake: 400000000,
    blocksMinted: 60,
    activeDelegators: 500,
    country: "JP",
    saturation: 0.60,
    epoch: 455
  },
  {
    id: "pool4",
    ticker: "SPCE",
    name: "Space Blocks",
    stake: 800000000,
    blocksMinted: 110,
    activeDelegators: 1300,
    country: "AU",
    saturation: 1.02,      // over-saturated
    epoch: 455
  },
  {
    id: "pool5",
    ticker: "ECO",
    name: "Eco Friendly Pool",
    stake: 200000000,
    blocksMinted: 22,
    activeDelegators: 80,
    country: "SE",
    saturation: 0.30,
    epoch: 455
  }
];
