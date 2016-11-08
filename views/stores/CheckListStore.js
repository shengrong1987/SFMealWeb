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

var _checkList = [];
var _showDetail = false;

var CheckListStore = _.assign({}, EventEmitter.prototype, {
  getAllChecklist: function () {
    return _checkList;
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
    case ActionTypes.GET_CHECKLISTS:
      if(!Array.isArray(action.records)){
        _checkList = [action.records];
      }else{
        _checkList = action.records;
      }
      _showDetail = false;
      CheckListStore.emitChange();
      break;

    case ActionTypes.GET_CHECKLIST:
      if(!Array.isArray(action.records)){
        _checkList = [action.records];
      }else{
        _checkList = action.records;
      }
      _showDetail = true;
      CheckListStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _checkList = [];
      _showDetail = false;
      CheckListStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = CheckListStore;
