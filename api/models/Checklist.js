/**
 * Checklist.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  /*
   {
   status : "valid","pending","fail",
   url : url
   }
   */
  attributes: {
    host : {
      model : 'Host'
    },
    kitchen : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    },
    surface : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    },
    utensil : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    },
    dishes : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    },
    refrigerator : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    },
    sourceStorage : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    },
    dryFoodStorage : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    },
    water : {
      type : 'json',
      defaultsTo : {
        status : "needed"
      }
    }
  }
};

