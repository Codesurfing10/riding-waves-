const logger = require('./utils/logger');
const config = require('./config/config');
const ExchangeManager = require('./exchanges/exchangeManager');
const ArbitrageDetector = require('./arbitrage/detector');
const TradeExecutor = require('./trading/executor');

class ArbitrageBot {
  constructor() {
    this.exchangeManager = new ExchangeManager();
    this.detector = new ArbitrageDetector(this.exchangeManager);
    this.executor = new TradeExecutor(this.exchangeManager, this.detector);
    this.isRunning = false;
    this.symbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'ADA/USDT', 'SOL/USDT'];
  }

  async start() {
    logger.info('Starting Crypto Arbitrage Bot...');
    this.isRunning = true;

    // Start price monitoring
    this.startPriceMonitoring();

    // Start opportunity detection
    this.startOpportunityDetection();

    // Start health monitoring
    this.startHealthMonitoring();

    logger.info('Bot started successfully');
  }

  startPriceMonitoring() {
    setInterval(async () => {
      try {
        await this.exchangeManager.fetchPrices(this.symbols);
        logger.debug('Prices updated');
      } catch (error) {
        logger.error('Error updating prices:', error.message);
      }
    }, config.intervals.priceUpdate);
  }

  startOpportunityDetection() {
    setInterval(async () => {
      try {
        const opportunities = await this.detector.detectOpportunities(this.symbols);

        if (opportunities.length > 0) {
          const filtered = this.detector.filterOpportunities(opportunities);
          const topOpps = this.detector.getTopOpportunities(5);

          if (topOpps.length > 0) {
            logger.info(`Found ${topOpps.length} high-profit opportunities`);

            // Execute batch trades
            await this.executor.executeBatch(topOpps);
          }
        }
      } catch (error) {
        logger.error('Error detecting opportunities:', error.message);
      }
    }, config.intervals.opportunityCheck);
  }

  startHealthMonitoring() {
    setInterval(async () => {
      try {
        await this.executor.monitorPositions();

        const stats = this.executor.getStats();
        logger.info('Bot Stats:', {
          activePositions: stats.activePositions,
          pendingOrders: stats.pendingOrders,
          totalExecutedTrades: stats.detectorStats.executedTrades,
          successfulTrades: stats.detectorStats.successfulTrades,
          totalProfit: stats.detectorStats.totalProfit.toFixed(2),
          averageProfitPerTrade: stats.detectorStats.averageProfitPerTrade.toFixed(4),
        });
      } catch (error) {
        logger.error('Error in health monitoring:', error.message);
      }
    }, config.intervals.healthCheck);
  }

  async stop() {
    logger.info('Stopping bot...');
    this.isRunning = false;
    // Clean up positions if needed
    logger.info('Bot stopped');
  }
}

// Main execution
const bot = new ArbitrageBot();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

// Start the bot
bot.start().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

module.exports = ArbitrageBot;
