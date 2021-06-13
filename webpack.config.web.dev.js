const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  /** Target: @see https://webpack.js.org/configuration/target/ */
  /** target: "web" is default. */
  context: process.cwd(), // to automatically find tsconfig.json
  entry: {
    'web-index': './src/web-index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'build/web'),
    filename: '[name].js',
    publicPath: '/',
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      eslint: {
        files: './src/**/*.{ts,tsx,js,jsx}',
      },
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: 'src/index.html',
    }),
  ],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/env', '@babel/typescript', '@babel/react'],
              plugins: [
                '@babel/proposal-class-properties',
                '@babel/proposal-object-rest-spread',
                'styled-jsx/babel',
              ],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'inline-source-map',
  devServer: {
    clientLogLevel: 'warning',
    historyApiFallback: true,
    stats: 'errors-only',
    host: '0.0.0.0',
  },
}
