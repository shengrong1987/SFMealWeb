/**
 * Auth
 *
 * @module      :: Model
 * @description :: Holds all authentication methods for a User
 * @docs        :: http://waterlock.ninja/documentation
 */
var mailChimp = require("../services/mailchimp");
module.exports = {

  attributes: require('waterlock').models.auth.attributes({

    /* e.g.
    nickname: 'string'
    */
    facebookId : {
      type : 'string',
      unique : true
    },
    email : {
      type : 'email',
      unique : true
    },
    password : {
      type : 'string',
      regex : /^[_A-z0-9]{8,}$/
    },
    wechatToken : {
      type : 'string'
    },
    firstName: {
      type : 'string'
    },
    lastName: {
      type: 'string'
    },
    gender: {
      type : 'string'
    },
    timezone: {
      type :'number'
    }
  }),

  beforeCreate: require('waterlock').models.auth.beforeCreate,
  beforeUpdate: require('waterlock').models.auth.beforeUpdate
};
