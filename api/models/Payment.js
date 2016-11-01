/**
* Payment.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    user : {
      model : 'User'
    },
    cardId : {
      type : 'string'
    },
    last4 : {
      type : 'string'
    },
    brand : {
      type : 'string'
    },
    isDefaultPayment : {
      type : 'boolean',
      defaultsTo : false
    }
  }
};

