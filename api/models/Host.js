/**
* Host.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

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
      defaultsTo : "我的小厨房"
    },
    picture : {
      type : 'string'
    },
    intro : {
      type : 'string',
      defaultsTo : ""
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
    license : {
      type : 'string'
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
    zip : {
      type : 'string',
      minLength : 10,
      minLength : 5
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
      var d = R * c; // Distance in km
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

