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
    titleI18n : function(locale){
      var prop = "title-" + locale;
      if(this.hasOwnProperty(prop) && this[prop]){
        return this[prop];
      }
      return this.title;
    },
    price : {
      type : 'float',
      required : true
    },
    dynamicPrice : {
      type : 'float'
    },
    minimalPrice : {
      type : 'float'
    },
    priceAlterRate : {
      type : 'integer',
      defaultsTo : 5
    },
    isDynamic : {
      type : 'boolean',
      defaultsTo : false
    },
    description : {
      type : 'string',
      defaultsTo : "",
      maxLength : 200
    },
    descriptionI18n : function(locale){
      var prop = "description-" + locale;
      if(this.hasOwnProperty(prop) && this[prop]){
        return this[prop];
      }
      return this.description;
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
        sweetness : [{property : s1, extra : 1}, s2],
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
    isVerified : {
      type : 'boolean',
      defaultsTo : false
    },
    updatePrice : function(number){
      var p = Math.ceil(this.price - number / this.priceAlterRate);
      if(p < this.minimalPrice){
        p = this.minimalPrice;
      }
      this.dynamicPrice = p;
    },
    isFeature : function(){
      return this.score >= 4.8 || this.numberOfReviews > 5;
    }
  },

  beforeCreate : function(values, cb){
    values.isVerified = false;
    values.minimalPrice = values.price * 2/3;
    values.dynamicPrice = values.price;
    cb();
  }
};

