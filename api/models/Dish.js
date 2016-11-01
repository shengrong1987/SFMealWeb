/**
* Dish.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    title : {
      type : 'string',
      required : true
    },
    price : {
      type : 'float',
      required : true
    },
    description : {
      type : 'string',
      defaultsTo : "",
      maxLength : 200
    },
    quantity : {
      type : 'string'
    },
    photos : {
      type : 'json',
      required : true
    },
    /*
      {
        sweetness : [s1, s2],
        icy : [i1, i2]
      }
     */
    preference : {
      type : "json",
      defaultsTo : {}
    },
    sold : {
      type : 'integer',
      defaultsTo : 0
    },
    reviews : {
      collection : 'Review',
      via : 'dish'
    },
    numberOfReviews : {
      type : 'integer',
      defaultsTo : 0
    },
    score : {
      type : 'float',
      defaultsTo : 5.0
    },
    prepareTime : {
      type: 'integer',
      defaultsTo : 30
    },
    chef : {
      model : 'Host'
    },
    type : {
      type : 'string',
      enum : ['appetizer','entree','dessert'],
      defaultsTo : 'entree'
    },
    isFeature : function(){
      return this.score >= 4.8 || this.numberOfReviews > 50;
    },
    isVerified : {
      type : 'boolean',
      defaultsTo : false
    },
    beforeCreate : function(values, cb){
      values.isVerified = false;
      cb();
    }
  }
};

