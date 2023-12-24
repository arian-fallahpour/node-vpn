const path = require("path");
const common = require("./webpack.common");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { merge } = require("webpack-merge");

module.exports = merge(common, {
  mode: "development",
  watch: true,
  output: {
    filename: "[name].[contenthash].bundle.js",
    path: path.join(__dirname, "public/js"),
  },
  plugins: [
    new CleanWebpackPlugin({
      dry: false,
      dangerouslyAllowCleanPatternsOutsideProject: true, // REMOVE CODE IN  WEBPACKCLEANPLUGIN SRC CODE
    }),
    new MiniCssExtractPlugin({
      filename: "../css/[name].css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,

          // 3. Extract css into files
          {
            loader: "css-loader",
            options: {
              // modules: true,
            },
          },

          // 2. Turns css into commonjs
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "autoprefixer",
                    {
                      // Options
                    },
                  ],
                ],
              },
            },
          },

          // 1. Turns sass into css
          "sass-loader",
        ],
      },
    ],
  },
});
