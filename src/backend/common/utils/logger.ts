import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file'; // winston-daily-rotate-file@4.7.1

// Global variables/constants from environment
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || './logs';

/**
 * Creates and configures a Winston logger instance with appropriate transports and formats
 * @returns Configured Winston logger instance
 */
export const createLogger = (): winston.Logger => {
  // Define custom format for development logs
  // This format makes logs more readable in the console during development
  const developmentFormat = winston.format.printf(({ level, message, timestamp, ...rest }) => {
    const metadata = Object.keys(rest).length > 0 
      ? `\n${JSON.stringify(rest, null, 2)}` 
      : '';
    return `${timestamp} ${level}: ${message}${metadata}`;
  });

  // Define the console format based on environment
  // Development: Colorized, readable format
  // Production/others: JSON format for machine parsing
  const consoleFormat = NODE_ENV === 'development' 
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        developmentFormat
      )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      );

  // Create the logger instance with base configuration
  const logger = winston.createLogger({
    level: LOG_LEVEL, // Set from environment or default to 'info'
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: 'freight-optimization-platform' }, // Tag all logs with service name
    transports: [
      // Console transport with environment-appropriate format
      new winston.transports.Console({
        format: consoleFormat
      })
    ]
  });

  // Add file transports in non-test environments
  if (NODE_ENV !== 'test') {
    // Main log file with daily rotation
    // This captures all log levels for comprehensive logging
    logger.add(
      new DailyRotateFile({
        filename: `${LOG_FILE_PATH}/application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true, // Compress older logs
        maxSize: '20m', // Rotate when file reaches this size
        maxFiles: '14d' // Keep logs for 14 days
      })
    );

    // Error log file for errors only
    // This isolates errors for easier monitoring and alerting
    logger.add(
      new DailyRotateFile({
        filename: `${LOG_FILE_PATH}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error', // Only capture error level logs
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d' // Keep error logs longer (30 days)
      })
    );
  }

  return logger;
};

/**
 * Formats log messages with consistent structure and metadata
 * This function ensures that all logs have a consistent format with required fields
 * @param message The log message
 * @param metadata Additional metadata to include in the log
 * @returns Formatted log object with message and metadata
 */
const formatLogMessage = (message: string, metadata: Record<string, any> = {}): Record<string, any> => {
  const formattedMetadata: Record<string, any> = { ...metadata };
  
  // Add request ID for request tracing if available
  if (metadata.requestId) {
    formattedMetadata.requestId = metadata.requestId;
  }
  
  // Add user ID for audit logs if available
  if (metadata.userId) {
    formattedMetadata.userId = metadata.userId;
  }
  
  // Add correlation ID for distributed tracing if available
  if (metadata.correlationId) {
    formattedMetadata.correlationId = metadata.correlationId;
  }
  
  // For error objects, extract stack trace and other properties
  if (metadata.error instanceof Error) {
    formattedMetadata.errorName = metadata.error.name;
    formattedMetadata.errorStack = metadata.error.stack;
    formattedMetadata.errorMessage = metadata.error.message;
    // Remove the original error object to avoid circular references
    delete formattedMetadata.error;
  }
  
  return formattedMetadata;
};

// Create the default logger instance
const logger = createLogger();

// Export the default logger instance with standard methods
export default {
  /**
   * Log an error message
   * @param message The error message
   * @param metadata Additional metadata to include in the log
   */
  error: (message: string, metadata: Record<string, any> = {}) => {
    logger.error(message, formatLogMessage(message, metadata));
  },

  /**
   * Log a warning message
   * @param message The warning message
   * @param metadata Additional metadata to include in the log
   */
  warn: (message: string, metadata: Record<string, any> = {}) => {
    logger.warn(message, formatLogMessage(message, metadata));
  },

  /**
   * Log an info message
   * @param message The info message
   * @param metadata Additional metadata to include in the log
   */
  info: (message: string, metadata: Record<string, any> = {}) => {
    logger.info(message, formatLogMessage(message, metadata));
  },

  /**
   * Log a debug message
   * @param message The debug message
   * @param metadata Additional metadata to include in the log
   */
  debug: (message: string, metadata: Record<string, any> = {}) => {
    logger.debug(message, formatLogMessage(message, metadata));
  },

  /**
   * Log a verbose message
   * @param message The verbose message
   * @param metadata Additional metadata to include in the log
   */
  verbose: (message: string, metadata: Record<string, any> = {}) => {
    logger.verbose(message, formatLogMessage(message, metadata));
  }
};