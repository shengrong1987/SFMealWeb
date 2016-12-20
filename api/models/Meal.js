/**
* Meal.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var dateUtil = require("../services/util.js");
var moment = require("moment");
var async = require("async");

module.exports = {

  types: {
    decimal2: function(number){
      return ((number *100)%1 === 0);
    }
  },
  attributes: {
    title : {
      type : 'string'
    },
    status : {
      type : 'string',
      enum : ['on','off']
    },
    isScheduled : {
      type : 'boolean',
      defaultsTo : false
    },
    /*
      Array of object
     Date pickupFromTime,
     Date pickupTilltime,
     String location
     String publicLocation
     String instruction
     String phone
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
      enum : ['San Francisco County','Sacramento County']
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
      defaultsTo : 5.0,
      decimal2 : true
    },
    numberOfReviews : {
      type : 'integer',
      defaultsTo : 0
    },
    delivery_fee : {
      type : 'float',
      defaultsTo : 5.99,
      decimal2 : true
    },
    delivery_range : {
      type : 'float',
      defaultsTo : 5.0,
      decimal2 : true
    },
    delivery_center : {
      type : 'string'
    },
    commission : {
      type : 'float',
      defaultsTo : 0.2,
      decimal2 : true
    },
    isDelivery : {
      type : 'boolean'
    },
    isDeliveryBySystem : {
      type : 'boolean',
      defaultsTo : false
    },
    /*
      type : "fixed/custom",
      price : "5.00",
      hasFreePolicy : true,
      freeAmount : "20.00"
     */
    shippingPolicy : {
      type : 'json'
    },
    isShipping : {
      type : 'boolean',
      defaultsTo : false
    },
    msg : {
      type : 'string',
      defaultsTo : ''
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
      var now = new Date();
      if(provideFromTime >= provideTillTime){
        return false;
      }else if(new Date(provideTillTime) < now){
        return false;
      }else if(moment.duration(moment(provideTillTime).diff(moment(provideFromTime))).asMinutes() < 30){
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
        return dish.isVerified;
      });
    }
  },

  beforeCreate : function(values, cb){
    async.auto({
      updateCountyAndPickup: function(next){
        if(!values.chef){
          console.log("meal has no chef");
          return next(Error("meal has no chef"));
        }
        if(values.county && values.type != "order"){
          return next();
        }
        Host.findOne(values.chef).populate("user").exec(function(err, host){
          if(err){
            return next(err);
          }
          if(!values.county){
            values.county = host.county;
          }
          if(values.type == "order"){
            values.pickups = JSON.stringify([{
              "pickupFromTime" : values.provideFromTime,
              "pickupTillTime" : values.provideTillTime,
              "location" : host.full_address,
              "phone" : host.user.phone,
              "method" : "pickup"
            }])
          }
          next();
        });
      },
      updateMealCover : function(next){
        if(!values.cover){
          return next();
        }
        Dish.findOne(values.cover).exec(function(err,dish){
          if(err){
            return cb(err);
          }
          values.coverString = dish ? dish.photos[0].v : '';
          next();
        });
      }
    },function(err){
      cb();
    });
  },

  beforeUpdate : function(values,cb){
    async.auto({
      updateCover : function(next){
        if(values.cover && values.cover != ""){
          Dish.findOne(values.cover).exec(function(err,dish){
            if(err){
              return next(err);
            }
            values.coverString = dish ? dish.photos[0].v : '';
            next();
          });
        }else{
          next();
        }
      },
      updatePickup : function(next){
        if(values.type == "order"){
          Host.findOne(values.chef || values.host).populate("user").exec(function(err, host){
            if(err){
              return next(err);
            }
            values.pickups = JSON.stringify([{
              "pickupFromTime" : values.provideFromTime,
              "pickupTillTime" : values.provideTillTime,
              "location" : host.full_address,
              "phone" : host.user.phone,
              "method" : "pickup"
            }])
            next();
          });
        }else{
          next();
        }
      }
    },function(err){
      cb(err);
    });
  }
};

