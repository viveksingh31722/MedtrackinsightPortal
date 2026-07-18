import winston from 'winston';
import 'winston-daily-rotate-file';

// Define RFC 5424 severity levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine default log level based on Node environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define color mappings for dev console logging
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Log format configuration for console output (pretty printing)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

// Log format configuration for persistent rotating files (structured JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Define log transports targets
const transports: winston.transport[] = [
  // 1. Console Transport (Writes logs to stdout/stderr)
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // 2. Rotating File Transport for errors (Writes JSON error logs to logs/error-YYYY-MM-DD.log)
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
  }),

  // 3. Rotating File Transport for all events (Writes JSON combined logs to logs/combined-YYYY-MM-DD.log)
  new winston.transports.DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
  }),
];

// Create Winston logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

export default logger;
export { logger };
