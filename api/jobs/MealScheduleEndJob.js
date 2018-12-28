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
                userId : order.customer ? order.customer.id : null
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

    updateOrders : function(meal, cb){
      //update all orders to preparing
      Order.update({ meal : meal.id, status : "schedule"}, {status : "preparing"}).exec(function(err, orders){
        if(err){
          return cb(err);
        }
        async.each(orders, function(order, next){
          if(!order.customer){
            return next();
          }
          User.findOne(order.customer).exec(function(err, user){
            if(err){
              return next(err);
            }
            order.customer = user;
            next();
          });
        },function(err){
          if(err){
            return cb(err);
          }
          meal.leftQty = meal.totalQty;
          meal.status = "off";
          meal.save(function(err, m){
            if(err){
              return cb(err);
            }
            m.orders = orders;
            var pickups = [];
            m.pickups.forEach(function(p){
              var isOldPickupOption = pickups.some(function(pickupInfo){
                return (pickupInfo.pickupFromTime === p.pickupFromTime && pickupInfo.pickupTillTime === p.pickupTillTime)
                  &&  pickupInfo.location === p.location && pickupInfo.method === p.method;
              })
              if(!isOldPickupOption){
                pickups.push(p);
              }
            })
            m.pickups = pickups;
            notification.notificationCenter("Meal","mealScheduleEnd",m,true);
            console.log("sending guest list to host");
            cb();
          });
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
          mealId: order.meal.id,
          hostId: order.host.id,
          orderId: order.id,
          userId: order.customer,
          deliveryFee: 0,
          tax: tax
        }
      }, function (err, charge, transfer) {
        if (err) {
          return cb(err);
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
        sails.log.info("charge amount: " + charge.amount );
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
          var refundedFee = Math.floor(Math.abs(amount * order.meal.commission * 100));
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
              sails.log.error(err);
              return next(err);
            }
            order.application_fees['cash'] -= refundedFee;
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

    adjustOrders : function(orders, meal, cb){
      var dishes = meal.dishes;
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
          if(!dish || currentOrders[dishId].number === 0 || !dish.isDynamicPriceOn){
            return next();
          }
          var number = currentOrders[dishId].number;
          var paidDishPrice = parseFloat(currentOrders[dishId].price);
          var totalQty = meal.getDynamicDishesTotalOrder(number);
          var currentPrice = parseFloat(dish.getPrice(totalQty, meal));
          currentOrders[dishId].price = currentPrice;
          var difference = (currentPrice - paidDishPrice) * number;
          sails.log.info("price you paid: $" + paidDishPrice + ", price now: $" + currentPrice, " order amount: " + number, " difference: " + difference);
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
                  order.save(next);
                });
              }else{
                _this.refundOrder(difference, order, function(err){
                  if(err){
                    return next(err);
                  }
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

      Meal.findOne(mealId).populate("chef").populate("dishes").populate("dynamicDishes").exec(function(err, meal){
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
            notification.notificationCenter("Meal","mealScheduleEnd", meal ,true);
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
            if(total < meal.minimalTotal){
              notification.notificationCenter("Meal","cancel",meal,true,false,null);
              _this.cancelOrders(mealId, function(err){
                if(err){
                  return done(err);
                }
                meal.leftQty = meal.totalQty;
                meal.status = "off";
                meal.save(done);
              });
            }else{
              if(meal.isSupportDynamicPrice){
                _this.adjustOrders(orders, meal, function(err){
                  if(err){
                    return done(err);
                  }
                  _this.updateOrders(meal, done);
                });
              }else{
                _this.updateOrders(meal,done);
              }
            }
          });
        });
      })
    }
  };
  return job;
};
