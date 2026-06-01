const logger = require('../utils/logger');
const config = require('../config/config');

class ArbitrageDetector {
  constructor(exchangeManager) {
    this.exchangeManager = exchangeManager;
    this.opportunities = [];
    this.executedTrades = [];
    this.profitThreshold = config.trading.minProfitPercentage;
  }

  /**
   * Detect arbitrage opportunities across exchanges
   * @param {Array} symbols - Trading pairs to analyze
   * @returns {Array} Array of arbitrage opportunities
   */
  async detectOpportunities(symbols) {
    const prices = this.exchangeManager.getPriceCache();
    const opportunities = [];

    if (Object.keys(prices).length === 0) {
      return opportunities;
    }

    // Compare prices across all exchange pairs
    const exchanges = Object.keys(prices);

    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        const exchange1 = exchanges[i];
        const exchange2 = exchanges[j];

        for (const symbol of symbols) {
          const price1 = prices[exchange1][symbol];
          const price2 = prices[exchange2][symbol];

          if (!price1 || !price2) continue;

          // Check for buy on exchange1 and sell on exchange2
          const opportunity1 = this.calculateArbitrage(
            symbol,
            exchange1,
            exchange2,
            price1.ask, // Buy at asking price
            price2.bid  // Sell at bidding price
          );

          if (opportunity1 && opportunity1.profitPercentage >= this.profitThreshold) {
            opportunity1.timestamp = Date.now();
            opportunities.push(opportunity1);
            logger.info(`Arbitrage detected: ${opportunity1.symbol} (${opportunity1.profitPercentage.toFixed(3)}%)`);
          }

          // Check for buy on exchange2 and sell on exchange1
          const opportunity2 = this.calculateArbitrage(
            symbol,
            exchange2,
            exchange1,
            price2.ask,
            price1.bid
          );

          if (opportunity2 && opportunity2.profitPercentage >= this.profitThreshold) {
            opportunity2.timestamp = Date.now();
            opportunities.push(opportunity2);
            logger.info(`Arbitrage detected: ${opportunity2.symbol} (${opportunity2.profitPercentage.toFixed(3)}%)`);
          }
        }
      }
    }

    this.opportunities = opportunities;
    return opportunities;
  }

  /**
   * Calculate potential profit from arbitrage
   */
  calculateArbitrage(symbol, buyExchange, sellExchange, buyPrice, sellPrice) {
    if (buyPrice >= sellPrice) {
      return null; // No profit opportunity
    }

    const positionSize = config.trading.positionSizeUSDT;
    const quantity = positionSize / buyPrice;

    const buyFee = quantity * buyPrice * 0.001; // 0.1% fee assumption
    const sellFee = quantity * sellPrice * 0.001;
    const totalCost = positionSize + buyFee;
    const totalRevenue = quantity * sellPrice - sellFee;
    const grossProfit = totalRevenue - totalCost;
    const profitPercentage = (grossProfit / totalCost) * 100;

    if (profitPercentage <= 0) {
      return null;
    }

    return {
      symbol,
      buyExchange,
      sellExchange,
      buyPrice,
      sellPrice,
      quantity,
      positionSize,
      grossProfit,
      profitPercentage,
      estimatedGasFeesUSDT: 0, // For DEX trades
    };
  }

  /**
   * Filter opportunities by profitability and feasibility
   */
  filterOpportunities(opportunities, minProfit = this.profitThreshold) {
    return opportunities.filter(
      (opp) =>
        opp.profitPercentage >= minProfit &&
        opp.quantity > 0 &&
        opp.grossProfit > 0
    );
  }

  /**
   * Get top opportunities sorted by profit
   */
  getTopOpportunities(limit = 5) {
    return this.opportunities
      .sort((a, b) => b.profitPercentage - a.profitPercentage)
      .slice(0, limit);
  }

  recordExecutedTrade(opportunity, result) {
    const trade = {
      ...opportunity,
      executedAt: Date.now(),
      result,
      status: result.success ? 'success' : 'failed',
    };
    this.executedTrades.push(trade);
    return trade;
  }

  getStats() {
    const stats = {
      totalOpportunities: this.opportunities.length,
      executedTrades: this.executedTrades.length,
      successfulTrades: this.executedTrades.filter((t) => t.status === 'success').length,
      totalProfit: this.executedTrades.reduce((sum, t) => sum + (t.grossProfit || 0), 0),
      averageProfitPerTrade:
        this.executedTrades.length > 0
          ? this.executedTrades.reduce((sum, t) => sum + (t.profitPercentage || 0), 0) /
            this.executedTrades.length
          : 0,
    };
    return stats;
  }
}

module.exports = ArbitrageDetector;