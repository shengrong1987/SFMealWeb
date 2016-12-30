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

var _coupons = [];
var _showDetail = false;

var CouponStore = _.assign({}, EventEmitter.prototype, {
  getAllCoupons: function () {
    return _coupons;
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
    case ActionTypes.GET_COUPONS:
      if(!Array.isArray(action.records)){
        _coupons = [action.records];
      }else{
        _coupons = action.records;
      }
      _showDetail = false;
      CouponStore.emitChange();
      break;

    case ActionTypes.GET_COUPON:
      if(!Array.isArray(action.records)){
        _coupons = [action.records];
      }else{
        _coupons = action.records;
      }
      _showDetail = true;
      CouponStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _dishes = [];
      _showDetail = false;
      CouponStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = CouponStore;
