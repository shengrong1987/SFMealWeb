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
      Host.find({ passGuide: true }).populate("orders").populate('meals').exec(function (err, hosts) {
        if (err) {
          sails.log.error(err);
          return done();
        }
        var todayDate = new Date().getDate();
        var fromDate = new Date().setDate(todayDate - 8);
        var toDate = new Date().setDate(todayDate - 2);

        hosts = hosts.filter(function (host) {
          host.orders = host.orders.filter(function (order) {
            return !order.isPaid && (order.status === "review" || order.status === "complete") && order.createdAt.getTime() > fromDate && order.createdAt < toDate;
          });
          return host.orders.length !== 0;
        });

        if (hosts.length === 0) {
          return done();
        }

        var showDates = [];
        for(var i=0 ; i < 7; i++){
          var mFromDate = moment(fromDate);
          mFromDate.add(i, 'days');
          var month = moment.months()[mFromDate.month()];
          var day = mFromDate.date();
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
              var transfer = order.transfer;
              async.each(Object.keys(charges), function (chargeId, next3) {
                stripe.retrieveCharge(chargeId, function (err, charge) {
                  if (err) {
                    return next3(err);
                  }
                  Host.findOne(host.id).exec(function (err, host) {
                    if (err) {
                      return next3(err);
                    }
                    stripe.retrieveApplicationFee(charge.application_fee, function(err, fee){
                      if(err){
                        return next(err);
                      }
                      if(chargeId === "cash"){
                        var date = moment(new Date(order.createdAt).getTime());
                        charge.income = order.charges['cash'];
                        charge.application_fee = order.application_fees['cash'];
                      }else {
                        date = moment(charge.created * 1000);
                        charge.application_fee = fee.amount - fee.amount_refunded;
                        charge.income = (charge.amount - charge.amount_refunded);
                      }

                      charge.month = moment.months()[date.month()];
                      charge.day = date.date();
                      charge.type = "payment";
                      charge.host = host;
                      var paidInPeriod = false;
                      for(var i=0; i < 7; i++){
                        var dateObj = showDates[i];
                        date = dateObj.date;
                        var dateInfos = date.split(" ");
                        if(dateInfos.length > 1 && dateInfos[0] === charge.month && parseInt(dateInfos[1]) === charge.day){
                          orderTotalPayment += charge.income - charge.application_fee;
                          dateObj.income += charge.income;
                          dateObj.fee += charge.application_fee;
                          dateObj.number++;
                          paidInPeriod = true;
                        }
                      }
                      if(paidInPeriod){
                        transactions.push(charge);
                      }
                      next3();
                    });
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
                  return order.meal === meal.id;
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
