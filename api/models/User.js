/**
 * User
 *
 * @module      :: Model
 * @description :: This is the base user model
 * @docs        :: http://waterlock.ninja/documentation
 */

module.exports = {

  attributes: require('waterlock').models.user.attributes({
    /* e.g.
    nickname: 'string'
    */
    username : {
      type : 'string',
      maxLength : 20
    },
    firstname : {
      type : 'string',
      maxLength : 10
    },
    lastname : {
      type : 'string',
      maxLength : 10
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
      type : 'string'
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
      defaultsTo : '000-000-0000'
    },
    full_address : {
      type : 'string'
    },
    //[{ street : "1974 palou ave", "city" : "San Francisco", "zip" : 94124, "phone" : 14158023853},{},{}]
    address_list : {
      type : 'json',
      defaultsTo : {}
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
    birthday : {
      type : 'datetime'
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
    featureDishes : {
      collection : 'Dish',
      defaultsTo : []
    }
  }),

  cloneToUser : function(user,data,cb){
    user.firstname = data.firstname;
    user.lastname = data.lastname;
    if(data.phone){
      user.phone = data.phone;
    }
    if(data.gender){
      user.gender = data.gender;
    }
    if(data.birthday){
      user.birthday = data.birthday;
    }
    if(data.picture){
      user.picture = data.picture;
    }
    if(data.receivedEmail){
      user.receivedEmail = data.receivedEmail;
    }
    user.save(cb);
  },

  beforeCreate: require('waterlock').models.user.beforeCreate,
  beforeUpdate: require('waterlock').models.user.beforeUpdate
};
