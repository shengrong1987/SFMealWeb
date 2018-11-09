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

var _pickups = [];
var _showDetail = false;
var _isCreate;

var PickupOptionStore = _.assign({}, EventEmitter.prototype, {
  getAllPickups: function () {
    return _pickups;
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
    case ActionTypes.GET_PICKUPOPTIONS:
      _isCreate = false;
      if(!Array.isArray(action.records)){
        _pickups = [action.records];
      }else{
        _pickups = action.records;
      }
      _showDetail = false;
      PickupOptionStore.emitChange();
      break;
    case ActionTypes.GET_PICKUPOPTION:
      _isCreate = false;
      if(!Array.isArray(action.records)){
        _pickups = [action.records];
      }else{
        _pickups = action.records;
      }
      _showDetail = true;
      PickupOptionStore.emitChange();
      break;

    case ActionTypes.MODEL_CREATE:
      _isCreate = true;
      PickupOptionStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _pickups = [];
      _showDetail = false;
      _isCreate = false;
      PickupOptionStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = PickupOptionStore;
