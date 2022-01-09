const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

const {
  getCommonPlugins,
  getModuleConfig,
  getResolveConfig,
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
    publicPath: '/',
  },
  plugins: getCommonPlugins().concat([
    new ReactRefreshWebpackPlugin(),
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
  module: getModuleConfig('development'),
  resolve: getResolveConfig(),
  devtool: 'inline-source-map',
  devServer: {
    historyApiFallback: true,
    client: {
      /** Comment out this line to debug HMR issues. */
      logging: 'info',
      overlay: false,
    },
    devMiddleware: {
      stats: 'errors-only',
    },
    /** Change to 'only' to debug HMR issues. */
    hot: true,
    liveReload: false,
    host: '0.0.0.0',
    port: 8140,
  },
}
