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
    minimalOrder : {
      type : 'integer',
      defaultsTo : 0
    },
    isSupportShipping : {
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
    meals : {
      collection : "Meal",
      via : "dishes"
    },
    dynamicMeals : {
      collection : "Meal",
      via : "dynamicDishes"
    },
    type : {
      type : 'string',
      enum : ['snack','appetizer','rice&noodle','dimsum','pastry','entree','dessert','soup','frozen'],
      defaultsTo : 'entree'
    },
    isVerified : {
      type : 'boolean',
      defaultsTo : false
    },
    discount : {
      type : 'integer'
    },
    cateringMinimalOrder : {
      type : 'integer',
      defaultsTo : 10
    },
    availableAfter : {
      type : 'string'
    },
    prepareDay : {
      type : 'integer',
      defaultsTo : 7
    },
    peopleServe : {
      type : 'integer',
      defaultsTo : 1
    },
    canPintuan : {
      type : 'boolean'
    },
    isFeature : function(){
      return this.score >= 4.8 || this.numberOfReviews > 5;
    }
  }
};

