/**
 * Created by shengrong on 7/27/16.
 */
var util = require('../services/util');
var async = require('async');
module.exports = function(agenda) {
  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this hob
    //disabled: false,

    // method can be 'every <interval>', 'schedule <when>' or now
    frequency: 'every 5 seconds',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    //data: {},

    // execute job
    run: function(job, done) {
      console.log("Order check executed");
      var now = new Date();
      Order.find({ status : ["schedule","preparing"], isScheduled : false}).exec(function(err, orders){
        if(err){
          return done();
        }

        async.each(orders, function( order, cb){
          order.isScheduled = true;
          order.save(function(err, result){
            if(err){
              return cb(err);
            }
            if(order.type == "order"){
              var tenMinutesBeforePickup = util.minutesBefore(order.eta);
              if(order.method == "pickup"){
                console.log("scheduling pickup reminding Job at: " + tenMinutesBeforePickup);
                Jobs.schedule(tenMinutesBeforePickup, 'pickupReminderJob', {orderId : order.id, period : "minute"});
              }else{
                console.log("scheduling delivery reminding Job at: " + tenMinutesBeforePickup);
                Jobs.schedule(tenMinutesBeforePickup, 'deliveryReminderJob', {orderId : order.id, period : "minute"});
              }
            }else{
              if(order.method == "pickup"){
                var oneHourBeforePickup = util.oneHourBefore(order.pickupInfo.pickupFromTime);
                var oneDayBeforePickup = util.oneDayBefore(order.pickupInfo.pickupFromTime);
                if(now < oneDayBeforePickup){
                  console.log("scheduling pickup reminding Job at: " + oneHourBeforePickup);
                  Jobs.schedule(oneHourBeforePickup, 'pickupReminderJob', {orderId : order.id, period : "hour"});
                }
                if(now < oneHourBeforePickup){
                  console.log("scheduling pickup reminding Job at: " + oneDayBeforePickup);
                  Jobs.schedule(oneDayBeforePickup, 'pickupReminderJob', {orderId : order.id, period : "day"});
                }
              }else{
                var tenMinutesBeforeReceive = util.minutesBefore(order.eta);
                console.log("scheduling pickup deliverying Job at: " + tenMinutesBeforeReceive);
                Jobs.schedule(tenMinutesBeforeReceive, 'arriveReminderJob', {orderId : order.id, period : "minute"});
              }
            }
            cb();
          })
        },function(err){
          if(err){
            console.log(err);
          }
          done();
        });
      });
    }
  };
  return job;
}
