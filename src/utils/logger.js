const pino = require('pino');
const config = require('../config/config');

const logger = pino({
  level: config.monitoring.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

module.exports = logger;