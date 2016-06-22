'use strict';

var keyMirror = require('react/lib/keyMirror');

module.exports = {
  ActionTypes: keyMirror({
    GET_USERS: null,
    GET_USER : null,
    GET_HOSTS : null,
    GET_HOST : null,
    GET_MEALS : null,
    GET_MEAL : null,
    GET_ORDERS : null,
    GET_ORDER : null,
    GET_DISHES : null,
    GET_DISH : null,
    TAB_CHANGE : null,
    SEARCH_CHANGE : null,
    NO_RESULT : null,
    BAD_REQUEST : null
  }),
};
