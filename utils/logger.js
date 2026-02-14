/**
 * Structured Logger using Winston
 * Replaces raw console.log/error/warn throughout the application
 */
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? format.json()
      : format.combine(format.colorize(), format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        }))
  ),
  transports: [
    new transports.Console()
  ],
  silent: process.env.NODE_ENV === 'test'
});

module.exports = logger;
