const languages = {
  en : require('./config/locales/en.json'),
  zh : require('./config/locales/zh.json')
};
const I18nPlugin = require("i18n-webpack-plugin");
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = Object.keys(languages).map(function (language) {
  return merge(common, {
    mode : 'development',
    devtool : 'none',
    plugins : [
      new I18nPlugin(languages["zh"])
    ]
  })
});
