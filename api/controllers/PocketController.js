/**
 * DishController
 *
 * @description :: Server-side logic for managing Pocket
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripe = require("../services/stripe.js");
var moment = require("moment");
var async = require("async");

module.exports = {

  findOne : function(req, res){
    var chargeId = req.params.id;
    stripe.retrieveCharge(chargeId, function(err, charge){
      if(err){
        return res.badRequest(err);
      }
      var date = moment(charge.created * 1000);
      charge.application_fee_amount = (charge.amount - charge.amount_refunded) * 0.10;
      charge.month = moment.months()[date.month()];
      charge.day = date.date();
      return res.ok({transactions : charge});
    });
  },

  composeCharge : function(charge, order, host){
    var chargeId = charge.id;
    if(chargeId === "cash"){
      charge.amount = order.charges[chargeId];
      charge.amount_refunded = 0;
      charge.paymentMethod = "cash";
      charge.status = "cash";
      charge.metadata = {
        orderId : order.id,
        deliveryFee : order.delivery_fee,
        tax : order.tax
      }
    }else{
      charge.paymentMethod = "online";
    }
    charge.tip = order.tip;
    charge.deliveryFee = order.delivery_fee;
    charge.orderStatus = order.status;
    charge.host = {
      id : host.id,
      shopName : host.shopName,
      picture : host.picture
    };
    var date = moment(order.createdAt);
    charge.month = moment.months()[date.month()];
    charge.day = date.date();
    charge.created = parseInt(new Date(order.createdAt).getTime()/1000);
    return charge;
  },

  composeTransfer : function(transfer, order, host){
    host.pocket = null;
    host.orders = null;
    var date = moment(transfer.created * 1000);
    transfer.month = moment.months()[date.month()];
    transfer.day = date.date();
    transfer.type = "type-compensation";
    transfer.host = host;
    transfer.paymentMethod = "online";
    transfer.orderStatus = order.status;
    transfer.status = "succeeded";
    return transfer;
  },

  composeFee : function(fee, order, host){
    host.pocket = null;
    host.orders = null;
    var date = moment(fee.created * 1000);
    fee.month = moment.months()[date.month()];
    fee.day = date.date();
    fee.type = "type-fee";
    fee.host = host;
    fee.paymentMethod = "cash";
    fee.deliveryFee = order.delivery_fee;
    fee.metadata = {
      orderId : order.id,
      deliveryFee : order.delivery_fee,
      tax : order.tax,
      total : fee.total
    }
    return fee;
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
        User.update(user.id, { pocket : pocket.id}).exec(function(err, u){
          if(err){
            return cb(err);
          }
          Host.update(host.id, { pocket : pocket.id}).exec(function(err, h){
            if(err){
              return cb(err);
            }
            cb(null, pocket);
          })
        });
      })
    }else{
      Pocket.create({ user : user.id }).exec(function(err, pocket){
        if(err){
          return cb(err);
        }
        User.update(user.id, { pocket : pocket.id}).exec(function(err, u){
          if(err){
            return cb(err);
          }
          cb(null, pocket);
        });
      })
    }
  },

  getBalance : function(req, res){
    var host = req.session.user.host;
    if(!host){
      this.getUserBalance(req, res);
    }else{
      this.getHostBalance(req, res);
    }
  },

  getUserBalance : function(req, res){
    var _this = this;
    if(req.session.user.auth.email && req.session.user.auth.email !== "admin@sfmeal.com" && req.params.id){
      return res.forbidden();
    }
    var isAdmin = req.session.user.auth.email === "admin@sfmeal.com" && req.session.user.emailVerified;
    var userId = isAdmin ? req.params.id : req.session.user.id;
    User.findOne(userId).populate("orders").populate('pocket').populate('payment').exec(function(err, user) {
      if(err){
        return res.badRequest(err);
      }
      _this.createOrGetPocket(user, null, false, function (err, pocket) {
        if (err) {
          return res.badRequest(err);
        }
        var transactions = [];
        async.each(user.orders, function (order, next1) {
          Host.findOne(order.host).exec(function(err, host){
            if(err){
              return next1(err);
            }
            if(!order.charges){
              return next1();
            }
            let charges = Object.keys(order.charges);
            async.each(charges, function (chargeId, next2) {
              stripe.retrieveCharge(chargeId, function(err, charge){
                if(err){
                  return next2(err);
                }
                charge = _this.composeCharge(charge, order, host);
                charge.application_fee_amount = 0;
                charge.type = "type-charge";
                transactions.push(charge);
                next2();
              });
            }, function (err) {
              if(err){
                return next1(err);
              }
              next1();
            });
          });
        }, function (err) {
          if(err){
            return res.badRequest(err);
          }
          pocket.transactions = transactions;
          user.pocket = pocket;
          Badge.find().exec(function(err, badges){
            if(err){
              return res.badRequest(err);
            }
            if(user.badgeInfo){
              Object.keys(user.badgeInfo).forEach(function(key){
                badges = badges.filter(function(b){
                  return b.id === key;
                });
                if(!badges.length){
                  return;
                }
                let badge = badges[0];
                let userBadgeInfo = user.badgeInfo[key];
                badge.isAchieved = userBadgeInfo.isAchieved;
                badge.achievedDate = userBadgeInfo.achievedDate;
                badge.customImage = userBadgeInfo.customImage;
              })
            }
            if(req.wantsJSON && process.env.NODE_ENV === "development"){
              return res.ok({ pocket : pocket, badges: badges });
            }
            res.view('pocket', {user : user, badges : badges });
          });
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
    if(req.session.user.auth.email !== "admin@sfmeal.com" && req.params.id){
      return res.forbidden();
    }
    var isAdmin = req.session.user.auth.email === "admin@sfmeal.com" && (req.session.user.emailVerified || process.env.NODE_ENV === "development");
    var hostId = isAdmin ? req.params.id : (typeof req.session.user.host.id !== 'undefined' ? req.session.user.host.id : req.session.user.host);
    console.log(isAdmin, req.session.user.host);
    Host.findOne(hostId).populate("orders", { limit : 50, sort : 'createdAt DESC'}).populate('user').populate('pocket').exec(function(err, host){
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
          async.each(host.orders, function (order, cb) {
            if(order.status === "cancel"){
              return cb();
            }
            var charges = order.charges;
            var transfer = order.transfer;
            var feeCharges = order.feeCharges;
            async.auto({
              retrieveCharge : function(next){
                if(!charges){
                  return next();
                }
                async.each(Object.keys(charges), function(chargeId , next2){
                  stripe.retrieveCharge(chargeId, function(err, charge){
                    if(err){
                      return next2(err);
                    }
                    charge.type = "type-payment";
                    charge = _this.composeCharge(charge, order, host);
                    stripe.retrieveApplicationFee(charge.application_fee_amount, function(err, fee){
                      if(err){
                        return next2(err);
                      }
                      order.application_fees =  order.application_fees || {};
                      if(chargeId === "cash"){
                        charge.application_fee_amount = order.application_fees['cash'];
                      }else if(fee){
                        charge.application_fee_amount = fee.amount - fee.amount_refunded;
                      }
                      transactions.push(charge);
                      next2();
                    });
                  });
                }, function(err){
                  if (err) {
                    return next(err);
                  }
                  next();
                });
              },
              retrieveTransfer : function(next){
                if(!transfer){
                  return next();
                }
                async.each(Object.keys(transfer), function(transferId, next2){
                  stripe.retrieveTransfer(transferId, function(err, tran){
                    if(err){
                      return next2(err);
                    }
                    tran = _this.composeTransfer(tran, order, host);
                    stripe.retrieveApplicationFee(tran.application_fee_amount, function(err, fee){
                      if(err){
                        return next2(err);
                      }
                      if(fee){
                        tran.application_fee_amount = fee.application_fee_amount - fee.amount_refunded;
                      }else{
                        tran.application_fee_amount = 0;
                      }
                      transactions.push(tran);
                      next2();
                    })
                  })
                }, function(err){
                  if(err){
                    return next(err);
                  }
                  next();
                });
              },
              retrieveFee : function(next){
                if(!feeCharges){
                  return next();
                }
                async.each(Object.keys(feeCharges), function(chargeId, next2){
                  stripe.retrieveCharge(chargeId, function(err, fee){
                    if(err){
                      return next2(err);
                    }
                    fee = _this.composeFee(fee, order, host);
                    transactions.push(fee);
                    next2();
                  });
                }, function(err){
                  if(err){
                    return next(err);
                  }
                  next();
                })
              }
            }, function(err){
              if(err){
                return cb(err);
              }
              cb();
            })
          },function(err){
            if(err){
              return res.badRequest(err);
            }
            pocket.totalBalance = totalBalance;
            pocket.pending_balances = pendingBalance;
            pocket.transactions = transactions;

            User.findOne(host.user.id).populate('orders').populate('payment').exec(function(err, user){
              if(err){
                return res.badRequest(err);
              }
              async.each(user.orders, function (order, cb) {
                if(!order.charges){
                  return cb();
                }
                var charges = Object.keys(order.charges);
                var transfer = order.transfer;
                async.each(charges, function (chargeId, next) {
                  stripe.retrieveCharge(chargeId, function(err, charge){
                    if(err){
                      return next(err);
                    }
                    Host.findOne(order.host).exec(function(err, host){
                      if(err){
                        return next(err);
                      }
                      charge = _this.composeCharge(charge, order, host);
                      charge.type = "type-charge";
                      pocket.transactions.push(charge);
                      next();
                    });
                  });
                }, function (err) {
                  if(err){
                    return cb(err);
                  }
                  cb();
                });
              }, function (err) {
                if(err){
                  return res.badRequest(err);
                }
                if(isAdmin || (req.wantsJSON && process.env.NODE_ENV === "development")){
                  return res.ok({pocket : pocket});
                }

                host.user.pocket = pocket;
                host.user.payment = user.payment;
                Badge.find().exec(function(err, badges){
                  if(err){
                    return res.badRequest(err);
                  }
                  if(user.badgeInfo){
                    Object.keys(user.badgeInfo).forEach(function(key){
                      badges = badges.filter(function(b){
                        return b.id === key;
                      });
                      if(!badges.length){
                        return;
                      }
                      var badge = badges[0];
                      var userBadgeInfo = user.badgeInfo[key];
                      badge.isAchieved = userBadgeInfo.isAchieved;
                      badge.achievedDate = userBadgeInfo.achievedDate;
                    })
                  }
                  if(req.wantsJSON && process.env.NODE_ENV === "development"){
                    return res.ok({pocket : pocket, badges: badges});
                  }
                  res.view('pocket', {user : host.user, host : host, badges: badges});
                })
              });
            })
          });
        })
      });
    });
  }
};

