/**
* Order.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var util = require('../services/util');
module.exports = {

  attributes: {
    index: {
      type: 'string'
    },
    coupon : {
      model : 'Coupon'
    },
    isScheduled : {
      type : 'boolean',
      defaultsTo : false
    },
    type: {
      type: 'string',
      enum: ['order', 'preorder'],
      defaultsTo: 'preorder'
    },
    paymentMethod : {
      type : 'string',
      enum : ['cash','online','venmo','paypal','alipay','wechatpay','weixin','zelle'],
      defaultsTo : 'online'
    },
    dishes: {
      collection: 'Dish',
      required: true
    },
    dynamicDishes: {
      collection: 'Dish'
    },
    orders: {
      type: 'json',
      required: true
    },
    last_orders : {
      type : 'json',
      defaultsTo : {}
    },
    reviewing_orders : {
      type : 'json'
    },
    adjusting_orders : {
      type : 'json',
      defaultsTo : {}
    },
    adjusting_subtotal : {
      type : 'float'
    },
    delivery_fee: {
      type: 'float'
    },
    shipping_fee : {
      type : 'float'
    },
    subtotal: {
      type: 'float',
      required: true
    },
    address: {
      type: 'string',
    },
    phone: {
      type: 'string',
      required: true
    },
    customerPhone : {
      type : 'string',
      required : true
    },
    customerName : {
      type : 'string'
    },
    guestEmail : {
      type : 'string',
      required : true
    },
    hostEmail : {
      type : 'string',
      required : true
    },
    isSendToHost : {
      type : 'boolean',
      defaultsTo : true
    },
    isExpressCheckout : {
      type : 'boolean'
    },
    eta: {
      type: 'Date'
    },
    method: {
      type: 'string',
      enum: ['pickup', 'delivery','shipping'],
      defaultsTo: 'delivery'
    },
    pickupOption : {
      type : 'integer'
    },
    pickupInfo : {
      type : 'json'
    },
    customer: {
      model: 'User'
    },
    meal: {
      model: 'Meal',
      required: true
    },
    host: {
      model: 'Host',
      required: true
    },
    status: {
      type: 'string',
      enum: ['schedule', 'preparing', 'ready', 'adjust', 'cancelling', 'cancel', 'review', 'complete','pending-payment'],
      defaultsTo : 'schedule'
    },
    isPaid : {
      type : 'boolean',
      defaultsTo : 'false'
    },
    lastStatus : {
      type : 'string',
      enum: ['schedule', 'preparing', 'ready', 'adjust', 'cancelling', 'cancel', 'review', 'complete','pending-payment']
    },
    charges : {
      type : 'json'
    },
    transfers : {
      type : 'json'
    },
    msg : {
      type : 'string',
      defaultsTo : ''
    },
    getTaxRate : function(){
      if(this.meal && this.meal.isTaxIncluded){
        return 0;
      }else if(!this.meal || !this.meal.id){
        return this.tax / 100;
      }
      return util.getTaxRate(this.host.county);
    },
    tip :{
      type : 'float',
      defaultsTo : 0
    },
    discountAmount : {
      type : 'float',
      defaultsTo : 0
    },
    redeemPoints : {
      type : 'int',
      defaultsTo : 0
    },
    discount : {
      type : 'float',
      defaultsTo : 0
    },
    tax : {
      type : 'float',
      defaultsTo : 0
    },
    service_fee : {
      type : 'float',
      defaultsTo : 0
    },
    isPartyMode : {
      type : 'boolean',
      defaultsTo : false
    },
    clientSecret : {
      type : 'string'
    },
    isClear : {
      type : 'boolean'
    }
  }
};

