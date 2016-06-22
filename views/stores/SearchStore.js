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

var _criteria = '';
var _search = '';
var _errMsg = '';

var SearchStore = _.assign({}, EventEmitter.prototype, {
  getSearchData: function () {
    return { criteria : _criteria, search : _search, errMsg : _errMsg};
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
    case ActionTypes.SEARCH_CHANGE:
      _criteria = action.criteria;
      _search = action.search;
      _errMsg = "";
      SearchStore.emitChange();
      break;

    case ActionTypes.NO_RESULT:
      _errMsg = action.msg;
      SearchStore.emitChange();
      break;

    case ActionTypes.BAD_REQUEST:
      _errMsg = action.msg;
      SearchStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = SearchStore;
