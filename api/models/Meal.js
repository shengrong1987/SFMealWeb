/**
* Meal.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var dateUtil = require("../services/util.js");
var moment = require("moment");
var async = require("async");
var geoService = require("../services/geocode.js");

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
    titleI18n : function(locale){
      var prop = "title_" + locale;
      if(this.hasOwnProperty(prop) && this[prop]){
        return this[prop];
      }
      return this.title;
    },
    status : {
      type : 'string',
      enum : ['on','off']
    },
    isScheduled : {
      type : 'boolean',
      defaultsTo : false
    },
    isPartyMode : {
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
     String area
     String county
     */
    pickups : {
     type : 'json'
    },
    /*
     { minimal : $100, range : 5, deliveryCenter : “123 ave”, area : '10 miles from Sacramento downtown'}
     */
    partyRequirement : {
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
      type : 'string'
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
      defaultsTo : 3.99,
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
    isTaxIncluded : {
      type : 'boolean',
      defaultsTo : false
    },
    supportPartyOrder : {
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

    finishDate : function(short){
      if(this.type === "preorder"){
        var pickupDate = this.pickups.length ? this.pickups[0] : null;
        if(pickupDate && (short || new Date(pickupDate.pickupFromTime).getDate() ===  new Date(this.pickupTillTime).getDate())){
          return dateUtil.formattedDate(pickupDate.pickupTillTime);
        }else{
          return dateUtil.formattedDate(pickupDate.pickupFromTime) + " - " + dateUtil.formattedDate(pickupDate.pickupTillTime);
        }
      }else{
        return dateUtil.formattedHour(this.provideFromTime) + " - " + dateUtil.formattedHour(this.provideTillTime)
      }
    },

    dispatchingHour : function(from, till) {
      return dateUtil.formattedHour(from) + " - " + dateUtil.formattedHour(till);
    },

    getTimeOfDay : function(date){
      return dateUtil.getTimeOfDay(date);
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
          if(!pickup.isDateCustomized){
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
            }else if(pickupFromTime <= provideTillTime && params.type == "preorder"){
              console.log("pickup time too early");
              valid = false;
              return;
            }
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
    },

    getTaxRate : function(){
      if(this.isTaxIncluded){
        return 0;
      }
      return util.getTaxRate(this.chef.county);
    },

    getMonthName : function(date){
      return util.getMonthNameFromDate(date);
    },

    getDateFromDate : function(date){
      return util.getDateFromDate(date);
    },

    getDaysAfterNow : function(day){
      return util.getDaysAfterDate(moment(),day);
    },

    getDateFromDaysAfterNow : function(day){
      return util.getDateFromDaysAfterNow(moment(),day);
    }
  },

  beforeCreate : function(values, cb){
    async.auto({
      updateCountyAndPickup: function(next){
        if(!values.chef){
          console.log("meal has no chef");
          return next(Error("meal has no chef"));
        }
        Host.findOne(values.chef).populate("user").exec(function(err, host){
          if(err){
            return next(err);
          }
          if(values.type != "order"){
            return next();
          }
          sails.log.info("updating meal county to host county");
          values.county = host.county;
          var pickupOption = {
            "pickupFromTime": values.pickupFromTime,
            "pickupTillTime": values.pickupTillTime,
            "location": host.full_address,
            "phone": host.user.phone,
            "method": "pickup",
            "county" : host.county,
            "area" : '',
            'index' : 1
          };
          var deliveryOption = {
            "pickupFromTime": values.provideFromTime,
            "pickupTillTime": values.provideTillTime,
            "deliveryCenter": host.full_address,
            "phone": host.user.phone,
            "method": "delivery",
            "county" : host.county,
            "area" : '',
            "index" : 2
          }
          if(values.isDelivery){
            values.pickups = [pickupOption, deliveryOption];
          }else{
            values.pickups = [pickupOption];
          }
          sails.log.info("pickups: " + JSON.stringify(values.pickups));
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
      updateCountyAndPickup: function(next){
        if(!values.chef){
          console.log("meal has no chef");
          return next(Error("meal has no chef"));
        }
        Host.findOne(values.chef).populate("user").exec(function(err, host){
          if(err){
            return next(err);
          }
          if(values.type != "order"){
            return next();
          }
          sails.log.info("updating meal county to host county");
          values.county = host.county;
          var pickupOption = {
            "pickupFromTime": values.provideFromTime,
            "pickupTillTime": values.provideTillTime,
            "location": host.full_address,
            "phone": host.user.phone,
            "method": "pickup",
            "county" : host.county,
            "area" : '',
            "index" : 1
          };
          var deliveryOption = {
            "pickupFromTime": values.provideFromTime,
            "pickupTillTime": values.provideTillTime,
            "deliveryCenter": host.full_address,
            "phone": host.user.phone,
            "method": "delivery",
            "county" : host.county,
            "area" : '',
            "index" : 2
          }
          if(values.isDelivery){
            values.pickups = [pickupOption, deliveryOption];
          }else{
            values.pickups = [pickupOption];
          }
          sails.log.info("pickups: " + JSON.stringify(values.pickups));
          next();
        });
      },
    },function(err){
      cb(err);
    });
  }
};

