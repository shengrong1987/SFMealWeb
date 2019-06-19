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
//-51 : meals don't have same pickup option
//-52 : meals not found
//-53 : order not found
//-54 : meal lack of order
//-55 : meal lack of date
//-56 : meal lack of meal
//-57 : ordered dish not found in meal
//-58 : coupon,points need login to redeem
//-59 : user address exist, can not autosave
//-60 : order total is not enough
//-61 : Alipay lack of source id
//-62 : Wrong payment api
//-63 : Tracking number is empty
//-98 : result not found

module.exports = {

  /*
  Build pick-up info
   */
  buildDeliveryData : function(params, meal, pickups, req, cb){
    //check meals both have the same pickupOption
    var pickUpInfo,delivery_fee = 0;
    if(params.method === "shipping"){
      pickUpInfo = {
        method : 'shipping',
        phone : meal.chef.phone,
        pickupFromTime : moment().add(1,'days').toDate(),
        pickupTillTime : moment().add(2,'days').toDate()
      };
      delivery_fee = 0;
    }else{
      if(params.method === "delivery" && !params.isPartyMode){
        if(params.isDeliveryBySystem){
          delivery_fee = stripe.SYSTEM_DELIVERY_FEE;
        }else{
          delivery_fee = parseFloat(meal.delivery_fee);
        }
      }else if(params.isPartyMode){
        // skip calculating delivery fee
      }else{
        delivery_fee = 0;
      }
      params.pickupOption = params.pickupOption.toString();
      var pickupInfos = params.pickupOption.split(":");
      var pickupIndex;
      var pickupNickname;
      if(pickupInfos.length > 1){
        pickupIndex = parseInt(pickupInfos[1]);
        pickupNickname = pickupInfos[0];
      }else{
        pickupIndex = parseInt(params.pickupOption);
      }
      pickups.forEach(function(pickup){
        if(pickup.index == pickupIndex && (!pickupNickname || pickup.nickname === pickupNickname)){
          pickUpInfo = Object.assign({}, pickup);
        }
      });
    }
    var customComment = params.customInfo ? (params.customInfo.comment) || '' : '';
    var pickupComment = pickUpInfo.comment || '';
    pickUpInfo.comment = customComment + pickupComment;
    if(params.isPartyMode){
      pickUpInfo.pickupFromTime = params.customInfo.time;
      pickUpInfo.pickupTillTime = params.customInfo.time;
      pickUpInfo.comment = params.customInfo.comment;
      pickUpInfo.isDateCustomized = true;
    }
    if(!pickUpInfo){
      sails.log.error("pickup info not exist, check meal setting");
    }
    cb({
      pickupInfo : pickUpInfo,
      delivery_fee : delivery_fee
    });
  },

  /*
    @params:
      orders : detail key to value order list
      subtotal : dishes subtotal
      method : ['pickup','delivery','shipping']
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

	  //sails.log.group("---Order Processing---");
    var _this = this;
    var isAdmin = req.session.authenticated && req.session.user.auth.email === "admin@sfmeal.com";
    var orders = req.body.orders;
    if(!orders){
      return res.badRequest({code: -54, responseText: req.__('meal-checkout-lack-of-order')});
    }

    var targetMeal = req.body.pickupMeal;
    if(!targetMeal){
      return res.badRequest({code : -56, responseText: req.__('meal-checkout-lack-of-meal')});
    }

    Meal.find({where: {status: "on", provideFromTime : { '<' : moment().toDate()}, provideTillTime: {'>': moment().toDate()}}}).populate("chef").populate('dishes').populate("dynamicDishes").exec(function(err, meals) {
      if(err){
        return res.badRequest(err);
      }
      var orderedDishes = [];
      Object.keys(orders).forEach(function(dishId){
        if(orders[dishId].number > 0){
          orderedDishes.push(dishId);
        }
      });

      targetMeal = meals.filter(function(meal){
        return meal.id === targetMeal;
      })[0];

      if(!targetMeal){
        return res.badRequest({ code : -57, responseText : req.__('ordered-dish-not-found')});
      }

      meals = meals.filter(function (meal) {

        if(meal.id === targetMeal.id){
          return true;
        }
        var hasSameNickname = targetMeal.nickname !== "custom" && targetMeal.nickname === meal.nickname;
        var mealHasDish = meal.dishes.some(function(d) {
          return orderedDishes.includes(d.id);
        });
        return mealHasDish && hasSameNickname;
      });

      var notInMealDish;
      var orderedDishInMeal = orderedDishes.every(function(orderedDishId){
        var dishInMeal = meals.some(function(meal){
          return meal.dishes.some(function(d){
            return d.id === orderedDishId;
          })
        });

        if(!dishInMeal){
          sails.log.error("Dish(%s) not in meal error, please check your url.", orderedDishId);
          notInMealDish = orderedDishId;
        }
        return dishInMeal;
      });

      if(!orderedDishInMeal){
        Dish.findOne(notInMealDish).exec(function(err, dish){
          if(err){
            return res.badRequest(err);
          }
          return res.badRequest({ code : -57, responseText : req.__('ordered-dish-not-found', dish.title)});
        })
      }else{
        if(!meals.length){
          return res.badRequest({ code: -52, responseText: req.__('meal-not-found')})
        }
        var _logisticInfo, _orders = [];
        async.auto({
          /*
           * Check parameters pass from client are correct
           */
          validateParams : function(next){
            _this.validateOption(req.body, meals, req, function(err){
              if(err){
                sails.log.error("#1/11 - Error in validate params");
              }else{
                sails.log.debug("#1/11 - Success in validate params");
              }
              next(err);
            });
          },
          validateOrders : ['validateParams', function(next){
            async.each(meals, function(meal, nextIn){
              _this.validateMeal(meal, orders, null, req, null, nextIn);
            }, function(err){
              if(err){
                sails.log.error("#2/11 - Error in validate orders");
              }else{
                sails.log.debug("#2/11 - Success in validate orders");
              }
              next(err);
            })
          }],
          buildOptions : ['validateOrders', function(next){
            _this.buildDeliveryData(req.body, meals[0], meals[0].pickups, req, function(logisticInfo){
              sails.log.debug("#3/11 - Success in building logistic info: " + logisticInfo);
              _logisticInfo = logisticInfo;
              next();
            });
          }],
          validateSubtotal : ['buildOptions', function(next){
            var subtotal = 0;
            if(meals && meals.length){
              meals.forEach(function(meal){
                subtotal += meal.subtotal;
              });
              sails.log.debug("#4/11 - Sucess in validating subtotal: " + subtotal + " with a minimal of " + _logisticInfo.pickupInfo.minimalOrder);
              if(parseFloat(subtotal) < parseFloat(_logisticInfo.pickupInfo.minimalOrder) && !isAdmin){
                return next({ code: -60, responseText : req.__('order-single-minimal-not-reach', _logisticInfo.pickupInfo.minimalOrder)});
              }
              next();
            }else{
              next();
            }
          }],
          saveAddress : ['validateSubtotal', function(next){
            if(!req.session.authenticated){
              return next();
            }
            var method = req.body.method;
            var address = req.body.contactInfo.address;
            var phone = req.body.contactInfo.phone;
            if(method !== "delivery" && !address){
              return next();
            }
            User.findOne(req.session.user.id).exec(function(err, user){
              if(err){
                return next(err);
              }
              if(user.address.length){
                return next();
              }
              require('../services/geocode').geocode(address, function (err, result) {
                if (err) {
                  sails.log.error("#5/11 - Error in geocoding user address: " + address);
                  return next(req.__('meal-error-address'));
                }
                if (result.length === 0) {
                  sails.log.error("#5/11 - Error looking for address: " + address);
                  return next(req.__('meal-error-address2'));
                }
                sails.log.debug("#5/11 - Success in saving address: " + address + " & phone no.: " + phone);
                var administration = result[0].administrativeLevels;
                user.county = administration.level2long;
                user.city = result[0].city;
                user.full_address = result[0].formattedAddress;
                user.lat = result[0].latitude;
                user.long = result[0].longitude;
                user.zip = result[0].zipcode;
                var addObj = {};
                addObj.id = new Date().getTime();
                addObj.street = result[0].streetNumber + " " + result[0].streetName;
                addObj.city = result[0].city;
                addObj.zip = result[0].zipcode;
                addObj.phone = phone;
                user.address = [addObj];
                user.save(next);
              });
            })
          }],
          buildOrders : ['saveAddress', function(next){
            var index = 0;
            async.eachSeries(meals, function(meal, nextIn){
              var orderParam = {};
              orderParam.subtotal = parseFloat(meal.subtotal) || 0;
              orderParam.orders = meal.orders;
              orderParam.host = meal.chef.id;
              orderParam.type = meal.type;
              orderParam.dishes = meal.dishes;
              orderParam.method = req.body.method;
              orderParam.meal = meal.id;
              orderParam.hostEmail = meal.chef.email;
              orderParam.phone = meal.chef.phone;
              orderParam.tax = _this.getTax(req.body.subtotal, meal.chef.county, meal.isTaxIncluded);
              orderParam.serviceFee = meal.serviceFee;
              orderParam.eta = meal.eta;
              if(!index){
                orderParam.tip = parseFloat(req.body.tip).toFixed(2);
              }else{
                orderParam.tip = 0;
              }
              orderParam.paymentInfo = req.body.paymentInfo;
              orderParam.contactInfo = req.body.contactInfo;
              orderParam.pickupInfo = _logisticInfo.pickupInfo;
              orderParam.customInfo = req.body.customInfo;
              orderParam.delivery_fee = _logisticInfo.delivery_fee;
              index++;
              if(meal.type === "order"){
                orderParam.status = "preparing";
              }else{
                orderParam.status = "schedule";
              }
              async.auto({
                normalCheckOut : function(nextIn2){
                  if(!req.session.authenticated){
                    return nextIn2();
                  }
                  User.findOne(req.session.user.id).populate('payment').populate("coupons").populate('auth').exec(function (err, found) {
                    if (err) {
                      return nextIn2(err);
                    }
                    var contactInfo = req.body.contactInfo;
                    var paymentInfo = req.body.paymentInfo;
                    if(paymentInfo.method === 'online' && (!found.payment || found.payment.length === 0)){
                      return nextIn2({ responseText : req.__('order-lack-payment'), code : -5});
                    }
                    if(!found.phone && !contactInfo.phone){
                      return nextIn2({ responseText : req.__('order-lack-contact'), code : -31});
                    }
                    if(!found.firstname && !contactInfo.name){
                      return nextIn2({ responseText : req.__('order-lack-contact'), code : -31});
                    }
                    orderParam.guestEmail = found.email || found.auth.email || process.env.ADMIN_EMAIL;
                    orderParam.customerName = contactInfo.name || found.firstname;
                    orderParam.customerPhone = contactInfo.phone || found.phone;
                    orderParam.customerId = found.payment[0] ? found.payment[0].customerId : null;
                    orderParam.paymentMethod = paymentInfo.method;
                    orderParam.isExpressCheckout = false;
                    orderParam.customer = req.session.user.id;

                    var code = req.body.couponCode, pointsRedeem = req.body.points;

                    if(code && pointsRedeem){
                      return nextIn2({ code : -23, responseText : req.__('order-duplicate-discount')});
                    }

                    //validate Coupon
                    _this.verifyCoupon(req, code, found, meal, function(err, coupon){
                      if(err){
                        sails.log.error("#6-1/11 - Error in verifing coupon");
                        return nextIn2(err);
                      }
                      sails.log.debug("#6-1/11 - Success in verifing coupon");
                      var subtotalAfterTax = meal.subtotal + orderParam.tax/100;
                      _this.redeemPoints(req, pointsRedeem, found, subtotalAfterTax, function(err, discount){
                        if(err){
                          sails.log.error("#6-2/11 - Error in redeeming points");
                          return nextIn2(err);
                        }
                        sails.log.debug("#6-2/11 - Success in redeeming points");
                        req.body.points -= (discount * 10);
                        orderParam.redeemPoints = pointsRedeem;
                        _this.redeemCoupon(req, code, subtotalAfterTax, coupon, found, discount, function(err, discount){
                          if(err){
                            sails.log.error("#6-3/11 - Success in redeeming coupon");
                            return nextIn2(err);
                          }
                          sails.log.debug("#6-3/11 - Success in redeeming coupon");
                          if(coupon){
                            orderParam.coupon = coupon.id;
                          }
                          orderParam.discountAmount = discount;
                          orderParam.discount = discount;
                          nextIn2();
                        });
                      });
                    });
                  });
                },
                expressCheckout : function(nextIn2) {
                  if(req.session.authenticated){
                    return nextIn2();
                  }
                  var contactInfo = req.body.contactInfo;
                  var paymentInfo = req.body.paymentInfo;
                  var code = req.body.couponCode, pointsRedeem = req.body.points;
                  if(code || pointsRedeem){
                    return nextIn2({ responseText : req.__('order-redeem-not-login'), code: -58});
                  }
                  if(paymentInfo.method === 'online' && !paymentInfo.token){
                    return nextIn2({ responseText : req.__('order-lack-payment'), code : -5});
                  }
                  if(paymentInfo.method === 'cash' && (!contactInfo.phone || !contactInfo.name)){
                    return nextIn2({ responseText : req.__('order-cash-miss-profile'), code : -27});
                  }
                  if(!contactInfo.phone){
                    return nextIn2(req.__('order-lack-contact'));
                  }
                  orderParam.guestEmail = process.env.ADMIN_EMAIL;
                  orderParam.customerName = contactInfo.name || req.__('user');
                  orderParam.customerPhone = contactInfo.phone;
                  orderParam.paymentMethod = paymentInfo.method;
                  orderParam.locale = req.getLocale();
                  orderParam.isExpressCheckout = true;
                  stripe.newCustomerWithCard({
                    token : paymentInfo.token,
                    email : process.env.ADMIN_EMAIL
                  }, function(err, customer){
                    if(err){
                      return nextIn2({ code : -45, responseText : err.message });
                    }
                    orderParam.customerId = customer.id;
                    orderParam.discount = 0;
                    nextIn2();
                  });
                }
              }, function(err){
                if(err){
                  return nextIn(err);
                }
                Order.create(orderParam).exec(function (err, order) {
                  if (err) {
                    return nextIn(err);
                  }
                  sails.log.debug("#6/11 - Building order: " + order.id);
                  order.meal = meal;
                  order.dishes = meal.dishes;
                  _orders.push(order);
                  nextIn();
                });
              })
            }, function(err){
              if(err){
                return next(err);
              }
              next();
            })
          }],
          makePayments : [ 'buildOrders', function(next){
            sails.log.debug("#7/11 - Make payment of orders");
            async.eachSeries(_orders, function(order, nextIn){
              if(order.paymentMethod === "alipay" || order.paymentMethod === "wechatpay"){
                stripe.newSource({
                  type : order.paymentMethod,
                  isInitial : true,
                  amount : order.subtotal * 100,
                  tip : order.tip,
                  deliveryFee : parseInt(order.delivery_fee * 100),
                  discount : order.discount * 100,
                  email : order.guestEmail,
                  meal : order.meal,
                  method : order.method,
                  tax : order.tax,
                  metadata : {
                    mealId : order.meal.id,
                    hostId : order.meal.chef.id,
                    orderId : order.id,
                    userId : order.customer,
                    deliveryFee : parseInt(order.delivery_fee * 100),
                    tax : order.tax,
                    discount : order.discount * 100
                  }
                }, function(err, source){
                  if(err){
                    return nextIn({ code : -45, responseText : err.message });
                  }
                  order.source = source;
                  order.status = "pending-payment";
                  order.sourceId = source.id;
                  order.client_secret = source.client_secret;
                  order.service_fee = order.meal.serviceFee;
                  nextIn();
                });
              }else{
                stripe.charge({
                  paymentMethod : order.paymentMethod,
                  isInitial : true,
                  amount : order.subtotal * 100,
                  tip : order.tip,
                  deliveryFee : parseInt(order.delivery_fee * 100),
                  discount : order.discount * 100,
                  email : order.guestEmail,
                  customerId : order.customerId,
                  destination : order.meal.chef.accountId,
                  meal : order.meal,
                  method : order.method,
                  tax : order.tax,
                  isPartyMode : order.isPartyMode,
                  metadata : {
                    mealId : order.meal.id,
                    hostId : order.meal.chef.id,
                    orderId : order.id,
                    userId : order.customer,
                    deliveryFee : parseInt(order.delivery_fee * 100),
                    tax : order.tax
                  }
                },function(err, charge, transfer){
                  if(err){
                    Order.destroy(order.id).exec(function(err2){
                      if(err2){
                        return nextIn(err2);
                      }
                      return nextIn({ code : -39, responseText : err.message });
                    });
                  }else{
                    order.source = "charged";
                    order.charges = {};
                    order.transfer = {};
                    order.feeCharges = {};
                    order.application_fees = {};

                    if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
                      order.charges['cash'] = order.charges['cash'] || 0;
                      order.application_fees['cash'] = order.application_fees['cash'] || 0;
                      order.charges['cash'] += charge.amount;
                      order.application_fees['cash'] += charge.application_fee;
                      order.feeCharges[charge.id] = charge.application_fee;
                    }else if(charge){
                      order.isPaid = true;
                      order.charges[charge.id] = charge.amount;
                      order.application_fees[charge.id] = parseInt(charge.metadata.application_fee);
                    }
                    if(transfer){
                      order.transfer[transfer.id] = transfer.amount;
                    }
                    nextIn();
                  }
                });
              }
            }, function(err){
              if(err){
                return next(err);
              }
              next();
            })
          }],
          updateMeal : [ 'makePayments', function(next){
            async.each(_orders, function(order, nextIn){
              _this.updateMealLeftQty(order, order.meal, _this.clearOrder(order.orders), order.orders, function(err, meal){
                if(err){
                  return nextIn(err);
                }
                order.leftQty = meal.leftQty;
                nextIn();
              })
            }, function(err){
              if(err){
                sails.log.error("#8/11 - Error in updating dish qty");
                return next(err);
              }
              sails.log.debug("#8/11 - Success in updating dish qty");
              next();
            });
          }],
          addPoints : [ 'updateMeal',function(next){
            async.each(_orders, function (order, nextIn) {
              _this.addReferrerPoints(order.customer, nextIn);
            }, function(err){
              if(err){
                sails.log.debug("#9/11 - Error in adding referral points");
                return next(err);
              }
              sails.log.debug("#9/11 - Success in adding referral points");
              next();
            })
          }],
          checkBadges : ['addPoints', function(next){
            if(!req.session.authenticated){
              return next();
            }
            User.findOne(req.session.user.id).exec(function(err, user){
              if(err){
                return next(err);
              }
              Badge.find().exec(function(err, badges){
                if(err){
                  return next(err);
                }
                badges = badges.filter(function(badge){
                  return !user.badgeInfo || !user.badgeInfo.hasOwnProperty(badge.id) || !user.badgeInfo[badge.id].isAchieved;
                });
                async.each(badges, function(badge, nextIn){
                  var model = badge.model;
                  badge.rule.id = badge.rule.id.replace("${userId}",user.id);
                  _this.sails.models[model].find(badge.rule).exec(function(err, modelData){
                    if(err){
                      return nextIn(err);
                    }
                    if(!modelData || !modelData.length){
                      return nextIn();
                    }
                    user.badgeInfo = user.badgeInfo || {};
                    user.badgeInfo[badge.id] = user.badgeInfo[badge.id] || {};
                    user.badgeInfo[badge.id].isAchieved = true;
                    user.badgeInfo[badge.id].achievedDate = moment().format("ll");
                    notification.notificationCenter("Badge", "new", badge, false, false, req);
                    nextIn();
                  });
                }, function(err){
                  if(err){
                    sails.log.error("#10/11 - Error in updating badge info");
                    return next(err);
                  }
                  user.save(function(err, u){
                    if(err){
                      return next(err);
                    }
                    sails.log.debug("#10/11 - Success in updating badge info");
                    next();
                  })
                })
              });
            })
          }],
          finalizeOrder : ['checkBadges', function(next){
            async.each(_orders, function(order, nextIn){
              var _m = order.meal;
              order.meal = order.meal.id;
              order.save(function(err, o){
                if(err){
                  return nextIn(err);
                }
                if(process.env.NODE_ENV === "development"){
                  order.meal = _m;
                }
                order = o;
                notification.notificationCenter("Order", "new", order, true, false, req);
                nextIn();
              });
            }, function(err){
              if(err){
                sails.log.debug("#11/11 - Error in finalizing order");
                return next(err);
              }
              var combinedOrder = _this.combineOrders(_orders);
              notification.notificationCenter("Order", "new", combinedOrder, false, false, req);
              sails.log.debug("#11/11 - Success in finalizing order");
              next();
            })
          }]
        }, function(err){
          if(err){
            return res.badRequest(err);
          }
          res.ok({ orders : _orders});
        })
      }
    });
  },

  afterSuccessCharge : function(order, m, charge, transfer, req, res){
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

        if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
          order.charges['cash'] = order.charges['cash'] || 0;
          order.application_fees['cash'] = order.application_fees['cash'] || 0;
          order.charges['cash'] += charge.amount;
          order.application_fees['cash'] += charge.application_fee;
          order.feeCharges[charge.id] = charge.application_fee;
        }else{
          if(charge){
            order.isPaid = true;
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
            if(req.session.authenticated){
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
    var orderIds = req.params.id;
    var params = req.body;
    var subtotal = parseFloat(params.subtotal);
    var delivery_fee = parseFloat(params.delivery_fee);
    var tip = (params.tip || 0).toFixed(2);
    var $this = this;
    var _orders = [];
    var adjustAmount = 0;
    var _orderStatus, _isSendToHost = true;
    async.eachSeries(orderIds.split("+"), function(orderId, cb){
      Order.findOne(orderId).populate("meal").populate("dishes").populate("host").populate("customer").populate('coupon').exec(function(err,order){
        if(err){
          return cb(err)
        }
        if(order.coupon){
          return cb({ code : -18, responseText : req.__('adjust-with-coupon-error')});
        }
        Meal.findOne(order.meal.id).populate("dishes").populate("dynamicDishes").exec(function(err, meal){
          if(err){
            return cb(err);
          }
          Dish.find({ chef : meal.chef, isVerified : true}).exec(function(err, dishes) {
            if (err) {
              return cb(err);
            }
            if (!!order.isPartyMode) {
              meal.dishes = dishes;
            }
            order.service_fee = order.meal.serviceFee;
            $this.validateMeal(meal, params.orders, order.orders, req, order, function(err){
              if(err){
                return cb(err);
              }
              if(hostId === order.host.id){
                _isSendToHost = false;
              }
              if(order.status === "schedule"){
                _orderStatus = order.status;
                //host cannot adjust the order at schedule
                //can update without permission of host or adjust by host
                var netDiff = parseFloat(meal.subtotal - order.subtotal);
                var tax = $this.getTax(netDiff, order.host.county, order.meal.isTaxIncluded);
                netDiff *= 100;
                adjustAmount += netDiff + tax;
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
                      if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
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
                    async.auto({
                      refundOrders : function(next2) {
                        if (order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal") {
                          return next2();
                        }
                        var metadata = {
                          userId: !!order.customer ? order.customer.id : null,
                          paymentMethod: order.paymentMethod,
                          reverse_transfer : true,
                          refund_application_fee : true,
                          amount : Math.abs(adjustAmount)
                        };;
                        stripe.batchRefund(order.charges, order.transfer, metadata, function (err) {
                          if (err) {
                            return next2(err);
                          }
                          next2();
                        });
                      },
                      refundFeeForCashOrder: function (next2) {
                        if (order.paymentMethod !== "cash" && order.paymentMethod !== "venmo" && order.paymentMethod !== "paypal") {
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
                          order.charges['cash'] += netDiff;
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
                      order.subtotal = meal.subtotal;
                      order.tax += tax;
                      order.meal = m.id;
                      next();
                    });
                  }]
                }, function(err){
                  if(err){
                    return cb(err);
                  }
                  _orders.push(order);
                  order.save(function(err,result){
                    if(err){
                      return cb(err);
                    }
                    Meal.findOne(order.meal).populate("dishes").exec(function(err, meal){
                      if(err){
                        return cb(err);
                      }
                      notification.notificationCenter("Order", "adjust", result, _isSendToHost, false, req);
                      cb();
                    });
                  })

                });
              }else if(order.status === "preparing"){
                _orderStatus = order.status;
                order.lastStatus = order.status;
                order.status = "adjust";
                order.isSendToHost = _isSendToHost;
                order.adjusting_orders = params.orders;
                order.adjusting_subtotal = meal.subtotal;
                order.service_fee = order.meal.serviceFee;
                order.meal = order.meal.id;
                order.save(function(err,result){
                  if(err){
                    return cb(err);
                  }
                  _orders.push(order);
                  notification.notificationCenter("Order", "adjusting", result, _isSendToHost, false, req);
                  cb();
                });
              }else{
                return res.badRequest({ code : -43, responseText : req.__('order-manipulate-wrong-status')})
              }
            })
          });
        });
      });
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      if(req.wantsJSON && process.env.NODE_ENV === "development"){
        return res.ok({ orders : _orders });
      }
      if(_orderStatus === "schedule"){
        return res.ok({responseText : req.__('order-adjust-ok', (adjustAmount/100).toFixed(2)) });
      }else{
        if(_isSendToHost){
          return res.ok({ responseText : req.__('order-adjust-request-user')} );
        }else{
          return res.ok({ responseText : req.__('order-adjust-request-host')} );
        }
      }
    })
  },

  /*
  Cancel Order API
  User can cancel a specific order at its scheduled or preparing status
   */

  cancel : function(req, res){
    var userId = req.session.user.id;
    var hostId = req.session.user.host ? (req.session.user.host.id || req.session.user.host) : null;
    var email = req.session.user.auth.email;
    var orderIds = req.params.id.split("+");
    var params = req.body;
    var $this = this;
    var orders = [];
    async.each(orderIds, function(orderId, nextOut){
      Order.findOne(orderId).populate("meal").populate("host").populate("dishes").populate("customer").populate("coupon").exec(function(err,order){
        if(err){
          return nextOut(err)
        }

        if(order.coupon){
          return nextOut({ code : -19, responseText : req.__('cancel-with-coupon-error')});
        }

        var isSendToHost = true;
        if(hostId === order.host.id){
          isSendToHost = false;
        }

        if(order.status === "schedule"){
          //can cancel without permission of host
          User.findOne(order.customer.id).populate('payment').exec(function (err, user) {
            if(err) {
              return nextOut(err);
            }
            if(order.paymentMethod === 'online' && (!user.payment || user.payment.length === 0)){
              return nextOut({ responseText : req.__('order-lack-payment'), code : -5});
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
                if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
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
                    return next(err);
                  }
                  if(order.charges){
                    order.charges['cash'] = 0;
                  }
                  if(order.application_fees){
                    order.application_fees['cash'] = 0;
                  }
                  next();
                });
              }
            },function(err){
              if(err){
                return nextOut(err);
              }
              var emptyOrders = $this.clearOrder(order.orders);
              $this.updateMealLeftQty(order, order.meal, order.orders, emptyOrders, function(err, m) {
                if (err) {
                  return nextOut(err);
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
                    return nextOut(err);
                  }
                  Meal.findOne(m.id).populate("dishes").exec(function(err, meal){
                    if(err){
                      return nextOut(err);
                    }
                    notification.notificationCenter("Order", "cancel", result, isSendToHost, false, req);
                    $this.cancelOrderJob(result.id,'', function(err){
                      if(err){
                        return nextOut(err);
                      }
                      result.meal = meal;
                      orders.push(result);
                      nextOut();
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
              return nextOut(err);
            }
            //send notification
            result.service_fee = result.meal.serviceFee;
            notification.notificationCenter("Order", "cancelling", result, isSendToHost, false, req);
            orders.push(result);
            nextOut();
          });
        }
      });
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      if(req.wantsJSON && process.env.NODE_ENV === "development"){
        return res.ok(orders);
      }
      var isPreparing = orders.some(function(order){
        return order.lastStatus === "preparing";
      });
      if(isPreparing){
        if(orders[0].isSendToHost){
          return res.ok({responseText : req.__('order-cancel-request-user')});
        }else{
          return res.ok({responseText : req.__('order-cancel-request-host')});
        }
      }else{
        res.ok({responseText : req.__('order-cancel-ok'), tax : orders[0].tax, paymentMethod : orders[0].paymentMethod, charges : orders[0].charges, feeCharges : orders[0].feeCharges, application_fees : orders[0].application_fees});
      }
    })

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
                if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
                  if(order.charges){
                    order.charges['cash'] = order.charges['cash'] || 0;
                    order.charges['cash'] += charge.amount;
                  }
                  if(order.application_fees){
                    order.application_fees['cash'] = order.application_fees['cash'] || 0;
                    order.application_fees['cash'] += charge.application_fee;
                  }
                  if(order.feeCharges){
                    order.feeCharges[charge.id] = charge.application_fee;
                  }
                }else{
                  if(charge){
                    if(order.charges){
                      order.charges[charge.id] = charge.amount;
                    }
                    if(order.application_fees){
                      order.application_fees[charge.id] = parseInt(charge.metadata.application_fee);
                    }
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
                  if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
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
                    if(order.charges){
                      order.charges["cash"] += adjustAmount;
                    }
                    if(order.application_fees){
                      order.application_fees['cash'] -= refundedFee;
                    }
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
              if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
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
                if(order.charges){
                  order.charges['cash'] = 0;
                }
                if(order.application_fees){
                  order.application_fees['cash'] = 0;
                }
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
      async.auto({
        alipay : function(next){
          if(order.paymentMethod !== "alipay"){
            return next( { code : -62, responseText : req.__('wrong-payment-api', order.paymentMethod)});
          }
          var sourceId = order.sourceId;
          if(!sourceId){
            return next({ code : -61, responseText : req.__('alipayment-lack-of-source')});
          }
          stripe.getSource({
            id : sourceId
          }, function(err, source){
            if(err){
              return next({ code : -45, responseText : err.message });
            }
            if(source.status !== "pending"){
              return next({ code : -39, responseText : req.__('ali-payment-failure')});
            }
            order.source = source;
            next();
          });
        }
      })
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(order);
    });
  },

  payment : function(req, res){
    var orderIds = req.params.id.split("+");
    var subtotal = 0, discount = 0, tip = 0, o;
    async.each(orderIds, function(orderId, next){
      Order.findOne(orderId).exec(function(err, order){
        if(err){
          return next(err);
        }
        if(!o){
          o = order;
        }
        subtotal += order.subtotal;
        discount += order.discount;
        tip += order.tip;
        next();
      })
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      o.subtotal = subtotal;
      o.discount = discount;
      o.tip = tip;
      if(o.paymentMethod === "alipay"){
        return next( { code : -62, responseText : req.__('wrong-payment-api', o.paymentMethod)});
      }
      return res.view('topay', { order : o, layout : 'popup' });
    })
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
      order.adjusting_orders = {};
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

  tracking : function(req, res){
    var trackingNumber = req.body.tracking;
    var orderId = req.params.id;
    if(!trackingNumber){
      return res.badRequest({ code : -63, responseText : req.__('tracking-number-empty-error')});
    }
    Order.findOne(orderId).exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      order.pickupInfo.tracking = trackingNumber;
      order.status = "ready";
      //to-do send email notification
      order.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        res.ok(result);
      })
    })
  },

  receipt : function(req, res){
    var orderIds = req.params.id;
    if(!orderIds){
      return res.notFound();
    }
    orderIds = orderIds.split("+");
    var _orders = [];
    async.eachSeries(orderIds, function(orderId,next){
      Order.findOne(orderId).populate("dishes").populate('host').populate('meal').exec(function(err, order){
        if(err){
          return next(err);
        }
        if(!order){
          return next({ code : -53});
        }
        notification.transitLocaleTimeZone(order);
        order.download = false;
        order.discount = order.discount || 0;
        order.tip = order.tip || 0;
        _orders.push(order);
        next();
      })
    }, function(err){
      if(err && err.code === -53){
        return res.notFound();
      }
      if(err){
        return res.badRequest(err);
      }
      res.view('receipt', { orders: _orders});
    })
  },

  downloadReceipt : function(req, res) {
    var orderIds = req.params.id;
    if(!orderIds){
      return res.notFound();
    }
    orderIds = orderIds.split("+");
    var _orders = [];

    async.each(orderIds, function(orderId,next){
      Order.findOne(orderId).populate("dishes").populate('host').populate("meal").exec(function(err, order){
        if(err){
          return res.badRequest(err);
        }
        notification.transitLocaleTimeZone(order);
        order.layout = false;
        order.download = true;
        _orders.push(order);
        next();
      })
    }, function(err){
      if(err && err.code === -53){
        return res.notFound();
      }
      if(err){
        return res.badRequest(err);
      }
      var dateString = moment().format("ddd, hA");
      // res.set('Content-Disposition','attachment; filename="' + dateString + '"-receipt.html" ')
      res.view('receipt', { orders : _orders});
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
    var orderIds = req.params.id.split("+");
    var orders = [];
    async.each(orderIds, function(orderId, next) {
      Order.findOne(orderId).populate("customer").populate("meal").populate("dishes").populate("host").exec(function (err, order) {
        if(err){
          return next(err);
        }
        orders.push(order);
        next();
      })
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      return res.view("order_adjust",{layout:false, orders : orders});
    });
  },

  getProperties : function(preferences){
    var properties = [];
    if(!preferences){
      return [];
    }
    preferences.forEach(function(preference){
      var props = preference.property;
      if(props){
        props.forEach(function(prop){
          properties.push(prop);
        });
      }
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
      if(!order[dishId] || !lastOrder[dishId]){
        return;
      }
      leftQty[dishId] = parseInt(parseInt(lastOrder[dishId].number) - parseInt(order[dishId].number)) + parseInt(leftQty[dishId]);
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
      if(req.body.comment){
        req.body.customInfo.comment = req.body.comment;
      }
      Meal.findOne(mealId).populate("dishes").populate("chef").exec(function(err, meal){
        if(err){
          return res.badRequest(err);
        }
        _this.validateOption(req.body, [meal], req, function(err){
          if(err){
            return res.badRequest(err);
          }
          let _pickups = [];
          Meal.find({ where : { status : "on", provideFromTime : { '<' : moment().toDate()}, provideTillTime : { '>' : moment().toDate()}}}).populate('dishes').populate('chef').exec(function(err, meals){
            if(err){
              return res.badRequest(err);
            }
            var _dishes=[];
            async.auto({
              findPickups : function(next){
                meals.forEach(function(meal){
                  if(!_pickups.length){
                    _pickups = meal.pickups;
                  }else{
                    meal.pickups.forEach(function(pickup){
                      if(!_pickups.some(function(p){
                        return moment(p.pickupFromTime).isSame(pickup.pickupFromTime, 'minutes') && moment(p.pickupTillTime).isSame(pickup.pickupTillTime, 'minutes') && p.location === pickup.location && p.method === pickup.method;
                      })){
                        _pickups.push(pickup);
                      }
                    })
                  }
                });
                next();
              }
            }, function(err){
              if(err){
                return res.badRequest(err);
              }
              _this.buildDeliveryData(req.body, meal, _pickups, req, function(_logisticInfo){
                req.body.pickupInfo = _logisticInfo.pickupInfo;
                req.body.delivery_fee = _logisticInfo.delivery_fee;
                _this.cancelOrderJob(orderId, '', function(err){
                  if(err){
                    return res.badRequest(err);
                  }
                  req.body.pickupOption = _logisticInfo.pickupInfo.index;
                  req.body.isScheduled = false;
                  Order.update(order.id, req.body).exec(function(err, result){
                    if(err){
                      return res.badRequest(err);
                    }
                    result[0].meal = meal;
                    result[0].host = order.host;
                    res.ok(result[0]);
                  });
                });
              });
            })
          })
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
          if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
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
            if(order.charges){
              order.charges['cash'] = 0;
            }
            if(order.application_fees){
              order.application_fees['cash'] = 0;
            }
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
          if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
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
            if(order.charges){
              order.charges['cash'] -= discount;
            }
            if(order.application_fees){
              order.application_fees['cash'] -= refundedFee;
            }
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
        order.discount = discount / 100;
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

  paid : function(req, res){
    var orderId = req.params.id;
    var tip = req.body.tip;
    Order.findOne(orderId).exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      if(order.status === "cancel"){
        return res.badRequest({ code : -43, responseText : req.__('order-manipulate-wrong-status')});
      }
      order.isPaid = true;
      order.tip = tip;
      order.save(function(err, o){
        if(err){
          return res.badRequest(err);
        }
        res.ok(o);
      })
    })
  },

  adjustAdmin : function(req, res){
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("dishes").populate("host").populate("customer").populate('coupon').exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      if(order.status === "cancel"){
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
          $this.validateMeal(meal, params.orders, order.orders, req, order, function(err){
            if(err){
              sails.log.error(err.responseText);
              return res.badRequest(err);
            }
            var isSendToHost = true;
            var netDiff = parseFloat(params.subtotal - order.subtotal);
            var tax = $this.getTax(netDiff, order.host.county, order.meal.isTaxIncluded);
            netDiff *= 100;
            var adjustAmount = netDiff + tax;
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
                  if(order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal"){
                    if(order.charges){
                      order.charges['cash'] = order.charges['cash'] || 0;
                      order.charges['cash'] += charge.amount;
                    }
                    if(order.application_fees){
                      order.application_fees['cash'] = order.application_fees['cash'] || 0;
                      order.application_fees['cash'] += charge.application_fee;
                    }
                    if(order.feeCharges){
                      order.feeCharges[charge.id] = charge.application_fee;
                    }
                  }else{
                    if(order.charges){
                      order.charges[charge.id] = charge.amount;
                    }
                  }
                  if(transfer && order.transfer){
                    order.transfer[transfer.id] = transfer.amount;
                  }
                  next();
                });
              },
              refundCustomer : function(next){
                if(netDiff >= 0){
                  return next();
                }
                async.auto({
                  refundOrders : function(next2) {
                    if (order.paymentMethod === "cash" || order.paymentMethod === "venmo" || order.paymentMethod === "paypal") {
                      return next2();
                    }
                    var metadata = {
                      userId: !!order.customer ? order.customer.id : null,
                      paymentMethod: order.paymentMethod,
                      reverse_transfer : true,
                      refund_application_fee : true,
                      amount : Math.abs(adjustAmount)
                    };
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
                      if(order.application_fees){
                        order.application_fees['cash'] += refundedFee;
                      }
                      if(order.charges){
                        order.charges['cash'] += netDiff;
                      }
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
                  return res.ok({responseText : req.__('order-adjust-ok', (adjustAmount/100).toFixed(2)) });
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
  validateMeal : function(meal, orders, lastOrders, req, order, cb) {
    var now = new Date();
    var params = req.body;
    var subtotal = parseFloat(params.subtotal);
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
    if(isPartyMode){
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
      var ms = moment(customDate).diff(now);
      var d = moment.duration(ms);
      if(d.asHours() < 24){
        return cb({ responseText : req.__('order-party-time-invalid'), code : -34});
      }
    }

    var actual_subtotal = 0;
    var validDish = false;
    var $this = this;
    var mealOrder = Object.assign({}, orders);

    async.each(Object.keys(orders), function(dishId, next){
      var qty = parseInt(orders[dishId].number);
      var properties = $this.getProperties(orders[dishId].preference);
      if(lastOrders && lastOrders[dishId]){
        var lastQty = lastOrders ? parseInt(lastOrders[dishId].number) : 0;
      }else{
        lastQty = 0;
      }
      if(qty > 0 || lastQty > 0){
        var hasDish;
        async.each(meal.dishes, function(dish, next2){
          if(dish.id === dishId){
            hasDish = true;
            if(!dish.isVerified){
              return next2({responseText : req.__('order-invalid-dish',dish.title), code : -2});
            }
            if(params.method === "shipping" && !dish.isSupportShipping){
              return next2({responseText : req.__('order-dish-not-shipping',dish.title), code : -2});
            }
            var extra = 0;
            //check property exist
            if(!properties.every(function(property){
                if(property && dish.preference) {
                  var hasPreference = Object.keys(dish.preference).some(function(preference){
                    var props = dish.preference[preference];
                    var hasPros = props.some(function(p){
                      if(p.property === property.property){
                        extra += parseInt(p.extra);
                        return true;
                      }
                      return false;
                    });
                    return hasPros;
                  });
                  return hasPreference;
                }else{
                  return true;
                }
              })){
              return next2({ responseText : req.__('order-preference-not-exist'), code : -20});
            }
            var diff = qty - lastQty;
            if(!isPartyMode && diff > meal.leftQty[dish.id]){
              return next2({responseText : req.__('order-dish-not-enough',dish.title, qty), code : -1});
            }
            var totalQty = meal.getDynamicDishesTotalOrder(qty);
            var price = dish.getPrice(totalQty, meal);
            var listPrice = parseFloat(mealOrder[dishId].price);
            if(price !== listPrice){
              mealOrder[dishId].price = price;
              orders[dishId].price = price;
            }
            actual_subtotal += (qty * price + extra);
          }
          next2();
        }, function(err){
          if(err){
            return next(err);
          }
          if(!hasDish){
            delete mealOrder[dishId];
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
      meal.subtotal = actual_subtotal;
      meal.orders = mealOrder;
      return cb(null);
    });
  },

  /*
   check if parameters are valid
   */
  validateOption : function(params, meals, req, cb){
    if(!params.pickupOption){
      return cb({responseText : req.__('order-pickup-option-empty-error'), code : -20});
    }
    params.pickupOption = params.pickupOption.toString();
    var pickupOptions = params.pickupOption.split(":");
    if(pickupOptions.length > 1){
      var pickupOption = parseInt(pickupOptions[1]);
      var pickupNickname = pickupOptions[0];
    }else{
      pickupOption = parseInt(params.pickupOption);
    }
    var pickups = [];
    var existInMeals = meals.forEach(function(meal){
      var pickup = meal.pickups.filter(function(pickup){
        return pickup.index === pickupOption && ( !pickupNickname && pickup.nickname === pickupNickname);
      })[0];
      if(pickup){
        pickups.push(pickup);
      }
    });
    var isSamePickup = pickups.every(function(p){
      var p2 = pickups[0];
      return moment(p.pickupFromTime).isSame(moment(p2.pickupFromTime), 'minute') && moment(p.pickupTillTime).isSame(moment(p2.pickupTillTime), 'minute') && p.location === p2.location;
    });
    if(!isSamePickup){
      return cb({ code : -51, responseText : req.__('meal-not-same-pickup-option')});
    }



    async.each(meals, function(meal, next){
      var method = params.method;
      if(method === "pickup"){
        if(!!params.isPartyMode){
          return next({ code : -36, responseText : req.__('party-order-need-delivery')})
        }
        return next();
      }else if(method === "delivery"){
        var contactInfo = params.contactInfo;
        if(!contactInfo.address){
          return next({responseText: req.__('order-incomplete-address'), code: -29});
        }
        var full_address = contactInfo.address;
        sails.log.info("meal: " + meal.title);
        if(!meal.isDelivery && !params.isPartyMode) {
          return next({responseText: req.__('order-invalid-method'), code: -11});
        }
        var range = params.isPartyMode ? meal.delivery_range * stripe.PARTY_ORDER_RANGE_MULTIPLIER : meal.delivery_range;
        if(!pickupOption){
          return next({responseText : req.__('order-pickup-option-empty-error'), code : -20});
        }else if(pickupOption > meal.pickups.length+1){
          return next({responseText : req.__('order-pickup-option-error'), code : -7});
        }
        var pickupInfo;
        meal.pickups.forEach(function(pickup){
          if(pickup.index === pickupOption){
            pickupInfo = Object.assign({}, pickup);
          }
        });
        if(!pickupInfo){
          return next({responseText : req.__('order-pickup-option-invalid-error'), code : -22});
        }
        if(!pickupInfo.phone){
          return next({responseText : req.__('order-pickup-option-invalid-error'), code : -28});
        }
        if(pickupInfo.method !== method){
          return next({responseText : req.__('order-pickup-method-not-match-error'), code : -21});
        }
        if(params.isPartyMode){
          var customInfo = req.body.customInfo;
          if(!customInfo){
            return next({ responseText : req.__('order-party-lack-of-info'), code : -35});
          }
        }
        geocode.distance(full_address, pickupInfo.deliveryCenter, function(err, distance){
          if(err){
            return next(err);
          }
          range = pickupInfo.deliveryRange || range;
          sails.log.debug("distance:" + distance, range);
          if(distance > range){
            if(!params.isPartyMode){
              return next({responseText : req.__('order-invalid-address'), code : -6});
            }else{
              params.delivery_fee = (distance - range) * stripe.MILEAGE_FEE;
            }
          }else if(params.isPartyMode){
            params.delivery_fee = 0;
          }
          next();
        })
      }else{
        var subtotal = parseFloat(params.subtotal);
        // if(!meal.isShipping){
        //   sails.log.error("meal doesn't support shipping");
        //   return next({responseText : req.__('meal-no-shipping'), code : -12});
        // }
        if(subtotal < 60){
          return next({responseText : req.__('order-not-qualify-shipping', '60'), code : -14});
        }
        return next();
      }
    },function(err){
      if(err){
        return cb(err);
      }
      cb();
    });
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
    if(points > total * 10){ points = total * 10;}
    user.points = user.points || 0;
    sails.log.info()
    sails.log.info("redeeming points:" + points);
    //verify if user have enough points
    if(points > user.points){
      return cb({ code : -25, responseText : req.__('order-points-insufficient')});
    }
    if(!user.emailVerified){
      return cb({ code : -48, responseText : req.__('coupon-unverified-email')});
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

  addPoint : function(customer, order, cb){
    if(!customer){
      return cb();
    }
    var userId = customer.id || customer;
    var points = parseInt((order.subtotal - order.discount) / 5);
    User.findOne(userId).exec(function(err, u){
      if(err){
        return cb(err);
      }
      u.points = u.points || 0;
      u.points += points;
      u.save(cb);
    })
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
      if(!user.referrerCode || user.usedReferralBonus){
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
        referrer.save(function(err, r){
          if(err){
            return cb(err);
          }
          user.usedReferralBonus = true;
          user.save(cb);
        });
      })
    });
  },

  findOrdersOfWeek : function(req, res){
    moment.locale('en');
    var _this = this;
    var weekWanted = req.params['numberOfWeek'];
    var date = parseInt(weekWanted) *  7;
    var yearWanted = req.query.year;
    var beginDate = moment().set('year',yearWanted).set('dayOfYear',date-6).set('hour',0);
    var endDate = moment().set('year',yearWanted).set('dayOfYear',date).set('hour',0);
    var type = req.query.type;
    var status = req.query.status || { '!' : ['cancel','pending-payment']};
    var numberOfWeekNow = util.getWeekOfYear(new Date());
    var yearNow = new Date().getFullYear();
    if(parseInt(yearWanted) < yearNow || weekWanted < numberOfWeekNow) {
      status = ['review', 'complete'];
    }
    Order.find({ status : status, "pickupInfo.pickupFromTime" : { '>=' : beginDate.toISOString(), '<' : endDate.toISOString()}}).populate('dishes').exec(function(err, orders){
      if(err){
        return res.badRequest(err);
      }
      orders = orders.filter(function(order){
        var numberOfWeek = util.getWeekOfYear(order.pickupInfo.pickupFromTime);
        var year = new Date(order.pickupInfo.pickupFromTime).getFullYear();
        var isYearMatch = yearWanted ? (parseInt(yearWanted) === year) : true;
        return numberOfWeek === parseInt(weekWanted) && isYearMatch;
      });
      var dishIds = [];
      var newOrders = [];
      var hostSummary = {};
      async.each(orders, function(order, cb){
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
               next();
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
              if(type === "chef"){
                if(!hostSummary.hasOwnProperty(order.shopName)){
                  hostSummary[order.shopName] = {
                    income : order.subtotal
                  }
                }else{
                  hostSummary[order.shopName].income += order.subtotal;
                }
              }
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
            if(order.charges){
              order.charge = order.charges[Object.keys(order.charges)[0]];
            }
            if(order.application_fees){
              order.application_fee = order.application_fees[Object.keys(order.application_fees)[0]];
            }
            order.pickupFromTime = order.pickupInfo.pickupFromTime;
            order.pickupTillTime = order.pickupInfo.pickupTillTime;
            order.pickupPhone = order.contactInfo.phone;
            order.deliveryAddress = order.contactInfo.address;
            order.method = order.pickupInfo.method;
            order.location = order.pickupInfo.location;
            if(order.customInfo){
              order.instruction = order.customInfo.comment;
            }
            delete order.customer;
            delete order.meal;
            delete order.host;
            // delete order.orders;
            // delete order.contactInfo;
            // delete order.pickupInfo;
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
            order.dishes = [];
            order.dynamicDishes = [];
            // delete order.dishes;
            // delete order.dynamicDishes;
          }
          cb();
        });
      },function(err){
        if(err){
          return res.badRequest(err);
        }
        var wantsReport = req.query.report;
        var csv = req.query.csv;
        var dishIds = _this.getDishIdFromOrders(orders);
        var pickups,dishes=[],newOrders=[];
        async.each(orders, function(order, next) {
          if (!order.pickupInfo) {
            return next();
          }
          //remove dish not belongs to meal
          Object.keys(order.orders).forEach(function(dishId){
            var hasDish = order.dishes.some(function (d) {
              return d.id === dishId
            });
            if (!hasDish) {
              delete order.orders[dishId]
            }
          })
          if (!pickups) {
            pickups = [order.pickupInfo];
            dishes = order.dishes;
            newOrders = [order];
            return next();
          }
          var isSamePickup;
          var isSame = newOrders.some(function (oldOrder) {
            var from1 = moment(new Date(oldOrder.pickupInfo.pickupFromTime).toISOString());
            var from2 = moment(new Date(order.pickupInfo.pickupFromTime).toISOString());
            var isSamePickupOption = from1.isSame(from2, 'minute') && oldOrder.pickupInfo.location === order.pickupInfo.location && oldOrder.pickupInfo.method === order.pickupInfo.method;
            var isSameContact = oldOrder.customerName === order.customerName && oldOrder.customerPhone === order.customerPhone && (!order.contactInfo.address || !oldOrder.contactInfo.address || order.contactInfo.address.includes(oldOrder.contactInfo.address) || oldOrder.contactInfo.address.includes(order.contactInfo.address));
            if (isSamePickupOption && isSameContact) {
              oldOrder = _this.combineOrders(order, oldOrder);
            }
            if(isSamePickupOption){
              isSamePickup = true;
            }
            return isSamePickupOption && isSameContact;
          });

          if (!isSame) {
            newOrders.push(order);
          }
          if(!isSamePickup){
            pickups.push(order.pickupInfo);
          }

          order.dishes.forEach(function (dish) {
            var hasDish = dishes.some(function (oldDish) {
              return oldDish.id === dish.id;
            });
            if (!hasDish) {
              dishes.push(dish);
            }
          });
          next();
        }, function(err){
          if(err){
            return res.badRequest(err);
          }
          if(pickups){
            pickups = pickups.sort(function(a, b){
              return new Date(a.pickupFromTime).getTime() - new Date(b.pickupFromTime).getTime();
            })
          }
          if(!wantsReport){
            if(type === "chef"){
              var hostIncomes = Object.keys(hostSummary);
              hostIncomes = hostIncomes.map(function(shopName){
                var sumObj = hostSummary[shopName];
                return [shopName, sumObj.income];
              });
              return res.ok(hostIncomes);
            }else if(csv){
              var csvStr = util.ConvertToCSV(newOrders);
              res.setHeader('Content-disposition', 'attachment; filename=orders.csv');
              res.setHeader('Content-type', 'text/plain');
              res.charset = 'UTF-8';
              return res.end(csvStr);
            }else{
              return res.ok(newOrders);
            }
          }else{
            res.view('report', { meal : { orders : newOrders, pickups : pickups, dishes : dishes }});
          }
        })
      });
    });
  },

  data : function(req, res){
    var _this = this;
    var type = req.query.type;
    var year = req.query.year;
    this.getOrdersByYear(year, req.query,function(err, orders){
      if(err){
        return res.badRequest(err);
      }
      var orderList = _this.analystOrders(orders);
      return res.ok(orderList);
    });
  },

  getOrdersByYear : function(year, query, cb){
    var _this = this;
    var limit = parseInt(query.limit) || 100;
    var skip = parseInt(query.skip) || 0;
    var beginDate = moment().set('year',year).set('month',0).set('date',1).set('hour',0);
    var endDate = moment().set('year',parseInt(year)+1).set('month',0).set('date',1).set('hour',0);
    if(query.weeks){
      var startWeek = parseInt(query.weeks.split("-")[0]);
      beginDate = moment().set('year',year).isoWeek(startWeek).isoWeekday(1).set('hour',0);
      var endWeek = parseInt(query.weeks.split("-")[1]);
      endDate = moment().set('year',year).isoWeek(endWeek).isoWeekday(7).set('hour',23);
      limit = 9999;
      skip = 0;
    }else if(query.months){
      var startMonth = parseInt(query.months.split("-")[0])-1;
      beginDate = moment().set('year',year).set('month',startMonth).set('date',1).set('hour',0);
      var endMonth = parseInt(query.months.split("-")[1])-1;
      endDate = moment().set('year',year).set('month', endMonth).set('date',31).set('hour',0);
      limit = 9999;
      skip = 0;
    }
    Order.find( { status : ['review', 'complete'], 'pickupInfo.pickupFromTime' : { '>=' : beginDate.toISOString(), '<' : endDate.toISOString()}}).limit(limit).skip(skip).sort('createdAt ASC').exec(function(err, orders){
      if(err){
        return cb(err);
      }
      var newOrders = [], dishIds = [];
      orders.forEach(function(order){
        var isSamePickup = newOrders.some(function(oldOrder){
          var _isSame = moment(new Date(oldOrder.pickupInfo.pickupFromTime).toISOString()).isSame(moment(new Date(order.pickupInfo.pickupFromTime).toISOString()), 'minute') && moment(oldOrder.pickupInfo.pickupTillTime).isSame(moment(order.pickupInfo.pickupTillTime), "minute") && oldOrder.customerName === order.customerName && oldOrder.customerPhone === order.customerPhone && oldOrder.pickupInfo.method === order.pickupInfo.method && ((oldOrder.pickupInfo.method === "delivery" && oldOrder.contactInfo.address === order.contactInfo.address) || (oldOrder.pickupInfo.method === "pickup" && oldOrder.pickupInfo.location === order.pickupInfo.location));
          if(_isSame){
            oldOrder = _this.combineOrders(order, oldOrder);
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
      cb(null, newOrders);
    });
  },

  analystOrders : function(orders){
    if(!orders || !orders.length){
      return {};
    }
    var firstDate = moment(orders[0].pickupInfo.pickupFromTime);
    var firstWeek = firstDate.isoWeek();
    var firstMonth = firstDate.month();
    var lastDate = moment(orders[orders.length-1].pickupInfo.pickupFromTime);
    var lastWeek = lastDate.isoWeek();
    var lastMonth = lastDate.month();
    var orderList = {
      weeks : [],
      months : []
    };
    for(var i=firstWeek; i <= lastWeek; i++){
      orderList.weeks[i] = { "week" : i, "wau(周活跃订单)" : this.getActiveUsersByType(i,'week',orders), "wur(周留存率)" : this.getUserRetentionByType(i, 'week', orders)};
    }
    for(var j=firstMonth; j <= lastMonth; j++){
      orderList.months[j] = { "month" : j+1, "mau(月活跃订单)" : this.getActiveUsersByType(j,'month',orders), "mur(月留存率)" : this.getUserRetentionByType(j, 'month', orders)};
    }
    return orderList;
  },

  getActiveUsersByType : function(num, filterType, orders){
    orders = orders.filter(function(order){
      var pickupDate = order.pickupInfo.pickupFromTime;
      if(filterType === "week"){
        return num === moment(pickupDate).isoWeek();
      }else if(filterType === "month"){
        return num === moment(pickupDate).month();
      }
    })
    return orders.length;
  },

  getUserRetentionByType : function(num, filterType, orders){
    var ordersOfLastWeek = orders.filter(function(order){
      var pickupDate = order.pickupInfo.pickupFromTime;
      if(filterType === "week"){
        return (num-1) === moment(pickupDate).isoWeek();
      }else if(filterType === "month"){
        return (num-1) === moment(pickupDate).month();
      }
    });
    if(!ordersOfLastWeek.length){
      return "100%";
    }
    var repeatOrderThisWeek = orders.filter(function(order){
      var pickupDate = order.pickupInfo.pickupFromTime;
      var phone = order.customerPhone;
      var hasPhoneLastWeek = !!ordersOfLastWeek.filter(function(order){
        return order.customerPhone === phone;
      }).length;
      if(filterType === "week"){
        return num === moment(pickupDate).isoWeek() && hasPhoneLastWeek;
      }else if(filterType === "month"){
        return num === moment(pickupDate).month() && hasPhoneLastWeek;
      }
    })
    var seen = {};
    repeatOrderThisWeek = repeatOrderThisWeek.filter(function(order){
      return seen.hasOwnProperty(order.customerPhone) ? false : (seen[order.customerPhone] = true);
    })
    return ((repeatOrderThisWeek.length / ordersOfLastWeek.length) * 100).toFixed(2) + "%";
  },

  getDishIdFromOrders : function(orders){
    var dishIds = [];
    orders.forEach(function(order){
      if(order.orders){
        dishIds = dishIds.concat(Object.keys(order.orders));
        dishIds = dishIds.filter(function(item, pos){
          return dishIds.indexOf(item) === pos;
        });
      }
    })
    return dishIds;
  },

  combineOrders : function(orders, combinedOrder){
    var cOrder = combinedOrder || Object.assign({}, orders[0]);
    if(orders && !Array.isArray(orders)){
      orders = [orders];
    }
    orders.forEach(function(order){
      if(cOrder.id === order.id){
        return;
      }
      Object.keys(order.orders).forEach(function(dishId){
        if(cOrder.orders.hasOwnProperty(dishId)){
          cOrder.orders[dishId].number += order.orders[dishId].number;
        }else{
          cOrder.orders[dishId] = order.orders[dishId];
        }
      })
      cOrder.id += "+" + order.id;
      cOrder.subtotal = parseFloat(cOrder.subtotal) + parseFloat(order.subtotal);
      cOrder.pickupInfo.comment += order.pickupInfo.comment;
      cOrder.dishes = cOrder.dishes.concat(order.dishes);
      if(cOrder.paymentMethod === "cash" && cOrder.charges && order.charges){
        cOrder.charges['cash'] += order.charges['cash'];
      }
    })
    return cOrder;
  }
};

