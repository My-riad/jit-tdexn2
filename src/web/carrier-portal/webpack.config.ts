import path from 'path';
import webpack from 'webpack';
import { createWebpackConfig } from '../webpack.config';

/**
 * Factory function that returns webpack configuration for the Carrier Management Portal
 * @param env Environment variables passed from webpack CLI
 * @returns Webpack configuration object
 */
const webpackConfig = (env: { [key: string]: boolean }): webpack.Configuration => {
  // Determine if we're building for production or development
  const isProduction = env.production === true;

  // Define carrier-portal specific paths
  const entryPath = path.resolve(__dirname, 'src/index.tsx');
  const outputPath = path.resolve(__dirname, 'dist');
  const htmlTemplate = path.resolve(__dirname, 'index.html');
  
  // Dev server port for the carrier portal
  const devServerPort = 3001;
  
  // Additional carrier-portal specific configuration
  const additionalConfig: Partial<webpack.Configuration> = {
    resolve: {
      alias: {
        // Allow imports using @ to reference src directory
        '@': path.resolve(__dirname, 'src'),
        // Allow imports from common and shared directories
        '@common': path.resolve(__dirname, '../common'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    module: {
      rules: [
        // SVG handling for carrier portal - allows both component usage and file URLs
        {
          test: /\.svg$/,
          use: ['@svgr/webpack', 'file-loader'],
        },
      ],
    },
  };
  
  // Create configuration using the base factory function
  return createWebpackConfig(
    {
      appName: 'carrier-portal',
      entryPath,
      outputPath,
      htmlTemplate,
      devServerPort,
      additionalConfig,
    },
    env
  );
};

// Export for webpack CLI
module.exports = webpackConfig;