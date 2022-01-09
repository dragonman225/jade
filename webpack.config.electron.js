const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

const {
  getCommonPlugins,
  getModuleConfig,
  getResolveConfig,
} = require('./webpack.config.utils')

module.exports = {
  /** (Webpack 4) Target: @see https://webpack.js.org/configuration/target/ */
  // target: 'electron-renderer',
  /** (Webpack 5) Externals: @see https://webpack.js.org/configuration/externals/#externalspresets */
  /** Indicate by https://github.com/liady/webpack-node-externals */
  externalsPresets: { node: true, electronRenderer: true },
  /** Do not bundle external deps, directly "require" from "node_modules". */
  externals: [
    /** Do not bundle selected packages. */
    /** Must specify type @see https://webpack.js.org/configuration/externals/#externalstype */
    { 'better-sqlite3': 'node-commonjs better-sqlite3' },
    /** Do not bundle all packages in `node_modules`. */
    // nodeExternals({
    //   /**
    //    * Allow CSS go into the bundling pipeline since it cannot be
    //    * natively imported/required.
    //    * @see https://github.com/liady/webpack-node-externals#how-can-i-bundle-required-assets-ie-css-files-from-node_modules
    //    */
    //   allowlist: [/\.css$/i],
    // }),
  ],
  context: process.cwd(), // to automatically find tsconfig.json
  /** Entry & Output: @see https://webpack.js.org/configuration/entry-context/#naming */
  entry: {
    renderer: './src/platforms/electron/renderer.ts',
  },
  output: {
    path: path.resolve(__dirname, 'build/electron'),
    filename: '[name].js',
  },
  plugins: getCommonPlugins().concat([
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
  module: getModuleConfig('production'),
  resolve: getResolveConfig(),
  devtool: 'inline-source-map',
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
}
