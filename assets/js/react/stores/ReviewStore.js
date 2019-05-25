/*
 * RecordStore
 */

'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ActionTypes from '../constants/AppConstants';
import _ from 'lodash';

var CHANGE_EVENT = 'change';

var _reviews = [];
var _showDetail = false;

var ReviewStore = _.assign({}, EventEmitter.prototype, {
  getAllReviews: function () {
    return _reviews;
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
    case ActionTypes.GET_REVIEWS:
      if(!Array.isArray(action.records)){
        _reviews = [action.records];
      }else{
        _reviews = action.records;
      }
      _showDetail = false;
      ReviewStore.emitChange();
      break;

    case ActionTypes.GET_REVIEW:
      if(!Array.isArray(action.records)){
        _reviews = [action.records];
      }else{
        _reviews = action.records;
      }
      _showDetail = true;
      ReviewStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _reviews = [];
      _showDetail = false;
      ReviewStore.emitChange();
      break;

    default:
      // no op
  }
});

export default ReviewStore;
