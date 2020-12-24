const path = require('path')
const { BannerPlugin } = require('webpack')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  /** Target: @see https://webpack.js.org/configuration/target/ */
  target: 'electron-renderer',
  /** Do not bundle external deps, directly "require" from "node_modules". */
  externals: [nodeExternals()],
  context: process.cwd(), // to automatically find tsconfig.json
  /** Entry & Output: @see https://webpack.js.org/configuration/entry-context/#naming */
  entry: {
    'electron-renderer': './src/electron-renderer.ts'
  },
  output: {
    path: path.join(process.cwd(), 'build/electron'),
    filename: '[name].js',
  },
  plugins: [
    new BannerPlugin('Copyright 2020 Wen-Zhi (Alexander) Wang. All rights reserved.'),
    new ForkTsCheckerWebpackPlugin({
      async: false,
      useTypescriptIncrementalApi: true,
      memoryLimit: 4096
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
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'inline-source-map'
}
