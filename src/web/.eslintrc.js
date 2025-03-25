module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // @typescript-eslint/parser v5.59.0
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
    tsconfigRootDir: '.',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
  ],
  plugins: [
    'react', // eslint-plugin-react v7.32.2
    '@typescript-eslint', // @typescript-eslint/eslint-plugin v5.59.0
    'jsx-a11y', // eslint-plugin-jsx-a11y v6.7.1
    'import', // eslint-plugin-import v2.27.5
    'react-hooks', // eslint-plugin-react-hooks v4.6.0
    'prettier', // eslint-plugin-prettier v4.2.1
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Using TypeScript for type checking
    'react/display-name': 'off', // Sometimes causes issues with HOCs and forwardRef
    'react-hooks/rules-of-hooks': 'error', // Enforce rules of hooks
    'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // Allow some console methods
    'no-unused-vars': 'off', // Use TypeScript version instead
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Sometimes too verbose
    '@typescript-eslint/no-explicit-any': 'warn', // Warn but don't error on 'any' type
    '@typescript-eslint/no-non-null-assertion': 'warn', // Warn on non-null assertions
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to'],
      },
    ],
    'jsx-a11y/click-events-have-key-events': 'warn', // Accessibility but allow some flexibility
    'jsx-a11y/no-static-element-interactions': 'warn', // Accessibility but allow some flexibility
    'eqeqeq': ['error', 'always'], // Always use strict equality
    'curly': ['error', 'all'], // Always use curly braces
    'prefer-const': 'error', // Use const when possible
    'no-var': 'error', // Never use var
    'object-shorthand': ['error', 'always'], // Use shorthand object properties
    'prefer-template': 'error', // Use template literals instead of string concatenation
  },
  settings: {
    react: {
      version: 'detect', // Automatically detect React version
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  overrides: [
    {
      // Test files
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/tests/**/*.ts',
        '**/tests/**/*.tsx',
      ],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in tests
        '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions in tests
        'react/display-name': 'off', // Don't worry about display names in tests
      },
    },
    {
      // JavaScript files (non-TypeScript)
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off', // Allow require in JS files
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/', 'public/', '*.d.ts'],
};