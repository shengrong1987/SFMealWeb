/**
 * Created by shengrong on 7/27/16.
 */
var async = require('async');
var util = require('../services/util');
var stripe = require("../services/stripe");
var notification = require("../services/notification");

module.exports = function(agenda) {
  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this hob
    //disabled: false,

    // method can be 'every <interval>', 'schedule <when>' or now
    frequency: 'every 1 week',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    //data: {},

    // execute job
    run: function(job, done) {
      sails.log.info("Sending host income summary");
      Host.find({passGuide : true}).populate("orders").exec(function(err, hosts){
        if(err){
          sails.log.error(err);
          return done();
        }
        hosts.filter(function(host){
          host.orders.filter(function(order){
            return order.status == "review" || order.status == "complete";
          })
          return host.orders.length != 0;
        });

        if(hosts.length == 0){
          return done();
        }

        async.each(hosts, function(host, next){
          stripe.getBalance({id : host.accountId }, function(err, transactions){
            if(err){
              return next(err);
            }
            host.transactions = transactions;
          });
          notification.sendEmail("Host","summary",{host: host, hostEmail : host.email, isSendToHost : true});
        }, function(err){
          if(err){
            sails.log.error(err);
            return done();
          }
          done();
        });
      });
    }
  };
  return job;
}
