/**
 * Created by shengrong on 7/27/16.
 */
var notification = require('../services/notification');
var async = require('async');
var stripe = require('../services/stripe');
module.exports = function(agenda) {

  var helperMethod = {
    cancelOrders : function(mealId, done){
      Order.find({ meal : mealId, status : "schedule"}).populate("dishes").populate("meal").populate("host").populate("customer").exec(function(err, orders){
        if(err){
          return done();
        }
        async.each(orders, function(order, cb){
          var refundCharges = Object.keys(order.charges);
          async.each(refundCharges, function(chargeId, next){
            stripe.refund({
              id : chargeId,
              metadata : {
                userId : order.customer.id
              }
            },function(err, refund){
              if(err){
                return next(err);
              }
              next();
            });
          },function(err){
            if(err){
              return cb(err);
            }
            order.status = "cancel";
            order.msg = sails.__({
              phrase : "meal-fail-requirement",
              locale : order.host.locale
            });
            order.save(function(err, o){
              if(err){
                return cb(err);
              }
              Jobs.cancel({ 'data.orderId' : order.id }, function(err, numberRemoved){
                if(err){
                  console.log(err);
                  return cb(err);
                }
                sails.log.debug(numberRemoved + " order jobs of order : " + order.id +  " removed");
                notification.notificationCenter("Order", "cancel", order, false, true, null);
                cb();
              })
            })
          })
        }, function(err){
          if(err){
            return done(err);
          }
          console.log("cancel all orders");
          done();
        });
      });
    },

    updateOrders : function(meal, done){
      //update all orders to preparing
      Order.update({ meal : meal.id, status : "schedule"}, {status : "preparing"}).exec(function(err, orders){
        if(err){
          return done();
        }
        async.each(orders, function(order, cb){
          User.findOne(order.customer).exec(function(err, user){
            if(err){
              return cb(err);
            }
            order.customer = user;
            cb();
          });
        },function(err){
          if(err){
            return done();
          }
          meal.orders = orders;
          notification.notificationCenter("Meal","mealScheduleEnd",meal,true);
          console.log("sending guest list to host");
          done();
        });
      });
    },

    getTax : function(subtotal, county, isTaxIncluded){
      if(isTaxIncluded){
        return 0;
      }
      var tax = require("../services/util").getTaxRate(county);
      return Math.round(subtotal * tax * 100);
    },

    chargeOrder : function(amount, order, cb){
      var tax = helperMethod.getTax(amount, order.host.county, order.meal.isTaxIncluded);
      stripe.charge({
        paymentMethod: order.paymentMethod,
        isInitial: false,
        amount: amount * 100,
        deliveryFee: 0,
        discount: 0,
        email: order.guestEmail,
        customerId: order.customerId,
        destination: order.host.accountId,
        meal: order.meal,
        method: order.method,
        tax: tax,
        metadata: {
          mealId: order.meal,
          hostId: order.host,
          orderId: order.id,
          userId: order.customer,
          deliveryFee: 0,
          tax: tax
        }
      }, function (err, charge, transfer) {
        if (err) {
          return cb(err);
        }
        cb();
      });
    },

    refundOrder : function(amount, order, cb){
      var tax = helperMethod.getTax(amount, order.host.county, order.meal.isTaxIncluded);
      var refundAmount = Math.abs(amount*100 + tax);
      async.auto({
        refundOrder : function(next){
          if(order.paymentMethod === "cash"){
            return next();
          }
          stripe.batchRefund(
            order.charges, order.transfer,
            {
              userId: order.customer,
              paymentMethod: order.paymentMethod,
              reverse_transfer : true,
              refund_application_fee : true,
              amount : refundAmount
            }, function(err){
              if(err){
                return next(err);
              }
              next();
            }
          );
        },
        refundFeeForCashOrder : function(next){
          if(order.paymentMethod !== "cash"){
            return next();
          }
          var refundedFee = Math.abs(amount * order.meal.commission) * 100;
          var metadata = {
            userName: order.customerName,
            userPhone: order.customerPhone,
            paymentMethod: order.paymentMethod,
            reverse_transfer : false,
            refund_application_fee : false,
            amount : refundedFee
          };
          stripe.batchRefund(order.feeCharges, null, metadata, function(err){
            if(err){
              return next(err);
            }
            order.charges['cash'] -= refundAmount;
            next();
          });
        }
      }, function(err){
        if(err){
          return cb(err);
        }
        cb();
      });
    },

    adjustOrders : function(orders, dishes, cb){
      var _this = this;
      async.each(orders, function(order, next2){
        var currentOrders = order.orders;
        async.each(Object.keys(currentOrders), function(dishId, next){
          var dish;
          dishes.forEach(function(d){
            if(d.id === dishId){
              dish = d;
            }
          });
          if(!dish || currentOrders[dishId].number === 0 || !dish.isDynamic){
            return next();
          }
          var number = currentOrders[dishId].number;
          var paidDishPrice = currentOrders[dishId].price;
          var currentPrice = dish.dynamicPrice;
          currentOrders[dishId].price = currentPrice;
          var difference = (currentPrice - paidDishPrice) * number;
          if(difference !== 0){
            Order.findOne(order.id).populate("meal").populate("host").exec(function (err, order) {
              if (err) {
                return next(err);
              }
              order.subtotal += difference;
              order.orders = currentOrders;
              if(difference > 0){
                _this.chargeOrder(difference, order, function(err){
                  if(err){
                    return next(err);
                  }
                  sails.log.info("charged extra amount: " + difference);
                  order.save(next);
                });
              }else{
                _this.refundOrder(difference, order, function(err){
                  if(err){
                    return next(err);
                  }
                  sails.log.info("refunded amount: " + difference);
                  order.save(next);
                });
              }
            });
          }else{
            next();
          }
        }, function(err){
          if(err){
            return next2(err);
          }
          next2();
        });
      }, function(err){
        if(err){
          return cb(err);
        }
        cb();
      });
    }
  };

  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this hob
    disabled: false,

    // method can be 'every <interval>', 'schedule <when>' or now
    // frequency: 'now',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    // data: {},

    // execute job
    run: function(job, done) {
      sails.log.info("preorder end booking, check meal requirement...");
      var mealId = job.attrs.data.mealId;
      var _this = helperMethod;

      Meal.findOne(mealId).populate("chef").populate("dishes").exec(function(err, meal){
        if(err || !meal){
          return done();
        }
        meal.hostEmail = meal.chef.email;

        Order.find({ meal : mealId, status : ["schedule","pending-payment"]}).exec(function(err, orders){
          if(err){
            return done();
          }
          if(orders.length === 0){
            meal.orders = [];
            notification.notificationCenter("Meal","mealScheduleEnd",meal,true);
            return done();
          }
          async.each(orders, function(order, next){
            if(order.status !== "pending-payment"){
              return next();
            }
            stripe.getSource(order.sourceId, function(err, source){
              if(err){
                return next(err);
              }
              if(source.status === "consumed"){
                order.status = "schedule";
                order.save(next);
              }else{
                Order.destroy(order.id).exec(next);
              }
            });
          }, function(err){
            if(err){
              return done(err);
            }
            var total = 0;
            orders.forEach(function(order){
              total += order.subtotal;
            });
            if(orders.length < meal.minimalOrder || total < meal.minimalTotal){
              notification.notificationCenter("Meal","cancel",meal,true,false,null);
              _this.cancelOrders(mealId, done);
            }else{
              if(meal.supportDynamicPrice){
                _this.adjustOrders(orders, meal.dishes, function(err){
                  if(err){
                    return done();
                  }
                  _this.updateOrders(meal, done);
                });
              }else{
                _this.updateOrders(meal, done);
              }
            }
          });
        });
      })
    }
  };
  return job;
};
