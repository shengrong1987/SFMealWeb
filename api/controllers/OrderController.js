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
var util = require('../services/util');

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
//-20 : lack of pick-up option
//-21 : selected pick-up method does not match pick-up option
//-22 : pick-up option invalid
//-23 : coupon and points can not be used together
//-24 : redeeming points exceed order amount
//-25 : redeeming points insufficient
//-26 : can not use any discount on cash checkout
//-27 : can not order meal with cash checkout without name & phone


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

  validateDeliveryMethod : function(params, meal, verifyingObj, req, cb){
    var method = params.method;
    if(method == "pickup"){
      cb();
    }else if(method == "delivery"){
      if(!meal.isDelivery) {
        return cb({responseText: req.__('order-invalid-method'), code: -11});
      }
      var range = meal.delivery_range;
      var options = params.pickupOption;
      if(!options){
        return cb({responseText : req.__('order-pickup-option-empty-error'), code : -20});
      }
      var pickupInfo = meal.pickups[options-1];
      if(!pickupInfo){
        return cb({responseText : req.__('order-pickup-option-invalid-error'), code : -22});
      }
      if(pickupInfo.method != method){
        return cb({responseText : req.__('order-pickup-method-not-match-error'), code : -21});
      }
      geocode.distance(verifyingObj.address, pickupInfo.deliveryCenter, function(err, distance){
        if(err){
          sails.log.error("verified distance err" + err);
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
      sails.log.info("updating dish " + dishId + "to quantity of " + leftQty[dishId]);
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

  redeemCoupon : function(req, code, total, coupon, user, discount, cb){
    if(!code){
      return cb(null, discount);
    }
    var diff = total - coupon.amount;
    if(diff < 0){ coupon.amount += diff; }
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

  applyPoints : function(req, res){
    var userId = req.session.user.id;
    User.findOne(userId).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      res.ok({ points : user.points});
    })
  },

  redeemPoints : function(req, points, user, total, cb){
    if(!points){
      return cb(null, 0);
    }
    //verify how many points need to be redeemed
    if(points > total * 10){
      return cb({ code : -24, responseText : req.__('order-points-exceed')});
    }
    user.points = user.points || 0;
    //verify if user have enough points
    if(points > user.points){
      return cb({ code : -25, responseText : req.__('order-points-insufficient')});
    }
    //apply points
    user.points -= points;
    user.save(function(err, user){
      if(err){
        return cb(err);
      }
      req.body.discountAmount = points/10;
      cb(null, points/10);
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
    var pointsRedeem = req.body.points;
    var paymentMethod = req.body.paymentMethod;
    req.body.customer = userId;

    var $this = this;

    Meal.findOne(mealId).populate("dishes").populate("chef").exec(function(err,m) {
      if (err) {
        return res.badRequest(err);
      }
      $this.validateDeliveryMethod(req.body, m, { address : address, subtotal : subtotal }, req, function(err){
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
          req.body.phone = m.chef.phone;

          User.findOne(userId).populate('payment').populate("coupons").exec(function (err, found) {
            if (err) {
              return res.badRequest(err);
            }
            if(paymentMethod == 'online' && (!found.payment || found.payment.length == 0)){
              return res.badRequest({ responseText : req.__('order-lack-payment'), code : -5});
            }
            if(paymentMethod == 'cash' && (!found.phone || !found.firstname)){
              return res.badRequest({ responseText : req.__('order-cash-miss-profile'), code : -27});
            }
            if(m.type == "order"){
              req.body.status = "preparing";
            }
            if(!found.phone && !req.body.customerPhone){
              return res.badRequest(req.__('order-lack-contact'));
            }
            req.body.customerName = found.firstname || '';
            req.body.customerPhone = req.body.customerPhone || found.phone;

            if(code && pointsRedeem){
              return res.badRequest({ code : -23, responseText : req.__('order-duplicate-discount')});
            }

            if((code || pointsRedeem) && paymentMethod == 'cash'){
              return res.badRequest({ code : -26, responseText : req.__('order-cash-no-discount')});
            }

            //validate Coupon
            $this.verifyCoupon(req, code, found, m, function(err, coupon){
              if(err){
                return res.badRequest(err);
              }
              var tax = $this.getTax(req.body.subtotal, m.chef.county);
              var subtotalAfterTax = subtotal + tax/100;
              $this.redeemPoints(req, pointsRedeem, found, subtotalAfterTax, function(err, discount){
                if(err){
                  return res.badRequest(err);
                }
                //calculate total
                $this.redeemCoupon(req, code, subtotalAfterTax, coupon, found, discount, function(err, discount){
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
                      paymentMethod : order.paymentMethod,
                      isInitial : true,
                      amount : subtotal * 100,
                      deliveryFee : req.body.delivery_fee * 100,
                      discount : discount * 100,
                      email : email,
                      customerId : found.payment[0] ? found.payment[0].customerId : null,
                      destination : m.chef.accountId,
                      meal : m,
                      method : method,
                      tax : tax,
                      metadata : {
                        mealId : m.id,
                        hostId : m.chef.id,
                        orderId : order.id,
                        userId : userId,
                        deliveryFee : (req.body.delivery_fee || 0) * 100,
                        tax : tax
                      }
                    },function(err, charge, transfer){
                      if(err){
                        Order.destroy(order.id).exec(function(err2){
                          if(err2){
                            return res.badRequest(err2);
                          }
                          return res.badRequest(err);
                        });
                      } else if(charge.status == "succeeded"){

                        sails.log.info("charge succeed, gathering charging info for order");
                        for(var i = 0; i < m.dishes.length; i++){
                          var dishId = m.dishes[i].id;
                          var quantity = parseInt(orders[dishId].number);
                          m.leftQty[dishId] -= quantity;
                        }
                        order.tax = tax;
                        order.transfer = transfer;
                        order.charges = {};
                        if(order.paymentMethod == "cash"){
                          order.charges[charge.id] = order.charges[charge.id] || 0;
                          order.charges[charge.id] += charge.amount;
                        }else{
                          order.charges[charge.id] = charge.amount;
                        }
                        order.application_fees = {};
                        if(order.paymentMethod == 'cash'){
                          order.application_fees[charge.id] = charge.application_fee;
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
                          })
                        }else{
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
                        }
                      } else {
                        return res.badRequest({ code : -99, responseText : req.__('order-unknown-error') });
                      }
                    });
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
    Order.findOne(orderId).populate("customer").populate("meal").populate("dishes").populate("host").exec(function(err,order){
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
      if(order.discountAmount){
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
          var diff = parseFloat(subtotal - order.subtotal);
          var tax = $this.getTax(diff, order.host.county);

          sails.log.info("adjusting amount: " + diff);
          sails.log.info("original tax amount: " + order.tax);
          sails.log.info("tax adjusting amount: " + tax);

          if(diff != 0){
            User.findOne(order.customer.id).populate('payment').exec(function (err, found) {
              if (err) {
                return res.badRequest(err);
              }
              if(order.paymentMethod == 'online' && (!found.payment || found.payment.length == 0)){
                return res.badRequest({responseText : req.__('order-lack-payment'), code : -5});
              }
              if(diff>0){
                //create another charge
                stripe.charge({
                  isInitial : false,
                  paymentMethod : order.paymentMethod,
                  amount : diff * 100,
                  discount : 0,
                  email : email,
                  customerId : found.payment[0] ? found.payment[0].customerId : null,
                  destination : order.host.accountId,
                  meal : order.meal,
                  tax : tax,
                  metadata : {
                    mealId : order.meal.id,
                    hostId : order.host.id,
                    orderId : order.id,
                    userId : order.customer.id,
                    deliveryFee : order.delivery_fee * 100,
                    tax : order.tax + tax
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
                      if(order.paymentMethod == "cash"){
                        order.charges[charge.id] = order.charges[charge.id] || 0;
                        order.charges[charge.id] += charge.amount;
                        order.application_fees[charge.id] += charge.application_fee;
                      }else{
                        order.charges[charge.id] = charge.amount;
                      }
                      order.tax += tax;
                      order.transfer = transfer;
                      order.meal = m.id;
                      order.save(function(err,result){
                        if(err){
                          return res.badRequest(err);
                        }
                        //send notification
                        notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                        return res.ok({responseText : req.__('order-adjust-ok',charge.amount / 100), tax : order.tax});
                      })
                    });
                  }else{
                    return res.badRequest({ code : -99, responseText : req.__('order-unknown-error') });
                  }
                });
              }else{
                var totalRefund = Math.abs(diff);
                var refunded_application_fee = totalRefund * order.meal.commission;
                tax = $this.getTax(totalRefund, order.host.county)/100;
                sails.log.info("original tax amount: " + order.tax);
                sails.log.info("tax refund amount: " + tax);
                order.tax -= tax * 100;
                totalRefund += tax;
                diff = - diff;
                diff += tax;
                sails.log.info("refunding amount plus tax: " + diff);
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
                    paymentMethod : order.paymentMethod,
                    id : charge.id,
                    amount : charge.amount * 100,
                    metadata : {
                      userId : order.customer.id
                    }
                  },function(err, refund){
                    if(err){
                      return next(err);
                    }
                    if(order.paymentMethod == "cash"){
                      order.charges['cash'] -= refund.amount;
                      order.application_fees['cash'] -= refunded_application_fee;
                      if(order.charges['cash'] < 0){
                        order.charges['cash'] = 0;
                      }
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
                      return res.ok({responseText : req.__('order-adjust-ok2', totalRefund), tax : order.tax});
                    })
                  });
                });
              }
            });
          }else{
            $this.updateMealLeftQty(order.meal, order.orders, params.orders, function(err, m) {
              if (err) {
                return res.badRequest(err);
              }
              order.orders = params.orders;
              order.subtotal = params.subtotal;
              order.meal = m.id;
              order.save(function(err,result){
                if(err){
                  return res.badRequest(err);
                }
                notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                return res.ok({responseText :req.__('order-adjust-ok3'), tax : order.tax});
              })
            });
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
      var curOrder = extend({}, order.orders);
      Object.keys(curOrder).forEach(function (dishId) {
        curOrder[dishId] = { number : 0};
      });
      $this.updateMealLeftQty(order.meal, order.orders, curOrder, function(err, m) {
        if (err) {
          return res.badRequest(err);
        }
        order.meal = m.id;
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
    });
  },

  refund : function(req, res){
    var orderId = req.params.id;
    var userId = req.session.user.id;
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
          paymentMethod : order.paymentMethod,
          id : chargeId,
          metadata : {
            userId : order.customer.id
          }
        },function(err, refund){
          if(err){
            return next(err);
          }
          if(order.paymentMethod == "cash"){
            order.charges['cash'] = 0;
            order.application_fees['cash'] = 0;
          }
          next();
        });
      },function(err){
        if(err){
          return res.badRequest(err);
        }
        order.tax = 0;
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
            if(err) {
              return res.badRequest(err);
            }
            if(order.paymentMethod == 'online' && (!found.payment || found.payment.length == 0)){
              return res.badRequest({ responseText : req.__('order-lack-payment'), code : -5});
            }
            var refundCharges = Object.keys(order.charges);
            async.each(refundCharges, function(chargeId, next){
              stripe.refund({
                paymentMethod : order.paymentMethod,
                id : chargeId,
                metadata : {
                  userId : order.customer.id
                }
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
                if(order.paymentMethod == "cash"){
                  order.charges['cash'] = 0;
                  order.application_fees = 0;
                }
                order.tax = 0;
                order.status = "cancel";
                order.meal = m.id;
                order.subtotal = 0;
                order.save(function (err, result) {
                  if(err){
                    return res.badRequest(err);
                  }
                  notification.notificationCenter("Order", "cancel", result, isSendToHost, false, req);
                  $this.cancelOrderJob(result.id, function(err){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok({responseText : req.__('order-cancel-ok'), tax : order.tax});
                  });
                })
              });
            });
          });
        }else{
          order.status = "cancel";
          order.tax = 0;
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
              return res.ok({responseText : req.__('order-cancel-ok'), tax : order.tax});
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
        var diff = adjusting_subtotal - order.subtotal;
        var tax = $this.getTax(diff,order.host.county);
        var customerId = order.customer.id;
        if(diff != 0){
          User.findOne(customerId).populate('payment').exec(function (err, found) {
            if (err) {
              return res.badRequest(err);
            }
            if(order.paymentMethod == 'online' && (!found.payment || found.payment.length == 0)){
              return res.badRequest({ responseText : req.__('order-lack-payment'), code : -5});
            }
            if(diff>0){
              //create another charge
              stripe.charge({
                paymentMethod : order.paymentMethod,
                isInitial : false,
                amount : diff * 100,
                email : email,
                discount : 0,
                customerId : found.payment[0] ?  found.payment[0].customerId : null,
                destination : order.host.accountId,
                meal : order.meal,
                tax : tax,
                metadata : {
                  mealId : order.meal.id,
                  hostId : order.host.id,
                  orderId : order.id,
                  userId : order.customer.id,
                  deliveryFee : order.delivery_fee * 100,
                  tax : tax
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
                    if(order.paymentMethod == "cash"){
                      order.charges[charge.id] = order.charges[charge.id] || 0;
                      order.charges[charge.id] += charge.amount;
                      order.application_fees[charge.id] += charge.application_fee;
                    }else{
                      order.charges[charge.id] = charge.amount;
                    }
                    order.tax += tax * 100;
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
                }else{
                  return res.badRequest({ code : -99, responseText : req.__('order-unknown-error') });
                }
              });
            }else {
              var totalRefund = Math.abs(diff);
              var refunded_application_fee = totalRefund * order.meal.commission;
              tax = $this.getTax(totalRefund, order.host.county)/100;
              diff = - diff;
              diff += tax;
              sails.log.info("refunding amount plus tax: " + diff);
              sails.log.info("refunding application fee: " + refunded_application_fee);
              var chargeIds = Object.keys(order.charges);
              var refundCharges = [];
              chargeIds.forEach(function (chargeId) {
                if (diff != 0) {
                  var chargeAmount = order.charges[chargeId];
                  if(chargeAmount != 0){
                    if (chargeAmount > diff) {
                      refundCharges.push({amount: diff, id: chargeId});
                      order.charges[chargeId] = chargeAmount - diff * 100;
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
                  paymentMethod : order.paymentMethod,
                  id: charge.id,
                  amount: charge.amount * 100,
                  metadata : {
                    userId : order.customer.id
                  }
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
                  if(order.paymentMethod == "cash"){
                    sails.log.info("original application fee: " + order.application_fees['cash']);
                    order.application_fees['cash'] -= refunded_application_fee * 100;
                  }
                  order.orders = adjusting_orders;
                  order.subtotal = adjusting_subtotal;
                  order.adjusting_orders = {};
                  order.adjusting_subtotal = 0;
                  var tmpLastStatus = order.status;
                  order.status = order.lastStatus;
                  order.lastStatus = tmpLastStatus;
                  order.meal = order.meal.id;
                  order.tax -= tax * 100;
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
          $this.updateMealLeftQty(order.meal, order.orders, adjusting_orders, function(err, m) {
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
            order.meal = m.id;
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
                paymentMethod : order.paymentMethod,
                id : chargeId,
                metadata : {
                  userId : order.customer.id
                }
              },function(err, refund){
                if(err){
                  return next(err);
                }
                if(order.paymentMethod == "cash"){
                  order.charges['cash'] = 0;
                  order.application_fees['cash'] = 0;
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
                order.tax = 0;
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
          order.tax = 0;
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

  getTax : function(subtotal, county){
    var tax = util.getTaxRate(county);
    return Math.round(subtotal * tax * 100);
  }
};

