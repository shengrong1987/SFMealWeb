/**
 * Auth
 *
 * @module      :: Model
 * @description :: Holds all authentication methods for a User
 * @docs        :: http://waterlock.ninja/documentation
 */

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
    }
  }),

  beforeCreate: require('waterlock').models.auth.beforeCreate,
  beforeUpdate: require('waterlock').models.auth.beforeUpdate
};
