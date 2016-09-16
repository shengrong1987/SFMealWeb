/**
 * Created by shengrong on 7/27/16.
 */
var notification = require('../services/notification');
var async = require('async');
module.exports = function(agenda) {

  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this hob
    //disabled: false,

    // method can be 'every <interval>', 'schedule <when>' or now
    frequency: 'now',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    // data: {},

    // execute job
    run: function(job, done) {
      console.log("preorder end booking, check meal requirement...");
      var mealId = job.attrs.data.mealId;

      var cancelOrders = function(mealId, done){
        Order.find({ meal : mealId, status : "schedule"}).populate("dishes").populate("meal").populate("host").populate("customer").exec(function(err, orders){
          if(err){
            return done();
          }
          async.each(orders, function(order, cb){
            var refundCharges = Object.keys(order.charges);
            async.each(refundCharges, function(chargeId, next){
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
      };

      var updateOrders = function(meal, done){
        //update all orders to preparing
        Order.update({ meal : meal.id, status : "schedule"}, { status : "preparing"}).exec(function(err, orders){
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
      };

      Meal.findOne(mealId).populate("chef").populate("dishes").exec(function(err, meal){
        if(err || !meal){
          return done();
        }
        meal.hostEmail = meal.chef.email;

        Order.find({ meal : mealId, status : "schedule"}).exec(function(err, orders){
          if(err){
            return done();
          }
          if(orders.length == 0){
            meal.orders = [];
            notification.notificationCenter("Meal","mealScheduleEnd",meal,true);
            return done();
          }
          var total = 0;
          orders.forEach(function(order){
            total += order.subtotal;
          });
          if(orders.length < meal.minimalOrder || total < meal.minimalTotal){
            notification.notificationCenter("Meal","cancel",meal,true,false,null);
            cancelOrders(mealId, done);
          }else{
            updateOrders(meal, done);
          }
        });
      })
    },
  };
  return job;
}
