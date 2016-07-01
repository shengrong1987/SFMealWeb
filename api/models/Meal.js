/**
* Meal.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var dateUtil = require("../services/util.js");
var moment = require("moment");

module.exports = {

  attributes: {
    title : {
      type : 'string'
    },
    status : {
      type : 'string',
      enum : ['on','off']
    },
    /*
      Array of object
     Date pickupFromTime,
     Date pickupTilltime,
     String location
     */
    pickups : {
     type : 'json'
    },
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
      type : 'integer',
      defaultsTo : 1
    },
    minimalTotal : {
      type : 'float',
      defaultsTo : 1
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
    delivery_fee : {
      type : 'float',
      defaultsTo : 5.0
    },
    delivery_range : {
      type : 'float',
      defaultsTo : 5.0
    },
    isDelivery : {
      type : 'boolean'
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

    dateIsValid : function(params){
      var params = this;
      var provideFromTime = params.provideFromTime;
      var provideTillTime = params.provideTillTime;
      if(provideFromTime >= provideTillTime){
        return false;
      }else if(moment.duration(moment(provideTillTime).diff(moment(provideFromTime))).asMinutes() < 60){
        return false;
      }
      var valid = true;
      if(params.pickups){
        params.pickups.forEach(function(pickup){
          var pickupFromTime = pickup.pickupFromTime;
          var pickupTillTime = pickup.pickupTillTime;
          if(pickupFromTime >= pickupTillTime){
            console.log("pickup time not valid");
            valid = false;
            return;
          }else if(moment.duration(moment(pickupTillTime).diff(moment(pickupFromTime))).asMinutes() < 30){
            console.log("pickup time too short");
            valid = false;
            return;
          }else if(pickupFromTime <= provideTillTime){
            console.log("pickup time too early");
            valid = false;
            return;
          }
        });
      }
      return valid;
    },

    dishIsValid : function(){
      if(this.dishes.length == 0){
        return false;
      }
      return this.dishes.every(function(dish){
        return dish.isVerified
      });
    }
  },

  beforeCreate : function(values, cb){
    if(values.chef && !values.county){
      Host.findOne(values.chef).exec(function(err,host){
        if(err){
          return cb(err);
        }
        values.county = host.county;
        if(values.cover){
          Dish.findOne(values.cover).exec(function(err,dish){
            if(err){
              return cb(err);
            }
            values.coverString = dish ? dish.photos[0].v : '';
            cb();
          });
        }else{
          cb();
        }
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
        values.coverString = dish ? dish.photos[0].v : '';
        cb();
      });
    }else{
      cb();
    }
  }
};

