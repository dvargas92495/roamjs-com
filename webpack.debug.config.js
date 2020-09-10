const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = {
  target: "node",
  entry: "./src/debug-lambda.ts",
  resolve: {
    extensions: [".ts", ".js"],
  },
  mode: "production",
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "out"),
    filename: "debug-lambda.js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: ".env.local",
      systemvars: true,
    }),
  ],
};