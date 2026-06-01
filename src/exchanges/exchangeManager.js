const ccxt = require('ccxt');
const logger = require('../utils/logger');
const config = require('../config/config');

class ExchangeManager {
  constructor() {
    this.exchanges = {};
    this.priceCache = new Map();
    this.lastPriceUpdate = {};
    this.initializeExchanges();
  }

  initializeExchanges() {
    try {
      // Initialize Binance
      this.exchanges.binance = new ccxt.binance({
        apiKey: config.exchanges.binance.apiKey,
        secret: config.exchanges.binance.secret,
        enableRateLimit: true,
        rateLimit: config.exchanges.binance.rateLimit,
      });

      // Initialize Kraken
      this.exchanges.kraken = new ccxt.kraken({
        apiKey: config.exchanges.kraken.apiKey,
        secret: config.exchanges.kraken.secret,
        enableRateLimit: true,
        rateLimit: config.exchanges.kraken.rateLimit,
      });

      // Initialize Coinbase
      this.exchanges.coinbase = new ccxt.coinbase({
        apiKey: config.exchanges.coinbase.apiKey,
        secret: config.exchanges.coinbase.secret,
        enableRateLimit: true,
        rateLimit: config.exchanges.coinbase.rateLimit,
      });

      logger.info('All exchanges initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize exchanges:', error);
      throw error;
    }
  }

  async fetchPrices(symbols) {
    const prices = {};
    const now = Date.now();

    // Fetch prices from all exchanges in parallel
    const promises = Object.entries(this.exchanges).map(async ([name, exchange]) => {
      try {
        const result = {};
        for (const symbol of symbols) {
          const ticker = await exchange.fetchTicker(symbol);
          result[symbol] = {
            exchange: name,
            bid: ticker.bid,
            ask: ticker.ask,
            mid: (ticker.bid + ticker.ask) / 2,
            timestamp: now,
          };
        }
        return [name, result];
      } catch (error) {
        logger.warn(`Error fetching prices from ${name}:`, error.message);
        return [name, {}];
      }
    });

    const results = await Promise.all(promises);

    for (const [exchange, exchangePrices] of results) {
      prices[exchange] = exchangePrices;
    }

    this.priceCache = prices;
    this.lastPriceUpdate = now;

    return prices;
  }

  async getOrderBook(exchange, symbol, limit = 10) {
    try {
      if (!this.exchanges[exchange]) {
        throw new Error(`Exchange ${exchange} not found`);
      }
      const orderbook = await this.exchanges[exchange].fetchOrderBook(symbol, limit);
      return orderbook;
    } catch (error) {
      logger.error(`Error fetching order book from ${exchange}:`, error.message);
      throw error;
    }
  }

  async placeBuyOrder(exchange, symbol, amount, price) {
    try {
      const order = await this.exchanges[exchange].createLimitBuyOrder(symbol, amount, price);
      logger.info(`Buy order placed on ${exchange}:`, order);
      return order;
    } catch (error) {
      logger.error(`Error placing buy order on ${exchange}:`, error.message);
      throw error;
    }
  }

  async placeSellOrder(exchange, symbol, amount, price) {
    try {
      const order = await this.exchanges[exchange].createLimitSellOrder(symbol, amount, price);
      logger.info(`Sell order placed on ${exchange}:`, order);
      return order;
    } catch (error) {
      logger.error(`Error placing sell order on ${exchange}:`, error.message);
      throw error;
    }
  }

  async cancelOrder(exchange, orderId, symbol) {
    try {
      const result = await this.exchanges[exchange].cancelOrder(orderId, symbol);
      logger.info(`Order ${orderId} cancelled on ${exchange}`);
      return result;
    } catch (error) {
      logger.error(`Error cancelling order on ${exchange}:`, error.message);
      throw error;
    }
  }

  async getBalance(exchange) {
    try {
      const balance = await this.exchanges[exchange].fetchBalance();
      return balance;
    } catch (error) {
      logger.error(`Error fetching balance from ${exchange}:`, error.message);
      throw error;
    }
  }

  getPriceCache() {
    return this.priceCache;
  }
}

module.exports = ExchangeManager;