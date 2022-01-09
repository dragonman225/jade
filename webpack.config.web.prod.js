const path = require('path')
const { BannerPlugin } = require('webpack')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const {
  getCommonPlugins,
  getModuleConfig,
  getResolveConfig,
  getOptimizationConfig,
} = require('./webpack.config.utils')

module.exports = {
  /**
   * @see https://webpack.js.org/configuration/target/
   * Defaults to 'browserslist' or to 'web' when no browserslist
   * configuration was found.
   */
  // target: 'web',
  context: process.cwd(), // to automatically find tsconfig.json
  entry: {
    app: './src/platforms/web/startup.ts',
  },
  output: {
    path: path.resolve(__dirname, 'build/web'),
    filename: '[name].js',
  },
  plugins: [
    ...getCommonPlugins(),
    new BannerPlugin({
      banner:
        'Jade v0.3.6 Copyright (c) Wen-Zhi (Alexander) Wang. All rights reserved.',
    }),
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: {
        memoryLimit: 4096,
      },
    }),
    new HtmlWebpackPlugin({
      hash: true,
      inject: true,
      template: 'src/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
  ],
  module: getModuleConfig('production'),
  resolve: getResolveConfig(),
  optimization: getOptimizationConfig(),
}
