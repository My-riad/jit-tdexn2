import path from 'path';
import webpack from 'webpack';
import { createWebpackConfig } from '../webpack.config';

/**
 * Creates the webpack configuration for the shipper portal application by extending the base configuration
 * @param env Environment variables
 * @returns Complete webpack configuration for the shipper portal application
 */
const createShipperPortalConfig = (env: { [key: string]: boolean }): webpack.Configuration => {
  // Define shipper portal specific configuration values
  const appName = 'shipper-portal';
  const entryPath = path.resolve(__dirname, 'src/index.tsx');
  const outputPath = path.resolve(__dirname, 'dist');
  const htmlTemplate = path.resolve(__dirname, 'index.html');
  const devServerPort = 3002;

  // Additional webpack configuration for shipper portal
  const additionalConfig: Partial<webpack.Configuration> = {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@common': path.resolve(__dirname, '../common'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
  };

  // Create the webpack configuration by extending the base configuration
  return createWebpackConfig({
    appName,
    entryPath,
    outputPath,
    htmlTemplate,
    devServerPort,
    additionalConfig,
  }, env);
};

// Export the webpack configuration factory function as default for webpack CLI usage
export default createShipperPortalConfig;