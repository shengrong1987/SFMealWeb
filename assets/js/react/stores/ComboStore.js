/*
 * RecordStore
 */

'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ActionTypes from '../constants/AppConstants';
import _ from 'lodash';

var CHANGE_EVENT = 'change';

var _combos = [];
var _showDetail = false;
var _isCreate = false;

var ComboStore = _.assign({}, EventEmitter.prototype, {
  getAllCombos: function () {
    return _combos;
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
    case ActionTypes.GET_COMBOS:
      if(!Array.isArray(action.records)){
        _combos = [action.records];
      }else{
        _combos = action.records;
      }
      _showDetail = false;
      ComboStore.emitChange();
      break;

    case ActionTypes.GET_COMBO:
      if(!Array.isArray(action.records)){
        _combos = [action.records];
      }else{
        _combos = action.records;
      }
      _showDetail = true;
      ComboStore.emitChange();
      break;

    case ActionTypes.MODEL_CREATE:
      _isCreate = true;
      ComboStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _combos = [];
      _showDetail = false;
      ComboStore.emitChange();
      break;

    default:
      // no op
  }
});

export default ComboStore;
