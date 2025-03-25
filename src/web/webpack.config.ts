import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

/**
 * Factory function that creates a webpack configuration object based on provided options and environment
 * @param options Configuration options for the webpack config
 * @param env Environment variables
 * @returns Complete webpack configuration object
 */
export function createWebpackConfig(
  options: {
    appName: string;
    entryPath: string;
    outputPath: string;
    htmlTemplate: string;
    devServerPort: number;
    additionalConfig?: Partial<webpack.Configuration>;
  },
  env: { [key: string]: boolean }
): webpack.Configuration {
  const isProduction = env.production === true;
  
  // Base webpack configuration
  const config: webpack.Configuration = {
    mode: isProduction ? 'production' : 'development',
    entry: path.isAbsolute(options.entryPath)
      ? options.entryPath
      : path.resolve(process.cwd(), options.entryPath),
    output: {
      path: path.isAbsolute(options.outputPath)
        ? options.outputPath
        : path.resolve(process.cwd(), options.outputPath),
      filename: 'js/[name].[contenthash:8].js',
      chunkFilename: 'js/[name].[contenthash:8].chunk.js',
      publicPath: '/',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@common': path.resolve(__dirname, './common'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    module: {
      rules: [
        // TypeScript
        {
          test: /\.(ts|tsx)$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        // CSS
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        // Images
        {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10000, // 10kb
            },
          },
          generator: {
            filename: 'images/[name].[hash:8][ext]',
          },
        },
        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]',
          },
        },
        // SVG
        {
          test: /\.svg$/,
          use: ['@svgr/webpack', 'file-loader'],
          issuer: {
            and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
          },
        },
      ],
    },
    plugins: [
      // HTML generation
      new HtmlWebpackPlugin({
        template: path.isAbsolute(options.htmlTemplate)
          ? options.htmlTemplate
          : path.resolve(process.cwd(), options.htmlTemplate),
        inject: true,
        title: options.appName,
      }),
      // TypeScript type checking
      new ForkTsCheckerWebpackPlugin(),
      // Environment variables
      new Dotenv(),
      // Clean build directory
      new CleanWebpackPlugin(),
      // CSS extraction (production only)
      isProduction && new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[name].[contenthash:8].chunk.css',
      }),
    ].filter(Boolean) as webpack.WebpackPluginInstance[],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: true,
            mangle: true,
          },
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        name: false,
      },
      runtimeChunk: 'single',
    },
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 512000, // 500kb
      maxEntrypointSize: 512000, // 500kb
    },
  };

  // Add development server configuration
  if (!isProduction) {
    config.devServer = {
      port: options.devServerPort,
      hot: true,
      historyApiFallback: true,
      compress: true,
      client: {
        overlay: true,
      },
    };
  }

  // Merge with additional configuration if provided
  if (options.additionalConfig) {
    return {
      ...config,
      ...options.additionalConfig,
    };
  }

  return config;
}