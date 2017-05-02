/**
 * Dependencies
 */

var thunkify = require('thunkify');
var crypto = require('crypto');


/**
 * Expose thunkified crypto
 */

var methods = [
  'pbkdf2',
  'randomBytes',
  'pseudoRandomBytes'
];

var ignore = [
  'createCredentials',
  'Credentials'
];

Object.keys(crypto).forEach(function (property) {
  if (ignore.indexOf(property) > -1) return;
  
  exports[property] = crypto[property];
});

methods.forEach(function (method) {
  exports[method] = thunkify(crypto[method]);
});
