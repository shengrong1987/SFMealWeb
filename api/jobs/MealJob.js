/**
 * Created by shengrong on 7/27/16.
 */
var async = require('async');
var util = require('../services/util');
var moment = require('moment');
module.exports = function(agenda) {
  var job = {

    // job name (optional) if not set,
    // Job name will be the file name or subfolder.filename (without .js)
    //name: 'Foo',

    // set true to disabled this hob
    disabled: false,

    // method can be 'every <interval>', 'schedule <when>' or now
    frequency: 'every 60 seconds',

    // Jobs options
    //options: {
    // priority: highest: 20, high: 10, default: 0, low: -10, lowest: -20
    //priority: 'highest'
    //},

    // Jobs data
    //data: {},

    // execute job
    run: function(job, done) {
      var now = new Date();

      Meal.find({ status : 'on', isScheduled : false }).exec(function(err, meals){
        if(err || !meals){
          return done();
        }
        //schedule an end job for each meals
        async.each(meals, function(meal, cb){
          if(meal.type === "preorder" && meal.provideFromTime < now && meal.provideTillTime > now){
            meal.isScheduled = true;
            meal.save(function(err, result){
              if(err){
                return cb(err);
              }
              sails.log.debug("JOBS Created! - Type: MealScheduleEndJob on" + moment(meal.provideTillTime).format("LLL"));
              Jobs.schedule(meal.provideTillTime, 'MealScheduleEndJob', { mealId : meal.id });
              cb();
            });
          }else if(meal.type === "order"){
            var tenMinutesBeforeProvideFromTime = new Date(util.minutesBefore(meal.provideFromTime,10));
            if(tenMinutesBeforeProvideFromTime > now){
              meal.isScheduled = true;
              meal.save(function(err, result){
                if(err){
                  return cb(err);
                }
                sails.log.debug("JOBS Created! - Type: MealStartJob on" + moment(util.minutesBefore(meal.provideFromTime,10)).format("LLL"));
                Jobs.schedule(util.minutesBefore(meal.provideFromTime,10), 'MealStartJob', { mealId : result.id });
                cb();
              });
            }else{
              cb();
            }
          }else{
            cb();
          }
        },function(err){
          done();
        });
      });
    }
  };
  return job;
}
