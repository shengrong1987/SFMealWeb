/**
* Meal.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var dateUtil = require("../services/util.js");
module.exports = {

  attributes: {
    title : {
      type : 'string'
    },
    status : {
      type : 'string',
      enum : ['on','off','ongoing','fail']
    },
    //pickups : {
    //  type : 'json'
    //},
    features : {
      type : 'string',
      defaultsTo : ''
    },
    provideFromTime : {
      type : 'date'
    },
    provideTillTime : {
      type : 'date'
    },
    pickupFromTime : {
      type : 'date'
    },
    pickupTillTime : {
      type : 'date'
    },
    prepareTime : {
      //in minutes
      type : 'integer',
      defaultsTo : 30
    },
    type : {
      type : 'string',
      enum : ['order','preorder'],
      defaultsTo : 'preorder'
    },
    totalQty : {
      type : 'json'
    },
    leftQty : {
      type : 'json'
    },
    minimalOrder : {
      type : 'integer'
    },
    minimalTotal : {
      type : 'float'
    },
    delivery_min : {
      type : 'float'
    },
    county : {
      type : 'string',
      enum : ['San Francisco County','San Mateo County','Los Angela','Sacramento County']
    },
    chef : {
      model : 'Host'
    },
    reviews : {
      collection : 'Review',
      via : 'meal'
    },
    dishes : {
      collection : 'Dish'
    },
    cover : {
      type : 'string',
      required : true
    },
    coverString : {
      type : 'string'
    },
    score : {
      type : 'float',
      defaultsTo : 5.0
    },
    numberOfReviews : {
      type : 'integer',
      defaultsTo : 0
    },
    isFull : function(){
      var $this = this;
      var isFull = true;
      Object.keys($this.leftQty).forEach(function(key){
        if($this.leftQty[key]>0){
          isFull = false;
        }
      });
      return isFull;
    },
    provideDate : function(){
      if(this.type == "preorder"){
        if(this.provideFromTime.getDate() == this.provideTillTime.getDate()){
          return dateUtil.formattedDate(this.provideFromTime);
        }else{
          return dateUtil.formattedDate(this.provideFromTime) + " - " + dateUtil.formattedDate(this.provideTillTime);
        }
      }else{
        return dateUtil.formattedHour(this.provideFromTime) + " - " + dateUtil.formattedHour(this.provideTillTime)
      }
    },
    finishDate : function(){
      if(this.type == "preorder"){
        if(this.pickupFromTime.getDate() == this.pickupTillTime.getDate()){
          return dateUtil.formattedDate(this.pickupTillTime);
        }else{
          return dateUtil.formattedDate(this.pickupFromTime) + " - " + dateUtil.formattedDate(this.pickupTillTime);
        }
      }else{
        return dateUtil.formattedHour(this.provideFromTime) + " - " + dateUtil.formattedHour(this.provideTillTime)
      }
    },
    dispatchingHour : function() {
      return dateUtil.formattedHour(this.pickupFromTime) + " - " + dateUtil.formattedHour(this.pickupTillTime);
    },

    isValid : function(){
      var now = new Date();
      var midnightToday = new Date(new Date().setHours(0,0,0,0));
      if(this.status){
        if(this.type == "order"){
          //console.log("now is :" + now + " from: " + this.provideFromTime + " till: " + this.provideTillTime);
          if(now < this.provideTillTime && now > this.provideFromTime){
            return true;
          }
        }else{
          var pickupFromDate = this.pickupFromTime;
          var deadline = new Date(now.getTime() - this.prepareTime * 60 * 1000);
          if(deadline < pickupFromDate){
            return true;
          }
        }
      }
      return false;
    }
  },

  beforeCreate : function(values, cb){
    if(values.chef && !values.county){
      Host.findOne(values.chef).exec(function(err,host){
        if(err){
          return cb(err);
        }
        values.county = host.county;
        cb();
      });
    }else{
      cb();
    }
  },

  beforeUpdate : function(values,cb){
    if(values.cover && values.cover != ""){
      Dish.findOne(values.cover).exec(function(err,dish){
        if(err){
          return cb(err);
        }
        values.coverString = dish.photos[0].v;
        cb();
      });
    }
  }
};

