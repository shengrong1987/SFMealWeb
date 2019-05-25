/*
 * RecordStore
 */

'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ActionTypes from '../constants/AppConstants';
import _ from 'lodash';

var CHANGE_EVENT = 'change';

var _tab = '';

var TabStore = _.assign({}, EventEmitter.prototype, {
  getCurrentTab: function () {
    return _tab;
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
    case ActionTypes.TAB_CHANGE:
      _tab = action.tab;
      TabStore.emitChange();
      break;

    default:
      // no op
  }
});

export default TabStore;
