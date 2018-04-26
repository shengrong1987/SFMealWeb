/**
 * User
 *
 * @module      :: Model
 * @description :: This is the base user model
 * @docs        :: http://waterlock.ninja/documentation
 */

var async = require('async');
var geocode = require('../services/geocode');

module.exports = {

  types: {
    at1000Max : function(value){
      var type = typeof value;
      if(type === 'integer' || type === 'float' || type === 'number'){
        return value <= 1000;
      }
      return false;
    }
  },

  attributes: require('waterlock').models.user.attributes({
    /* e.g.
    nickname: 'string'
    */
    birthday : {
      type : 'Date'
    },
    firstname : {
      type : 'string'
    },
    lastname : {
      type : 'string'
    },
    status : {
      type : 'string',
      enum : ['active','frozen'],
      defaultsTo : 'active'
    },
    desc : {
      type : 'string',
      maxLength : 140,
      defaultsTo : '我是来自%s的吃货,最喜欢吃的是'
    },
    hometown : {
      type : 'string'
    },
    gender : {
      type : 'string',
      enum : ['male','female']
    },
    picture : {
      type : 'string',
      url : true
    },
    color : {
      type : 'string',
      defaultsTo : 'red'
    },
    host : {
      model : 'Host'
    },
    phone : {
      type : 'string',
      regex : /^\((\d{3})\)\s{0,1}\d{3}-\d{4}$/
    },
    full_address : {
      type : 'string'
    },
    //[{ street : "1974 palou ave", "city" : "San Francisco", "zip" : 94124, "phone" : 14158023853},{},{}]
    address : {
      type : 'array',
      defaultsTo : []
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
    county : {
      type : 'string',
      enum : ["San Francisco County", "Sacramento County", "San Mateo County", "Santa Clara County"]
    },
    zip : {
      type : 'string',
      regex : /^\d{5}(?:[-\s]\d{4})?$/
    },
    receivedEmail : {
      type : 'boolean',
      defaultsTo : true
    },
    orders : {
      collection : 'Order',
      via : 'customer'
    },
    reviews : {
      collection : 'Review',
      via : 'user'
    },
    payment : {
      collection : 'Payment',
      via : 'user'
    },
    pocket : {
      model : 'Pocket',
      via : 'user'
    },
    collects : {
      collection : 'Meal'
    },
    notifications : {
      collection : 'Notification',
      via : 'user'
    },
    coupons : {
      collection : 'Coupon'
    },
    likes : {
      collection : 'Host'
    },
    follow : {
      model : 'Host'
    },
    feature_dishes : {
      type : 'json'
    },
    customerId : {
      type : 'string'
    },
    isCollect : function(mealId){
      return this.collects.some(function(meal){
        return meal.id === mealId;
      });
    },
    points : {
      type : 'integer',
      at1000Max : true,
      defaultsTo : 0
    },
    emailVerified : {
      type : 'boolean',
      defaultsTo : false
    },
    referralBonus : {
      type : 'boolean',
      defaultsTo : false
    },
    referralCode : {
      type : 'string'
    },
    generateCode : function(params, cb){
      if(this.referralCode) {
        if((params.firstname && params.firstname !== this.firstname) || (params.lastname && params.lastname !== this.lastname)) {
          var code = this.referralCode;
          var parts = code.split(".");
          var newCode = (params.firstname || this.firstname) + "." + (params.lastname || this.lastname) + "." + parts[2];
          sails.log.info("code updated: " + code);
          cb(null, newCode);
        }else{
          cb(null, this.referralCode);
        }
      }else{
        var _this = this;
        User.count().exec(function(err, number){
          if(err){
            return cb(err);
          }
          var code = (params.firstname || _this.firstname) + "." + (params.lastname || _this.lastname) + "." + number;
          sails.log.info("code created: " + code);
          cb(null, code);
        })
      }
    }
  }),

  beforeUpdate : function(params, cb){
    if(params.email){
      Auth.update({ user : params.id}, { email : params.email}).exec(cb);
    }else{
      cb();
    }
  },

  afterCreate : function(user, cb){
    Auth.findOne(user.auth).exec(function(err, auth){
      if(err){
        return cb(err);
      }
      User.count().exec(function(err, number){
        if(err){
          return cb(err);
        }
        var emailVerified = !!(auth.googleEmail || (auth.facebookId && auth.email)) ;
        var firstName = auth.firstname || ( auth.name ? auth.name.split(' ')[0] : auth.username) || auth.nickname || 'guest';
        var lastName = auth.lastname || ( auth.name ? auth.name.split(' ')[1] : '') || 'guest';
        var referralCode = firstName + "." + lastName + "." + number;
        var hometown = auth.hometown ? auth.hometown.name : (auth.city ? (auth.city + ", " + auth.province) : 'San Francisco, California');
        var city = auth.location ? ( auth.location.name ? auth.location.name.split(",")[0] : '') : ( auth.city || 'San Francisco');
        var picture = auth.picture ? auth.picture.data.url : ( auth.headimgurl || '');
        var state = auth.location ? ( auth.location.name ? auth.location.name.split(",")[1] : '') : ( auth.province || 'California');
        var gender = auth.gender || (auth.sex === 1 ? "male" : "female");
        sails.log.info("code created: " + referralCode);
        var params = {
          firstname: firstName,
          lastname: lastName,
          gender: gender,
          hometown: hometown,
          email : auth.email,
          desc : user.desc.replace('%s', hometown),
          picture: picture,
          city: city,
          state: state,
          referralCode : referralCode,
          emailVerified : emailVerified
        }
        User.update(user.id, params).exec(function(err, user){
          if(err){
            return cb(err);
          }
          Auth.native(function(err, collection){
            if(err){
              return cb(err);
            }
            var objectId = ObjectID = require('mongodb').ObjectID;
            collection.updateOne({_id : objectId(auth.id)}, { $unset : {
              firstname : "",
              lastname : "",
              gender : "",
              username : "",
              name : "",
              location : "",
              hometown : "",
              picture : ""
            }}, cb);
          });
        })
      })
    })
  }
};
