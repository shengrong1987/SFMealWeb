/**
* Host.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
var stripe = require("../services/stripe.js");
module.exports = {

  attributes: {
    user : {
      model : 'User'
    },
    accountId : {
      type : 'string'
    },
    bankId : {
      type : 'string'
    },
    shopName : {
      type : 'string',
      maxLength : 35
    },
    picture : {
      type : 'string'
      // url : true
    },
    intro : {
      type : 'string',
      defaultsTo : ""
    },
    email : {
      type : 'email',
      required : true,
      unique : true
    },
    //[{"dish1": id}, {"dish2":id}, {"dish3":id}]
    feature_dishes : {
      type : 'json'
    },
    full_address : {
      type : 'string'
    },
    pickup_addresses : {
      type : 'json'
    },
    /*
    @url license url
    @exp expiration date
    @issuedTo issue to name string
    @valid pass admin check
    */
    license : {
      type : 'json'
    },
    long : {
      type : 'string'
    },
    lat : {
      type : 'string'
    },
    city : {
      type : 'string'
    },
    street : {
      type : 'string'
    },
    county : {
      type : 'string',
      enum : ["San Francisco County", "Sacramento County"]
    },
    state : {
      type : 'string'
    },
    zip : {
      type : 'string',
      regex : /^\d{5}(?:[-\s]\d{4})?$/
    },
    dishes : {
      collection : 'Dish',
      via : 'chef'
    },
    meals : {
      collection : 'Meal',
      via : 'chef'
    },
    orders : {
      collection : 'Order',
      via : 'host'
    },
    notifications : {
      collection : 'Notification',
      via : 'host'
    },
    passGuide : {
      type : 'boolean',
      defaultsTo : false
    },
    //check stripe verification, return verification object if not there's field_needed
    checkVerification : function(cb){
      var host = this;
      stripe.getAccount(this.accountId, function(err, account){
        if(err){
          console.log(err);
          return cb(err);
        }
        if(account.verification.fields_needed.length != 0){
          host.verification = account.verification;
          return cb(null,false);
        }
        return cb(null,true);
      });
    },
    //check all validation as host
    checkGuideRequirement : function(cb){
      var host = this;
      if(this.full_address && this.dishes.length > 0 && this.dishes.some(function(dish){
          return dish.isVerified;
        }) && this.bankId){
        this.checkVerification(function(err, valid){
          host.passGuide = valid;
          return cb(null,valid)
        });
      }else{
        host.passGuide = false;
        return cb(null,false);
      }
    },
    getDistance : function(userLat, userLong){
      function deg2rad(deg) {
        return deg * (Math.PI/180)
      }
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(this.lat-userLat);  // deg2rad below
      var dLon = deg2rad(this.long-userLong);
      var a =
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(deg2rad(this.lat)) * Math.cos(deg2rad(userLat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
          ;
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var d = R * c * 0.62; // Distance in miles
      return d.toFixed(1);
    },
    shortIntro : function(){
      var length = this.intro?this.intro.length:0;
      if(length > 12){
        return this.intro.slice(0,30) + "...";
      }
      return this.intro;
    }
  }
};

