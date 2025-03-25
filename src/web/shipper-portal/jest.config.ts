import type { Config } from '@jest/types';
import baseConfig from '../jest.config';

/**
 * Jest configuration for the Shipper Portal application.
 * Extends the base web configuration with shipper-portal specific settings.
 */
const config: Config.InitialOptions = {
  ...baseConfig,
  
  // Set display name for the test suite
  displayName: 'shipper-portal',
  
  // Set root directory for the jest context
  rootDir: '../../',
  
  // Specify where to find test files
  roots: ['<rootDir>/shipper-portal/src'],
  
  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/shipper-portal/src/setupTests.ts'],
  
  // Test file patterns to match
  testMatch: [
    '<rootDir>/shipper-portal/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/shipper-portal/src/**/*.test.{ts,tsx}'
  ],
  
  // Module path aliases for import resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/shipper-portal/src/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/shared/tests/mocks/fileMock.ts'
  },
  
  // TypeScript transformation settings
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/shipper-portal/tsconfig.json' }]
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    '<rootDir>/shipper-portal/src/**/*.{ts,tsx}',
    '!<rootDir>/shipper-portal/src/**/*.d.ts',
    '!<rootDir>/shipper-portal/src/index.tsx',
    '!<rootDir>/shipper-portal/src/setupTests.ts',
    '!<rootDir>/shipper-portal/src/**/*.stories.{ts,tsx}'
  ],
  
  // Coverage thresholds to enforce code quality
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
  
  // Test environment for React components
  testEnvironment: 'jsdom',
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Patterns to ignore
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
  
  // Watch plugins for better developer experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Global settings for ts-jest
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/shipper-portal/tsconfig.json'
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