/**
 * Created by shengrong on 7/27/16.
 */
var async = require('async');
var util = require('../services/util');
var stripe = require("../services/stripe");
var notification = require("../services/notification");
var moment = require("moment");

module.exports = function(agenda) {
  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this job
    disabled: false,

    // method can be 'every <interval>', 'schedule <when>' or now
    // frequency: 'schedule next tuesday',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    // data: {},

    // execute job
    run: function (job, done) {
      sails.log.info("scheduling host summary report job");
      agenda.every('week','HostPaymentSummaryJob');
      done();
    }
  }
  return job;
}