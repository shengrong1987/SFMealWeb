/**
 * Pickup.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    pickupFromTime : {
      type : 'date'
    },
    pickupTillTime : {
      type : 'date'
    },
    location : {
      type : 'string'
    },
    method : {
      type : 'string',
      enum : ["pickup","delivery","shipping"]
    },
    phone : {
      type : 'string'
    },
    publicLocation : {
      type : 'string'
    },
    comment : {
      type : 'string'
    },
    deliveryCenter : {
      type : "string"
    },
    deliveryRange : {
      type : 'float'
    },
    area : {
      type : 'string'
    },
    county : {
      type : "string"
    },
    index : {
      type : "integer"
    },
    nickname : {
      type : 'string'
    },
    minimalOrder : {
      type : 'integer'
    }
  }
};
