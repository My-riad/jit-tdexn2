/**
 * Jest configuration for the AI-driven Freight Optimization Platform backend services.
 * This configuration sets up Jest to work with TypeScript and provides consistent
 * test settings across all microservices.
 *
 * @see https://jestjs.io/docs/configuration
 */
import type { Config } from 'jest'; // jest version ^29.6.1

const config: Config = {
  // Use ts-jest preset for TypeScript testing
  preset: 'ts-jest',
  
  // Use Node.js as the test environment
  testEnvironment: 'node',
  
  // Specify the directories to search for test files
  roots: [
    '<rootDir>/src',
    '<rootDir>/tests',
    '<rootDir>/*/src',  // For monorepo structure
    '<rootDir>/*/tests' // For monorepo structure
  ],
  
  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Set up module aliases for easier imports
  moduleNameMapper: {
    // Root level imports
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Common module imports
    '^@common/(.*)$': '<rootDir>/common/$1',
    
    // Service-specific imports
    '^@api-gateway/(.*)$': '<rootDir>/api-gateway/src/$1',
    '^@auth-service/(.*)$': '<rootDir>/auth-service/src/$1',
    '^@driver-service/(.*)$': '<rootDir>/driver-service/src/$1',
    '^@load-service/(.*)$': '<rootDir>/load-service/src/$1',
    '^@load-matching-service/(.*)$': '<rootDir>/load-matching-service/src/$1',
    '^@gamification-service/(.*)$': '<rootDir>/gamification-service/src/$1',
    '^@tracking-service/(.*)$': '<rootDir>/tracking-service/src/$1',
    '^@market-intelligence-service/(.*)$': '<rootDir>/market-intelligence-service/src/$1',
    '^@notification-service/(.*)$': '<rootDir>/notification-service/src/$1',
    '^@integration-service/(.*)$': '<rootDir>/integration-service/src/$1',
    '^@cache-service/(.*)$': '<rootDir>/cache-service/src/$1',
    '^@data-service/(.*)$': '<rootDir>/data-service/src/$1',
    '^@event-bus/(.*)$': '<rootDir>/event-bus/src/$1',
    '^@optimization-engine/(.*)$': '<rootDir>/optimization-engine/src/$1'
  },
  
  // File extensions to consider when looking for imports
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.d.ts',
    '!**/tests/**'
  ],
  
  // Coverage thresholds to enforce
  coverageThreshold: {
    // Global thresholds
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Higher thresholds for common code which should be highly tested
    './src/common/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // API Gateway thresholds
    './src/api-gateway/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Patterns to match test files
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],
  
  // Patterns to ignore when looking for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Setup files to run after Jest is loaded
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Watch plugins for better developer experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Show verbose output
  verbose: true
};

export default config;