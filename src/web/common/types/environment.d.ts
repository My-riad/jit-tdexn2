/**
 * Environment variable type definitions for the AI-driven Freight Optimization Platform
 * These types extend the NodeJS.ProcessEnv interface to provide type safety
 * when accessing environment variables through process.env
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // Core environment configuration
    NODE_ENV: 'development' | 'test' | 'staging' | 'production';
    REACT_APP_ENVIRONMENT: 'development' | 'test' | 'staging' | 'production';
    REACT_APP_VERSION: string;
    
    // API Configuration
    REACT_APP_API_BASE_URL: string;
    REACT_APP_WEBSOCKET_URL: string;
    REACT_APP_API_TIMEOUT: string; // Milliseconds as string, to be parsed with parseInt
    REACT_APP_MAX_RETRY_ATTEMPTS: string; // Number as string, to be parsed with parseInt
    
    // Third-party Service Keys
    REACT_APP_MAPBOX_API_KEY: string; // v2.15+ as per Technical Specifications
    REACT_APP_SENTRY_DSN: string;
    REACT_APP_GOOGLE_ANALYTICS_ID: string;
    
    // Firebase Configuration
    REACT_APP_FIREBASE_API_KEY: string;
    REACT_APP_FIREBASE_AUTH_DOMAIN: string;
    REACT_APP_FIREBASE_PROJECT_ID: string;
    REACT_APP_FIREBASE_APP_ID: string;
    
    // Feature Flags (stored as strings but represent boolean values)
    REACT_APP_FEATURE_RELAY_PLANNING: 'true' | 'false';
    REACT_APP_FEATURE_SMART_HUBS: 'true' | 'false';
    REACT_APP_FEATURE_BONUS_ZONES: 'true' | 'false';
    REACT_APP_FEATURE_LOAD_AUCTIONS: 'true' | 'false';
    
    // Logging Configuration
    REACT_APP_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  }
}