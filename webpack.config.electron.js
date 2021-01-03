const path = require('path')
const { BannerPlugin } = require('webpack')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

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
    'electron-renderer': './src/electron-renderer.ts'
  },
  output: {
    path: path.join(process.cwd(), 'build/electron'),
    filename: '[name].js',
  },
  plugins: [
    new BannerPlugin('Jade v0.1.3 Copyright (c) Wen-Zhi (Alexander) Wang. All rights reserved.'),
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: {
        memoryLimit: 4096,
      }
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
