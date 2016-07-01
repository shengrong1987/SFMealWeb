/**
 * DishController
 *
 * @description :: Server-side logic for managing Pocket
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripe = require("../services/stripe.js");
var moment = require("moment");

module.exports = {

  findOne : function(req, res){
    var chargeId = req.params.id;
    stripe.retrieveCharge(chargeId, function(err, charge){
      if(err){
        return res.badRequest(err);
      }
      var date = moment(charge.created * 1000);
      charge.application_fee = (charge.amount - charge.amount_refunded) * 0.10;
      charge.month = moment.months()[date.month()];
      charge.day = date.date();
      return res.ok({transactions : charge});
    });
  },

  getUserBalance : function(req, res){
    var userId = req.params.id;
    User.findOne(userId).populate("orders").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      var transactions = [];
      async.each(user.orders, function (order, next) {
        var charges = Object.keys(order.charges);
        async.each(charges, function (chargeId, next) {
          stripe.retrieveCharge(chargeId, function(err, charge){
            if(err){
              return next(err);
            }
            Host.findOne(charge.metadata.hostId).exec(function(err, host){
              if(err){
                return next(err);
              }
              charge.application_fee = "N/A";
              charge.type = "charge";
              var date = moment(charge.created * 1000);
              charge.month = moment.months()[date.month()];
              charge.day = date.date();
              transactions.push(charge);
              next();
            });
          });
        }, function (err) {
          if(err){
            return next(err);
          }
          next();
        });
      }, function (err) {
        if(err){
          return res.badRequest(err);
        }
        return res.ok({transactions : transactions})
      });
    });
  },

  getHostBalance : function(req, res){
    var hostId = req.params.id;
    Host.findOne(hostId).populate("orders").exec(function(err, host){
      if(err || !host){
        return res.badRequest(err);
      }
      stripe.getBalance({id : host.accountId}, function(err, balance){
        if(err){
          return res.badRequest(err);
        }
        var totalBalance = balance.available.reduce(function(preValue, curValue){
          return preValue.amount + curValue.amount;
        });

        var pendingBalance = balance.pending.reduce(function(preValue, curValue){
          return preValue.amount + curValue.amount;
        });

        var transactions = [];
        async.each(host.orders, function (order, next) {
          var charges = order.charges;
          async.each(Object.keys(charges), function(chargeId , next){
            stripe.retrieveCharge(chargeId, function(err, charge){
              if(err){
                return next(err);
              }
              var hostId = charge.metadata.hostId;
              Host.findOne(hostId).exec(function (err, host) {
                if (err) {
                  return next(err);
                }
                charge.application_fee = (charge.amount - charge.amount_refunded) * 0.10;
                var date = moment(charge.created * 1000);
                charge.month = moment.months()[date.month()];
                charge.day = date.date();
                charge.type = "payment";
                transactions.push(charge);
                next();
              })
            });
          },function(err){
            if(err){
              return next(err);
            }
            next();
          });
        },function(err){
          if(err){
            return res.badRequest(err);
          }
          return res.ok({ totalBalance : totalBalance, pendingBalance : pendingBalance, transactions : transactions})
        });
      });
    });
  }
};

