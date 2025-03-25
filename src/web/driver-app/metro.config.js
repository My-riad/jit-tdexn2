/**
 * Metro configuration for React Native
 * https://facebook.github.io/metro/docs/configuration
 *
 * This file configures Metro, the JavaScript bundler for React Native, 
 * optimizing how the driver mobile application code is bundled during
 * development and production.
 */

const path = require('path'); // path module from Node.js (built-in)
const { getDefaultConfig } = require('metro-config'); // metro-config ^0.76.5

module.exports = (async () => {
  // Fetch the default Metro configuration as a starting point
  const defaultConfig = await getDefaultConfig();
  
  return {
    // Configure JavaScript/TypeScript transformation
    transformer: {
      // Enable inline requires for performance optimization by reducing initial load time
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
      // Use the default React Native babel transformer
      babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    },
    
    // Configure file resolution for imports and assets
    resolver: {
      // File extensions to consider as source code
      sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
      
      // File extensions to consider as assets
      assetExts: [
        // Images
        'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
        // Fonts
        'ttf', 'otf'
      ],
      
      // Any additional node modules that need custom resolution
      extraNodeModules: {
        // Example: 'shared-components': path.resolve(__dirname, '../shared')
        // We'll configure this as needed when we have shared components
      }
    },
    
    // Configure cache behavior for faster rebuilds
    cacheVersion: '1.0.0',
    
    // Don't reset cache on startup by default
    resetCache: false,
    
    // Configure maximum number of workers for transformation
    // Subtract 1 from CPU count to leave resources for other processes
    maxWorkers: Math.max(require('os').cpus().length - 1, 1),
  };
})();