const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const commonConfig = require('./webpack.config.common')

module.exports = {
  /** Target: @see https://webpack.js.org/configuration/target/ */
  /** target: "web" is default. */
  context: process.cwd(), // to automatically find tsconfig.json
  entry: {
    app: './src/platforms/web/startup.ts',
  },
  output: {
    path: path.join(process.cwd(), 'build/web'),
    filename: '[name].js',
  },
  plugins: commonConfig.plugins.concat([
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
  ]),
  module: commonConfig.module,
  resolve: commonConfig.resolve,
}
