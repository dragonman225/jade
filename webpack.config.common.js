const { BannerPlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  plugins: [
    new BannerPlugin(
      'Jade v0.3.5 Copyright (c) Wen-Zhi (Alexander) Wang. All rights reserved.'
    ),
    new MiniCssExtractPlugin(),
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
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      /**
       * Move assets to `assets/`. New API that replaces file-loader.
       * @see https://webpack.js.org/guides/asset-modules/
       * @see https://webpack.js.org/loaders/css-loader/#assets
       */
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext][query]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
  },
}
