/*
 * RecordStore
 */

'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ActionTypes from '../constants/AppConstants';
import _ from 'lodash';
import EmailStore from "./EmailStore";

var CHANGE_EVENT = 'change';

var _badges = [];
var _showDetail = false;
var _isCreate = false;

var BadgeStore = _.assign({}, EventEmitter.prototype, {
  getAllBadges: function () {
    return _badges;
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
  },

  isCreate : function(){
    return _isCreate;
  }
});

// Register callback to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;
  _isCreate = false;

  switch (action.type) {
    case ActionTypes.GET_BADGES:
      if(!Array.isArray(action.records)){
        _badges = [action.records];
      }else{
        _badges = action.records;
      }
      _showDetail = false;
      BadgeStore.emitChange();
      break;

    case ActionTypes.GET_BADGE:
      if(!Array.isArray(action.records)){
        _badges = [action.records];
      }else{
        _badges = action.records;
      }
      _showDetail = true;
      BadgeStore.emitChange();
      break;

    case ActionTypes.MODEL_CREATE:
      _isCreate = true;
      BadgeStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _badges = [];
      _showDetail = false;
      BadgeStore.emitChange();
      break;

    default:
      // no op
  }
});

export default BadgeStore;
