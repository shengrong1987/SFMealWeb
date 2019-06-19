/*
 * RecordStore
 */

'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ActionTypes from '../constants/AppConstants';
import _ from 'lodash';

var CHANGE_EVENT = 'change';

var _drivers = [];
var _showDetail = false;
var _isCreate;

var DriverStore = _.assign({}, EventEmitter.prototype, {
  getAllDrivers: function () {
    return _drivers;
  },

  isShowDetail : function(){
    return _showDetail;
  },

  isCreate : function(){
    return _isCreate;
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
    case ActionTypes.GET_DRIVERS:
      _isCreate = false;
      if(!Array.isArray(action.records)){
        _drivers = [action.records];
      }else{
        _drivers = action.records;
      }
      _showDetail = false;
      DriverStore.emitChange();
      break;
    case ActionTypes.GET_DRIVER:
      _isCreate = false;
      if(!Array.isArray(action.records)){
        _drivers = [action.records];
      }else{
        _drivers = action.records;
      }
      _showDetail = true;
      DriverStore.emitChange();
      break;

    case ActionTypes.MODEL_CREATE:
      _isCreate = true;
      DriverStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _drivers = [];
      _showDetail = false;
      _isCreate = false;
      DriverStore.emitChange();
      break;

    default:
      // no op
  }
});

export default DriverStore;
