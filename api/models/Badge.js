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
    achievedDate : {
      type : 'Date'
    },
    isAchieved : {
      type : 'boolean',
      defaultsTo : false
    },
    iconClass : {
      type : 'string',
      defaultsTo : 'fa fa-ribbon fa-2x'
    },
    rule : {
      type : 'string'
    },
    customImage : {
      type : 'string'
    }
  }
};

