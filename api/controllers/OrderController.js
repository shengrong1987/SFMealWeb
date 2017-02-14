/**
 * OrderController
 *
 * @description :: Server-side logic for managing Orders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripe = require("../services/stripe.js");
var extend = require('util')._extend;
var async = require('async');
var notification = require("../services/notification");
var geocode = require("../services/geocode.js");

//-1 : quantity not enough
//-2 : dish not valid
//-3 : order total doesn't match
//-4 : meal not valid
//-5 : missing payment profile
//-6 : address verification fail
//-7 : pickup option not exist
//-8 : host can't adjust order at schedule
//-9 : order is empty
//-10 : meal is not active
//-11 : order's pickup method invalid
//-12 : meal does not support shipping
//-13 : meal's shipping policy is not setup correctly
//-14 : order's amount not qualify for shipping
//-15 : coupon already used
//-16 : coupon invalid
//-17 : coupon expire
//-18 : order with coupon cannot be adjusted
//-19 : order with coupon cannot be cancelled
//-20 :


module.exports = {

  validate_meal : function(meal, orders, lastOrders, subtotal, req, cb) {
    var now = new Date();
    var params = req.body;
    if(!orders || !subtotal){
      return cb({ responseText : req.__('order-empty'), code : -9});
    }
    if(meal.status === "off" || (now < meal.provideFromTime || now > meal.provideTillTime)){
      return cb({ responseText : req.__('meal-not-active'), code : -10});
    }

    if(!meal.isDelivery && params.method == 'delivery'){
      return cb({ responseText : req.__('order-invalid-method'), code : -11});
    }

    if(!meal.dateIsValid()) {
      return cb({ responseText : req.__('order-invalid-meal'), code : -4});
    }

    sails.log.debug("meal looks good so far, checking order items...");

    var actual_subtotal = 0;
    var validDish = false;

    async.each(Object.keys(orders), function(dishId, next){
      var qty = parseInt(orders[dishId].number);
      var property = orders[dishId].preference ? orders[dishId].preference.property : null;
      var lastQty = lastOrders ? parseInt(lastOrders[dishId].number) : 0;
      if(qty > 0 || lastQty > 0){
        async.each(meal.dishes, function(dish, next2){
          if(dish.id == dishId){
            if(!dish.isVerified){
              return next2({responseText : req.__('order-invalid-dish',dishId), code : -2});
            }
            var extra = 0;
            if(property && dish.preference && !Object.keys(dish.preference).some(function(preference){
              var pros = dish.preference[preference];
              return pros.some(function(p){
                if(p.property == property){
                  extra = p.extra;
                  return true;
                }
                return false;
              })
            })){
              return next2({ responseText : req.__('order-preference-not-exist'), code : -20});
            }
            var diff = qty - lastQty;
            if(diff > meal.leftQty[dishId]){
              return next2({responseText : req.__('order-dish-not-enough',dishId, qty), code : -1});
            }
            actual_subtotal += qty * ( dish.price + extra);
          }
          next2();
        }, function(err){
          next(err);
        });
      }else{
        next();
      }
    }, function(err){
      if(err){
        return cb(err);
      }

      sails.log.debug("dish is valid and enough, checking total price...");

      if(actual_subtotal.toFixed(2) != subtotal) {
        sails.log.debug("subtotal supposed to be " + actual_subtotal.toFixed(2) + ", but get " + subtotal)
        return cb({responseText : req.__('order-total-not-match'), code : -3});
      }
      return cb(null);
    });
  },

  validateDeliveryMethod : function(method, meal, verifyingObj, req, cb){
    if(method == "pickup"){
      cb();
    }else if(method == "delivery"){
      var range = meal.delivery_range;
      geocode.distance(verifyingObj.address, meal.delivery_center, function(err, distance){
        if(err){
          sails.log.error("verifiying distance err" + err);
          return cb(err);
        }
        sails.log.debug("distance:" + distance, range);
        if(distance > range){
          sails.log.error("distance verification failed");
          return cb({responseText : req.__('order-invalid-address'), code : -6});
        }
        cb();
      })
    }else{
      if(!meal.isShipping){
        sails.log.error("meal doesn't support shipping");
        return cb({responseText : req.__('meal-no-shipping'), code : -12});
      }
      if(!meal.shippingPolicy || !meal.shippingPolicy.freeAmount){
        sails.log.error("meal's shipping setup is not correct");
        return cb({responseText : req.__('meal-shipping-policy-invalid'), code : -13});
      }
      if(verifyingObj.subtotal < parseFloat(meal.shippingPolicy.freeAmount)){
        sails.log.error("order's amount do not reach free shipping policy");
        return cb({responseText : req.__('order-not-qualify-shipping'), code : -14});
      }
      return cb();
    }
  },

  updateMealLeftQty : function(meal, lastorder, order, cb){
    var leftQty = meal.leftQty;
    Object.keys(lastorder).forEach(function(dishId){
      var diff = lastorder[dishId].number - order[dishId].number;
      leftQty[dishId] += diff;
    });
    meal.leftQty = leftQty;
    meal.save(function(err,result){
      if(err){
        return cb(err);
      }
      cb(err,result);
    });
  },

  buildDeliveryData : function(params, meal){
    var dishes = meal.dishes;
    if(params.method == "shipping"){
      var pickUpInfo;
      meal.pickups.forEach(function(pickupObj){
        if(pickupObj.method == "shipping"){
          pickUpInfo = pickupObj;
          return;
        }
      });
    }else{
      if(params.method == "delivery"){
        if(params.isDeliveryBySystem){
          params.delivery_fee = stripe.SYSTEM_DELIVERY_FEE;
        }else{
          params.delivery_fee = parseFloat(meal.delivery_fee);
        }
      }else {
        params.delivery_fee = 0;
      }

      if(meal.type == 'preorder'){
        if(!params.pickupOption || !meal.pickups || params.pickupOption-1>=meal.pickups.length){
          return false;
        }
        var pickupInfo = meal.pickups[params.pickupOption-1];
        if(!pickupInfo || pickupInfo.method != params.method){
          return false;
        }
      }

      if(meal.type == 'order' && params.method == 'pickup'){
        if(!params.pickupOption || !meal.pickups || params.pickupOption-1>=meal.pickups.length){
          return false;
        }
        var pickupInfo = meal.pickups[params.pickupOption-1];
        if(!pickupInfo || pickupInfo.method != params.method){
          return false;
        }
      }
    }
    params.pickupInfo = pickupInfo;
    sails.log.debug("building pickup data");
    return params;
  },

  verifyCoupon : function(req, code, user, meal, cb){
    if(!code){
      return cb();
    }
    Coupon.findOne({ code : code}).exec(function(err, coupon){
      if(err){
        return cb(err);
      }
      if(!coupon){
        return cb({ code : -16, responseText : req.__('coupon-invalid-error')})
      }
      if(coupon.expires_at < new Date()){
        return res.badRequest({ code : -17, responseText : req.__('coupon-expire-error')});
      }
      var couponIsRedeemed = false;
      couponIsRedeemed = user.coupons.some(function(coupon){
        return coupon.code == code;
      });
      if(couponIsRedeemed){
        return cb({code : -15, responseText : req.__('coupon-already-redeem-error')});
      }
      var amount = 0;
      switch(coupon.type){
        case "fix":
          amount = coupon.amount;
          break;
        case "freeShipping":
          amount = meal.delivery_fee;
          break;
      }
      coupon.amount = amount;
      cb(null, coupon);
    })
  },

  redeemCoupon : function(req, code, total, coupon, user, cb){
    if(!code){
      return cb(null, 0);
    }
    var diff = total - coupon.amount * 100;
    if(diff < 0){ coupon.amount += diff/100; }
    user.coupons.add(coupon.id);
    user.save(function(err, u){
      if(err){
        return cb(err);
      }
      req.body.discountAmount = coupon.amount;
      sails.log.info("redeeming coupon amount:" + coupon.amount + " & order total: " + total);
      cb(null, coupon.amount);
    });
  },

	create : function(req, res){

    var userId = req.session.user.id;
    var orders = req.body.orders;
    var mealId = req.body.mealId;
    var email = req.session.user.auth.email;
    var method = req.body.method;
    var address = req.body.address;
    var subtotal = parseFloat(req.body.subtotal);
    var code = req.body.couponCode;
    req.body.customer = userId;

    var $this = this;

    Meal.findOne(mealId).populate("dishes").populate("chef").exec(function(err,m) {
      if (err) {
        return res.badRequest(err);
      }
      $this.validateDeliveryMethod(method, m, { address : address, subtotal : subtotal }, req, function(err){
        if(err){
          return res.badRequest(err);
        }
        $this.validate_meal(m, orders, undefined, subtotal, req , function(err){
          if(err){
            sails.log.error(err.responseText);
            return res.badRequest(err);
          }
          //calculate pickup method and delivery fee
          req.body = $this.buildDeliveryData(req.body, m);
          if(typeof req.body == "boolean" && req.body == false){
            return res.badRequest({responseText : req.__('order-pickup-option-error'), code : -7});
          }
          //calculate ETA
          var now = new Date();
          req.body.eta = new Date(now.getTime() + m.prepareTime * 60 * 1000);
          req.body.host = m.chef.id;
          req.body.type = m.type;
          req.body.dishes = m.dishes;
          req.body.meal = m.id;
          req.body.guestEmail = email;
          req.body.hostEmail = m.chef.email;

          User.findOne(userId).populate('payment').populate("coupons").exec(function (err, found) {
            if (err) {
              return res.badRequest(err);
            }
            if(!found.payment || found.payment.length == 0){
              return res.badRequest({ responseText : req.__('order-lack-payment'), code : -5});
            }
            if(m.type == "order"){
              req.body.status = "preparing";
            }
            if(!found.phone && !req.body.phone){
              return res.badRequest(req.__('order-lack-contact'));
            }
            req.body.phone = found.phone || req.body.phone;

            //validate Coupon
            $this.verifyCoupon(req, code, found, m, function(err, coupon){
              if(err){
                return res.badRequest(err);
              }
              //calculate total
              var total = $this.calculateTotal(req.body, m.chef.county);
              sails.log.info("total is: " + total);
              $this.redeemCoupon(req, code, total, coupon, found, function(err, discount){
                if(err){
                  return res.badRequest(err);
                }
                if(coupon){
                  req.body.coupon = coupon.id;
                }
                Order.create(req.body).exec(function (err, order) {
                  if (err) {
                    return res.badRequest(err);
                  }
                  stripe.charge({
                    amount : req.body.subtotal * 100,
                    deliveryFee : req.body.delivery_fee * 100,
                    discount : discount,
                    email : email,
                    customerId : found.payment[0].customerId,
                    destination : m.chef.accountId,
                    meal : m,
                    method : method,
                    metadata : {
                      mealId : m.id,
                      hostId : m.chef.id,
                      orderId : order.id,
                      userId : userId
                    }
                  },function(err, charge, transfer){
                    if (err) {
                      Order.destroy(order.id).exec(function(err2){
                        if(err2){
                          return res.badRequest(err2);
                        }
                        return res.badRequest(err);
                      });
                    } else if(charge.status == "succeeded"){

                      sails.log.info("charge succeed, gathering charging info for order");
                      for (var i = 0; i < m.dishes.length; i++) {
                        var dishId = m.dishes[i].id;
                        var quantity = parseInt(orders[dishId].number);
                        m.leftQty[dishId] -= quantity;
                      }
                      order.transfer = transfer;
                      order.charges = {};
                      order.charges[charge.id] = charge.amount;
                      order.application_fees = {};

                      stripe.retrieveApplicationFee(charge.application_fee, function(err, fee1){
                        if(err){
                          return res.badRequest(err);
                        }
                        if(transfer && transfer.application_fee){
                          stripe.retrieveApplicationFee(transfer.application_fee, function(err, fee2){
                            if(err){
                              return res.badRequest(err);
                            }
                            order.application_fees[charge.id] = fee1.amount + fee2.amount;
                            m.save(function (err, result) {
                              if(err){
                                return res.badRequest(err);
                              }
                              order.save(function(err, o){
                                if(err){
                                  return res.badRequest(err);
                                }
                                o.chef = m.chef;
                                o.dishes = m.dishes;
                                notification.notificationCenter("Order", "new", o, true, false, req);
                                //test only
                                if(req.wantsJSON){
                                  return res.ok(order);
                                }
                                return res.ok({});
                              });
                            });
                          })
                        }else{
                          order.application_fees[charge.id] = fee1.amount;
                          m.save(function (err, result){
                            if(err){
                              return res.badRequest(err);
                            }
                            order.save(function(err, o){
                              if(err){
                                return res.badRequest(err);
                              }
                              o.chef = m.chef;
                              o.dishes = m.dishes;
                              notification.notificationCenter("Order", "new", o, true, false, req);
                              //test only
                              if(req.wantsJSON){
                                return res.ok(order);
                              }
                              return res.ok({});
                            });
                          });
                        }
                      });
                    } else {
                      res.badRequest({ reponseText : req.__('order-unknown-error'), code : -8});
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  adjust_order_form : function(req, res){
    var userId = req.session.user.id;
    var orderId = req.params.id;
    var params = req.body;
    Order.findOne(orderId).populate("customer").populate("meal").populate("dishes").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      return res.view("order_adjust",{layout:false,order : order});
    });
  },

  adjust : function(req, res){
    var userId = req.session.user.id;
    var hostId = req.session.user.host ? (req.session.user.host.id || req.session.user.host) : null;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var subtotal = parseFloat(params.subtotal);
    var delivery_fee = parseFloat(params.delivery_fee);
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("dishes").populate("host").populate("customer").populate('coupon').exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }
      if(order.coupon){
        return res.badRequest({ code : -18, responseText : req.__('adjust-with-coupon-error')});
      }
      order.meal.dishes = order.dishes;
      $this.validate_meal(order.meal, params.orders, order.orders, subtotal, req, function(err){
        if(err){
          sails.log.error(err.responseText);
          return res.badRequest(err);
        }
        var isSendToHost = true;
        if(hostId == order.host.id){
          isSendToHost = false;
        }
        if(order.status == "schedule"){
          //host cannot adjust the order at schedule
          //can update without permission of host or adjust by host
          var diff = $this.addTax(subtotal - order.subtotal, order.host.county);

          sails.log.info("adjusting amount: " + diff);

          if(diff != 0){
            User.findOne(order.customer.id).populate('payment').exec(function (err, found) {
              if (err) {
                return res.badRequest(err);
              }
              if(!found.payment || found.payment.length == 0){
                return res.badRequest({responseText : req.__('order-lack-payment'), code : -5});
              }
              if(diff>0){
                //create another charge
                stripe.charge({
                  amount : diff,
                  discount : 0,
                  email : email,
                  customerId : found.payment[0].customerId,
                  destination : order.host.accountId,
                  meal : order.meal,
                  metadata : {
                    mealId : order.meal.id,
                    hostId : order.host.id,
                    orderId : order.id,
                    userId : userId
                  }
                },function(err, charge, transfer){
                  if (err) {
                    sails.log.error(err);
                    return res.badRequest(err);
                  }
                  if(charge.status == "succeeded") {
                    $this.updateMealLeftQty(order.meal, order.orders, params.orders, function(err, m){
                      if(err){
                        return res.badRequest(err);
                      }
                      order.adjusting_orders = order.orders;
                      order.adjusting_subtotal = order.subtotal;
                      order.orders = params.orders;
                      order.subtotal = params.subtotal;
                      order.charges[charge.id] = charge.amount;
                      order.transfer = transfer;
                      order.meal = m.id;
                      order.save(function(err,result){
                        if(err){
                          return res.badRequest(err);
                        }
                        //send notification
                        notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                        return res.ok({responseText : req.__('order-adjust-ok',charge.amount / 100)});
                      })
                    });
                  }
                });
              }else{
                var totalRefund = Math.abs(diff);
                diff = - diff;
                var chargeIds = Object.keys(order.charges);
                var refundCharges = [];
                chargeIds.forEach(function(chargeId){
                  if(diff != 0){
                    var chargeAmount = order.charges[chargeId];
                    if(chargeAmount >= diff){
                      refundCharges.push({amount:diff,id:chargeId});
                      order.charges[chargeId] = chargeAmount - diff;
                      diff = 0;
                    }else if(chargeAmount != 0){
                      diff -= chargeAmount;
                      refundCharges.push({amount:chargeAmount,id:chargeId});
                      order.charges[chargeId] = 0;
                    }
                  }
                });

                async.each(refundCharges,function(charge, next){
                  stripe.refund({
                    id : charge.id,
                    amount : charge.amount
                  },function(err, refund){
                    if(err){
                      return next(err);
                    }
                    next();
                  })
                },function(err){
                  if(err){
                    return res.badRequest(err);
                  }
                  $this.updateMealLeftQty(order.meal, order.orders, params.orders, function(err, m){
                    if(err){
                      return res.badRequest(err);
                    }
                    order.adjusting_orders = order.orders;
                    order.adjusting_subtotal = order.subtotal;
                    order.orders = params.orders;
                    order.subtotal = params.subtotal;
                    order.meal = m.id;
                    order.save(function(err,result){
                      if(err){
                        return res.badRequest(err);
                      }
                      //send notification
                      notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                      return res.ok({responseText : req.__('order-adjust-ok2', totalRefund /100)});
                    })
                  });
                });
              }
            });
          }else{
            order.orders = params.orders;
            order.subtotal = params.subtotal;
            order.meal = order.meal.id;
            order.save(function(err,result){
              if(err){
                return res.badRequest(err);
              }
              notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
              return res.ok({responseText :req.__('order-adjust-ok3')});
            })
          }
        }else if(order.status == "preparing"){
          order.lastStatus = order.status;
          order.status = "adjust";
          order.isSendToHost = isSendToHost;
          order.adjusting_orders = params.orders;
          order.adjusting_subtotal = params.subtotal;
          order.meal = order.meal.id;
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            //send notification
            notification.notificationCenter("Order", "adjusting", result, isSendToHost, false, req);
            if(isSendToHost){
              return res.ok({responseText : req.__('order-adjust-request-user')});
            }else{
              return res.ok({responseText : req.__('order-adjust-request-host')});
            }
          });
        }
      })
    });
  },

  abort : function(req, res){
    var orderId = req.params.id;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("host").populate('customer').exec(function(err,order) {
      if (err) {
        return res.badRequest(err)
      }
      if (order.status === "complete" || order.status === "cancel") {
        return res.badRequest(req.__('order-abort-complete'));
      }

      order.status = "cancel";
      order.msg = "Order aborted by admin, please see email for detail, order id:" + order.id;
      order.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        notification.notificationCenter("Order", "cancel", result, false, true, req);
        $this.cancelOrderJob(result.id, function(err){
          if(err){
            return res.badRequest(err);
          }
          return res.ok(order);
        });
      })
    });
  },

  refund : function(req, res){
    var orderId = req.params.id;
    Order.findOne(orderId).populate("meal").populate("host").populate('customer').exec(function(err,order) {
      if (err) {
        return res.badRequest(err)
      }
      if(!order.charges || order.charges.length == 0){
        return res.badRequest(req.__('order-refund-fail'));
      }
      var refundCharges = Object.keys(order.charges);
      async.each(refundCharges, function(chargeId,next){
        stripe.refund({
          id : chargeId
        },function(err, refund){
          if(err){
            return next(err);
          }
          next();
        });
      },function(err){
        if(err){
          return res.badRequest(err);
        }
        order.msg = "Order refunded by admin, please see email for detail, order id:" + order.id;
        order.save(function(err, result){
          if(err){
            return res.badRequest(err);
          }
          return res.ok(order);
        })
      })

    });
  },

  cancel : function(req, res){
    var userId = req.session.user.id;
    var hostId = req.session.user.host ? (req.session.user.host.id || req.session.user.host) : null;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("host").populate("dishes").populate("customer").populate("coupon").exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }

      if(order.coupon){
        return res.badRequest({ code : -19, responseText : req.__('cancel-with-coupon-error')});
      }

      var isSendToHost = true;
      if(hostId == order.host.id){
        isSendToHost = false;
      }

      if(order.status == "schedule"){
        //can cancel without permission of host
        var amount = (order.subtotal + order.delivery_fee).toFixed(2);
        if(amount > 0){
          User.findOne(order.customer.id).populate('payment').exec(function (err, found) {
            if (err || !found.payment || found.payment.length == 0) {
              return res.badRequest(err);
            }
            var refundCharges = Object.keys(order.charges);
            async.each(refundCharges, function(chargeId, next){
              stripe.refund({
                id : chargeId
              },function(err, refund) {
                if(err){
                  return next(err);
                }
                next();
              });
            },function(err){
              if (err) {
                sails.log.error("refund error: " + err);
                return res.badRequest(err);
              }
              var curOrder = extend({}, order.orders);
              Object.keys(curOrder).forEach(function (dishId) {
                curOrder[dishId] = { number : 0};
              });
              $this.updateMealLeftQty(order.meal, order.orders, curOrder, function(err, m) {
                if (err) {
                  return res.badRequest(err);
                }
                order.status = "cancel";
                order.meal = m.id;
                order.subtotal = 0;
                order.save(function (err, result) {
                  if(err){
                    return res.badRequest(err);
                  }
                  //send notification
                  notification.notificationCenter("Order", "cancel", result, isSendToHost, false, req);
                  $this.cancelOrderJob(result.id, function(err){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok({responseText : req.__('order-cancel-ok')});
                  });
                })
              });
            });
          });
        }else{
          order.status = "cancel";
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            //send notification
            notification.notificationCenter("Order", "cancel", result, isSendToHost, false, req);
            $this.cancelOrderJob(result.id, function(err){
              if(err){
                return res.badRequest(err);
              }
              return res.ok({responseText : req.__('order-cancel-ok')});
            });
          })
        }
      }else if(order.status == "preparing"){
        order.isSendToHost = isSendToHost;
        order.lastStatus = order.status;
        order.status = "cancelling";
        order.save(function(err,result){
          if(err){
            return res.badRequest(err);
          }
          //send notification
          notification.notificationCenter("Order", "cancelling", result, isSendToHost, false, req);
          // if(req.wantsJSON){
          //   return res.ok(result);
          // }
          if(result.isSendToHost){
            return res.ok({responseText : req.__('order-cancel-request-user')});
          }else{
            return res.ok({responseText : req.__('order-cancel-request-host')});
          }
        });
      }
    });
  },

  confirm : function(req, res){
    var userId = req.session.user.id;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("host").populate("customer").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      if(order.status == "adjust"){
        var adjusting_subtotal = order.adjusting_subtotal;
        var adjusting_orders = order.adjusting_orders;
        var diff = $this.addTax(adjusting_subtotal - order.subtotal,order.host.county);
        var customerId = order.customer.id;
        if(diff != 0){
          User.findOne(customerId).populate('payment').exec(function (err, found) {
            if (err || !found.payment || found.payment.length == 0) {
              return res.badRequest(err);
            }
            if(diff>0){
              //create another charge
              stripe.charge({
                amount : diff,
                email : email,
                discount : 0,
                customerId : found.payment[0].customerId,
                destination : order.host.accountId,
                meal : order.meal,
                metadata : {
                  mealId : order.meal.id,
                  hostId : order.host.id,
                  orderId : order.id,
                  userId : userId
                }
              },function(err, charge, transfer){
                if (err) {
                  return res.badRequest(err);
                }
                if(charge.status == "succeeded") {
                  $this.updateMealLeftQty(order.meal, order.orders, adjusting_orders, function(err, m){
                    if(err){
                      return res.badRequest(err);
                    }
                    order.orders = adjusting_orders;
                    order.subtotal = adjusting_subtotal;
                    order.adjusting_orders = {};
                    order.adjusting_subtotal = 0;
                    var tmpLastStatus = order.status;
                    order.status = order.lastStatus;
                    order.lastStatus = tmpLastStatus;
                    order.charges[charge.id] = charge.amount;
                    order.transfer = transfer;
                    order.meal = order.meal.id;
                    order.save(function(err,result){
                      if(err){
                        return res.badRequest(err);
                      }
                      notification.notificationCenter("Order", "confirm", result, !result.isSendToHost, false, req);
                      if(result.isSendToHost){
                        return res.ok({responseText : req.__('order-confirm-user')});
                      }else{
                        return res.ok({responseText : req.__('order-confirm-host')});
                      }
                    })
                  });
                }
              });
            }else {
              diff = -diff;
              var chargeIds = Object.keys(order.charges);
              var refundCharges = [];
              chargeIds.forEach(function (chargeId) {
                if (diff != 0) {
                  var chargeAmount = order.charges[chargeId];
                  if(chargeAmount != 0){
                    if (chargeAmount > diff) {
                      refundCharges.push({amount: diff, id: chargeId});
                      order.charges[chargeId] = chargeAmount - diff;
                      diff = 0;
                    } else if(chargeAmount <= diff) {
                      diff -= chargeAmount;
                      refundCharges.push({amount: chargeAmount, id: chargeId});
                      order.charges[chargeId] = 0;
                    }
                  }
                }
              });
              async.each(refundCharges, function (charge, next) {
                stripe.refund({
                  id: charge.id,
                  amount: charge.amount
                }, function (err, refund) {
                  if (err) {
                    return next(err);
                  }
                  next();
                })
              }, function (err) {
                if (err) {
                  return res.badRequest(err);
                }
                $this.updateMealLeftQty(order.meal, order.orders, adjusting_orders, function (err, m) {
                  if (err) {
                    return res.badRequest(err);
                  }
                  order.orders = adjusting_orders;
                  order.subtotal = adjusting_subtotal;
                  order.adjusting_orders = {};
                  order.adjusting_subtotal = 0;
                  var tmpLastStatus = order.status;
                  order.status = order.lastStatus;
                  order.lastStatus = tmpLastStatus;
                  order.meal = order.meal.id;
                  order.save(function (err, result) {
                    if (err) {
                      return res.badRequest(err);
                    }
                    notification.notificationCenter("Order", "confirm", result, !result.isSendToHost, false, req);
                    if (result.isSendToHost) {
                      return res.ok({responseText: req.__('order-confirm-user')});
                    } else {
                      return res.ok({responseText: req.__('order-confirm-host')});
                    }
                  })
                });
              })
            }
          })
        }else{
          order.orders = adjusting_orders;
          order.subtotal = adjusting_subtotal;
          order.adjusting_orders = {};
          order.adjusting_subtotal = 0;
          var tmpLastStatus = order.status;
          order.status = order.lastStatus;
          order.lastStatus = tmpLastStatus;
          order.meal = order.meal.id;
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            notification.notificationCenter("Order", "confirm", result, !result.isSendToHost, false, req);
            if(result.isSendToHost){
              return res.ok({responseText : req.__('order-confirm-user')});
            }else{
              return res.ok({responseText : req.__('order-confirm-host')});
            }
          })
        }
      }else if(order.status == "cancelling"){
        var amount = order.subtotal + order.delivery_fee;
        if(amount > 0){
          User.findOne(userId).populate('payment').exec(function (err, found) {
            if (err) {
              return res.badRequest(err);
            }
            var refundCharges = Object.keys(order.charges);
            async.each(refundCharges, function(chargeId, next){
              if(order.charges[chargeId] == 0){
                return next();
              }
              stripe.refund({
                id : chargeId
              },function(err, refund){
                if(err){
                  return next(err);
                }
                next();
              });
            },function(err){
              if (err) {
                return res.badRequest(err);
              }
              var curOrder = extend({}, order.orders);
              Object.keys(curOrder).forEach(function (dishId) {
                curOrder[dishId] = { number : 0};
              });
              $this.updateMealLeftQty(order.meal, order.orders, curOrder, function (err, m) {
                if (err) {
                  return res.badRequest(err);
                }
                order.status = "cancel";
                order.lastStatus = "cancelling";
                order.meal = order.meal.id;
                order.save(function (err, result) {
                  if (err) {
                    return res.badRequest(err);
                  }
                  notification.notificationCenter("Order", "confirm", result, !result.isSendToHost, false, req);
                  $this.cancelOrderJob(result.id, function(err){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok({responseText : req.__('order-confirm-cancel')});
                  });
                })
              });
            })
          });
        }else{
          order.status = "cancel";
          order.lastStatus = "cancelling";
          order.meal = order.meal.id;
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            notification.notificationCenter("Order", "confirm", result, !result.isSendToHost, false, req);
            $this.cancelOrderJob(result.id, function(err){
              // if(err){
              //   return res.badRequest(err);
              // }
              return res.ok({responseText : req.__('order-confirm-cancel')});
            });
          })
        }
      }
    });
  },

  reject : function(req, res){
    var userId = req.session.user.id;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("customer").populate("host").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      var lastStatus = order.lastStatus;
      order.lastStatus = order.status;
      order.status = lastStatus;
      order.msg = params.msg;
      order.save(function(err,result){
        if(err){
          return res.badRequest(err);
        }
        notification.notificationCenter("Order", "reject", result, !result.isSendToHost, false, req);
        // if(req.wantsJSON){
        //   return res.ok(result);
        // }
        return res.ok({ responseText : req.__('order-reject-adjust')});
      });
    });
  },

  ready : function(req, res){
    var orderId = req.params.id;
    var email = req.session.user.auth.email;
    Order.findOne(orderId).populate("customer").populate("host").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      order.status = "ready";
      order.save(function(err,result){
        if(err){
          return res.badRequest(err);
        }
        notification.notificationCenter("Order", "ready", result, false, false, req);
        if(order.method == "pickup"){
          return res.ok({responseText : req.__('order-ready')});
        }else{
          return res.ok({responseText : req.__('order-ready2')});
        }
      });
    });
  },

  receive : function(req, res){
    var orderId = req.params.id;
    var email = req.session.user.auth.email;
    Order.findOne(orderId).populate("customer").populate("host").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      order.status = "review";
      order.reviewing_orders = Object.keys(order.orders).filter(function(orderId){
        return order.orders[orderId].number > 0;
      });
      order.save(function(err,result){
        if(err){
          return res.badRequest(err);
        }
        notification.notificationCenter("Order", "receive", result, false, false, req);
        return res.ok({responseText : req.__('order-receive')});
      });
    });
  },

  update : function(req, res){
    var orderId = req.params.id;
    Order.update(orderId, req.body).exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(order[0]);
    });
  },

  search : function(req, res){
    Order.find(req.query).populate('customer').populate('meal').populate('host').exec(function(err, orders){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(orders);
    })
  },

  cancelOrderJob : function(orderId, cb){
    Jobs.cancel({ 'data.orderId' : orderId }, function(err, numberRemoved){
      if(err){
        sails.log.error(err);
        return cb(err);
      }
      sails.log.debug(numberRemoved + " order jobs of order : " + orderId +  " removed");
      cb();
    })
  },

  addTax : function(subtotal, county){
    var tax;
    switch (county){
      case "San Francisco County":
        tax = 1.0875;
        break;
      case "Sacramento County":
        tax = 1.08;
        break;
      default:
        tax = 1.08;
    }
    tax = 1;
    return Math.round(subtotal * tax * 100);
  },

  calculateTotal : function(params, county){
    var total = params.subtotal;
    var tax;
    switch (county){
      case "San Francisco County":
        tax = 1.0875;
            break;
      case "Sacramento County":
        tax = 1.08;
        break;
      default:
        tax = 1.08;
    }
    // tax = tax || 1.08;
    tax = 1;
    total = total * tax;
    if(params.delivery_fee){
      total += params.delivery_fee;
    }
    return Math.round(total * 100);
  }
};

