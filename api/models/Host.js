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
    shopNameI18n : function(locale){
      var prop = "shopName_" + locale;
      if(this.hasOwnProperty(prop) && this[prop]){
        return this[prop];
      }
      return this.shopName;
    },
    picture : {
      type : 'string'
      // url : true
    },
    intro : {
      type : 'string',
      defaultsTo : ""
    },
    introI18n : function(locale){
      var prop = "intro_" + locale;
      if(this.hasOwnProperty(prop) && this[prop]){
        return this[prop];
      }
      return this.intro;
    },
    email : {
      type : 'email',
      required : true,
      unique : true
    },
    phone : {
      type : 'string'
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
      enum : ["San Francisco County", "Sacramento County", "San Mateo County", "Santa Clara County"]
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
    pocket : {
      model : 'Pocket'
    },
    likes : {
      type : 'integer',
      defaultsTo : 0
    },
    followers : {
      collection : 'User',
      via : 'follow'
    },
    commission : {
      type : 'float',
      defaultsTo : 0.2,
      decimal2 : true
    },
    numberOfReviews : {
      type : 'integer'
    },
    score : {
      type : 'float'
    },
    avgScore : {
      type : 'string'
    },
    //check stripe verification, return verification object if not there's field_needed
    checkVerification : function(cb){
      let host = this;
      stripe.getAccount(this.accountId, function(err, account){
        if(err){
          return cb(err);
        }
        let isPass = false;
        if(account.business_type === "individual"){
          host.individual = account.individual;
          console.log("account info: ");
          console.dir(host.individual);
          isPass = account.individual.requirements.eventually_due.length === 0;
        }else if(account.business_type === "llc"){
          host.company = account.company;
          console.log(account.company.address.city, account.company.name, account.company.owners_provided, account.company.phone, account.company.tax_id_provided);
          isPass = !!account.company.address.city && !!account.company.name && account.company.owners_provided && account.company.phone && account.company.tax_id_provided;
        }
        return cb(null, isPass);
      });
    },
    //check all validation as host
    checkGuideRequirement : function(cb){
      var host = this;
      this.checkVerification(function(err, valid){
        if(err){
          return cb(err);
        }
        sails.log.info("Host Requirement Check: Phone valid: " + !!host.phone + "& Address valid: " + !!host.full_address + "&Dishes valid: " + !!host.dishes.length + "&Bank valid: " + !!host.bankId + "&Verification valid: " + valid);
        if(host.phone && host.full_address && host.dishes.length > 0 && host.bankId && valid){
          host.passGuide = true;
        }else{
          host.passGuide = false;
        }
        host.dishVerifying = host.dishes.some(function(dish){
          return dish.isVerified;
        });
        host.save(cb);
      });
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
    shortIntro : function(locale){
      var intro = this.introI18n(locale);
      var length = intro?intro.length:0;
      if(length > 50){
        return intro.slice(0,50) + "...";
      }
      return intro;
    }
  }
};

