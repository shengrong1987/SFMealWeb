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
var moment = require("moment");
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil.js');

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
//-28 : pickup info lack of phone/name
//-29 : requires delivery, but address is not complete
//-31 : customer lack of contact info
//-32 : lack of party meal requirement
//-33 : order amount less than party meal require amount
//-34 : party meal must be order at least 24hours in advanced
//-35 : party order lack of order custom info
//-36 : party order has to be with delivery
//-37 : stripe error status
//-38 : stripe invalid payment callback
//-39 : stripe payment failed
//-40 : stripe payment cancel
//-41 : stripe payment unknown error
//-42 : stripe awaiting payment
//-43 : order status error, can not confirm
//-44 : order dynamic price not match
//-45 : all stripe error type
//-46 : this order is an express order, can not confirm
//-47 : incomplete order pickup information
//-48 : unverify email
//-49 : refund no charges found
//-50 : discount amount missing
//-98 : result not found


module.exports = {

  /*
  Build pick-up info
   */
  buildDeliveryData : function(params, meal){
    var dishes = meal.dishes;
    var pickUpInfo;
    if(params.method === "shipping"){
      pickUpInfo = {
        method : 'shipping',
        phone : meal.chef.phone,
        pickupFromTime : moment().add(1,'days').toDate(),
        pickupTillTime : moment().add(2,'days').toDate()
      };
      params.delivery_fee = 0;
    }else{
      sails.log.info("method: " + params.method, " party mode: " + params.isPartyMode);
      if(params.method === "delivery" && params.isPartyMode !== true){
        if(params.isDeliveryBySystem){
          params.delivery_fee = stripe.SYSTEM_DELIVERY_FEE;
        }else{
          params.delivery_fee = parseFloat(meal.delivery_fee);
        }
      }else if(params.isPartyMode){
        // skip calculating delivery fee
      }else{
        params.delivery_fee = 0;
      }
      meal.pickups.forEach(function(pickup){
        if(pickup.index === params.pickupOption){
          pickUpInfo = Object.assign({}, pickup);
        }
      });
    }
    var customComment = params.customInfo ? (params.customInfo.comment) || '' : '';
    var pickupComment = pickUpInfo.comment || pickUpInfo.instruction || '';
    pickUpInfo.comment = customComment + pickupComment;
    if(params.isPartyMode){
      pickUpInfo.pickupFromTime = params.customInfo.time;
      pickUpInfo.pickupTillTime = params.customInfo.time;
      pickUpInfo.comment = params.customInfo.comment;
      pickUpInfo.isDateCustomized = true;
    }
    params.pickupInfo = pickUpInfo;
    if(!pickUpInfo){
      sails.log.debug("pickup info not exist, check meal setting");
    }
    sails.log.info("building pickup data");
    return params;
  },

  /*
    @params:
      orders : detail key to value order list
      subtotal : dishes subtotal
      method : ['pickup','delivery','shipping']
      mealId : meal's id
      delivery_fee : delivery fee
      couponCode : coupon code
      points : points to apply
      isLogin : whether the checkout is login
      contactInfo : {
        name, phone, street, city, state, zipcode
      },
      paymentInfo : {
        method, token(used by express checkout)
      }
   */
	create : function(req, res){

    var orders = req.body.orders;
    var mealId = req.body.mealId;
    var method = req.body.method;
    var code = req.body.couponCode;
    var pointsRedeem = req.body.points;
    var states = {};
    var $this = this;

    if(req.session.authenticated){
      var userId = req.session.user.id;
      var email = req.session.user.auth.email;
      req.body.customer = userId;
      req.body.guestEmail = email;
    }

    Meal.findOne(mealId).populate("dishes").populate("dynamicDishes").populate("chef").exec(function(err,m) {
      if (err) {
        return res.badRequest(err);
      }
      $this.validateOption(req.body, m, req, function(err){
        if(err){
          return res.badRequest(err);
        }
        Dish.find({ chef : m.chef.id, isVerified : true}).exec(function(err, dishes){
          if(err){
            return res.badRequest(err);
          }
          if(req.body.isPartyMode){
            m.dishes = dishes;
          }
          $this.validate_meal(m, orders, undefined, parseFloat(req.body.subtotal), req ,null, function(err){
            if(err){
              return res.badRequest(err);
            }
            //calculate pickup method and delivery fee
            req.body = $this.buildDeliveryData(req.body, m);
            if(req.body === false){
              return res.badRequest({responseText : req.__('order-pickup-option-error'), code : -7});
            }
            //calculate ETA
            var now = new Date();
            req.body.eta = new Date(now.getTime() + m.prepareTime * 60 * 1000);
            req.body.host = m.chef.id;
            req.body.type = m.type;
            req.body.dishes = m.dishes;
            req.body.dynamicDishes = m.dynamicDishes;
            req.body.meal = m.id;
            req.body.hostEmail = m.chef.email;
            req.body.phone = m.chef.phone;
            req.body.tax = $this.getTax(req.body.subtotal, m.chef.county, m.isTaxIncluded);
            req.body.serviceFee = m.serviceFee;
            req.body.tip = parseFloat(req.body.tip)|| 0;
            req.body.tip = req.body.tip.toFixed(2);
            states.m = m;

            async.auto({
              normalCheckOut : function(next){
                if(!req.session.authenticated){
                  return next();
                }
                User.findOne(userId).populate('payment').populate("coupons").exec(function (err, found) {
                  if (err) {
                    return next(err);
                  }
                  var contactInfo = req.body.contactInfo;
                  var paymentInfo = req.body.paymentInfo;
                  if(paymentInfo.method === 'online' && (!found.payment || found.payment.length === 0)){
                    return next({ responseText : req.__('order-lack-payment'), code : -5});
                  }
                  sails.log.info("user's phone: " + found.phone || contactInfo.phone);
                  if(!found.phone && !contactInfo.phone){
                    return next({ responseText : req.__('order-lack-contact'), code : -31});
                  }
                  sails.log.info("user's name: " + found.firstname);
                  if(!found.firstname && !contactInfo.name){
                    return next({ responseText : req.__('order-lack-contact'), code : -31});
                  }
                  req.body.customerName = contactInfo.name || found.firstname;
                  req.body.customerPhone = contactInfo.phone || found.phone;
                  req.body.customerId = found.payment[0] ? found.payment[0].customerId : null;
                  req.body.paymentMethod = paymentInfo.method;
                  req.body.isExpressCheckout = false;

                  if(code && pointsRedeem){
                    return next({ code : -23, responseText : req.__('order-duplicate-discount')});
                  }

                  // if((code || pointsRedeem) && paymentInfo.method === 'cash'){
                  //   return next({ code : -26, responseText : req.__('order-cash-no-discount')});
                  // }

                  //validate Coupon
                  $this.verifyCoupon(req, code, found, m, function(err, coupon){
                    if(err){
                      return next(err);
                    }

                    var subtotalAfterTax = req.body.subtotal + req.body.tax/100;
                    $this.redeemPoints(req, pointsRedeem, found, subtotalAfterTax, function(err, discount){
                      if(err){
                        return res.badRequest(err);
                      }
                      //calculate total
                      $this.redeemCoupon(req, code, subtotalAfterTax, coupon, found, discount, function(err, discount){
                        if(err){
                          return next(err);
                        }
                        if(coupon){
                          req.body.coupon = coupon.id;
                        }
                        req.body.discount = discount;
                        next();
                      });
                    });
                  });
                });
              },
              expressCheckout : function(next){
                if(req.session.authenticated){
                  return next();
                }
                var contactInfo = req.body.contactInfo;
                var paymentInfo = req.body.paymentInfo;
                if(paymentInfo.method === 'online' && !paymentInfo.token){
                  return next({ responseText : req.__('order-lack-payment'), code : -5});
                }
                if(paymentInfo.method === 'cash' && (!contactInfo.phone || !contactInfo.name)){
                  return next({ responseText : req.__('order-cash-miss-profile'), code : -27});
                }
                if(!contactInfo.phone){
                  return next(req.__('order-lack-contact'));
                }
                req.body.guestEmail = process.env.ADMIN_EMAIL;
                req.body.customerName = contactInfo.name || req.__('user');
                req.body.customerPhone = contactInfo.phone;
                req.body.paymentMethod = paymentInfo.method;
                req.body.locale = req.getLocale();
                req.body.isExpressCheckout = true;
                stripe.newCustomerWithCard({
                  token : paymentInfo.token,
                  email : process.env.ADMIN_EMAIL
                }, function(err, customer){
                  if(err){
                    return next({ code : -45, responseText : err.message });
                  }
                  req.body.customerId = customer.id;
                  req.body.discount = 0;
                  next();
                });
              }
            },function(err) {
              if(err){
                return res.badRequest(err);
              }
              Order.create(req.body).exec(function (err, order) {
                if (err) {
                  return res.badRequest(err);
                }
                if(order.paymentMethod === "alipay" || order.paymentMethod === "wechatpay"){
                  stripe.newSource({
                    type : order.paymentMethod,
                    isInitial : true,
                    amount : req.body.subtotal * 100,
                    tip : req.body.tip,
                    deliveryFee : parseInt(req.body.delivery_fee * 100),
                    discount : req.body.discount * 100,
                    email : process.env.ADMIN_EMAIL,
                    meal : states.m,
                    method : method,
                    tax : req.body.tax,
                    metadata : {
                      mealId : states.m.id,
                      hostId : states.m.chef.id,
                      orderId : order.id,
                      userId : userId,
                      deliveryFee : parseInt(req.body.delivery_fee * 100),
                      tax : req.body.tax,
                      discount : req.body.discount * 100
                    }
                  }, function(err, source){
                    if(err){
                      return res.badRequest({ code : -45, responseText : err.message });
                    }
                    if(source==="no-charge"){
                      if(err){
                        return res.badRequest(err);
                      }
                      $this.afterSuccessCharge(order, orders, m, null, null, req, res);
                    }else{
                      order.status = "pending-payment";
                      order.sourceId = source.id;
                      order.client_secret = source.client_secret;
                      order.service_fee = m.serviceFee;
                      order.save(function(err, o){
                        if(err){
                          return res.badRequest(err);
                        }
                        order.source = source;
                        return res.ok(order);
                      });
                    }
                  });
                }else{
                  stripe.charge({
                    paymentMethod : order.paymentMethod,
                    isInitial : true,
                    amount : req.body.subtotal * 100,
                    tip : req.body.tip,
                    deliveryFee : parseInt(req.body.delivery_fee * 100),
                    discount : req.body.discount * 100,
                    email : email,
                    customerId : req.body.customerId,
                    destination : m.chef.accountId,
                    meal : states.m,
                    method : method,
                    tax : req.body.tax,
                    isPartyMode : order.isPartyMode,
                    metadata : {
                      mealId : states.m.id,
                      hostId : states.m.chef.id,
                      orderId : order.id,
                      userId : userId,
                      deliveryFee : parseInt(req.body.delivery_fee * 100),
                      tax : req.body.tax
                    }
                  },function(err, charge, transfer){
                    if(err){
                      Order.destroy(order.id).exec(function(err2){
                        if(err2){
                          return res.badRequest(err2);
                        }
                        return res.badRequest({ code : -39, responseText : err.message });
                      });
                    }else{
                      if(err){
                        return res.badRequest(err);
                      }
                      $this.afterSuccessCharge(order, orders, m, charge, transfer, req, res);
                    }
                  });
                }
              });
            });
          });
        });
      });
    });
  },

  afterSuccessCharge : function(order, orders, m, charge, transfer, req, res){
    sails.log.info("charge succeed, gathering charging info for order");
    var _this = this;
    this.addReferrerPoints(order.customer, function(err, u){
      if(err){
        return res.badRequest(err);
      }
      _this.updateMealLeftQty(order, m, _this.clearOrder(order.orders), order.orders, function(err, meal){
        if(err){
          return res.badRequest(err);
        }
        //build charges obj & application_fees obj
        order.leftQty = meal.leftQty;
        order.charges = {};
        order.transfer = {};
        order.feeCharges = {};
        order.application_fees = {};

        if(m.type === "order"){
          order.status = "preparing";
        }else{
          order.status = "schedule";
        }

        if(order.paymentMethod === "cash"){
          order.charges['cash'] = order.charges['cash'] || 0;
          order.application_fees['cash'] = order.application_fees['cash'] || 0;
          order.charges['cash'] += charge.amount;
          order.application_fees['cash'] += charge.application_fee;
          order.feeCharges[charge.id] = charge.application_fee;
        }else{
          if(charge){
            order.charges[charge.id] = charge.amount;
            order.application_fees[charge.id] = parseInt(charge.metadata.application_fee);
          }
        }
        if(transfer){
          order.transfer[transfer.id] = transfer.amount;
        }
        order.meal = order.meal.id;
        order.save(function(err, o){
          if(err){
            return res.badRequest(err);
          }
          o.chef = m.chef;
          o.dishes = m.dishes;
          o.service_fee = m.serviceFee;
          notification.notificationCenter("Order", "new", o, true, false, req);
          //test only
          if(req.wantsJSON && process.env.NODE_ENV === "development"){
            return res.ok(order);
          }
          if(order.paymentMethod === 'alipay' || order.paymentMethod === 'wechatpay'){
            if(req.authenticated){
              return res.redirect('/user/me#myorder');
            }else{
              return res.redirect('/order/' + order.id + "/receipt");
            }
          }else{
            return res.ok({ id: order.id});
          }
        });
      });
    });
  },

  /*
  DELETE Order
  For host to delete unpaid Alipay order
   */
  deleteOrder : function(req, res){
    var orderId = req.params.id;
    Order.findOne(orderId).exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      var sourceId = order.sourceId;
      stripe.getSource({
        id : sourceId
      }, function(err, source){
        if(err){
          return res.badRequest({ code : -45, responseText : err.message });
        }
        if(source.status === "consumed"){
          Order.update(orderId, { status : "schedule"}).exec(function(err, order){
            if(err){
              return res.badRequest(err);
            }
            res.ok({});
          });
        }else{
          Order.destroy(orderId).exec(function(err, order){
            if(err){
              return res.badRequest(err);
            }
            return res.ok({});
          })
        }
      });
    });
  },

  /*
  Adjust Order

   */

  adjust : function(req, res){
    var userId = req.session.user.id;
    var hostId = req.session.user.host ? (req.session.user.host.id || req.session.user.host) : null;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var subtotal = parseFloat(params.subtotal);
    var delivery_fee = parseFloat(params.delivery_fee);
    var tip = (params.tip || 0).toFixed(2);
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("dishes").populate("host").populate("customer").populate('coupon').exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }
      if(order.coupon){
        return res.badRequest({ code : -18, responseText : req.__('adjust-with-coupon-error')});
      }
      Meal.findOne(order.meal.id).populate("dishes").populate("dynamicDishes").exec(function(err, meal){
        if(err){
          return res.badRequest(err);
        }
        Dish.find({ chef : meal.chef, isVerified : true}).exec(function(err, dishes) {
          if (err) {
            return res.badRequest(err);
          }
          if (!!order.isPartyMode) {
            meal.dishes = dishes;
          }
          order.service_fee = order.meal.serviceFee;
          $this.validate_meal(meal, params.orders, order.orders, subtotal, req, order, function(err){
            if(err){
              sails.log.error(err.responseText);
              return res.badRequest(err);
            }
            var isSendToHost = true;
            if(hostId === order.host.id){
              isSendToHost = false;
            }
            if(order.status === "schedule"){
              //host cannot adjust the order at schedule
              //can update without permission of host or adjust by host
              var netDiff = parseFloat(subtotal - order.subtotal);
              var tax = $this.getTax(netDiff, order.host.county, order.meal.isTaxIncluded);
              netDiff *= 100;
              var adjustAmount = netDiff + tax;

              sails.log.info("adjusting amount: " + netDiff);
              sails.log.info("original tax amount: " + order.tax);
              sails.log.info("tax adjusting amount: " + tax);

              async.auto({
                chargeCustomer : function(next){
                  if(netDiff <= 0){
                    return next();
                  }
                  stripe.charge({
                    isInitial : false,
                    paymentMethod : order.paymentMethod,
                    amount : netDiff,
                    email : email,
                    customerId : !!order.customer ? order.customer.customerId : null,
                    destination : order.host.accountId,
                    meal : order.meal,
                    tax : tax,
                    tip : tip,
                    isPartyMode : order.isPartyMode,
                    metadata : {
                      mealId : order.meal.id,
                      hostId : order.host.id,
                      orderId : order.id,
                      userId : !!order.customer ? order.customer.id : null,
                      deliveryFee : order.delivery_fee * 100,
                      tax : order.tax + tax
                    }
                  },function(err, charge, transfer){
                    if(err){
                      return next({ code : -39, responseText : err.message });
                    }
                    if(charge.status !== "succeeded") {
                      return next({ responseText : req.__('order-adjust-stripe-error',charge.status), code : -37});
                    }
                    if(order.paymentMethod === "cash"){
                      order.charges['cash'] = order.charges['cash'] || 0;
                      order.application_fees['cash'] = order.application_fees['cash'] || 0;
                      order.charges['cash'] += charge.amount;
                      order.application_fees['cash'] += charge.application_fee;
                      order.feeCharges[charge.id] = charge.application_fee;
                    }else{
                      order.charges[charge.id] = charge.amount;
                      if(transfer){
                        order.transfer[transfer.id] = transfer.amount;
                      }
                    }
                    next();
                  });
                },
                refundCustomer : function(next){
                  if(netDiff >= 0){
                    return next();
                  }
                  sails.log.info("original tax amount: " + order.tax);
                  sails.log.info("tax refund amount: " + tax);
                  sails.log.info("refunding amount plus tax: " + netDiff);
                  async.auto({
                    refundOrders : function(next2) {
                      if (order.paymentMethod === "cash") {
                        return next2();
                      }
                      var metadata = {
                        userId: !!order.customer ? order.customer.id : null,
                        paymentMethod: order.paymentMethod,
                        reverse_transfer : true,
                        refund_application_fee : true,
                        amount : Math.abs(adjustAmount)
                      };
                      Object.keys(order.charges).forEach(function(chargeId){
                        sails.log.info("charge: " + chargeId, " with amount: " + order.charges[chargeId]);
                      });
                      stripe.batchRefund(order.charges, order.transfer, metadata, function (err) {
                        if (err) {
                          return next2(err);
                        }
                        next2();
                      });
                    },
                    refundFeeForCashOrder: function (next2) {
                      if (order.paymentMethod !== "cash") {
                        return next2();
                      }
                      var refundedFee = Math.abs(netDiff * order.meal.commission);
                      var metadata = {
                        userName: order.customerName,
                        userPhone: order.customerPhone,
                        paymentMethod: order.paymentMethod,
                        reverse_transfer : false,
                        refund_application_fee : false,
                        amount : refundedFee
                      };
                      stripe.batchRefund(order.feeCharges, null, metadata, function (err) {
                        if (err) {
                          return next2(err);
                        }
                        order.application_fees['cash'] -= refundedFee;
                        order.charges['cash'] -= netDiff;
                        next2();
                      })
                    }
                  }, function(err){
                    if(err){
                      return next(err);
                    }
                    next(err);
                  });
                },
                adjustOrder : ['chargeCustomer', 'refundCustomer', function(next){
                  $this.updateMealLeftQty(order, order.meal, order.orders, params.orders, function(err, m){
                    if(err){
                      return next(err);
                    }
                    order.leftQty = m.leftQty;
                    order.last_orders = order.orders;
                    order.last_subtotal = order.subtotal;
                    order.adjusting_orders = {};
                    order.adjusting_subtotal = 0;
                    order.orders = params.orders;
                    order.subtotal = params.subtotal;
                    order.tax += tax;
                    order.meal = m.id;
                    next();
                  });
                }]
              }, function(err){
                if(err){
                  return res.badRequest(err);
                }
                order.save(function(err,result){
                  if(err){
                    return next(err);
                  }
                  Meal.findOne(order.meal).populate("dishes").exec(function(err, meal){
                    if(err){
                      return res.badRequest(err);
                    }
                    notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                    if(req.wantsJSON && process.env.NODE_ENV === "development"){
                      return res.ok(order);
                    }
                    return res.ok({responseText : req.__('order-adjust-ok', adjustAmount) });
                  });
                })

              });
            }else if(order.status === "preparing"){
              order.lastStatus = order.status;
              order.status = "adjust";
              order.isSendToHost = isSendToHost;
              order.adjusting_orders = params.orders;
              order.adjusting_subtotal = params.subtotal;
              order.service_fee = order.meal.serviceFee;
              order.meal = order.meal.id;
              order.save(function(err,result){
                if(err){
                  return res.badRequest(err);
                }
                notification.notificationCenter("Order", "adjusting", result, isSendToHost, false, req);
                if(process.env.NODE_ENV === 'development' && req.wantsJSON){
                  return res.ok(order);
                }
                if(isSendToHost){
                  return res.ok({responseText : req.__('order-adjust-request-user')});
                }else{
                  return res.ok({responseText : req.__('order-adjust-request-host')});
                }
              });
            }else{
              return res.badRequest({ code : -43, responseText : req.__('order-manipulate-wrong-status')})
            }
          })
        });
      });
    });
  },

  /*
  Cancel Order API
  User can cancel a specific order at its scheduled or preparing status
   */

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
      if(hostId === order.host.id){
        isSendToHost = false;
      }

      if(order.status === "schedule"){
        //can cancel without permission of host
        User.findOne(order.customer.id).populate('payment').exec(function (err, user) {
          if(err) {
            return res.badRequest(err);
          }
          if(order.paymentMethod === 'online' && (!user.payment || user.payment.length === 0)){
            return res.badRequest({ responseText : req.__('order-lack-payment'), code : -5});
          }

          var metadata = {
            userName: order.customerName,
            userPhone: order.customerPhone,
            paymentMethod : order.paymentMethod,
            reverse_transfer : false,
            refund_application_fee : false
          };

          async.auto({
            refundOrders : function(next){
              if(order.paymentMethod === "cash"){
                return next();
              }
              var metadata = {
                userId : !!order.customer ? order.customer.id : null,
                paymentMethod : order.paymentMethod,
                reverse_transfer : true,
                refund_application_fee : true
              };
              stripe.batchRefund(order.charges, order.transfer, metadata, function(err){
                if(err){
                  return next(err);
                }
                next();
              })
            },
            refundApplicationFeeForCashOrder : function(next){
              if (order.paymentMethod !== "cash") {
                return next();
              }
              stripe.batchRefund(order.feeCharges, null, metadata, function (err) {
                if (err) {
                  return cb(err);
                }
                order.charges['cash'] = 0;
                order.application_fees['cash'] = 0;
                next();
              });
            }
          },function(err){
            if(err){
              return res.badRequest(err);
            }
            var emptyOrders = $this.clearOrder(order.orders);
            $this.updateMealLeftQty(order, order.meal, order.orders, emptyOrders, function(err, m) {
              if (err) {
                return res.badRequest(err);
              }
              order.leftQty = m.leftQty;
              order.tax = 0;
              order.status = "cancel";
              order.last_orders = order.orders;
              order.service_fee = order.meal.serviceFee;
              order.meal = m.id;
              order.redeemPoints = 0;
              order.discount = 0;
              order.save(function (err, result) {
                if(err){
                  return res.badRequest(err);
                }
                Meal.findOne(m.id).populate("dishes").exec(function(err, meal){
                  if(err){
                    return res.badRequest(err);
                  }
                  notification.notificationCenter("Order", "cancel", result, isSendToHost, false, req);
                  $this.cancelOrderJob(result.id,'', function(err){
                    if(err){
                      return res.badRequest(err);
                    }
                    if(req.wantsJSON && process.env.NODE_ENV === "development"){
                      return res.ok(result);
                    }
                    return res.ok({responseText : req.__('order-cancel-ok'), tax : order.tax, paymentMethod : order.paymentMethod, charges : order.charges, feeCharges : order.feeCharges, application_fees : order.application_fees});
                  });
                });
              })
            });
          })
        });
      }else if(order.status === "preparing"){
        order.isSendToHost = isSendToHost;
        order.lastStatus = order.status;
        order.status = "cancelling";
        order.save(function(err,result){
          if(err){
            return res.badRequest(err);
          }
          //send notification
          result.service_fee = result.meal.serviceFee;
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

  /*
  Confirm Order API
  Chef or user can confirm a pending change request of a specific order
   */

  confirm : function(req, res){
    var userId = req.session.user.id;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var tip = (req.body.tip || 0).toFixed(2);
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("host").populate("customer").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      var customerId = !!order.customer ? order.customer.id : null;
      if(!customerId){
        return res.badRequest({ code : -47, responseText : req.__('order-confirm-express-error')});
      }
      User.findOne(customerId).populate('payment').exec(function (err, user) {
        if (err) {
          return res.badRequest(err);
        }
        if(order.paymentMethod === 'online' && (!user.payment || user.payment.length === 0)){
          return res.badRequest({ responseText : req.__('order-lack-payment'), code : -5});
        }
        if(order.status === "adjust"){
          var adjusting_subtotal = order.adjusting_subtotal;
          var adjusting_orders = order.adjusting_orders;
          var netDiff = parseFloat(adjusting_subtotal - order.subtotal);
          var tax = $this.getTax(netDiff, order.host.county, order.meal.isTaxIncluded);
          netDiff *= 100;
          var adjustAmount = netDiff + tax;
          async.auto({
            chargeCustomer : function(next){
              if(netDiff <= 0){
                return next();
              }
              stripe.charge({
                paymentMethod : order.paymentMethod,
                isInitial : false,
                amount : netDiff,
                email : email,
                discount : 0,
                customerId : user.payment[0] ?  user.payment[0].customerId : null,
                destination : order.host.accountId,
                meal : order.meal,
                tax : tax,
                tip : tip,
                isPartyMode : order.isPartyMode,
                metadata : {
                  mealId : order.meal.id,
                  hostId : order.host.id,
                  orderId : order.id,
                  userId : order.customer.id,
                  deliveryFee : order.delivery_fee * 100,
                  tax : tax
                }
              },function(err, charge, transfer) {
                if (err) {
                  return next({ code : -39, responseText : err.message });
                }
                if(order.paymentMethod === "cash"){
                  order.charges['cash'] = order.charges['cash'] || 0;
                  order.application_fees['cash'] = order.application_fees['cash'] || 0;
                  order.charges['cash'] += charge.amount;
                  order.application_fees['cash'] += charge.application_fee;
                  order.feeCharges[charge.id] = charge.application_fee;
                }else{
                  if(charge){
                    order.charges[charge.id] = charge.amount;
                    order.application_fees[charge.id] = parseInt(charge.metadata.application_fee);
                  }
                  if(transfer){
                    order.transfer[transfer.id] = transfer.amount;
                  }
                }
                next();
              });
            },
            refundCustomer : function(cb){
              if(netDiff >= 0){
                return cb();
              }
              var refundedFee = Math.abs(netDiff * order.meal.commission);
              sails.log.info("refunding amount plus tax: " + adjustAmount);
              sails.log.info("refunding application fee: " + refundedFee);

              async.auto({
                refundOrders : function(next){
                  if(order.paymentMethod === "cash"){
                    return next();
                  }
                  var metadata = {
                    userId : order.customer.id,
                    paymentMethod : order.paymentMethod,
                    reverse_transfer : true,
                    refund_application_fee : true,
                    amount : Math.abs(adjustAmount)
                  };
                  stripe.batchRefund(order.charges, order.transfer, metadata, function(err){
                    if(err){
                      return next(err);
                    }
                    next();
                  });
                },
                refundFeeForCashOrder : function(next){
                  if(order.paymentMethod !== "cash"){
                    return next();
                  }
                  var refundedFee = Math.abs(netDiff * order.meal.commission);
                  var metadata = {
                    userName : order.customerName,
                    userPhone : order.customerPhone,
                    paymentMethod : order.paymentMethod,
                    reverse_transfer : false,
                    refund_application_fee : false,
                    amount : refundedFee
                  };
                  stripe.batchRefund(order.feeCharges, null, metadata, function (err) {
                    if(err) {
                      return cb(err);
                    }
                    order.charges["cash"] += adjustAmount;
                    order.application_fees['cash'] -= refundedFee;
                    next();
                  })
                }
              }, function(err){
                if(err){
                  return cb(err);
                }
                cb();
              });
            }
          }, function(err){
            if(err){
              return res.badRequest(err);
            }
            $this.updateMealLeftQty(order, order.meal, order.orders, adjusting_orders, function(err, m){
              if(err){
                return res.badRequest(err);
              }
              order.leftQty = m.leftQty;
              order.last_orders = order.orders;
              order.last_subtotal = order.total;
              order.orders = adjusting_orders;
              order.subtotal = adjusting_subtotal;
              order.adjusting_orders = {};
              order.adjusting_subtotal = 0;
              var tmpLastStatus = order.status;
              order.status = order.lastStatus;
              sails.log.info("restoring order status to last status:" + order.status);
              order.lastStatus = tmpLastStatus;
              order.service_fee = order.meal.serviceFee;
              order.meal = order.meal.id;
              if(netDiff > 0){
                order.tax += tax * 100;
              }else{
                order.tax -= tax * 100;
              }
              order.save(function(err,result){
                if(err){
                  return res.badRequest(err);
                }
                Meal.findOne(order.meal).populate("dishes").exec(function(err, meal){
                  if(err){
                    return res.badRequest(err);
                  }
                  notification.notificationCenter("Order", "confirm", result, !result.isSendToHost, false, req);
                  if(req.wantsJSON && process.env.NODE_ENV === "development"){
                    return res.ok(result);
                  }
                  if(result.isSendToHost){
                    return res.ok({responseText : req.__('order-confirm-user')});
                  }else{
                    return res.ok({responseText : req.__('order-confirm-host')});
                  }
                });
              })
            });
          });
        }else if(order.status === "cancelling") {
          var metadata = {
            userId : order.customer.id,
            paymentMethod : order.paymentMethod,
            reverse_transfer : true,
            refund_application_fee : true
          };
          async.auto({
            refundOrder : function(next){
              if(order.paymentMethod === "cash"){
                return next();
              }
              stripe.batchRefund(order.charges, order.transfer, metadata, function(err) {
                if(err){
                  return next(err);
                }
                next();
              });
            },
            refundFeeForCashOrder : function(next) {
              if (order.paymentMethod !== "cash") {
                return next();
              }
              var metadata = {
                userName: order.customerName,
                userPhone: order.customerPhone,
                paymentMethod : order.paymentMethod,
                reverse_transfer : false,
                refund_application_fee : false
              };
              stripe.batchRefund(order.feeCharges, null, metadata, function (err) {
                if(err) {
                  return next(err);
                }
                order.charges['cash'] = 0;
                order.application_fees['cash'] = 0;
                next();
              })
            }
          }, function(err){
            if(err){
              return res.badRequest(err);
            }
            var emptyOrders = $this.clearOrder(order.orders);
            $this.updateMealLeftQty(order, order.meal, order.orders, emptyOrders, function (err, m) {
              if(err){
                return res.badRequest(err);
              }
              order.leftQty = m.leftQty;
              order.tax = 0;
              order.status = "cancel";
              order.lastStatus = "cancelling";
              order.last_orders = order.orders;
              order.service_fee = order.meal.serviceFee;
              order.meal = order.meal.id;
              order.redeemPoints = 0;
              order.save(function (err, result) {
                if (err) {
                  return res.badRequest(err);
                }
                Meal.findOne(m.id).populate("dishes").exec(function(err, meal){
                  if(err){
                    return res.badRequest(err);
                  }
                  notification.notificationCenter("Order", "confirm", result, !result.isSendToHost, false, req);
                  if(req.wantsJSON && process.env.NODE_ENV === "development"){
                    return res.ok(result);
                  }
                  $this.cancelOrderJob(result.id,'', function(err){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok({responseText : req.__('order-confirm-cancel')});
                  });
                });
              })
            });
          });
        }else{
          return res.badRequest({ code : -43, responseText : req.__('order-manipulate-wrong-status') });
        }
      })
    });
  },

  /*
  Pay Order API
  User can pay a unpaid Alipay order with this API
   */

  pay : function(req, res){
    var orderId = req.params.id;
    Order.findOne(orderId).exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      var sourceId = order.sourceId;
      stripe.getSource({
        id : sourceId
      }, function(err, source){
        if(err){
          return res.badRequest({ code : -45, responseText : err.message });
        }
        if(source.status !== "pending"){
          return res.badRequest({ code : -39, responseText : req.__('ali-payment-failure')});
        }
        order.source = source;
        res.ok(order);
      });
    });
  },

  /*
  Reject Order API
  Chefs can reject a pending change requests of specific order
   */

  reject : function(req, res){
    var userId = req.session.user.id;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("customer").populate("host").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      var lastStatus = order.lastStatus;
      order.lastStatus = order.status;
      order.status = lastStatus;
      order.msg = params.msg;
      order.service_fee = order.meal.serviceFee;
      order.save(function(err,result){
        if(err){
          return res.badRequest(err);
        }
        notification.notificationCenter("Order", "reject", result, !result.isSendToHost, false, req);
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok(result);
        }
        return res.ok({ responseText : req.__('order-reject-adjust')});
      });
    });
  },

  /*
  Ready Order API
  Chef can mark "ready" of a specific order when it's ready for pickup
   */
  ready : function(req, res){
    var orderId = req.params.id;
    var email = req.session.user.auth.email;
    Order.findOne(orderId).populate("customer").populate("host").populate("meal").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      order.status = "ready";
      order.service_fee = order.meal.serviceFee;
      order.save(function(err,result){
        if(err){
          return res.badRequest(err);
        }
        notification.notificationCenter("Order", "ready", result, false, false, req);
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok(result);
        }
        if(order.method === "pickup"){
          return res.ok({responseText : req.__('order-ready')});
        }else{
          return res.ok({responseText : req.__('order-ready2')});
        }
      });
    });
  },

  /*
  Receive Order API
  Chef can mark "receive" of a specific order that is received
   */
  receive : function(req, res){
    var orderId = req.params.id;
    var email = req.session.user.auth.email;
    Order.findOne(orderId).populate("customer").populate("host").populate("meal").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      order.status = "review";
      order.service_fee = order.meal.serviceFee;
      order.reviewing_orders = Object.keys(order.orders).filter(function(orderId){
        return order.orders[orderId].number > 0;
      });
      order.save(function(err,result){
        if(err){
          return res.badRequest(err);
        }
        notification.notificationCenter("Order", "receive", result, false, false, req);
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok(order);
        }
        return res.ok({responseText : req.__('order-receive')});
      });
    });
  },

  receipt : function(req, res){
    var orderId = req.params.id;
    Order.findOne(orderId).populate("dishes").populate('host').populate('meal').exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      if(!order){
        return res.notFound();
      }
      notification.transitLocaleTimeZone(order);
      order.download = false;
      order.discount = order.discount || 0;
      order.tip = order.tip || 0;
      res.view('receipt', order);
    })
  },

  downloadReceipt : function(req, res) {
    var orderId = req.params.id;
    Order.findOne(orderId).populate("dishes").populate('host').populate("meal").exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      notification.transitLocaleTimeZone(order);
      var dateString = moment().format("ddd, hA");
      order.layout = false;
      order.download = true;
      res.set('Content-Disposition','attachment; filename="' + dateString + '"-receipt.html" ')
      res.view('receipt', order);
    })
  },

  verifyOrder : function(req, res){
    var orderId = req.params.id;
    var _this = this;
    Order.findOne(orderId).exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      if(!order){
        return res.badRequest({ code : -39, responseText : req.__('ali-payment-failure'), mealId : null});
      }
      var source = stripe.getSource({
        id : order.sourceId
      }, function(err, source){
        if(err){
          return res.badRequest(err);
        }
        if(source.status === stripe.SOURCE_FAIL){
          return res.badRequest({ code : -39, responseText : req.__('ali-payment-failure'), mealId : order.meal.id})
        }else if(source.status === stripe.SOURCE_CANCEL){
          return res.badRequest({ code : -40, responseText : req.__('ali-payment-cancel'), mealId : order.meal.id})
        }else if(source.status === stripe.SOURCE_PENDING){
          return res.badRequest({ code : -42, responseText : req.__('ali-payment-awaiting'), mealId : order.meal.id})
        }else if(source.status === stripe.SOURCE_CONSUMED){
          return res.ok(order);
        }else if(source.status === stripe.SOURCE_CHARGEABLE){
          return res.redirect('/order/' + orderId + '/process?sourceId='+source.id + '&client_secret=' + order.client_secret);
        }else{
          return res.badRequest({ code : -99, responseText : req.__('order-unknown-error')});
        }
      })
    });
  },

  process : function(req, res){
    var params = req.query;
    var sourceId = params.source;
    var client_secret = params.client_secret;
    var _this = this;

    stripe.getSource({
      id : sourceId
    }, function(err, source){
      if(err){
        return res.badRequest(err);
      }
      var orderId = source.metadata.orderId;
      Order.findOne(orderId).populate("meal").populate("host").exec(function(err, order){
        if(err){
          return res.badRequest(err);
        }
        if(!order){
          return res.view('redirectPopup', { code : -98, responseText : req.__('order-not-found'), mealId : order.meal.id});
        }
        if(!order.client_secret || order.client_secret !== client_secret){
          return res.badRequest({ code : -38, responseText : req.__('invalid-payment-callback')});
        }
        if(source.status === stripe.SOURCE_CONSUMED){
          if(req.authenticated){
            return res.redirect('/user/me#myorder');
          }else{
            return res.redirect('/order/' + order.id + "/receipt");
          }
        }else if(source.status !== stripe.SOURCE_CHARGEABLE){
          Order.destroy(orderId).exec(function(err, o){
            if(err){
              return res.view('redirectPopup', { code : -99, responseText : err.responseText, mealId : order.meal.id} );
            }
            if(req.wantsJSON && process.env.NODE_ENV === "development"){
              return res.badRequest({ code : -39, responseText : req.__('ali-payment-failure'), mealId : order.meal.id})
            }else{
              return res.view('redirectPopup', { code : -39, responseText : req.__('ali-payment-failure'), mealId : order.meal.id});
            }
          })
        }else{
          source.metadata.deliveryFee = parseInt(source.metadata.deliveryFee);
          source.metadata.tax = parseInt(source.metadata.tax);
          source.metadata.discount = parseInt(source.metadata.discount);
          source.metadata.total = parseInt(source.metadata.total);
          source.metadata.application_fee = parseInt(source.metadata.application_fee);
          var attr = {
            amount : source.amount,
            currency : "usd",
            source : source.id,
            isInitial : true,
            paymentMethod : source.type,
            meal : order.meal,
            destination : order.host.accountId,
            metadata : source.metadata,
            isPartyMode : order.isPartyMode
          };
          stripe.charge(attr, function(err, charge, transfer){
            if(err){
              return res.badRequest(err);
            }
            if(charge.status === "succeeded"){
              Meal.findOne(order.meal.id).populate("dishes").exec(function(err, dishes){
                if(err){
                  return res.badRequest(err);
                }
                _this.afterSuccessCharge(order, order.orders, order.meal, charge, transfer, req, res);
              });
            }else{
              res.badRequest({ code : -99, responseText : req.__('order-unknown-error')})
            }
          });
        }
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

  getProperties : function(preferences){
    var properties = [];
    if(!preferences){
      return [];
    }
    preferences.forEach(function(preference){
      var props = preference.property.split(",");
      props.forEach(function(prop){
        properties.push(prop);
      });
    });
    return properties;
  },

  getTax : function(subtotal, county, isTaxIncluded){
    if(isTaxIncluded){
      return 0;
    }
    var tax = util.getTaxRate(county);
    return Math.round(subtotal * tax * 100);
  },

  updateMealLeftQty : function(o, meal, lastOrder, order, cb){
    if(o.isPartyMode){
      return cb(null, meal);
    }
    var leftQty = meal.leftQty;
    Object.keys(lastOrder).forEach(function(dishId){
      leftQty[dishId] = parseInt(parseInt(lastOrder[dishId].number) - parseInt(order[dishId].number)) + parseInt(leftQty[dishId]);
      sails.log.info("updating dish " + dishId + " to quantity of " + leftQty[dishId]);
    });
    meal.leftQty = leftQty;
    meal.save(function(err,result){
      if(err){
        return cb(err);
      }
      cb(null ,result);
    });
  },

  cancelOrderJob : function(orderId, name, cb){
    var query = {};
    if(orderId){
      query['data.orderId'] = orderId;
    }
    if(name){
      query['name'] = name;
    }
    Jobs.cancel(query, function(err, numberRemoved){
      if(err){
        sails.log.error(err);
        return cb(err);
      }
      sails.log.debug(numberRemoved + " order jobs of order : " + orderId +  " removed");
      cb();
    })
  },

  clearOrder : function(orders){
    var curOrder = extend({}, orders);
    Object.keys(curOrder).forEach(function (dishId) {
      curOrder[dishId] = { number : 0, preference : orders[dishId].preference, price : orders[dishId].price };
    });
    return curOrder;
  },

  /*
  Admin API
  @update, @search, @abort, @refund
  */

  updatePickupInfo : function(req, res){
    var orderId = req.params["id"];
    req.body.pickupOption = parseInt(req.body.pickupOption);
    var address = req.body.address;
    var method = req.body.method;
    var mealId = req.body.mealId;
    var _this = this;
    if(!mealId || !method){
      return res.badRequest({ code : -47, responseText : req.__('order-incomplete-pickup-update')});
    }
    if((method === "delivery" || req.body.isPartyMode) && !address){
      return res.badRequest({ code : -47, responseText : req.__('order-incomplete-pickup-update')});
    }
    Order.findOne(orderId).populate("meal").populate("host").exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      if(order.status !== "schedule" && order.status !== "preparing"){
        return res.badRequest({ code : -43, responseText : req.__('order-manipulate-wrong-status')});
      }
      req.body.contactInfo = { address : address };
      if(req.body.customInfo){
        req.body.customInfo = JSON.parse(req.body.customInfo);
      }
      Meal.findOne(mealId).populate("chef").exec(function(err, meal){
        if(err){
          return res.badRequest(err);
        }
        _this.validateOption(req.body, meal, req, function(err){
          if(err){
            return res.badRequest(err);
          }
          req.body = _this.buildDeliveryData(req.body, meal);

          _this.cancelOrderJob(orderId, '', function(err){
            if(err){
              return res.badRequest(err);
            }
            req.body.isScheduled = false;
            Order.update(order.id, req.body).exec(function(err, result){
              if(err){
                return res.badRequest(err);
              }
              result.meal = meal;
              result.host = order.host;
              res.ok(result);
            });
          });
        });
      })
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
    if(req.query.hasOwnProperty('contactInfo.name')){
      var name = req.query["contactInfo.name"];
      req.query.or = [
        { "contactInfo.name" : name},
        { "customerName" : name}
      ];
      delete req.query["contactInfo.name"];
    }
    Order.find({ where : req.query, skip : actionUtil.parseSkip(req), limit : actionUtil.parseLimit(req) }).populate("dishes").populate('customer').populate('meal').populate('host').exec(function(err, orders){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(orders);
    })
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
      var emptyOrders = $this.clearOrder(order.orders);
      $this.updateMealLeftQty(order, order.meal, order.orders, emptyOrders, function(err, m) {
        if (err) {
          return res.badRequest(err);
        }
        order.leftQty = m.leftQty;
        order.service_fee = order.meal.serviceFee;
        order.meal = m.id;
        order.save(function(err, result){
          if(err){
            return res.badRequest(err);
          }
          Meal.findOne(m.id).populate("dishes").exec(function(err, meal){
            if(err){
              return res.badRequest(err);
            }
            notification.notificationCenter("Order", "cancel", result, false, true, req);
            $this.cancelOrderJob(result.id,'', function(err){
              if(err){
                return res.badRequest(err);
              }
              return res.ok(order);
            });
          });
        })
      });
    });
  },

  refund : function(req, res){
    var orderId = req.params.id;
    Order.findOne(orderId).populate("meal").populate("host").populate('customer').exec(function(err,order) {
      if (err) {
        return res.badRequest(err)
      }
      if((!order.charges || order.charges.length === 0) && (!order.transfer || order.transfer.length === 0)){
        return res.badRequest({ responseText : req.__('order-refund-fail'), code : -49});
      }
      var metadata = {
        userId :  order.customer ? order.customer.id : null,
        reverse_transfer : true,
        refund_application_fee : true
      };
      async.auto({
        refundOrder : function(next){
          if(order.paymentMethod === "cash"){
            return next();
          }
          stripe.batchRefund(order.charges, order.transfer, metadata, function(err) {
            if(err){
              return next(err);
            }
            next();
          });
        },
        refundApplicationFeeForCashOrder : function(next){
          if(order.paymentMethod !== "cash"){
            return next();
          }
          metadata = {
            userName: order.customerName,
            userPhone: order.customerPhone,
            reverse_transfer : false,
            refund_application_fee : false
          };
          stripe.batchRefund(order.feeCharges, null, metadata, function(err) {
            if (err) {
              return next(err);
            }
            order.charges['cash'] = 0;
            order.application_fees['cash'] = 0;
            next();
          });
        }
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        order.tax = 0;
        order.msg = "Order refunded by admin, please see email for detail, order id:" + order.id;
        order.save(function (err, result) {
          if (err) {
            return res.badRequest(err);
          }
          return res.ok(order);
        });
      });
    });
  },

  discount : function(req, res){
    var orderId = req.params.id;
    var discount = req.body.discount * 100;
    if(!discount){
      return res.badRequest({ responseText : req.__('order-discount-amount-needed'), code : -50});
    }
    Order.findOne(orderId).populate("meal").populate("host").populate('customer').exec(function(err, order) {
      if (err) {
        return res.badRequest(err)
      }
      if((!order.charges || order.charges.length === 0) && (!order.transfer || order.transfer.length === 0)){
        return res.badRequest({ responseText : req.__('order-refund-fail'), code : -49});
      }
      var metadata = {
        userId :  order.customer ? order.customer.id : null,
        amount : discount
      };
      async.auto({
        refundOrder : function(next){
          if(order.paymentMethod === "cash"){
            return next();
          }
          stripe.batchRefund(order.charges, order.transfer, metadata, function(err) {
            if(err){
              return next(err);
            }
            next();
          });
        },
        refundApplicationFeeForCashOrder : function(next){
          if(order.paymentMethod !== "cash"){
            return next();
          }
          var refundedFee = discount * order.meal.service_fee;
          metadata = {
            userName: order.customerName,
            userPhone: order.customerPhone,
            reverse_transfer : false,
            refund_application_fee : false,
            amount : discount
          };
          stripe.batchRefund(order.feeCharges, null, metadata, function(err) {
            if (err) {
              return next(err);
            }
            order.charges['cash'] -= discount;
            order.application_fees['cash'] -= refundedFee;
            next();
          });
        },
        transferDiscount : function(next){
          metadata = {
            destination : order.host.accountId,
            amount : discount,
            userId : order.customer ? order.customer.id : ''
          };
          stripe.transfer({ metadata : metadata }, function(err, transfer){
            if(err){
              return next(err);
            }
            if(transfer){
              order.transfer[transfer.id] = transfer.amount;
            }
            next();
          })
        }
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        order.tax = 0;
        order.discount = discount;
        order.msg = "Order discounted by admin, amount: " + order.discount + ", order id:" + order.id;
        order.save(function (err, result) {
          if (err) {
            return res.badRequest(err);
          }
          return res.ok(order);
        });
      });
    });
  },

  adjustAdmin : function(req, res){
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("dishes").populate("host").populate("customer").populate('coupon').exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      // if(order.coupon){
      //   return res.badRequest({ code : -18, responseText : req.__('adjust-with-coupon-error')});
      // }
      if(order.status !== "schedule" && order.status !== "preparing"){
        return res.badRequest({ code : -43, responseText : req.__('order-manipulate-wrong-status')});
      }
      Meal.findOne(order.meal.id).populate("dishes").populate("dynamicDishes").exec(function(err, meal){
        if(err){
          return res.badRequest(err);
        }
        order.service_fee = order.meal.serviceFee;
        Dish.find({ chef : meal.chef, isVerified : true}).exec(function(err, dishes) {
          if (err) {
            return res.badRequest(err);
          }
          if(!!order.isPartyMode) {
            meal.dishes = dishes;
          }
          $this.validate_meal(meal, params.orders, order.orders, params.subtotal, req, order, function(err){
            if(err){
              sails.log.error(err.responseText);
              return res.badRequest(err);
            }
            var isSendToHost = true;
            var netDiff = parseFloat(params.subtotal - order.subtotal);
            var tax = $this.getTax(netDiff, order.host.county, order.meal.isTaxIncluded);
            netDiff *= 100;
            var adjustAmount = netDiff + tax;

            sails.log.info("adjusting amount: " + netDiff);
            sails.log.info("original tax amount: " + order.tax);
            sails.log.info("tax adjusting amount: " + tax);

            async.auto({
              chargeCustomer : function(next){
                if(netDiff <= 0){
                  return next();
                }
                stripe.charge({
                  isInitial : false,
                  paymentMethod : order.paymentMethod,
                  amount : netDiff,
                  email : order.guestEmail,
                  customerId : !!order.customer ? order.customer.customerId : null,
                  destination : order.host.accountId,
                  meal : order.meal,
                  tax : tax,
                  isPartyMode : order.isPartyMode,
                  metadata : {
                    mealId : order.meal.id,
                    hostId : order.host.id,
                    orderId : order.id,
                    userId : !!order.customer ? order.customer.id : null,
                    deliveryFee : order.delivery_fee * 100,
                    tax : order.tax + tax
                  }
                },function(err, charge, transfer){
                  if(err){
                    return next({ code : -39, responseText : err.message });
                  }
                  if(charge.status !== "succeeded") {
                    return next({ responseText : req.__('order-adjust-stripe-error',charge.status), code : -37});
                  }
                  if(order.paymentMethod === "cash"){
                    order.charges['cash'] = order.charges['cash'] || 0;
                    order.application_fees['cash'] = order.application_fees['cash'] || 0;
                    order.charges['cash'] += charge.amount;
                    order.application_fees['cash'] += charge.application_fee;
                    order.feeCharges[charge.id] = charge.application_fee;
                  }else{
                    order.charges[charge.id] = charge.amount;
                  }
                  if(transfer){
                    order.transfer[transfer.id] = transfer.amount;
                  }
                  next();
                });
              },
              refundCustomer : function(next){
                if(netDiff >= 0){
                  return next();
                }

                sails.log.info("original tax amount: " + order.tax);
                sails.log.info("tax refund amount: " + tax);
                sails.log.info("refunding amount plus tax: " + netDiff);
                async.auto({
                  refundOrders : function(next2) {
                    if (order.paymentMethod === "cash") {
                      return next2();
                    }
                    var metadata = {
                      userId: !!order.customer ? order.customer.id : null,
                      paymentMethod: order.paymentMethod,
                      reverse_transfer : true,
                      refund_application_fee : true,
                      amount : Math.abs(adjustAmount)
                    };
                    Object.keys(order.charges).forEach(function(chargeId){
                      sails.log.info("charge: " + chargeId, " with amount: " + order.charges[chargeId]);
                    });
                    stripe.batchRefund(order.charges, order.transfer, metadata, function (err) {
                      if (err) {
                        return next2(err);
                      }
                      next2();
                    });
                  },
                  refundFeeForCashOrder: function (next2) {
                    if (order.paymentMethod !== "cash") {
                      return next2();
                    }
                    var refundedFee = Math.abs(netDiff * order.meal.commission);
                    var metadata = {
                      userName: order.customerName,
                      userPhone: order.customerPhone,
                      paymentMethod: order.paymentMethod,
                      reverse_transfer : false,
                      refund_application_fee : false,
                      amount : refundedFee
                    };
                    stripe.batchRefund(order.feeCharges, null, metadata, function (err) {
                      if (err) {
                        return next2(err);
                      }
                      order.application_fees['cash'] -= refundedFee;
                      order.charges['cash'] -= netDiff;
                      next2();
                    })
                  }
                }, function(err){
                  if(err){
                    return next(err);
                  }
                  next(err);
                });
              },
              adjustOrder : ['chargeCustomer', 'refundCustomer', function(next){
                $this.updateMealLeftQty(order, order.meal, order.orders, params.orders, function(err, m){
                  if(err){
                    return next(err);
                  }
                  order.leftQty = m.leftQty;
                  order.last_orders = order.orders;
                  order.last_subtotal = order.subtotal;
                  order.adjusting_orders = {};
                  order.adjusting_subtotal = 0;
                  order.orders = params.orders;
                  order.subtotal = params.subtotal;
                  order.tax += tax;
                  order.meal = m.id;
                  next();
                });
              }]
            }, function(err){
              if(err){
                return res.badRequest(err);
              }
              order.save(function(err,result){
                if(err){
                  return next(err);
                }
                Meal.findOne(order.meal).populate("dishes").exec(function(err, meal){
                  if(err){
                    return res.badRequest(err);
                  }
                  notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                  if(req.wantsJSON && process.env.NODE_ENV === "development"){
                    return res.ok(order);
                  }
                  return res.ok({responseText : req.__('order-adjust-ok', adjustAmount) });
                });
              })

            });
          })
        });
      });
    });
  },

  /*
   Check if meal is valid
   */
  validate_meal : function(meal, orders, lastOrders, subtotal, req, order, cb) {
    var now = new Date();
    var params = req.body;
    if(!orders || !subtotal){
      return cb({ responseText : req.__('order-empty'), code : -9});
    }
    if(!order && (meal.status === "off" || (now < meal.provideFromTime || now > meal.provideTillTime))){
      return cb({ responseText : req.__('meal-not-active'), code : -10});
    }
    if(!order && !meal.dateIsValid()) {
      return cb({ responseText : req.__('order-invalid-meal'), code : -4});
    }

    var orderInfo = order || req.body;
    var isPartyMode = orderInfo.isPartyMode;
    if(!!isPartyMode){
      var partyRequire = meal.partyRequirement;
      if(!partyRequire){
        return cb({ responseText : req.__('order-lack-of-party-requirement'), code : -32});
      }
      var minimal = partyRequire["minimal"];
      if(subtotal < minimal){
        return cb({ responseText : req.__('order-amount-not-qualify-party', minimal), code : -33});
      }
      var customDate = orderInfo.customInfo.time;
      now = moment();
      sails.log.info("now: " + now.format() + ", delivery date: " + moment(customDate).format());
      var ms = moment(customDate).diff(now);
      var d = moment.duration(ms);
      sails.log.info("hours in advanced: " + d.asHours());
      if(d.asHours() < 24){
        return cb({ responseText : req.__('order-party-time-invalid'), code : -34});
      }
    }

    sails.log.debug("meal looks good so far, checking order items...");

    var actual_subtotal = 0;
    var validDish = false;
    var $this = this;

    async.each(Object.keys(orders), function(dishId, next){
      var qty = parseInt(orders[dishId].number);
      var properties = $this.getProperties(orders[dishId].preference);
      var lastQty = lastOrders ? parseInt(lastOrders[dishId].number) : 0;
      if(qty > 0 || lastQty > 0){
        async.each(meal.dishes, function(dish, next2){
          if(dish.id === dishId){
            if(!dish.isVerified){
              return next2({responseText : req.__('order-invalid-dish',dishId), code : -2});
            }
            var extra = 0;
            //check property exist
            if(!properties.every(function(property){
                if(property && dish.preference) {
                  var hasPreference = Object.keys(dish.preference).some(function(preference){
                    var pros = dish.preference[preference];
                    var hasPros = pros.some(function(p){
                      if(p.property === property){
                        extra += parseInt(p.extra);
                        return true;
                      }
                      return false;
                    });
                    sails.log.info("dish has property: " + property + " : " + hasPros);
                    return hasPros;
                  });
                  sails.log.info("dish has preference: " + property + " : " + hasPreference);
                  return hasPreference;
                }else{
                  return true;
                }
              })){
              return next2({ responseText : req.__('order-preference-not-exist'), code : -20});
            }
            var diff = qty - lastQty;
            sails.log.info("order qty for the dish: " + dish.id + " is: " + diff, "dish's left qty: " + meal.leftQty[dish.id]);
            if(!isPartyMode && diff > meal.leftQty[dish.id]){
              return next2({responseText : req.__('order-dish-not-enough',dishId, qty), code : -1});
            }
            var totalQty = meal.getDynamicDishesTotalOrder(qty);
            var price = dish.getPrice(totalQty, meal);
            var listPrice = parseInt(orders[dishId].price);
            if(price !== listPrice){
              sails.log.info("listing price updated from " + listPrice + " to " + price);
              orders[dishId].price = price;
            }
            actual_subtotal += (qty * price + extra);
          }
          next2();
        }, function(err){
          if(err){
            return next(err);
          }
          next();
        });
      }else{
        next();
      }
    }, function(err){
      if(err){
        return cb(err);
      }

      sails.log.debug("dish is valid and enough, checking total price...");

      if(actual_subtotal !== subtotal) {
        sails.log.debug("subtotal supposed to be " + actual_subtotal + ", but get " + subtotal)
        req.body.subtotal = actual_subtotal;
        // return cb({responseText : req.__('order-total-not-match'), code : -3});
      }
      return cb(null);
    });
  },

  /*
   check if parameters are valid
   */
  validateOption : function(params, meal, req, cb){
    var method = params.method;
    if(method === "pickup"){
      if(!!params.isPartyMode){
        return cb({ code : -36, responseText : req.__('party-order-need-delivery')})
      }
      return cb();
    }else if(method === "delivery"){
      var contactInfo = params.contactInfo;
      if(!contactInfo.address){
        return cb({responseText: req.__('order-incomplete-address'), code: -29});
      }
      var full_address = contactInfo.address;
      if(!meal.isDelivery && !params.isPartyMode) {
        return cb({responseText: req.__('order-invalid-method'), code: -11});
      }
      var range = params.isPartyMode ? meal.delivery_range * stripe.PARTY_ORDER_RANGE_MULTIPLIER : meal.delivery_range;
      var pickupOption = params.pickupOption;
      if(!pickupOption){
        return cb({responseText : req.__('order-pickup-option-empty-error'), code : -20});
      }else if(pickupOption > meal.pickups.length+1){
        return cb({responseText : req.__('order-pickup-option-error'), code : -7});
      }
      var pickupInfo;
      meal.pickups.forEach(function(pickup){
        if(pickup.index === pickupOption){
          pickupInfo = Object.assign({}, pickup);
        }
      });
      if(!pickupInfo){
        return cb({responseText : req.__('order-pickup-option-invalid-error'), code : -22});
      }
      sails.log.info("pickup method: " + pickupInfo.method);
      if(!pickupInfo.phone){
        return cb({responseText : req.__('order-pickup-option-invalid-error'), code : -28});
      }
      if(pickupInfo.method !== method){
        return cb({responseText : req.__('order-pickup-method-not-match-error'), code : -21});
      }
      if(params.isPartyMode){
        var customInfo = req.body.customInfo;
        if(!customInfo){
          return cb({ responseText : req.__('order-party-lack-of-info'), code : -35});
        }
      }
      geocode.distance(full_address, pickupInfo.deliveryCenter, function(err, distance){
        if(err){
          sails.log.error("verified distance err " + err);
          return cb(err);
        }
        sails.log.debug("distance:" + distance, range);
        if(distance > range){
          if(!params.isPartyMode){
            sails.log.error("distance verification failed");
            return cb({responseText : req.__('order-invalid-address'), code : -6});
          }else{
            params.delivery_fee = (distance - range) * stripe.MILEAGE_FEE;
            sails.log.info("charged distance: " + (distance - range) + " in a total of: " + params.delivery_fee);
          }
        }else if(params.isPartyMode){
          params.delivery_fee = 0;
        }
        cb();
      })
    }else{
      var subtotal = parseFloat(params.subtotal);
      if(!meal.isShipping){
        sails.log.error("meal doesn't support shipping");
        return cb({responseText : req.__('meal-no-shipping'), code : -12});
      }
      if(!meal.shippingPolicy || !meal.shippingPolicy.freeAmount){
        sails.log.error("meal's shipping setup is not correct");
        return cb({responseText : req.__('meal-shipping-policy-invalid'), code : -13});
      }
      if(subtotal < parseFloat(meal.shippingPolicy.freeAmount)){
        sails.log.error("order's amount do not reach free shipping policy");
        return cb({responseText : req.__('order-not-qualify-shipping'), code : -14});
      }
      return cb();
    }
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
        return cb({ code : -17, responseText : req.__('coupon-expire-error')});
      }
      if(user.emailVerified===false){
        return cb({ code : -48, responseText : req.__('coupon-unverified-email')})
      }
      var couponIsRedeemed = false;
      couponIsRedeemed = user.coupons.some(function(coupon){
        return coupon.code === code;
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
      if(!user.emailVerified){
        return res.badRequest({ code : -48, reponseText : req.__('coupon-unverified-email')});
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
    if(!user.emailVerified){
      return cb({ code : -48, reponseText : req.__('coupon-unverified-email')});
    }
    //apply points
    user.points -= points;
    user.save(function(err, user){
      if(err){
        return cb(err);
      }
      req.body.redeemPoints = parseInt(points);
      cb(null, points/10);
    });
  },

  addReferrerPoints : function(customer, cb){
    if(!customer){
      return cb();
    }
    var userId = customer.id || customer;
    User.findOne(userId).exec(function(err, user){
      if(err){
        return cb(err);
      }
      if(!user.referrerCode){
        return cb();
      }
      User.findOne({ referralCode : user.referrerCode }).exec(function(err, referrer){
        if(err){
          return cb(err);
        }
        if(!referrer){
          return cb();
        }
        referrer.points += 50;
        sails.log.info("adding points to referrer: " + referrer.email);
        referrer.save(function(err, r){
          if(err){
            return cb(err);
          }
          user.referrerCode = null;
          user.save(cb);
        });
      })
    });
  },

  findOrdersOfWeek : function(req, res){
    var weekWanted = req.params['numberOfWeek'];
    var yearWanted = req.query.year;
    var status = req.query.status || { '!' : ['cancel','pending-payment']};
    Order.find({ status : status }).populate('dishes').exec(function(err, orders){
      if(err){
        return res.badRequest(err);
      }
      orders = orders.filter(function(order){
        var numberOfWeek = util.getWeekOfYear(order.pickupInfo.pickupFromTime);
        var year = new Date(order.pickupInfo.pickupFromTime).getFullYear();
        sails.log.info("number of week:" + numberOfWeek, "& year: " + year);
        var isYearMatch = yearWanted ? (parseInt(yearWanted) === year) : true;
        return numberOfWeek === parseInt(weekWanted) && isYearMatch;
      });
      var dishIds = [];
      var newOrders = [];
      orders.forEach(function(order){
        newOrders.forEach(function(oldOrder){})
        var isSamePickup = newOrders.some(function(oldOrder){
          var _isSame = oldOrder.pickupInfo.pickupFromTime === order.pickupInfo.pickupFromTime && oldOrder.pickupInfo.pickupTillTime === order.pickupInfo.pickupTillTime
            && oldOrder.pickupInfo.customerName === order.pickupInfo.customerName && oldOrder.pickupInfo.customerPhone === order.pickupInfo.customerPhone
            && oldOrder.pickupInfo.method === order.pickupInfo.method && ((oldOrder.pickupInfo.method === "delivery" && oldOrder.contactInfo.address === order.contactInfo.address)
            || (oldOrder.pickupInfo.method === "pickup" && oldOrder.pickupInfo.location === order.pickupInfo.location));
          if(_isSame){
            Object.keys(order.orders).forEach(function(dishId){
              oldOrder.orders[dishId] = order.orders[dishId];
            })
            oldOrder.subtotal = parseFloat(oldOrder.subtotal) + parseFloat(order.subtotal);
            oldOrder.pickupInfo.comment += order.pickupInfo.comment;
            if(oldOrder.paymentMethod === "cash"){
              oldOrder.charges['cash'] += order.charges['cash'];
            }
          }
          return _isSame;
        })
        if(!isSamePickup){
          newOrders.push(order);
        }
      });
      newOrders.forEach(function(order){
        dishIds = dishIds.concat(Object.keys(order.orders));
        dishIds = dishIds.filter(function(item, pos){
          return dishIds.indexOf(item) === pos;
        });
      })
      async.each(newOrders, function(order, cb){
        async.auto({
          findMeal : function(next){
             if(!order.meal){
               return next();
             }
             Meal.findOne(order.meal).populate('dishes').populate('dynamicDishes').exec(function(err, meal){
               if(err){
                 return next(err);
               }
               if(!meal){
                 return next();
               }
               order.mealTitle = meal.title;
               async.each(dishIds, function(dishId, next2){
                 Dish.findOne(dishId).exec(function(err, d){
                   if(err){
                     return next2(err);
                   }
                   if(order.orders.hasOwnProperty(dishId)){
                     order[d.title] = order.orders[dishId].number;
                   }else{
                     order[d.title] = 0;
                   }
                   next2();
                 });
               }, function(err){
                 if(err){
                   return next(err);
                 }
                 next();
               })
             })
          },
          findHost : function(next){
            if(!order.host){
              return next();
            }
            Host.findOne(order.host).exec(function (err, host) {
              if(err){
                return next(err);
              }
              order.shopName = host.shopName;
              next();
            })
          }
        }, function(err){
          if(err){
            return cb(err);
          }
          notification.transitLocaleTimeZone(order);
          var wantsReport = req.query.report;
          if(!wantsReport){
            order.deliveryCenter = order.pickupInfo.deliveryCenter;
            order.charge = order.charges[Object.keys(order.charges)[0]];
            order.application_fee = order.application_fees[Object.keys(order.application_fees)[0]];
            order.pickupFromTime = order.pickupInfo.pickupFromTime;
            order.pickupTillTime = order.pickupInfo.pickupTillTime;
            order.pickupPhone = order.contactInfo.phone;
            order.deliveryAddress = order.contactInfo.address;
            order.instruction = order.customInfo.comment;
            delete order.customer;
            delete order.meal;
            delete order.host;
            delete order.orders;
            delete order.contactInfo;
            delete order.pickupInfo;
            delete order.eta;
            delete order.isScheduled;
            delete order.isSendToHost;
            delete order.leftQty;
            delete order.paymentInfo;
            delete order.application_fees;
            delete order.phone;
            delete order.msg;
            delete order.mealId;
            delete order.pickupOption;
            delete order.address;
            delete order.charges;
            delete order.feeCharges;
            delete order.customInfo;
            order.dishes = []
            order.dynamicDishes = [];
            delete order.dishes;
            delete order.dynamicDishes;
          }
          cb();
        });
      },function(err){
        if(err){
          return res.badRequest(err);
        }
        var wantsReport = req.query.report;
        var csv = req.query.csv;
        if(!wantsReport){
          if(csv){
            var csvStr = util.ConvertToCSV(newOrders);
            res.setHeader('Content-disposition', 'attachment; filename=orders.csv');
            res.setHeader('Content-type', 'text/plain');
            res.charset = 'UTF-8';
            return res.end(csvStr);
          }else{
            return res.ok(newOrders);
          }
        }
        var pickups,dishes = [];
        newOrders.forEach(function(order){
          if(!order.pickupInfo){
            return;
          }
          if(!pickups){
            pickups = [order.pickupInfo];
            dishes = order.dishes;
          }
          var isOldPickupOption = pickups.some(function(pickupInfo){
            return (pickupInfo.pickupFromTime === order.pickupInfo.pickupFromTime && pickupInfo.pickupTillTime === order.pickupInfo.pickupTillTime)
              &&  pickupInfo.location === order.pickupInfo.location && pickupInfo.method === order.pickupInfo.method;
          })
          order.dishes.forEach(function(dish){
            var hasDish = dishes.some(function(oldDish){
              return oldDish.id === dish.id;
            })
            if(!hasDish){
              dishes.push(dish);
            }
          })
          if(!isOldPickupOption){
            pickups.push(order.pickupInfo);
          }
        })
        pickups.sort(function(a, b){
          return new Date(a.pickupFromTime).getTime() - new Date(b.pickupFromTime).getTime();
        })
        res.view('report', { meal : { orders : newOrders, pickups : pickups, dishes : dishes }});
      });
    });
  }
};

