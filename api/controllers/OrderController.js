/**
 * OrderController
 *
 * @description :: Server-side logic for managing Orders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripe = require("../services/stripe.js");
var extend = require('util')._extend;
var async = require('async');

//-1 : quantity now enough
//-2 : dish not valid
//-3 : order total doesn't match
//-4 : meal not valid
//-5 : missing payment profile
//-6 : other payment error

module.exports = {

  validate_meal : function(meal, orders, preorders, subtotal, res) {
    if(!orders || !subtotal){
      console.log("missing order argument");
      return res.badRequest("订单为空。");
    }
    if(meal.isValid()) {
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
              res.badRequest({responseText : "dish: " + dishId + " is not enough for " + quantity, code : -1});
              return false;
            }
          }
        }
        if (!validDish) {
          console.log("dish: " + dishId + " is not valid");
          res.badRequest({responseText : "dish: " + dishId + " is not valid", code : -2});
          return false;
        }
      }
      console.log("dish is valid");
      if (actual_subtotal.toFixed(2) != subtotal) {
        console.log("calculate subtotal is: " + actual_subtotal + "submit subtotal is :" + subtotal + "order subtotal is not correct");
        res.badRequest({responseText : "order subtotal is not correct", code : -3});
        return false;
      }
      return true;
    }else{
      console.log("meal is not a valid meal");
      res.badRequest({ responseText : "meal is not a valid meal", code : -4});
      return false;
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

	create : function(req, res){
    var userId = req.session.user.id;
    var orders = req.body.orders;
    var mealId = req.body.mealId;
    var email = req.session.user.auth.email;
    var delivery_fee = req.body.delivery_fee;
    var subtotal = parseFloat(req.body.subtotal).toFixed(2);
    req.body.customer = userId;
    var $this = this;

    Meal.findOne(mealId).populate("dishes").populate("chef").exec(function(err,m) {
      if (err) {
        return res.badRequest(err);
      }
      if($this.validate_meal(m, orders, undefined, subtotal, res)){
        console.log("order pass meal validation");
        var dishes = m.dishes;
        req.body.host = m.chef.id;
        req.body.type = m.type;
        req.body.dishes = dishes;
        req.body.meal = m.id;
        User.findOne(userId).populate('payment').exec(function (err, found) {
          if (err) {
            console.log("error:" + err);
            return res.badRequest(err);
          }
          if(!found.payment || found.payment.length == 0){
            console.log("error: missing payment profile");
            return res.badRequest({ responseText : "payment method needed", code : -5});
          }
          Order.create(req.body).exec(function (err, order) {
            if (err) {
              return res.badRequest(err);
            }
            stripe.charge({
              amount : (subtotal + delivery_fee) * 100,
              email : email,
              customerId : found.payment[0].customerId,
              destination : m.chef.accountId,
              metadata : {
                mealId : m.id,
                hostId : m.chef.id,
                orderId : order.id
              }
            },function(err, charge){
              if (err) {
                Order.destroy(order.id).exec(function(err){
                  if(err){
                    return res.badRequest(err);
                  }
                  return res.badRequest(err);
                });
              }
              if (charge.status == "succeeded") {
                for (var i = 0; i < dishes.length; i++) {
                  var dishId = dishes[i].id;
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
                  if(order.type == "order"){
                    order.status = "preparing";
                  }
                  order.save(function(err, newOrder){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok(order);
                    //test only
                    //if(req.wantsJSON){
                    //  return res.ok(order);
                    //}
                    //res.ok({responseText : "Your order has been taken successfully!You will be directed to orde page. Now just wait for your food to be ready."});
                  });
                });
              } else {
                res.badRequest({ reponseText : "Encoutered unkown error", code : -6});
              }
            });
          });
        });
      }
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
    Order.findOne(orderId).populate("meal").populate("dishes").populate("host").exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }
      if(order.status != "schedule" && order.status != "preparing"){
        return res.forbidden();
      }

      order.meal.dishes = order.dishes;
      if($this.validate_meal(order.meal, params.orders, order.orders, subtotal, res)){

        console.log("pass meal validation");

        if(order.status == "schedule" || hostId == order.host.id){
          //can update without permission of host or adjust by host
          var diff = (subtotal - order.subtotal).toFixed(2);
          console.log("adjusting amount: " + diff);
          if(diff != 0){
            User.findOne(order.customer).populate('payment').exec(function (err, found) {
              if (err) {
                return res.badRequest(err);
              }
              if(!found.payment || found.payment.length == 0){
                return res.badRequest({responseText : "payment profile missing", code : -5});
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
                    orderId : order.id
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
                        return res.ok({responseText : "订单调整完成,已从用户账户中扣除$" +  charge.amount/100});
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
                      return res.ok({responseText : "订单调整完成,已返回$" +  totalRefund + "到用户账户中"});
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
              return res.ok({responseText :"订单调整完成,订单金额不变"});
            })
          }
          if(hostId == order.host.id){
            //send notification to user
            console.log("sending notification to user about adjust order")
          }else{
            //send notification to host
            console.log("sending notification to host about adjust order")
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
            return res.ok({responseText : "订单调整请求已提交，等待厨师确认"});
          });
        }
      }
    });
  },

  cancel : function(req, res){
    var userId = req.session.user.id;
    var email = req.session.user.auth.email;
    var orderId = req.params.id;
    var params = req.body;
    var $this = this;
    Order.findOne(orderId).populate("meal").populate("dishes").exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }

      if(order.status != "schedule" && order.status != "preparing"){
        return res.forbidden();
      }

      if(order.status == "schedule"){
        //can cancel without permission of host
        var amount = (order.subtotal + order.delivery_fee).toFixed(2);
        if(amount > 0){
          User.findOne(order.customer).populate('payment').exec(function (err, found) {
            if (err || !found.payment || found.payment.length == 0) {
              return res.badRequest(err);
            }
            var refundCharges = Object.keys(order.charges);
            var callOnce = false;
            for(var i=0; i<refundCharges.length;i++) {
              var chargeId = refundCharges[i];
              //refund the amount
              stripe.refund({
                id : chargeId
              },function(err, refund){
                if(!callOnce){
                  callOnce = true;
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
                      res.ok({responseText : "订单已取消。"});
                    })
                  });
                }
              });
            }
          });
        }else{
          order.status = "cancel";
          order.save(function(err,result){
            if(err){
              return res.badRequest(err);
            }
            //send notification
            return res.ok({ responseText : "订单已取消"});
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
          return res.ok({responseText : "已提交取消申请，请等待厨师确认"});
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
    Order.findOne(orderId).populate("meal").populate("host").exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      if(order.status == "adjust"){
        var adjusting_subtotal = order.adjusting_subtotal;
        var adjusting_orders = order.adjusting_orders;
        var diff = (parseFloat(adjusting_subtotal) - order.subtotal).toFixed(2);
        var customerId = order.customer;
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
                  orderId : order.id
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
                      return res.ok({responseText : "已确认调整的订单，请按照新订单准备。"});
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
                        return res.ok({responseText : "已确认调整的订单，请按照新订单准备。"});
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
            return res.ok({responseText : "已确认调整的订单，请按照新订单准备。"});
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
                      return res.ok({responseText : "订单已确认取消"});
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
            return res.ok({responseText : "订单已确认取消"});
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
    Order.findOne(orderId).exec(function(err,order){
      if(err){
        return res.badRequest(err);
      }
      order.status = order.lastStatus;
      order.msg = params.msg;
      order.save(function(err,result){
        if(err){
          return res.badRequest(err);
        }
        return res.ok({ responseText : "已拒绝订单修改请求"});
      });
    });
  },

  ready : function(req, res){
    var orderId = req.params.id;
    Order.findOne(orderId).exec(function(err,order){
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
        if(order.method == "pickup"){
          return res.ok({responseText : "订单已准备完毕，已通知吃货上门取货"});
        }else{
          return res.ok({responseText : "订单已准备完毕，请通知司机送餐"});
        }
      });
    });
  },

  receive : function(req, res){
    var orderId = req.params.id;
    Order.findOne(orderId).exec(function(err,order){
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
        return res.ok({responseText : "订单已被领取"});
      });
    });
  },

  review : function(req, res){

  },

  complete : function(req, res){
    //change the order to complete
    var orderId = req.params.id;
    //check the status of the order, if already complete skip it
    //elseif cancel, return badRequest
    Order.findOne(orderId).exec(function(err,order){
      if(err){
        return res.badRequest(err)
      }
      var stauts = order.status;
      if(status == "complete"){
        return res.badRequest("complete order can not be completed again")
      }else if(status == "schedual" || stauts == "prepare" || status == "adjust"){
        return res.badRequest("order must be ready before completion")
      }else if(status == "cancel"){
        return res.badRequest("order has been canceled")
      }
      order.stauts = "complete";

      var total = order.total + order.delivery_fee;
      //pay the host, transfer from my account to host account

    });

    //calculate subtotal + tax + delivery - fee

    //set status to complete


  }
};

