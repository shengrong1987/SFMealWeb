/**
 * Coupon.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    type : {
      type : 'string',
      enum : ['fix','freeShipping']
    },
    amount : {
      type : 'float'
    },
    description : {
      type : 'string'
    },
    code : {
      type : 'string',
      unique : true
    },
    expires_at : {
      type : 'date'
    }
  }
};

