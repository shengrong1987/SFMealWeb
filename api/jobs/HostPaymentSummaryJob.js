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
    // frequency: 'every week',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    // data: {},

    // execute job
    run: function (job, done) {
      sails.log.info("Sending host income summary");
      Host.find({passGuide: true}).populate("orders").populate('meals').exec(function (err, hosts) {
        if (err) {
          sails.log.error(err);
          return done();
        }
        hosts = hosts.filter(function (host) {
          host.orders = host.orders.filter(function (order) {
            return !order.isPaid && (order.status == "review" || order.status == "complete");
          })
          return host.orders.length != 0;
        });

        if (hosts.length == 0) {
          return done();
        }

        var todayDate = new Date().getDate();
        var fromDate = new Date().setDate(todayDate - 8);
        var toDate = new Date().setDate(todayDate - 2);
        var showDates = [];
        for(var i=0 ; i < 7; i++){
          var newDate = new Date();
          newDate.setDate(new Date(fromDate).getDate() + i);
          var month = moment.months()[newDate.getMonth()];
          var day = newDate.getDate();
          var dateObj = {
            date : month + " " + day,
            income : 0,
            fee : 0,
            number : 0
          };
          showDates.push(dateObj);
        }

        async.each(hosts, function (host, next) {
          stripe.getBalance({id: host.accountId}, function (err, balance) {
            if (err) {
              return next(err);
            }
            var totalBalance = balance.available.reduce(function (preValue, curValue) {
              return preValue.amount + curValue.amount;
            });
            var transactions = [];
            var orderTotalPayment = 0;
            async.each(host.orders, function (order, next2) {
              var charges = order.charges;
              async.each(Object.keys(charges), function (chargeId, next3) {
                stripe.retrieveCharge(chargeId, function (err, charge) {
                  if (err) {
                    return next3(err);
                  }
                  var hostId = charge.metadata.hostId;
                  Host.findOne(hostId).exec(function (err, host) {
                    if (err) {
                      return next3(err);
                    }
                    var date = moment(charge.created * 1000);
                    charge.income = (charge.amount - charge.amount_refunded);
                    charge.application_fee = charge.income * 0.10;
                    charge.month = moment.months()[date.month()];
                    charge.day = date.date();
                    charge.type = "payment";
                    charge.host = host;
                    var paidInPeriod = false;
                    for(var i=0; i < 7; i++){
                      var dateObj = showDates[i];
                      var date = dateObj.date;
                      var dateInfos = date.split(" ");
                      if(dateInfos.length > 1 && dateInfos[0] == charge.month && dateInfos[1] == charge.day){
                        orderTotalPayment += charge.income - charge.application_fee;
                        dateObj.income += charge.income;
                        dateObj.fee += charge.application_fee;
                        dateObj.number++;
                        paidInPeriod = true;
                      }
                    }
                    if(!paidInPeriod){
                      transactions.push(charge);
                    }
                    next3();
                  })
                });
              }, function (err) {
                if (err) {
                  return next2(err);
                }
                order.isPaid = true;
                order.save(next2);
              });
            }, function (err) {
              if (err) {
                return next(err);
              }
              var meals = host.meals.filter(function(meal){
                return host.orders.some(function(order){
                  return order.meal == meal.id;
                })
              });
              var score = 0;
              meals.forEach(function(meal){
                score += meal.score;
              });
              host.score = score / meals.length;
              host.numberOfMeal = meals.length;
              host.totalBalance = totalBalance;
              host.orderTotalPayment = orderTotalPayment;
              host.transactions = transactions;
              host.showDates = showDates;
              notification.sendEmail("Host", "summary", {host: host, hostEmail: host.email, isSendToHost: true});
              next();
            });
          }, function (err) {
            if (err) {
              sails.log.error(err);
              return done();
            }
            done();
          });
        });
      });
    }
  }
  return job;
}
