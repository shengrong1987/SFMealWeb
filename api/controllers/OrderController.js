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

//-1 : quantity now enough
//-2 : dish not valid
//-3 : order total doesn't match
//-4 : meal not valid
//-5 : missing payment profile
//-6 : address verification fail
//-7 : pickup option not exist

module.exports = {

  validate_meal : function(meal, orders, preorders, subtotal, res, req) {
    if(!orders || !subtotal){
      return res.badRequest(req.__('order-empty'));
    }
    if(meal.status === "off"){
      return res.badRequest(req.__('meal-not-active'));
    }
    if(meal.dateIsValid()) {
      console.log("meal is valid");
      //check order is valid
      //check amount is correct base on the dish price
      var actual_subtotal = 0;
      var dishes = Object.keys(orders);
      for (var i = 0; i < dishes.length; i++) {
        var dishId = dishes[i];
        var quantity = parseInt(orders[dishId]);
        var preQuantity = 0
        if(preorders){
          preQuantity = parseInt(preorders[dishId]);
        }
        var validDish = false;
        for (var j = 0; j < meal.dishes.length; j++) {
          var mealDish = meal.dishes[j];
          if (dishId == mealDish.id) {
            var diff = quantity - preQuantity;
            if (diff == 0 || diff <= meal.leftQty[dishId]) {
              validDish = true;
              actual_subtotal += quantity * mealDish.price;
            } else {
              console.log("dish: " + dishId + " is not enough for " + quantity);
              res.badRequest({responseText : req.__('order-dish-not-enough',dishId, quantity), code : -1});
              return false;
            }
          }
        }
        if (!validDish) {
          console.log("dish: " + dishId + " is not valid");
          res.badRequest({responseText : req.__('order-invalid-dish',dishId), code : -2});
          return false;
        }
      }
      console.log("dish is valid");
      if (actual_subtotal.toFixed(2) != subtotal) {
        console.log("calculate subtotal is: " + actual_subtotal + "submit subtotal is :" + subtotal + "order subtotal is not correct");
        res.badRequest({responseText : req.__('order-total-not-match'), code : -3});
        return false;
      }
      return true;
    }else{
      console.log("meal is not a valid meal");
      res.badRequest({ responseText : req.__('order-invalid-meal'), code : -4});
      return false;
    }
  },

  validateAddress : function(method, meal, address, cb){
    if(method === "delivery"){
      var host = meal.chef;
      var location = {lat : host.lat, long : host.long};
      var range = meal.delivery_range;
      geocode.distance(address, location, function(err, distance){
        if(err){
          console.log(err);
          return cb(false);
        }
        if(distance > range){
          console.log("distance verification failed");
          return cb(false);
        }
        cb(true);
      })
    }else{
      cb(true);
    }
  },

  updateMealLeftQty : function(meal, lastorder, order, cb){
    var leftQty = meal.leftQty;
    var dishes = Object.keys(lastorder);
    dishes.forEach(function(dishId){
      var diff = lastorder[dishId] - order[dishId];
      leftQty[dishId] += diff;
      //console.log("dish: " + dishId + " left: " + leftQty[dishId]);
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
    if(params.method == "delivery"){
      params.delivery_fee = parseFloat(meal.delivery_fee);
    }else{
      if(!meal.pickups || params.pickupOption-1>=meal.pickups.length){
        return false;
      }
      var pickupInfo = meal.pickups[params.pickupOption-1];
      if(!pickupInfo){
        return false;
      }
      params.pickupInfo = pickupInfo;
      params.delivery_fee = 0;
    }
    return params;
  },

	create : function(req, res){

    var userId = req.session.user.id;
    var orders = req.body.orders;
    var mealId = req.body.mealId;
    var email = req.session.user.auth.email;
    var method = req.body.method;
    var address = req.body.address;
    var subtotal = parseFloat(req.body.subtotal);
    req.body.customer = userId;

    var $this = this;

    Meal.findOne(mealId).populate("dishes").populate("chef").exec(function(err,m) {
      if (err) {
        return res.badRequest(err);
      }
      $this.validateAddress(method, m, address, function(valid){
        if(!valid){
          return res.badRequest({responseText : req.__('order-invalid-address'), code : -6});
        }else if($this.validate_meal(m, orders, undefined, subtotal, res, req)){
          console.log("order pass meal validation");

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
          User.findOne(userId).populate('payment').exec(function (err, found) {
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
            console.log("everything seems good, creating order...");
            Order.create(req.body).exec(function (err, order) {
              if (err) {
                return res.badRequest(err);
              }
              stripe.charge({
                amount : parseInt((subtotal + req.body.delivery_fee) * 100),
                email : email,
                customerId : found.payment[0].customerId,
                destination : m.chef.accountId,
                metadata : {
                  mealId : m.id,
                  hostId : m.chef.id,
                  orderId : order.id,
                  userId : userId
                }
              },function(err, charge){
                if (err) {
                  Order.destroy(order.id).exec(function(err2){
                    if(err2){
                      return res.badRequest(err2);
                    }
                    return res.badRequest(err);
                  });
                } else if (charge.status == "succeeded") {
                  console.log("charge succeed, gathering charing info for order");
                  for (var i = 0; i < m.dishes.length; i++) {
                    var dishId = m.dishes[i].id;
                    var quantity = parseInt(orders[dishId]);
                    m.leftQty[dishId] -= quantity;
                  }
                  order.transfers = {};
                  order.transfers[charge.transfer] = charge.transfer;
                  order.charges = {};
                  order.charges[charge.id] = charge.amount/100;
                  m.save(function (err, result) {
                    if(err){
                      return res.badRequest(err);
                    }
                    order.save(function(err, o){
                      if(err){
                        return res.badRequest(err);
                      }
                      notification.notificationCenter("Order", "new", order, true, false, req);
                      //test only
                      if(req.wantsJSON){
                        return res.ok(order);
                      }
                      return res.ok({responseText : req.__('order-ok')});
                    });
                  });
                } else {
                  res.badRequest({ reponseText : req.__('order-unknown-error'), code : -7});
                }
              });
            });
          });
        }
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
    var hostId = req.session.user.host;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var subtotal = parseFloat(params.subtotal);
    var delivery_fee = parseFloat(params.delivery_fee);
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("dishes").populate("host").populate("customer").exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }
      if(order.status != "schedule" && order.status != "preparing"){
        return res.forbidden();
      }

      order.meal.dishes = order.dishes;
      if($this.validate_meal(order.meal, params.orders, order.orders, subtotal, res, req)){

        console.log("pass meal validation");
        var isSendToHost = true;
        if(hostId == order.host.id){
          isSendToHost = false;
        }
        if(order.status == "schedule"){
          //can update without permission of host or adjust by host
          var diff = (subtotal - order.subtotal).toFixed(2);
          console.log("adjusting amount: " + diff);
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
                  amount : diff * 100,
                  email : email,
                  customerId : found.payment[0].customerId,
                  destination : order.host.accountId,
                  metadata : {
                    mealId : order.meal.id,
                    hostId : order.host.id,
                    orderId : order.id,
                    userId : userId
                  }
                },function(err, charge){
                  if (err) {
                    console.log(err);
                    return res.badRequest(err);
                  }
                  if(charge.status == "succeeded") {
                    $this.updateMealLeftQty(order.meal, order.orders, params.orders, function(err, m){
                      if(err){
                        return res.badRequest(err);
                      }
                      order.orders = params.orders;
                      order.subtotal = params.subtotal;
                      order.charges[charge.id] = charge.amount/100;
                      order.meal = m.id;
                      order.save(function(err,result){
                        if(err){
                          return res.badRequest(err);
                        }
                        //send notification
                        notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                        return res.ok({responseText : req.__('order-adjust-ok',charge.amount/100)});
                      })
                    });
                  }
                });
              }else{
                var totalRefund = Math.abs(diff);
                diff = - diff;
                console.log(order.charges);
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
                    amount : charge.amount * 100
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
                    order.orders = params.orders;
                    order.subtotal = params.subtotal;
                    order.meal = m.id;
                    order.save(function(err,result){
                      if(err){
                        return res.badRequest(err);
                      }
                      //send notification
                      notification.notificationCenter("Order", "adjust", result, isSendToHost, false, req);
                      return res.ok({responseText : req.__('order-adjust-ok2',totalRefund)});
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
          order.adjusting_orders = params.orders;
          order.adjusting_subtotal = params.subtotal;
          order.meal = order.meal.id;
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            //send notification
            notification.notificationCenter("Order", "adjusting", result, isSendToHost, false, req);
            return res.ok({responseText : req.__('order-adjust-request')});
          });
        }
      }
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
    var hostId = req.session.user.host;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("host").populate("dishes").populate("customer").exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }

      if(order.status != "schedule" && order.status != "preparing"){
        return res.forbidden();
      }

      var isSendToHost = true;
      if(hostId == order.host){
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
                console.log("refund error: " + err);
                return res.badRequest(err);
              }
              var curOrder = extend({}, order.orders);
              Object.keys(curOrder).forEach(function (dishId) {
                curOrder[dishId] = 0;
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
        order.lastStatus = order.status;
        order.status = "canceling";
        order.save(function(err,result){
          if(err){
            return res.badRequest(err);
          }
          //send notification
          notification.notificationCenter("Order", "cancelling", result, isSendToHost, false, req);
          return res.ok({responseText : req.__('order-cancel-request')});
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
        var diff = (parseFloat(adjusting_subtotal) - order.subtotal).toFixed(2);
        var customerId = order.customer.id;
        if(diff != 0){
          User.findOne(customerId).populate('payment').exec(function (err, found) {
            if (err || !found.payment || found.payment.length == 0) {
              return res.badRequest(err);
            }
            if(diff>0){
              //create another charge
              stripe.charge({
                amount : diff * 100,
                email : email,
                customerId : found.payment[0].customerId,
                destination : order.host.accountId,
                metadata : {
                  mealId : order.meal.id,
                  hostId : order.host.id,
                  orderId : order.id,
                  userId : userId
                }
              },function(err, charge){
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
                    order.status = order.lastStatus;
                    order.charges[charge.id] = charge.amount / 100;
                    order.meal = order.meal.id;
                    order.save(function(err,result){
                      if(err){
                        return res.badRequest(err);
                      }
                      notification.notificationCenter("Order", "confirm", result, false, false, req);
                      return res.ok({responseText : req.__('order-confirm')});
                    })
                  });
                }
              });
            }else{
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
              for(var i=0; i < refundCharges.length; i++){
                var charge = refundCharges[i];
                stripe.refund({
                  id : charge.id,
                  amount : charge.amount * 100
                },function(err, refund){
                  if(i==refundCharges.length){
                    if(err){
                      return res.badRequest(err);
                    }
                    $this.updateMealLeftQty(order.meal, order.orders, adjusting_orders, function(err, m){
                      if(err){
                        return res.badRequest(err);
                      }
                      order.orders = adjusting_orders;
                      order.subtotal = adjusting_subtotal;
                      order.adjusting_orders = {};
                      order.adjusting_subtotal = 0;
                      order.status = order.lastStatus;
                      //order.charges[result.id] = result.amount/100;
                      order.meal = order.meal.id;
                      order.save(function(err,result){
                        if(err){
                          return res.badRequest(err);
                        }
                        notification.notificationCenter("Order", "confirm", result, false, false, req);
                        return res.ok({responseText : req.__('order-confirm')});
                      })
                    });
                  }
                });
              }
            }
          });
        }else{
          order.orders = adjusting_orders;
          order.subtotal = adjusting_subtotal;
          order.adjusting_orders = {};
          order.adjusting_subtotal = 0;
          order.status = order.lastStatus;
          order.meal = order.meal.id;
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            notification.notificationCenter("Order", "confirm", result, false, false, req);
            return res.ok({responseText : req.__('order-confirm')});
          })
        }
      }else if(order.status == "canceling"){
        var amount = (order.subtotal + order.delivery_fee).toFixed(2);
        if(amount > 0){
          User.findOne(userId).populate('payment').exec(function (err, found) {
            if (err) {
              return res.badRequest(err);
            }
            var refundCharges = Object.keys(order.charges);
            var callOnce = false;
            for(var i=0; i < refundCharges.length; i++) {
              var charge = refundCharges[i];
              stripe.refund({
                id : charge
              },function(err, refund){
                if(!callOnce) {
                  callOnce = true;
                  if (err) {
                    return res.badRequest(err);
                  }
                  var curOrder = extend({}, order.orders);
                  Object.keys(curOrder).forEach(function (dishId) {
                    curOrder[dishId] = 0;
                  });
                  $this.updateMealLeftQty(order.meal, order.orders, curOrder, function (err, m) {
                    if (err) {
                      return res.badRequest(err);
                    }
                    order.status = "cancel";
                    order.meal = order.meal.id;
                    order.save(function (err, result) {
                      if (err) {
                        return res.badRequest(err);
                      }
                      notification.notificationCenter("Order", "confirm", result, false, false, req);
                      $this.cancelOrderJob(result.id, function(err){
                        if(err){
                          return res.badRequest(err);
                        }
                        return res.ok({responseText : req.__('order-confirm-cancel')});
                      });
                    })
                  });
                }
              });
            }
          });
        }else{
          order.status = "cancel";
          order.meal = order.meal.id;
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            notification.notificationCenter("Order", "confirm", result, false, false, req);
            $this.cancelOrderJob(result.id, function(err){
              if(err){
                return res.badRequest(err);
              }
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
        notification.notificationCenter("Order", "reject", result, false, false, req);
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
      if(order.status != "preparing"){
        return res.forbidden("order status error");
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
      if(order.status != "ready"){
        return res.forbidden("order status error");
      }
      order.status = "review";
      order.reviewing_orders = Object.keys(order.orders).filter(function(orderId){
        return order.orders[orderId] > 0;
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
        console.log(err);
        return cb(err);
      }
      console.log(numberRemoved + " order jobs removed");
      cb();
    })
  }
};

