/**
 * Created by shengrong on 7/27/16.
 */
var util = require('../services/util');
var async = require('async');
var moment = require("moment");
module.exports = function(agenda) {
  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this hob
    // disabled: true,

    // method can be 'every <interval>', 'schedule <when>' or now
    frequency: 'every 60 seconds',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    //data: {},

    // execute job
    run: function(job, done) {
      var now = new Date();

      Order.find({ status : ["schedule","preparing"], isScheduled : false }).exec(function(err, orders){
        if(err || !orders){
          return done();
        }

        async.each(orders, function(order, cb){
          order.isScheduled = true;
          order.save(function(err, result){
            if(err){
              return cb(err);
            }
            if(order.type === "order"){
              var fifteenMinutesBeforePickup = util.minutesBefore(order.eta, 15);
              sails.log.debug("JOBS Created! - Type: OrderPickupReminderJob on " + moment(fifteenMinutesBeforePickup).format("LLL"));
              Jobs.schedule(fifteenMinutesBeforePickup, 'OrderPickupReminderJob', {orderId : order.id, period : "minute"});
            }else{
              if(!order.isPartyMode){
                if(order.method === "pickup"){
                  var oneHourBeforePickup = new Date(util.oneHourBefore(order.pickupInfo.pickupFromTime));
                  var oneDayBeforePickup = new Date(util.oneDayBefore(order.pickupInfo.pickupFromTime));
                  var orderPickupTime = new Date(order.pickupInfo.pickupFromTime);
                  if(now < oneDayBeforePickup){
                    sails.log.debug("JOBS Created! - Type: OrderPickupReminderJob on " + moment(oneDayBeforePickup).format("LLL"));
                    Jobs.schedule(oneDayBeforePickup, 'OrderPickupReminderJob', {orderId : order.id, period : "day"});
                  }
                  if(now < oneHourBeforePickup){
                    sails.log.debug("JOBS Created! - Type: OrderPickupReminderJob on " + moment(oneHourBeforePickup).format("LLL"));
                    Jobs.schedule(oneHourBeforePickup, 'OrderPickupReminderJob', {orderId : order.id, period : "hour"});
                  }
                  if(now < orderPickupTime){
                    sails.log.debug("JOBS Created! - Type: OrderReadyJob on " + moment(orderPickupTime).format("LLL"));
                    Jobs.schedule(orderPickupTime, 'OrderReadyJob', {orderId : order.id});
                  }
                }else if(order.method === "delivery"){
                  var startDeliveryTime = new Date(order.pickupInfo.pickupFromTime);
                  sails.log.debug("JOBS Created! - Type: OrderDeliveringReminderJob on " + moment(startDeliveryTime).format("LLL"));
                  Jobs.schedule(startDeliveryTime, 'OrderDeliveringReminderJob', {orderId : order.id, period : "minute"});
                }
              }else{
                var orderDeliveryTime = moment(order.pickupInfo.pickupFromTime).subtract(10, 'hours');
                sails.log.debug("JOBS Created! - Type: PartyOrderStartReminderJob on " + moment(orderDeliveryTime).format("LLL"));
                Jobs.schedule(orderDeliveryTime._d, 'PartyOrderStartReminderJob', {orderId : order.id});
              }
            }
            cb();
          })
        },function(err){
          if(err){
            sails.log.error("Error creating order jobs:" + err);
          }
          done();
        });
      });
    }
  };
  return job;
}
