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

    isValid : function(){
      var now = new Date();
      var midnightToday = new Date(new Date().setHours(0,0,0,0));
      var valid = true;
      if(this.status){
        if(this.type == "order"){
          //console.log("now is :" + now + " from: " + this.provideFromTime + " till: " + this.provideTillTime);
          if(now < this.provideTillTime && now > this.provideFromTime){
            return true;
          }
        }else{
          var $this = this;
          this.pickups.forEach(function(pickup){
            var pickupFromDate = pickup.pickupFromTime;
            var deadline = new Date(now.getTime() - $this.prepareTime * 60 * 1000);
            if(deadline >= pickupFromDate){
              valid = false;
              return;
            }
          });
        }
      }else{
        valid = false;
      }
      return valid;
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

