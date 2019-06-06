/**
 * Badge.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    title : {
      type : 'String',
      required : true
    },
    desc : {
      type : 'String'
    },
    rule : {
      type : 'json'
    },
    largeImage : {
      type : 'string'
    },
    model : {
      type : 'string'
    }
  }
};

