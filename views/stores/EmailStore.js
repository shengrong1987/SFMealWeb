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

var _emails = [];
var _isCreate = false;

var EmailStore = _.assign({}, EventEmitter.prototype, {

  emitChange: function () {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function (callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function (callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  getAllEmails : function(){
    return _emails;
  },

  isCreate : function(){
    return _isCreate;
  }
});

// Register callback to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch (action.type) {
    case ActionTypes.MODEL_CREATE:
      _isCreate = true;
      EmailStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = EmailStore;
