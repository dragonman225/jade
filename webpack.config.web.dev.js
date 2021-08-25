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
    path: path.resolve(__dirname, 'build/web'),
    filename: '[name].js',
    publicPath: '/',
  },
  plugins: commonConfig.plugins.concat([
    new ForkTsCheckerWebpackPlugin({
      eslint: {
        files: './src/**/*.{ts,tsx,js,jsx}',
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
  devServer: {
    historyApiFallback: true,
    client: {
      logging: 'warn',
      overlay: false,
    },
    devMiddleware: {
      stats: 'errors-only',
    },
    host: '0.0.0.0',
    port: 8140,
  },
}
