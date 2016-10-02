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

  attributes: require('waterlock').models.user.attributes({
    /* e.g.
    nickname: 'string'
    */
    birthday : {
      type : 'Date'
    },
    firstname : {
      type : 'string',
      regex : /^([A-z\ ]{1,15})$/
    },
    lastname : {
      type : 'string',
      regex : /^([A-z\ ]{1,15})$/
    },
    status : {
      type : 'string',
      enum : ['active','frozen'],
      defaultsTo : 'active'
    },
    desc : {
      type : 'string',
      maxLength : 140
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
      enum : ["San Francisco County","Sacramento County"]
    },
    zip : {
      type : 'string',
      regex : /^\d{5}(?:[-\s]\d{4})?$/
    },
    birthday : {
      type : 'date'
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
    featureDishes : {
      collection : 'Dish',
      defaultsTo : []
    },
    isCollect : function(mealId){
      return this.collects.some(function(meal){
        return meal.id == mealId;
      });
    }
  }),

  cloneToUser : function(user,data,cb){
    delete user.auth.password;
    delete data.password;
    delete data.id;
    delete data.email;
    delete data.facebookId;
    async.each(Object.keys(data), function(key, next){
      if(typeof user[key] != 'undefined' || user[key]) {
        return next();
      }
      if(key == 'name'){
        var names = data[key].split(' ');
        if(names.length > 1){
          user['firstname'] = user['firstname'] || names[0];
          user['lastname'] = user['lastname'] || names[1];
        }
        next();
      }else if(key == 'picture'){
        user[key] = data[key].data.url;
        next();
      }else if(key == 'hometown'){
        user[key] = data[key].name;
        if(!user['desc']){
          user['desc'] = "我是来自" + data[key].name + "的吃货";
        }
        next();
      }else if(key == 'location'){
        geocode.geocodeCity(data[key].name, function(err, result){
          if(err){
            console.log("err geocoding city:" + data[key].name);
            return next(err);
          }
          user['county'] = result[0].administrativeLevels.level2long;
          next();
        });
      }else{
        user[key] = data[key];
        next();
      }
    }, function(err){
      if(err){
        return cb(err);
      }
      user.save(cb);
    });
  }
};
