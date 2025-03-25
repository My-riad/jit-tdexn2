import type { Config } from '@jest/types'; // v29.5.0

/**
 * Root Jest configuration for the web applications of the AI-driven Freight Optimization Platform.
 * This configuration serves as the base for carrier and shipper portal testing.
 */
const config: Config.InitialOptions = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Use jsdom for testing React components
  testEnvironment: 'jsdom',
  
  // Root directory for the web applications
  rootDir: './',
  
  // Setup files that run after the testing framework is installed
  setupFilesAfterEnv: ['<rootDir>/shared/tests/setupTests.ts'],
  
  // Module path aliases and file mocks
  moduleNameMapper: {
    // Alias mappings for common and shared code
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    
    // Mock CSS and style imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Mock asset imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/shared/tests/mocks/fileMock.ts'
  },
  
  // TypeScript transformation configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  
  // Test file patterns to match
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'common/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds to ensure quality metrics
  coverageThreshold: {
    // Global thresholds
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Higher thresholds for shared components as they're used across applications
    './shared/components/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Extensions to consider when resolving modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Patterns to ignore when searching for test files
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
  
  // Watch plugins for improved developer experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Global settings for ts-jest
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/tsconfig.json'
    }
  },
  
  // Reset/restore/clear mocks automatically between tests
  resetMocks: true,
  restoreMocks: true,
  clearMocks: true,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Project references for multi-project setup
  projects: [
    '<rootDir>/carrier-portal/jest.config.ts',
    '<rootDir>/shipper-portal/jest.config.ts'
  ]
};

export default config;