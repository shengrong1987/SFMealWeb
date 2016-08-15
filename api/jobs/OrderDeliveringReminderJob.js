/**
 * Created by shengrong on 7/27/16.
 */
var notification = require('../services/notification');
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
    data: {},

    // execute job
    run: function(job, done) {
      var orderId = job.attrs.data.orderId;
      Order.findOne(orderId).populate('host').populate('dishes').populate("customer").exec(function(err, order){
        if(err){
          return done();
        }
        console.log("sending arrive reminder email to guest");
        notification.notificationCenter("Order","reminder", order, false, false, null);
        done();
      })
    },
  };
  return job;
}