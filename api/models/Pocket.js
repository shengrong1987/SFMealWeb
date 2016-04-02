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
    //in cents
    balance : {
      type : 'float',
      defaultsTo : 0
    },
    available_balances : {
      type : 'json'
    },
    pending_balances : {
      type : 'json'
    },
    transaction_history : {
      type : 'json'
    }
  }
};

