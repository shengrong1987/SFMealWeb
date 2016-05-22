/**
 * Notification.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    model : {
      type : 'string'
    },
    verb : {
      type : 'string'
    },
    action : {
      type : 'string'
    },
    recordId : {
      type : 'string'
    },
    user : {
      model : 'User'
    },
    host : {
      model : 'Host'
    }
  }
};

