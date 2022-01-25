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
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript',
                '@babel/preset-react',
              ],
              plugins: [
                '@babel/proposal-class-properties',
                '@babel/proposal-object-rest-spread',
                /**
                 * For async/await
                 * create-react-app's usage:
                 * https://github.com/facebook/create-react-app/blob/a422bf227cf5294a34d68696664e9568a152fd8f/packages/babel-preset-react-app/create.js#L178
                 * babel documentation
                 * https://babeljs.io/docs/en/babel-plugin-transform-runtime
                 */
                '@babel/plugin-transform-runtime',
                /** For HMR */
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

/** @see https://webpack.js.org/configuration/optimization/ */
function getOptimizationConfig() {
  return {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  }
}

module.exports = {
  getCommonPlugins,
  getModuleConfig,
  getResolveConfig,
  getOptimizationConfig,
}
