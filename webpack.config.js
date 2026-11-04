const path = require('path');
const { DefinePlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (_env, argv) => {
  const isDev = argv.mode !== 'production';

  return {
    mode: isDev ? 'development' : 'production',
    devtool: 'cheap-module-source-map',
    entry: {
      background: './src/background.ts',
      popup: './src/popup.ts',
      content: './src/content.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      // 개발 빌드에서만 켜지는 코드(판별 결과 배지 등)를 위한 상수
      new DefinePlugin({ __DEV__: JSON.stringify(isDev) }),
      new CopyPlugin({
        patterns: [{ from: 'public', to: '.' }],
      }),
      new HtmlWebpackPlugin({
        template: './src/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),
    ],
  };
};
