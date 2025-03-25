/**
 * Babel Configuration for AI-driven Freight Optimization Platform
 * 
 * This configuration file sets up Babel to transpile TypeScript to JavaScript
 * for the backend services. It enables modern JavaScript features while ensuring
 * compatibility with Node.js environments across all microservices.
 * 
 * @babel/preset-env - 7.22.5
 * @babel/preset-typescript - 7.22.5
 * @babel/plugin-transform-runtime - 7.22.5
 */

module.exports = {
  // Presets are collections of plugins used to support particular language features
  presets: [
    // Preset for converting modern JavaScript features to be compatible with target environments
    ['@babel/preset-env', {
      // Target Node.js 18 environment
      targets: { node: '18' },
      // Use CommonJS modules for Node.js compatibility
      modules: 'commonjs',
      // Polyfill only the features that are used in the code
      useBuiltIns: 'usage',
      // Use core-js version 3 for polyfills
      corejs: 3
    }],
    // Preset for TypeScript support
    ['@babel/preset-typescript', {
      // Allow class fields declarations
      allowDeclareFields: true,
      // Only remove type imports to optimize bundle size
      onlyRemoveTypeImports: true
    }]
  ],
  
  // Plugins for additional transformations
  plugins: [
    // Transform runtime plugin provides helpers for async/await and other ES features
    ['@babel/plugin-transform-runtime', {
      // Use regenerator for async/await
      regenerator: true,
      // Use runtime helpers
      helpers: true,
      // Use core-js version 3 for runtime polyfills
      corejs: 3
    }]
  ],
  
  // Environment-specific configurations
  env: {
    // Jest testing environment configuration
    test: {
      presets: [
        // Target current Node.js version for tests
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ],
      plugins: ['@babel/plugin-transform-runtime']
    },
    
    // Production environment configuration
    production: {
      presets: [
        // Target Node.js 18 for production
        ['@babel/preset-env', {
          targets: { node: '18' },
          modules: 'commonjs',
          useBuiltIns: 'usage',
          corejs: 3
        }],
        '@babel/preset-typescript'
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          regenerator: true,
          helpers: true,
          corejs: 3
        }]
      ]
    }
  }
};