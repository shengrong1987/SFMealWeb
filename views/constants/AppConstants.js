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
    GET_TRANSACTIONS : null,
    GET_TRANSACTION : null,
    GET_JOBS : null,
    GET_JOB : null,
    GET_CHECKLISTS : null,
    GET_CHECKLIST : null,
    GET_COUPON : null,
    GET_COUPONS : null,
    TAB_CHANGE : null,
    SEARCH_CHANGE : null,
    MODEL_CREATE : null,
    NO_RESULT : null,
    BAD_REQUEST : null
  }),
};
