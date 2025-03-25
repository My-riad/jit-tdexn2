/**
 * A centralized logging utility for the web applications of the AI-driven Freight Optimization Platform.
 * Provides standardized logging capabilities with different log levels, contextual information,
 * and browser-specific adaptations to facilitate debugging and monitoring in web environments.
 */

/**
 * Enum for log levels in order of severity
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

/**
 * Configuration options for the logger
 */
export interface LoggerOptions {
  level?: string;
  prefix?: string;
  enableConsole?: boolean;
  enableRemote?: boolean;
  remoteEndpoint?: string;
}

/**
 * Additional metadata for log entries
 */
export interface LogMetadata {
  component?: string;
  requestId?: string;
  userId?: string;
  error?: Error;
  [key: string]: any;
}

/**
 * Logger interface with standard logging methods
 */
export interface Logger {
  error(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
  verbose(message: string, metadata?: LogMetadata): void;
  getLogLevel(): string;
  setLogLevel(level: string): void;
}

// Global configuration variables
const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEVELOPMENT = NODE_ENV === 'development';

// Internal log level mapping for comparisons
const LOG_LEVEL_PRIORITIES: Record<string, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
  [LogLevel.VERBOSE]: 4
};

/**
 * Formats log messages with consistent structure and metadata
 * @param message The log message
 * @param metadata Additional contextual information
 * @returns Formatted log object with message and metadata
 */
export function formatLogMessage(message: string, metadata: LogMetadata = {}): Record<string, any> {
  const timestamp = new Date().toISOString();
  const formattedLog: Record<string, any> = {
    timestamp,
    message
  };

  // Add component name if available
  if (metadata.component) {
    formattedLog.component = metadata.component;
  }

  // Add request ID if available for request tracing
  if (metadata.requestId) {
    formattedLog.requestId = metadata.requestId;
  }

  // Add user ID if available
  if (metadata.userId) {
    formattedLog.userId = metadata.userId;
  }

  // Add error information if available
  if (metadata.error) {
    formattedLog.errorMessage = metadata.error.message;
    formattedLog.stack = metadata.error.stack;
  }

  // Add any remaining metadata fields
  Object.keys(metadata).forEach(key => {
    if (!['component', 'requestId', 'userId', 'error'].includes(key)) {
      formattedLog[key] = metadata[key];
    }
  });

  return formattedLog;
}

/**
 * Creates and configures a logger instance with appropriate methods for web applications
 * @param options Configuration options for the logger
 * @returns Configured logger instance
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  let currentLogLevel = options.level || LOG_LEVEL;
  const prefix = options.prefix ? `[${options.prefix}] ` : '';
  const enableConsole = options.enableConsole !== undefined ? options.enableConsole : true;
  const enableRemote = options.enableRemote !== undefined ? options.enableRemote : false;
  const remoteEndpoint = options.remoteEndpoint || '';

  // Helper to check if a log level should be displayed
  const shouldLog = (level: string): boolean => {
    const currentPriority = LOG_LEVEL_PRIORITIES[currentLogLevel.toLowerCase()] || LOG_LEVEL_PRIORITIES[LogLevel.INFO];
    const levelPriority = LOG_LEVEL_PRIORITIES[level.toLowerCase()] || LOG_LEVEL_PRIORITIES[LogLevel.INFO];
    return levelPriority <= currentPriority;
  };

  // Helper to get clean metadata for console output
  const getConsoleMetadata = (metadata: LogMetadata): any => {
    // Don't show anything if there's no metadata
    if (!metadata || Object.keys(metadata).length === 0) {
      return '';
    }
    
    // In development, show more details but filter out error object to avoid circular references
    if (IS_DEVELOPMENT) {
      const { error, ...rest } = metadata;
      return Object.keys(rest).length > 0 ? rest : '';
    }
    
    // In production, only show essential info
    const { component, requestId, userId } = metadata;
    const essentialInfo: Record<string, any> = {};
    
    if (component) essentialInfo.component = component;
    if (requestId) essentialInfo.requestId = requestId;
    if (userId) essentialInfo.userId = userId;
    
    return Object.keys(essentialInfo).length > 0 ? essentialInfo : '';
  };

  // Helper to send logs to a remote endpoint
  const sendRemoteLog = async (level: string, formattedLog: Record<string, any>): Promise<void> => {
    if (!enableRemote || !remoteEndpoint) return;

    try {
      await fetch(remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          ...formattedLog,
        }),
        // Don't block the UI for log sending
        keepalive: true,
      });
    } catch (err) {
      // Don't use the logger here to avoid infinite loops
      if (enableConsole && IS_DEVELOPMENT) {
        console.error('Failed to send log to remote endpoint:', err);
      }
    }
  };

  // Create the logger instance
  const logger: Logger = {
    /**
     * Logs an error message with optional metadata
     * @param message The error message
     * @param metadata Additional contextual information
     */
    error(message: string, metadata: LogMetadata = {}): void {
      const formattedLog = formatLogMessage(message, metadata);
      if (enableConsole) {
        const consoleMetadata = getConsoleMetadata(metadata);
        console.error(`${prefix}ERROR:`, formattedLog.message, consoleMetadata);
        
        // In development, include full stack trace if available
        if (IS_DEVELOPMENT && metadata.error && metadata.error.stack) {
          console.error(metadata.error.stack);
        }
      }
      
      // Always send error logs to remote endpoint if enabled
      if (enableRemote) {
        sendRemoteLog(LogLevel.ERROR, formattedLog);
      }
    },

    /**
     * Logs a warning message with optional metadata
     * @param message The warning message
     * @param metadata Additional contextual information
     */
    warn(message: string, metadata: LogMetadata = {}): void {
      if (!shouldLog(LogLevel.WARN)) return;

      const formattedLog = formatLogMessage(message, metadata);
      if (enableConsole) {
        const consoleMetadata = getConsoleMetadata(metadata);
        console.warn(`${prefix}WARN:`, formattedLog.message, consoleMetadata);
      }
      
      if (enableRemote) {
        sendRemoteLog(LogLevel.WARN, formattedLog);
      }
    },

    /**
     * Logs an informational message with optional metadata
     * @param message The informational message
     * @param metadata Additional contextual information
     */
    info(message: string, metadata: LogMetadata = {}): void {
      if (!shouldLog(LogLevel.INFO)) return;

      const formattedLog = formatLogMessage(message, metadata);
      if (enableConsole) {
        const consoleMetadata = getConsoleMetadata(metadata);
        console.info(`${prefix}INFO:`, formattedLog.message, consoleMetadata);
      }
      
      if (enableRemote) {
        sendRemoteLog(LogLevel.INFO, formattedLog);
      }
    },

    /**
     * Logs a debug message with optional metadata
     * @param message The debug message
     * @param metadata Additional contextual information
     */
    debug(message: string, metadata: LogMetadata = {}): void {
      if (!shouldLog(LogLevel.DEBUG)) return;

      const formattedLog = formatLogMessage(message, metadata);
      if (enableConsole) {
        const consoleMetadata = getConsoleMetadata(metadata);
        console.debug(`${prefix}DEBUG:`, formattedLog.message, consoleMetadata);
      }
      
      if (enableRemote) {
        sendRemoteLog(LogLevel.DEBUG, formattedLog);
      }
    },

    /**
     * Logs a verbose message with optional metadata
     * @param message The verbose message
     * @param metadata Additional contextual information
     */
    verbose(message: string, metadata: LogMetadata = {}): void {
      if (!shouldLog(LogLevel.VERBOSE)) return;

      const formattedLog = formatLogMessage(message, metadata);
      if (enableConsole) {
        const consoleMetadata = getConsoleMetadata(metadata);
        console.log(`${prefix}VERBOSE:`, formattedLog.message, consoleMetadata);
      }
      
      if (enableRemote) {
        sendRemoteLog(LogLevel.VERBOSE, formattedLog);
      }
    },

    /**
     * Gets the current log level
     * @returns Current log level
     */
    getLogLevel(): string {
      return currentLogLevel;
    },

    /**
     * Sets the log level
     * @param level New log level
     */
    setLogLevel(level: string): void {
      const normalizedLevel = level.toLowerCase();
      const validLogLevels = Object.values(LogLevel);
      
      if (validLogLevels.includes(normalizedLevel as LogLevel)) {
        currentLogLevel = normalizedLevel;
        if (enableConsole && shouldLog(LogLevel.INFO)) {
          console.log(`${prefix}Log level set to ${level}`);
        }
      } else {
        if (enableConsole) {
          console.error(`${prefix}Invalid log level: ${level}. Using ${currentLogLevel} instead.`);
        }
      }
    }
  };

  return logger;
}

// Create default logger instance
const defaultLogger = createLogger();

// Export the default logger instance and utility functions
export default defaultLogger;