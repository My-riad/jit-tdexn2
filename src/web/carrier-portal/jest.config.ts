import type { Config } from '@jest/types'; // v29.5.0
import baseConfig from '../jest.config';

/**
 * Jest configuration for the carrier management portal of the AI-driven Freight Optimization Platform.
 * Extends the base web configuration with carrier portal specific settings.
 */
const config: Config.InitialOptions = {
  // Identification for this test suite
  displayName: 'carrier-portal',
  
  // Root directory relative to the repository
  rootDir: '../../',
  
  // Locations of carrier portal test files
  roots: ['<rootDir>/carrier-portal/src'],
  
  // Carrier portal specific test setup file
  setupFilesAfterEnv: ['<rootDir>/carrier-portal/src/setupTests.ts'],
  
  // Test file patterns specific to carrier portal
  testMatch: [
    '<rootDir>/carrier-portal/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/carrier-portal/src/**/*.test.{ts,tsx}'
  ],
  
  // Module path mappings specific to carrier portal
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/carrier-portal/src/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/shared/tests/mocks/fileMock.ts'
  },
  
  // TypeScript transformation with carrier portal's tsconfig
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/carrier-portal/tsconfig.json' }]
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    '<rootDir>/carrier-portal/src/**/*.{ts,tsx}',
    '!<rootDir>/carrier-portal/src/**/*.d.ts',
    '!<rootDir>/carrier-portal/src/index.tsx',
    '!<rootDir>/carrier-portal/src/setupTests.ts',
    '!<rootDir>/carrier-portal/src/**/*.stories.{ts,tsx}'
  ],
  
  // Coverage thresholds according to project requirements
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Testing environment
  testEnvironment: 'jsdom',
  
  // Extensions to consider when resolving modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Patterns to ignore when searching for test files
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
  
  // Watch plugins for improved developer experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Override ts-jest globals to use the carrier portal's tsconfig
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/carrier-portal/tsconfig.json'
    }
  },
  
  // Reset/restore/clear mocks automatically between tests
  resetMocks: true,
  restoreMocks: true,
  clearMocks: true,
  
  // Verbose output for better debugging
  verbose: true
};

export default config;