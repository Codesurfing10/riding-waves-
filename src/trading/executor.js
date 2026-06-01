const logger = require('../utils/logger');
const config = require('../config/config');

class TradeExecutor {
  constructor(exchangeManager, detector) {
    this.exchangeManager = exchangeManager;
    this.detector = detector;
    this.activePositions = [];
    this.pendingOrders = [];
    this.executionTimeout = config.trading.executionTimeoutMs;
  }

  /**
   * Execute arbitrage trade with microsecond precision
   */
  async executeArbitrage(opportunity) {
    const startTime = Date.now();
    logger.info(`Executing arbitrage: ${opportunity.symbol}`, opportunity);

    try {
      // Step 1: Place buy order on first exchange
      const buyOrderStart = Date.now();
      const buyOrder = await this.exchangeManager.placeBuyOrder(
        opportunity.buyExchange,
        opportunity.symbol,
        opportunity.quantity,
        opportunity.buyPrice
      );
      const buyOrderTime = Date.now() - buyOrderStart;
      logger.info(`Buy order executed in ${buyOrderTime}ms`);

      if (!buyOrder || !buyOrder.id) {
        throw new Error('Buy order failed or returned invalid ID');
      }

      // Step 2: Wait for buy order confirmation (with timeout)
      const buyConfirmed = await this.waitForOrderConfirmation(
        opportunity.buyExchange,
        buyOrder.id,
        opportunity.symbol,
        this.executionTimeout / 2
      );

      if (!buyConfirmed) {
        await this.exchangeManager.cancelOrder(
          opportunity.buyExchange,
          buyOrder.id,
          opportunity.symbol
        );
        throw new Error('Buy order confirmation timeout');
      }

      // Step 3: Place sell order immediately on second exchange
      const sellOrderStart = Date.now();
      const sellOrder = await this.exchangeManager.placeSellOrder(
        opportunity.sellExchange,
        opportunity.symbol,
        opportunity.quantity,
        opportunity.sellPrice
      );
      const sellOrderTime = Date.now() - sellOrderStart;
      logger.info(`Sell order executed in ${sellOrderTime}ms`);

      if (!sellOrder || !sellOrder.id) {
        throw new Error('Sell order failed');
      }

      // Step 4: Wait for sell order confirmation
      const sellConfirmed = await this.waitForOrderConfirmation(
        opportunity.sellExchange,
        sellOrder.id,
        opportunity.symbol,
        this.executionTimeout / 2
      );

      if (!sellConfirmed) {
        // If sell failed, try to sell on original exchange or manual recovery
        logger.error('Sell order confirmation timeout - initiating recovery');
        await this.handleTradeFailure(opportunity, buyOrder, sellOrder);
        throw new Error('Sell order confirmation timeout');
      }

      const totalExecutionTime = Date.now() - startTime;

      const result = {
        success: true,
        buyOrder,
        sellOrder,
        executionTimeMs: totalExecutionTime,
        profitUSDT: opportunity.grossProfit,
        profitPercentage: opportunity.profitPercentage,
      };

      logger.info(
        `Trade completed successfully in ${totalExecutionTime}ms with profit: $${opportunity.grossProfit.toFixed(2)}`
      );

      this.detector.recordExecutedTrade(opportunity, result);
      this.activePositions.push({
        ...opportunity,
        buyOrder,
        sellOrder,
        executedAt: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error('Trade execution failed:', error.message);
      return {
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Wait for order confirmation with timeout
   */
  async waitForOrderConfirmation(exchange, orderId, symbol, timeout) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const order = await this.exchangeManager.exchanges[exchange].fetchOrder(orderId, symbol);

        if (order.status === 'closed') {
          logger.debug(`Order ${orderId} confirmed on ${exchange}`);
          return true;
        }

        if (order.status === 'canceled' || order.status === 'rejected') {
          logger.warn(`Order ${orderId} was ${order.status}`);
          return false;
        }

        // Wait a short time before checking again
        await this.sleep(10); // 10ms sleep for microsecond-level responsiveness
      } catch (error) {
        logger.warn(`Error checking order ${orderId}:`, error.message);
        await this.sleep(10);
      }
    }

    logger.warn(`Order confirmation timeout for ${orderId}`);
    return false;
  }

  /**
   * Handle failed trades with recovery strategy
   */
  async handleTradeFailure(opportunity, buyOrder, sellOrder) {
    logger.error('Handling trade failure - attempting recovery');

    try {
      // Try to sell the position on the same exchange it was bought
      if (buyOrder && buyOrder.status === 'closed') {
        logger.info('Position acquired, attempting recovery sell...');
        const recoveryResult = await this.exchangeManager.placeSellOrder(
          opportunity.buyExchange,
          opportunity.symbol,
          opportunity.quantity,
          opportunity.buyPrice // Sell at at least breakeven
        );
        logger.info('Recovery sell initiated:', recoveryResult.id);
      }
    } catch (error) {
      logger.error('Recovery failed:', error.message);
    }
  }

  /**
   * Execute batch arbitrage on multiple opportunities
   */
  async executeBatch(opportunities) {
    const maxPositions = config.trading.maxPositions;
    const availableSlots = maxPositions - this.activePositions.length;
    const toExecute = opportunities.slice(0, availableSlots);

    logger.info(`Executing batch of ${toExecute.length} trades (${availableSlots} slots available)`);

    // Execute trades in parallel with rate limiting
    const results = [];
    for (const opportunity of toExecute) {
      const result = await this.executeArbitrage(opportunity);
      results.push(result);
      await this.sleep(50); // 50ms delay between trades to avoid rate limiting
    }

    return results;
  }

  /**
   * Monitor active positions and close them if needed
   */
  async monitorPositions() {
    for (let i = this.activePositions.length - 1; i >= 0; i--) {
      const position = this.activePositions[i];
      const ageMs = Date.now() - position.executedAt;

      // Remove position if older than 1 hour
      if (ageMs > 3600000) {
        logger.info(`Removing old position: ${position.symbol}`);
        this.activePositions.splice(i, 1);
      }
    }
  }

  getStats() {
    return {
      activePositions: this.activePositions.length,
      pendingOrders: this.pendingOrders.length,
      detectorStats: this.detector.getStats(),
    };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = TradeExecutor;