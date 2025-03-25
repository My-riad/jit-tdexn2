module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['>0.2%', 'not dead', 'not op_mini all']
        },
        useBuiltIns: 'usage',
        corejs: 3,
        modules: false
      }
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
        allowDeclareFields: true,
        onlyRemoveTypeImports: true
      }
    ]
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true,
        helpers: true,
        corejs: 3
      }
    ],
    [
      'babel-plugin-styled-components',
      {
        displayName: true,
        fileName: true,
        pure: true
      }
    ],
    [
      'babel-plugin-module-resolver',
      {
        root: ['./'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@common': './common',
          '@shared': './shared'
        }
      }
    ]
  ],
  env: {
    development: {
      presets: [
        [
          '@babel/preset-react',
          {
            development: true,
            runtime: 'automatic'
          }
        ]
      ],
      plugins: ['babel-plugin-styled-components']
    },
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['>0.2%', 'not dead', 'not op_mini all']
            },
            useBuiltIns: 'usage',
            corejs: 3,
            modules: false
          }
        ]
      ],
      plugins: [
        [
          'babel-plugin-styled-components',
          {
            displayName: false,
            pure: true
          }
        ]
      ]
    },
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs'
          }
        ]
      ],
      plugins: ['@babel/plugin-transform-modules-commonjs']
    }
  }
};