const MiniCssExtractPlugin = require('mini-css-extract-plugin')

function getCommonPlugins() {
  return [new MiniCssExtractPlugin()]
}

/**
 * @see https://webpack.js.org/configuration/module/
 * @param {'development' | 'production'} mode
 */
function getModuleConfig(mode) {
  return {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/env', '@babel/typescript', '@babel/react'],
              plugins: [
                '@babel/proposal-class-properties',
                '@babel/proposal-object-rest-spread',
                mode === 'development' && 'react-refresh/babel',
              ].filter(Boolean),
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      /**
       * Move assets to `assets/`. New API that replaces file-loader.
       * @see https://webpack.js.org/guides/asset-modules/
       * @see https://webpack.js.org/loaders/css-loader/#assets
       */
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext][query]',
        },
      },
    ],
  }
}

/** @see https://webpack.js.org/configuration/resolve/ */
function getResolveConfig() {
  return {
    extensions: ['.tsx', '.ts', '.js', '.css'],
  }
}

module.exports = { getCommonPlugins, getModuleConfig, getResolveConfig }
