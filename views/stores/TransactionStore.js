/*
 * RecordStore
 */

'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
  EventEmitter = require('events').EventEmitter,
  AppConstants = require('../constants/AppConstants'),
  ActionTypes = AppConstants.ActionTypes,
  _ = require('lodash');

var CHANGE_EVENT = 'change';

var _transactions = [];
var _totalBalance = 0;
var _pendingBalance = 0;
var _showDetail = false;

var TransactionStore = _.assign({}, EventEmitter.prototype, {
  getAllTransactions: function () {
    return _transactions;
  },

  getBalance : function(){
    return "Balance available(" + (_totalBalance ? _totalBalance.currency : '') + "):" + (_totalBalance ? _totalBalance.amount : "N/A") + "   Balance pending: " + (_pendingBalance ? _pendingBalance.amount : "N/A");
  },

  isShowDetail : function(){
    return _showDetail;
  },

  emitChange: function () {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function (callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function (callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

// Register callback to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch (action.type) {
    case ActionTypes.GET_TRANSACTIONS:
      if(!Array.isArray(action.transactions)){
        _transactions = [action.transactions];
      }else{
        _transactions = action.transactions;
      }
      _totalBalance = action.totalBalance;
      _pendingBalance = action.pendingBalance;
      _showDetail = false;
      TransactionStore.emitChange();
      break;

    case ActionTypes.GET_TRANSACTION:
      if(!Array.isArray(action.transactions)){
        _transactions = [action.transactions];
      }else{
        _transactions = action.transactions;
      }
      _totalBalance = action.totalBalance;
      _pendingBalance = action.pendingBalance;
      _showDetail = true;
      TransactionStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _transactions = [];
      _showDetail = false;
      _totalBalance = null;
      _pendingBalance = null;
      TransactionStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = TransactionStore;
