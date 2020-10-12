/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const main = [
  './src/index.tsx'
]

module.exports = {
  context: process.cwd(), // to automatically find tsconfig.json
  entry: {
    main
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/'
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      eslint: true
    }),
    new ForkTsCheckerNotifierWebpackPlugin({
      title: 'TypeScript', excludeWarnings: false
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: 'src/index.html'
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
              'presets': [
                '@babel/env',
                '@babel/typescript',
                '@babel/react'
              ],
              'plugins': [
                '@babel/proposal-class-properties',
                '@babel/proposal-object-rest-spread',
                'styled-jsx/babel'
              ]
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'inline-source-map',
  devServer: {
    clientLogLevel: 'warning',
    open: true,
    historyApiFallback: true,
    stats: 'errors-only'
  }
}
