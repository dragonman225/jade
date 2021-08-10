const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

const commonConfig = require('./webpack.config.common')

module.exports = {
  /** (Webpack 4) Target: @see https://webpack.js.org/configuration/target/ */
  // target: 'electron-renderer',
  /** (Webpack 5) Externals: @see https://webpack.js.org/configuration/externals/#externalspresets */
  /** Indicate by https://github.com/liady/webpack-node-externals */
  externalsPresets: { node: true, electronRenderer: true },
  /** Do not bundle external deps, directly "require" from "node_modules". */
  externals: [nodeExternals()],
  context: process.cwd(), // to automatically find tsconfig.json
  /** Entry & Output: @see https://webpack.js.org/configuration/entry-context/#naming */
  entry: {
    renderer: './src/platforms/electron/renderer.ts',
  },
  output: {
    path: path.join(process.cwd(), 'build/electron'),
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
      inject: true,
      template: 'src/index.html',
    }),
  ]),
  module: commonConfig.module,
  resolve: commonConfig.resolve,
  devtool: 'inline-source-map',
}
