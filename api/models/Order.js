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
    dishes: {
      collection: 'Dish',
      required: true
    },
    orders: {
      type: 'json',
      required: true
    },
    reviewing_orders : {
      type : 'json'
    },
    adjusting_orders : {
      type : 'json'
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
      model: 'User',
      required: true
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
      enum: ['schedule', 'preparing', 'ready', 'adjust', 'cancelling', 'cancel', 'review', 'complete'],
      defaultsTo : 'schedule'
    },
    isPaid : {
      type : 'boolean',
      defaultsTo : 'false'
    },
    lastStatus : {
      type : 'string',
      enum: ['schedule', 'preparing', 'ready', 'adjust', 'cancelling', 'cancel', 'review', 'complete']
    },
    charges : {
      type : 'json'
    },
    msg : {
      type : 'string',
      defaultsTo : ''
    },
    getTaxRate : function(){
      return util.getTaxRate(this);
    },
    coupon : {
      model : 'Coupon'
    },
    discountAmount : {
      type : 'float',
      defaultsTo : 0
    }
  }
};

