/**
 * Global Variable Configuration
 * (sails.config.globals)
 *
 * Configure which global variables which will be exposed
 * automatically by Sails.
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.globals.html
 */
var nodemailer = require('nodemailer');

module.exports.email = {
  transporter : {
    host : "smtp.office365.com",
    secureConnection : false,
    port : 587,
    auth : {
      user : process.env.ADMIN_EMAIL,
      pass : process.env.ADMIN_EMAIL_PWD
    },
    tls : {
      ciphers : 'SSLv3'
    }
  },
  from : "SFMeal Admin",
  testMode : false
};
