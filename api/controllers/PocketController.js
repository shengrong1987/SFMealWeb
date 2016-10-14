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

  createOrGetPocket : function(user, host, isHost, cb){
    if((!isHost && user.pocket)){
      return cb(null, user.pocket);
    }else if(isHost && host.pocket){
      return cb(null, host.pocket);
    }
    if(isHost){
      Pocket.create({ user : user.id, host : host.id}).exec(function(err, pocket){
        if(err){
          return cb(err);
        }
        cb(null, pocket);
      })
    }else{
      Pocket.create({ user : user.id}).exec(function(err, pocket){
        if(err){
          return cb(err);
        }
        cb(null, pocket);
      })
    }
  },

  getBalance : function(req, res){
    var host = req.session.user.host;
    if(!host){
      return this.getUserBalance(req, res);
    }else{
      return this.getHostBalance(req, res);
    }
  },

  getUserBalance : function(req, res){
    var _this = this;
    if(req.session.user.auth.email != "admin@sfmeal.com" && req.params.id){
      return res.forbidden();
    }
    var isAdmin = req.session.user.auth.email == "admin@sfmeal.com";
    var userId = isAdmin ? req.params.id : req.session.user.id;
    User.findOne(userId).populate("orders").populate('pocket').exec(function(err, user) {
      if (err) {
        return res.badRequest(err);
      }
      _this.createOrGetPocket(user, null, false, function (err, pocket) {
        if (err) {
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
                charge.host = host;
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
          pocket.transactions = transactions;
          user.pocket = pocket;
          if(req.wantsJSON){
            return res.ok({pocket : pocket});
          }
          res.view('pocket', {user : user});
        });
      })
    });
  },

  getBalanceHistory : function(host, cb) {
    Host.findOne(host.id).populate('pocket').exec(function (err, host) {
      if (err) {
        return cb(err);
      }
      stripe.listTransactions({
        id: host.accountId
      }, function (err, transactions) {
        if (err) {
          return cb(err);
        }
        var pocket = host.pocket;
        pocket.transactions_history = transactions.data;
        pocket.save(function (err, p) {
          if (err) {
            return cb(err);
          }
          return cb(null, pocket);
        })
      });
    });
  },

  getHostBalance : function(req, res){
    var _this = this;
    if(req.session.user.auth.email != "admin@sfmeal.com" && req.params.id){
      return res.forbidden();
    }
    var isAdmin = req.session.user.auth.email == "admin@sfmeal.com";
    var hostId = isAdmin ? req.params.id : (req.session.user.host.id ? req.session.user.host.id : req.session.user.host);
    Host.findOne(hostId).populate("orders").populate('user').populate('pocket').exec(function(err, host){
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

        _this.createOrGetPocket(host.user, host, true, function(err, pocket){
          if(err){
            return res.badRequest(err);
          }
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
                  charge.host = host;
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
            pocket.totalBalance = totalBalance;
            pocket.pending_balances = pendingBalance;
            pocket.transactions = transactions;

            User.findOne(host.user.id).populate('orders').exec(function(err, user){
              if(err){
                return res.badRequest(err);
              }
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
                      charge.host = host;
                      var date = moment(charge.created * 1000);
                      charge.month = moment.months()[date.month()];
                      charge.day = date.date();
                      pocket.transactions.push(charge);
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
                if(req.wantsJSON){
                  return res.ok({pocket : pocket});
                }
                host.user.pocket = pocket;
                res.view('pocket', {user : host.user, host : host});
              });
            })
          });
        })
      });
    });
  }
};

