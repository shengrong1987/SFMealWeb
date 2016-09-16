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

var _dishes = [];
var _showDetail = false;

var DishStore = _.assign({}, EventEmitter.prototype, {
  getAllDishes: function () {
    return _dishes;
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
    case ActionTypes.GET_DISHES:
      if(!Array.isArray(action.records)){
        _dishes = [action.records];
      }else{
        _dishes = action.records;
      }
      _showDetail = false;
      DishStore.emitChange();
      break;

    case ActionTypes.GET_DISH:
      if(!Array.isArray(action.records)){
        _dishes = [action.records];
      }else{
        _dishes = action.records;
      }
      _showDetail = true;
      DishStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _dishes = [];
      _showDetail = false;
      DishStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = DishStore;
