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
      console.log("sending guest list to host");
      var mealId = job.attrs.data.mealId;
      Meal.findOne(mealId).populate("chef").populate("dishes").exec(function(err, meal){
        if(err || !meal){
          return done();
        }
        meal.hostEmail = meal.chef.email;

        //update all orders to preparing
        Order.update({ meal : mealId, status : "schedule"}, { status : "preparing"}).exec(function(err, orders){
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
            return done();
          });
        });
      })
    },
  };
  return job;
}
