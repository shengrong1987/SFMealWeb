'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
  Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

var ActionsCreators = {

  getUser: function (records) {

    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_USER,
      records: records
    });
  },

  getUsers: function (records) {

    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_USERS,
      records: records
    });
  },

  getHost : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_HOST,
      records: records
    });
  },

  getHosts : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_HOSTS,
      records: records
    });
  },

  getMeal : function( records ){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_MEAL,
      records: records
    });
  },

  getMeals: function (records) {

    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_MEALS,
      records: records
    });
  },

  getDish : function( records ){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_DISH,
      records: records
    });
  },

  getDishes: function (records) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_DISHES,
      records: records
    });
  },

  getOrder : function(records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_ORDER,
      records: records
    });
  },

  getOrders : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_ORDERS,
      records: records
    });
  },

  getTransaction : function(records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_TRANSACTION,
      transactions: records.transactions,
      total : records.totalBalance
    });
  },

  getTransactions : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_TRANSACTIONS,
      transactions: records.pocket.transactions,
      totalBalance : records.pocket.totalBalance,
      pendingBalance : records.pocket.pending_balances
    });
  },

  getJob : function(records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_JOB,
      records: records
    });
  },

  getJobs : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_JOBS,
      records: records
    });
  },

  getCheckList : function(records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_CHECKLIST,
      records: records
    });
  },

  getCheckLists : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_CHECKLISTS,
      records: records
    });
  },

  getCoupon : function(records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_COUPON,
      records: records
    });
  },

  getCoupons : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_COUPONS,
      records: records
    });
  },

  switchTab : function(tab){
    AppDispatcher.handleViewAction({
      type : ActionTypes.TAB_CHANGE,
      tab : tab
    });
  },

  search : function(criteria, content){
    AppDispatcher.handleViewAction({
      type : ActionTypes.SEARCH_CHANGE,
      criteria : criteria,
      search : content
    })
  },

  create : function(model){
    AppDispatcher.handleViewAction({
      type : ActionTypes.MODEL_CREATE,
      model : model
    })
  },

  noResult : function(msg){
    AppDispatcher.handleViewAction({
      type : ActionTypes.NO_RESULT,
      msg : msg
    })
  },

  badRequest : function(msg){
    AppDispatcher.handleViewAction({
      type : ActionTypes.BAD_REQUEST,
      msg : msg
    })
  }
};

module.exports = ActionsCreators;
