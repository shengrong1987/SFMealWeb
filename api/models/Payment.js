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
    customerId : {
      type : 'string'
    },
    street : {
      type : 'string',
      required : true
    },
    city : {
      type : 'string',
      required : true
    },
    state : {
      type : 'string',
      required : true
    },
    postal: {
      type : 'string',
      required : true
    },
    country : {
      type : 'string',
      required : true,
      defaultsTo : 'US'
    },
    cardholder : {
      type : 'string',
      required : true
    },
    cardNumber : {
      type : 'string',
      required : true
    },
    expMonth : {
      type : 'string',
      required : true
    },
    expYear : {
      type : 'string',
      required : true
    },
    CVV : {
      type : 'string'
    },
    brand : {
      type : 'string'
    },
    isDefaultPayment : {
      type : 'boolean',
      defaultsTo : false
    }
  },

  afterUpdate : function(payment,cb){
    delete  payment.CVV;
    cb(null,payment);
  },

  afterCreate : function(payment,cb){
    delete  payment.CVV;
    cb(null,payment);
  }
};

