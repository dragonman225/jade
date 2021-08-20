const { BannerPlugin } = require('webpack')

module.exports = {
  plugins: [
    new BannerPlugin(
      'Jade v0.2.3 Copyright (c) Wen-Zhi (Alexander) Wang. All rights reserved.'
    ),
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
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
}
