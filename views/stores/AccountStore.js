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

var _accounts = [];
var _showDetail = false;

var AccountStore = _.assign({}, EventEmitter.prototype, {
  getAllAccounts: function () {
    return _accounts;
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
    case ActionTypes.GET_ACCOUNTS:
      if(!Array.isArray(action.records)){
        _accounts = [action.records];
      }else{
        _accounts = action.records;
      }
      _showDetail = false;
      AccountStore.emitChange();
      break;

    case ActionTypes.GET_ACCOUNT:
      if(!Array.isArray(action.records)){
        _accounts = [action.records];
      }else{
        _accounts = action.records;
      }
      _showDetail = true;
      AccountStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _accounts = [];
      _showDetail = false;
      AccountStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = AccountStore;
