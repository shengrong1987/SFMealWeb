/*
 * RecordStore
 */

'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ActionTypes from '../constants/AppConstants';
import _ from 'lodash';

var CHANGE_EVENT = 'change';

var _orders = [];
var _showDetail = false;
var _contentView = "";

var OrderStore = _.assign({}, EventEmitter.prototype, {
  getAllOrders: function () {
    return _orders;
  },

  getContentView : function(){
    return _contentView;
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
    case ActionTypes.GET_ORDERS:
      if(!Array.isArray(action.records)){
        _orders = [action.records];
      }else{
        _orders = action.records;
      }
      _showDetail = false;
      OrderStore.emitChange();
      break;

    case ActionTypes.GET_ORDER:
      if(!Array.isArray(action.records)){
        _orders = [action.records];
      }else{
        _orders = action.records;
      }
      _showDetail = true;
      OrderStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _orders = [];
      _showDetail = false;
      OrderStore.emitChange();
      break;

    default:
      // no op
  }
});

export default OrderStore;