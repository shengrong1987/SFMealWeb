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

var _meals = [];
var _showDetail = false;

var MealStore = _.assign({}, EventEmitter.prototype, {
  getAllMeals: function () {
    return _meals;
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
    case ActionTypes.GET_MEALS:
      if(!Array.isArray(action.records)){
        _meals = [action.records];
      }else{
        _meals = action.records;
      }
      _showDetail = false;
      MealStore.emitChange();
      break;

    case ActionTypes.GET_MEAL:
      if(!Array.isArray(action.records)){
        _meals = [action.records];
      }else{
        _meals = action.records;
      }
      _showDetail = true;
      MealStore.emitChange();

      break;

    case ActionTypes.NO_RESULT:
      _meals = [];
      _showDetail = false;
      MealStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = MealStore;
