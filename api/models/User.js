/**
 * User
 *
 * @module      :: Model
 * @description :: This is the base user model
 * @docs        :: http://waterlock.ninja/documentation
 */

var async = require('async');

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
      maxLength : 15,
      regex : /^([A-z\ ]{1,15})$/
    },
    lastname : {
      type : 'string',
      maxLength : 15,
      regex : /^([A-z\ ]{1,15})$/
    },
    status : {
      type : 'string',
      enum : ['active','frozen'],
      defaultsTo : 'active'
    },
    desc : {
      type : 'string',
      maxLength : 140,
      defaultsTo : "我是吃货，我爱吃柠檬芝士蛋糕。"
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
    Object.keys(data).forEach(function(key){
      user[key] = data[key];
    });
    user.save(cb);
  }
};
