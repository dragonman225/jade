const path = require('path')
const { BannerPlugin } = require('webpack')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  /** Target: @see https://webpack.js.org/configuration/target/ */
  /** target: "web" is default. */
  context: process.cwd(), // to automatically find tsconfig.json
  entry: {
    'web-index': './src/web-index.ts'
  },
  output: {
    path: path.join(process.cwd(), 'build/web'),
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
  }
}
