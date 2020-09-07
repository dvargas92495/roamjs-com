const fs = require("fs");
const path = require("path");
const Dotenv = require("dotenv-webpack");

const extensions = fs.readdirSync("./src/lambdas/");
const entry = Object.fromEntries(
  extensions.map((e) => [e.substring(0, e.length - 3), `./src/lambdas/${e}`])
);

module.exports = {
  target: "node",
  entry,
  resolve: {
    extensions: [".ts", ".js"],
  },
  mode: "production",
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "out"),
    filename: "[name].js",
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
