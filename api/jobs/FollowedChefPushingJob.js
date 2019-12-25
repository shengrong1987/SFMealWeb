/**
 * Created by shengrong on 7/27/16.
 */
var async = require('async');
var util = require('../services/util');
var stripe = require("../services/stripe");
var notification = require("../services/notification");
var moment = require("moment");

module.exports = function(agenda) {
  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this job
    disabled: false,

    // method can be 'every <interval>', 'schedule <when>' or now
    // frequency: 'every week',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    // data: {},

    // execute job
    run: function (job, done) {
      sails.log.debug("running chef meals pushing job");
      User.find({follow: {'!': null}}).populate("follow").populate("auth").exec(function (err, users) {
        if(err){
          return done();
        }
        async.each(users, function(user,next){
          if(!user.follow){
            return next();
          }
          var now = new Date();
          var nextMon = moment().day(7)._d;
          var hosts = user.follow;
          async.each(hosts, function(host, next){
            Meal.find({ chef : host.id, status : 'on'}).populate("dishes").exec(function(err, meals){
              if(err){
                return next(err);
              }
              if(meals.length === 0){
                return next();
              }
              var meal = meals[0];
              meal.dateDesc = meal.getDateDesc(meal.pickups[0].pickupFromTime);
              var dishes = [];
              meals.forEach(function(meal){
                if(!dishes.length){
                  dishes = meal.dishes
                }else{
                  meal.dishes.forEach(function(d1){
                    var hasDish = dishes.some(function(d2){
                      return d1.id===d2.id
                    });
                    if(!hasDish){
                      dishes.push(d1)
                    }
                  })
                }
              });
              var params = {
                meal : meal,
                host : host,
                dishes : dishes,
                guestEmail : user.auth.email,
                customer : user
              };
              sails.log.debug("JOBS - Type: FollowedChefPushingJob, Model: Meal, Action: ChefSelect, For Host: " + host.id + "To: " + user.auth.email);
              notification.notificationCenter("Meal","chefSelect", params);
              next();
            });
          }, function(err){
            if(err){
              return done(err);
            }
          });
        }, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });
    }
  }
  return job;
}
