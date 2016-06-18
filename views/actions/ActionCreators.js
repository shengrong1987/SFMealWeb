'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
  Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

var ActionsCreators = {

  getUsers: function (records) {

    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_USERS,
      records: records
    });
  },

  getHosts : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_HOSTS,
      records: records
    });
  },

  getMeals: function (records) {

    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_MEALS,
      records: records
    });
  },

  getOrders : function (records){
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_ORDERS,
      records: records
    });
  },

  switchTab : function(tab){
    AppDispatcher.handleViewAction({
      type : ActionTypes.TAB_CHANGE,
      tab : tab
    });
  }
};

module.exports = ActionsCreators;
