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

var _jobs = [];
var _showDetail = false;

var JobStore = _.assign({}, EventEmitter.prototype, {
  getAllJobs: function () {
    return _jobs;
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
    case ActionTypes.GET_JOBS:
      if(!Array.isArray(action.records)){
        _jobs = [action.records];
      }else{
        _jobs = action.records;
      }
      _showDetail = false;
      JobStore.emitChange();
      break;

    case ActionTypes.GET_JOB:
      if(!Array.isArray(action.records)){
        _jobs = [action.records];
      }else{
        _jobs = action.records;
      }
      _showDetail = true;
      JobStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _jobs = [];
      _showDetail = false;
      JobStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = JobStore;
