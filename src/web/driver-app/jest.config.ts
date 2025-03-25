import type { Config } from '@jest/types'; // v29.5.0

/**
 * Jest configuration for the driver mobile application
 * Extends base web Jest configuration with React Native specific settings
 */
const config: Config.InitialOptions = {
  // Use React Native preset for appropriate transformations
  preset: 'react-native',
  
  // Setup files for extending Jest functionality
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.ts',
  ],
  
  // Prevent transformation of node_modules except React Native related packages
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-maps)/)',
  ],
  
  // Path aliases for cleaner imports in tests
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@common/(.*)$': '<rootDir>/../common/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
  
  // Pattern for test files
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.test.{ts,tsx}',
  ],
  
  // Files to include in coverage reports
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!src/assets/**/*',
  ],
  
  // Coverage thresholds aligned with quality requirements
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
  
  // File extensions to be processed
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  
  // Patterns for paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/dist/',
  ],
  
  // Plugins for improved watch mode experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Mock behavior settings
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Enable verbose output for detailed test results
  verbose: true,
};

export default config;