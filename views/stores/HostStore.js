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

var _hosts = [];
var _showDetail = false;

var HostStore = _.assign({}, EventEmitter.prototype, {
  getAllHost: function () {
    return _hosts;
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
    case ActionTypes.GET_HOSTS:
      if(!Array.isArray(action.records)){
        _hosts = [action.records];
      }else{
        _hosts = action.records;
      }
      _showDetail = false;
      HostStore.emitChange();
      break;

    case ActionTypes.GET_HOST:
      if(!Array.isArray(action.records)){
        _hosts = [action.records];
      }else{
        _hosts = action.records;
      }
      _showDetail = true;
      HostStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _hosts = [];
      _showDetail = false;
      HostStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = HostStore;
