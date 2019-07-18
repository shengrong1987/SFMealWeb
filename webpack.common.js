const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin');
const glob = require('glob-all');

module.exports = {
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
    editDish : "./assets/js/entry/editDish.js",
    admin : "./assets/js/entry/admin.js",
    help : "./assets/js/entry/help.js",
    terms : "./assets/js/entry/terms.js",
    join : "./assets/js/entry/join.js",
    sendEmail : "./assets/js/entry/sendEmail.js",
    bank : "./assets/js/entry/bank.js",
    pocket : "./assets/js/entry/pocket.js",
    badge : "./assets/js/entry/badge.js",
    trust : "./assets/js/entry/trust.js",
    resetPassword : "./assets/js/entry/resetPassword.js",
    report : "./assets/js/entry/report.js",
    emailVerification : "./assets/js/entry/emailVerification.js"
  },
  output: {
    path: path.resolve(__dirname, '.tmp/public/assets/'),
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
            presets: ['@babel/preset-env','@babel/preset-react']
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader'
          },
          'sass-loader'
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
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      $ : 'jquery',
      jQuery : 'jquery'
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    new PurgecssPlugin({
      paths: glob.sync([`${path.resolve(__dirname,'views')}/*.ejs`,`${path.resolve(__dirname,'assets/templates')}/**/*.html`,`${path.resolve(__dirname,'assets/js')}/entry/*.js`,`${path.resolve(__dirname,'assets/js')}/react/**/*.js`], { nodir: true }),
      whitelist: ['modal-backdrop','/*bootstrap-dialog/','running','btn-primary','btn-outline-primary','btn-sm']
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['dayOfMeal'],
      filename : 'views/dayOfMeal.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['checkout'],
      filename : 'views/checkout.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['signup'],
      filename : 'views/signup.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['signin'],
      filename : 'views/signin.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['home'],
      filename : 'views/home.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['chefProfile'],
      filename : 'views/chefProfile.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['receipt'],
      filename : 'views/receipt.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['review'],
      filename : 'views/review.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['host'],
      filename : 'views/host.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['v403'],
      filename : 'views/v403.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['v404'],
      filename : 'views/v404.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['apply'],
      filename : 'views/apply.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['myorder'],
      filename : 'views/myorder.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['user'],
      filename : 'views/user.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['createMeal'],
      filename : 'views/createMeal.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['editMeal'],
      filename : 'views/editMeal.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['createDish'],
      filename : 'views/createDish.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['editDish'],
      filename : 'views/editDish.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['admin'],
      filename : 'views/admin.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['help'],
      filename : 'views/help.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['terms'],
      filename : 'views/terms.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['join'],
      filename : 'views/join.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['sendEmail'],
      filename : 'views/sendEmail.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['bank'],
      filename : 'views/bank.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['pocket'],
      filename : 'views/pocket.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['badge'],
      filename : 'views/badge.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['trust'],
      filename : 'views/trust.html'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['resetPassword'],
      filename : 'views/resetPassword.html'
    }),
    new ResourceHintWebpackPlugin(),
  ]
}
