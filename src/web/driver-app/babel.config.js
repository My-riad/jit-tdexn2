module.exports = {
  presets: [
    ['metro-react-native-babel-preset']
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@contexts': './src/contexts',
          '@utils': './src/utils',
          '@styles': './src/styles',
          '@assets': './src/assets',
          '@common': '../common',
          '@shared': '../shared'
        }
      }
    ]
  ],
  env: {
    production: {
      plugins: ['transform-remove-console']
    },
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          }
        }]
      ]
    }
  }
};