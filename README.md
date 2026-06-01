# Crypto Arbitrage Trading Bot

A high-frequency cryptocurrency arbitrage bot that detects price discrepancies across multiple exchanges in microseconds and executes profitable trades with micro positions.

## 🚀 Features

- **Microsecond-Level Detection**: Scans for arbitrage opportunities every 50ms
- **Multi-Exchange Support**: Integrates with Binance, Kraken, Coinbase, and more
- **Rapid Trade Execution**: Executes buy/sell orders within 100ms timeout window
- **Micro-Position Trading**: Works with configurable position sizes (default: $100 USDT)
- **Position Management**: Tracks active positions and manages risk exposure
- **Real-time Monitoring**: Continuous monitoring of prices, orders, and positions
- **Profit Optimization**: Automatic filtering based on profit threshold (minimum 0.5%)
- **Error Recovery**: Handles failed orders with graceful recovery mechanisms

## 📋 Prerequisites

- Node.js v14 or higher
- npm or yarn
- API keys for exchanges (Binance, Kraken, Coinbase)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/Codesurfing10/riding-waves-.git
cd riding-waves-
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API credentials
```

## 📝 Configuration

Edit `.env` file with your settings:

```env
# Exchange API Credentials
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret

# Trading Parameters
MIN_PROFIT_PERCENTAGE=0.5        # Minimum profit threshold
POSITION_SIZE_USDT=100           # Size of each position in USDT
MAX_POSITIONS=10                 # Maximum concurrent positions
EXECUTION_TIMEOUT_MS=100         # Max time to execute trades

# Monitoring
LOG_LEVEL=info
ENABLE_ALERTS=true
```

## 🏃 Running the Bot

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📊 How It Works

### 1. Price Monitoring
- Fetches ticker data from multiple exchanges every 100ms
- Maintains real-time cache of bid/ask prices
- Handles rate limiting for API requests

### 2. Opportunity Detection
- Scans all exchange pairs every 50ms
- Calculates potential profit considering:
  - Buy price (ask) on exchange A
  - Sell price (bid) on exchange B
  - Exchange fees (0.1% default)
- Filters by minimum profit threshold

### 3. Trade Execution
- Executes buy order on first exchange
- Waits for confirmation (10ms polling, 50ms timeout)
- Simultaneously executes sell order on second exchange
- Total execution time: typically 50-100ms

### 4. Position Management
- Tracks active positions
- Monitors order status
- Implements recovery for failed trades
- Archives closed positions

### 5. Monitoring & Reporting
- Real-time statistics every 5 seconds
- Logs all trades with timestamps and profits
- Tracks cumulative performance metrics

## 📈 Architecture

```
src/
├── config/
│   └── config.js              # Configuration management
├── exchanges/
│   └── exchangeManager.js      # Multi-exchange API wrapper
├── arbitrage/
│   └── detector.js            # Opportunity detection engine
├── trading/
│   └── executor.js            # Trade execution engine
├── utils/
│   └── logger.js              # Logging utility
└── index.js                   # Main bot orchestrator
```

## 🎯 Performance Metrics

The bot tracks and reports:
- **Execution Time**: Time to complete full trade cycle
- **Profit Per Trade**: USD and percentage gains
- **Success Rate**: Percentage of successful trades
- **Active Positions**: Number of open trades
- **Total Profit**: Cumulative gains since startup

## ⚠️ Risk Management

- **Max Positions**: Prevents over-leverage
- **Position Sizing**: Fixed micro-positions to limit exposure
- **Timeout Protection**: Cancels orders if execution takes too long
- **Error Recovery**: Gracefully handles failed orders
- **Fee Accounting**: Factored into profit calculations

## 🔐 Security

- API credentials stored in `.env` (never commit to repo)
- Rate limiting to respect exchange limits
- Order validation before execution
- Timeout protection on all API calls

## 📚 API Integrations

### Supported Exchanges
- **Binance**: REST API + WebSocket support
- **Kraken**: REST API with rate limiting
- **Coinbase**: REST API integration

### CCXT Library
Uses the CCXT library for unified exchange API access:
- Consistent API across exchanges
- Built-in rate limiting
- Automatic retry logic

## 🚨 Troubleshooting

### Bot won't start
- Check `.env` file is properly configured
- Verify API keys are correct
- Ensure network connectivity

### No opportunities detected
- Increase `MIN_PROFIT_PERCENTAGE` threshold
- Check exchange fees are correctly factored
- Verify price data is being fetched

### Failed orders
- Check account balance on exchanges
- Verify trading pairs are available
- Review exchange-specific trading restrictions

## 📝 Logging

Logs are output with timestamps and levels:
```
[2026-06-01T12:00:00] INFO: Buy order executed in 15ms
[2026-06-01T12:00:00] INFO: Sell order executed in 12ms
[2026-06-01T12:00:00] INFO: Trade completed successfully in 45ms
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## ⚡ Performance Tips

1. **Reduce Price Update Interval**: Lower from 100ms for faster detection
2. **Increase Symbol Count**: Monitor more pairs for more opportunities
3. **Optimize Network**: Use server close to exchange data centers
4. **Monitor Latency**: Track and minimize order execution time
5. **Tune Profit Threshold**: Balance between opportunity frequency and profitability

## 🎓 Educational Note

This bot is for educational purposes. Actual trading involves significant financial risk. Start with small positions and thoroughly test on exchange testnets before deploying with real funds.

## 📧 Support

For issues, questions, or suggestions, please open a GitHub issue.

---

**Built with ❤️ for crypto traders**