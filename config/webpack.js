const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const I18nPlugin = require("i18n-webpack-plugin");
const languages = {
  en : require('../config/locales/en.json'),
  zh : require('../config/locales/zh.json')
};

// module.exports.webpack = Object.keys(languages).map(function (language) {
//   return {
//     options: {
//       devtool : "source-map",
//       name: language,
//       // mode: "development || "production",
//       entry: {
//         dayOfMeal: './assets/js/entry/dayOfMeal.js',
//         checkout : './assets/js/entry/checkout.js',
//         signup :   './assets/js/entry/signup.js',
//         signin : './assets/js/entry/signin.js',
//         home : './assets/js/entry/home.js',
//         chefProfile : './assets/js/entry/chefProfile.js'
//       },
//       output: {
//         path: path.resolve(__dirname, './.tmp/public/assets/'),
//         publicPath : "/assets/",
//         filename: language + '.[name].bundle.js',
//         chunkFilename: "[name].bundle.js"
//       },
//       module: {
//         rules: [
//           {
//             test: /\.js$/,
//             exclude: /(node_modules|bower_components)/,
//             use: {
//               loader: 'babel-loader',
//               options: {
//                 presets: ['@babel/preset-env']
//               }
//             }
//           },
//           {
//             test: /\.(sa|sc|c)ss$/,
//             use: [
//               {
//                 loader: MiniCssExtractPlugin.loader
//               },
//               'css-loader',
//               'sass-loader',
//             ],
//           },
//           {
//             test: /\.(svg|woff|woff2|eot|ttf|otf)$/,
//             use: [
//               {
//                 loader: 'url-loader',
//                 options: {
//                   outputPath: '/fonts/'
//                 }
//               }
//             ]
//           },
//           {
//             test: /\.(png|jpg|gif|jpeg)$/,
//             loader: 'url-loader',
//             options: {
//               limit: 10000,
//               outputPath: '/images/'
//             }
//           },
//           {
//             test : /\.(html)$/,
//             loader: 'html-loader',
//             options: {
//               interpolate: true,
//               outputPath: '/templates/'
//             }
//           }
//         ]
//       },
//       optimization: {
//         splitChunks: {
//           chunks: 'all'
//         }
//       },
//       plugins: [
//         new I18nPlugin(languages[language]),
//         new webpack.ProvidePlugin({
//           $ : 'jquery',
//           jQuery : 'jquery'
//         }),
//         new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
//         new MiniCssExtractPlugin({
//           // Options similar to the same options in webpackOptions.output
//           // both options are optional
//           filename: '[name].css',
//           chunkFilename: '[id].css'
//         })
//       ]
//     }
//   }
// });

module.exports.webpack = {
  options: {
    devtool : "source-map",
    name: "zh",
    entry: {
      dayOfMeal: './assets/js/entry/dayOfMeal.js',
      checkout : './assets/js/entry/checkout.js',
      signup :   './assets/js/entry/signup.js',
      signin : './assets/js/entry/signin.js',
      home : './assets/js/entry/home.js',
      chefProfile : './assets/js/entry/chefProfile.js',
      receipt : "./assets/js/entry/receipt.js",
      review : "./assets/js/entry/review.js",
      host : "./assets/js/entry/host.js",
      v403 : "./assets/js/entry/403.js",
      v404 : "./assets/js/entry/404.js",
      apply : "./assets/js/entry/apply.js",
      myorder : "./assets/js/entry/myorder.js",
      user : "./assets/js/entry/user.js",
      createMeal : "./assets/js/entry/createMeal.js",
      editMeal : "./assets/js/entry/editMeal.js",
      createDish : "./assets/js/entry/createDish.js",
      editDish : "./assets/js/entry/editDish.js"
    },
    output: {
      path: path.resolve(__dirname, '../.tmp/public/assets/'),
      publicPath : "/assets/",
      filename: 'zh.[name].bundle.js',
      chunkFilename: "[name].bundle.js"
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(svg|woff|woff2|eot|ttf|otf)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                outputPath: '/fonts/'
              }
            }
          ]
        },
        {
          test: /\.(png|jpg|gif|jpeg)$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            outputPath: '/images/'
          }
        },
        {
          test : /\.(html)$/,
          loader: 'html-loader',
          options: {
            interpolate: true,
            outputPath: '/templates/'
          }
        }
      ]
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    plugins: [
      // new webpack.HotModuleReplacementPlugin(),
      new I18nPlugin(languages["zh"]),
      new webpack.ProvidePlugin({
        $ : 'jquery',
        jQuery : 'jquery'
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].css',
        chunkFilename: '[id].css'
      })
    ]
  }
}
