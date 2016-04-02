/**
* Order.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    index: {
      type: 'string'
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
    subtotal: {
      type: 'float',
      required: true
    },
    address: {
      type: 'string',
      required: true
    },
    phone: {
      type: 'string',
      required: true
    },
    eta: {
      type: 'Date'
    },
    method: {
      type: 'string',
      enum: ['pickup', 'delivery'],
      defaultsTo: 'delivery'
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
      enum: ['schedule', 'preparing', 'ready', 'adjust', 'canceling', 'cancel', 'review', 'complete'],
      defaultsTo : 'schedule'
    },
    lastStatus : {
      type : 'string',
      enum: ['schedule', 'preparing', 'ready', 'adjust', 'canceling', 'cancel', 'review', 'complete']
    },
    charges : {
      type : 'json'
    },
    msg : {
      type : 'string'
    },
    statusText: function () {
      switch (this.status) {
        case 'schedule':
          return "已预约";
        case "preparing":
          return "准备中";
        case "ready":
          if(this.type == "order"){
            return "送餐中";
          }else{
            return "待自取";
          }
        case "complete":
          return "已完成";
        case "cancel":
          return "已取消";
        case "adjust":
          return "调整中，待确认";
        case "canceling":
          return "取消中，待确认";
        case "review":
          return "待评价";
        default:
          return "未知";
      }
    }
  }
};

