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

var _users = [];
var _showDetail = false;

var UserStore = _.assign({}, EventEmitter.prototype, {
  getAllUsers: function () {
    return _users;
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
    case ActionTypes.GET_USERS:
      if(!Array.isArray(action.records)){
        _users = [action.records];
      }else{
        _users = action.records;
      }
      _showDetail = false;
      UserStore.emitChange();
      break;

    case ActionTypes.GET_USER:
      if(!Array.isArray(action.records)){
        _users = [action.records];
      }else{
        _users = action.records;
      }
      _showDetail = true;
      UserStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _users = [];
      _showDetail = false;
      UserStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = UserStore;
