/**
 * Created by shengrong on 7/27/16.
 */
var notification = require('../services/notification');
module.exports = function(agenda) {
  return {

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
    data: {},

    // execute job
    run: function(job, done) {
      sails.log.info("running order ready notification");
      var orderId = job.attrs.data.orderId;
      Order.findOne(orderId).populate("customer").populate("host").populate("meal").exec(function(err,order){
        if(err){
          return done();
        }
        order.status = "ready";
        order.service_fee = order.meal.serviceFee;
        order.save(function(err,result){
          if(err){
            return done(err);
          }
          notification.notificationCenter("Order", "ready", result, false, false, null);
          done();
        });
      });
    }
  };
};
