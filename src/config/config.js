require('dotenv').config();

module.exports = {
  // Exchange Configuration
  exchanges: {
    binance: {
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_API_SECRET,
      enableRateLimit: true,
      rateLimit: 50, // ms between requests
    },
    kraken: {
      apiKey: process.env.KRAKEN_API_KEY,
      secret: process.env.KRAKEN_API_SECRET,
      enableRateLimit: true,
      rateLimit: 100,
    },
    coinbase: {
      apiKey: process.env.COINBASE_API_KEY,
      secret: process.env.COINBASE_API_SECRET,
      enableRateLimit: true,
      rateLimit: 80,
    },
  },

  // Trading Parameters
  trading: {
    minProfitPercentage: parseFloat(process.env.MIN_PROFIT_PERCENTAGE) || 0.5,
    positionSizeUSDT: parseFloat(process.env.POSITION_SIZE_USDT) || 100,
    maxPositions: parseInt(process.env.MAX_POSITIONS) || 10,
    executionTimeoutMs: parseInt(process.env.EXECUTION_TIMEOUT_MS) || 100,
  },

  // Blockchain Configuration
  web3: {
    providerUrl: process.env.WEB3_PROVIDER_URL,
    uniswapRouterAddress: process.env.UNISWAP_ROUTER_ADDRESS,
    slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 0.5,
  },

  // Monitoring
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableAlerts: process.env.ENABLE_ALERTS === 'true',
    webhookUrl: process.env.WEBHOOK_URL,
  },

  // Price Update Intervals (ms)
  intervals: {
    priceUpdate: 100, // Check prices every 100ms
    opportunityCheck: 50, // Scan for opportunities every 50ms
    healthCheck: 5000, // Health check every 5s
  },
};