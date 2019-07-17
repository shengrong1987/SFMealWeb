/**
 * User
 *
 * @module      :: Model
 * @description :: This is the base user model
 * @docs        :: http://waterlock.ninja/documentation
 */

var async = require('async');
var geocode = require('../services/geocode');
var mailChimp = require("../services/mailchimp");

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
      type : 'string'
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
      collection : 'Host',
      via : 'followers'
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
      defaultsTo : 0
    },
    emailVerified : {
      type : 'boolean',
      defaultsTo : false
    },
    referralCode : {
      type : 'string'
    },
    referrerCode : {
      type : 'string'
    },
    usedReferralBonus : {
      type : 'boolean',
      defaultsTo : false
    },
    referralBonus : {
      type : 'boolean',
      defaultsTo : false
    },
    newUserRewardIsRedeemed : {
      type : 'boolean',
      defaultsTo : false
    },
    email : {
      type : 'email',
      unique : true
    },
    badgeInfo : {
      /*
      badgeId : {
        isAchieved : true/false
        achievedDate : Date
        customImage : String
      }
       */
      type : 'json'
    },
    generateCode : function(params, cb){
      if(this.referralCode) {
        if((params.firstname && params.firstname !== this.firstname) || (params.lastname && params.lastname !== this.lastname)) {
          var code = this.referralCode;
          var parts = code.split(".");
          var newCode = (params.firstname || this.firstname) + "." + (params.lastname || this.lastname) + "." + parts[2];
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
          var code = (params.firstname || _this.firstname || params.nickname || 'chi') + "." + (params.lastname || _this.lastname || 'huo') + "." + number;
          cb(null, code);
        })
      }
    }
  }),

  beforeUpdate : function(params, cb){
    var attrs = {};
    if(params.email || params.unionid){
      if(params.email){attrs.email = params.email;}
      if(params.unionid){attrs.unionid = params.unionid;}
      Auth.update({ user : params.id}, attrs).exec(cb);
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
        var email = auth.email || auth.googleEmail;
        var emailVerified = !!(auth.googleEmail || (auth.facebookId && auth.email)) ;
        var firstName = auth.firstname || ( auth.name ? auth.name.split(' ')[0] : auth.username) || auth.nickname || 'guest';
        var lastName = auth.lastname || ( auth.name ? auth.name.split(' ')[1] : '') || 'guest';
        var referralCode = firstName + "." + lastName + "." + number;
        var hometown = auth.hometown ? auth.hometown.name : (auth.city ? (auth.city + ", " + auth.province) : 'San Francisco, California');
        var city = auth.location ? ( auth.location.name ? auth.location.name.split(",")[0] : '') : ( auth.city || 'San Francisco');
        var picture = auth.picture ? auth.picture.data.url : ( auth.headimgurl || '');
        var state = auth.location ? ( auth.location.name ? auth.location.name.split(",")[1] : '') : ( auth.province || 'California');
        var gender = auth.gender || (auth.sex === 1 ? "male" : "female");
        var language = auth.language;
        var typeOfUser = user.receivedEmail ? "subscriber" : "member";
        if(auth.email && process.env.NODE_ENV === "production"){
          mailChimp.addMemberToList({ email : email, firstname : firstName, lastname : lastName}, typeOfUser);
        }else{
          //in development mode, skipping subscription
        }
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
          emailVerified : emailVerified,
          language : language
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
