/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {
  // User is allowed, proceed to the next policy,
  // or if this is the last policy, the controller
  var hostId = req.session.user.host ? (req.session.user.host.id ? req.session.user.host.id : req.session.user.host) : "";
  var orderIds = req.param('id').split("+");
  var action = req.path.split("/").pop();
  require('async').eachSeries(orderIds, function(orderId, cb){
    Order.findOne(orderId).populate('host').exec(function(err,order){
      if(err){
        return cb(err);
      }
      if(action === "confirm" || action === "reject"){
        if(order.isSendToHost && hostId && hostId === order.host.id){
          return cb();
        }else if(!order.isSendToHost && (!hostId || hostId !== order.host.id)){
          return cb();
        }else{
          sails.log.error("You are not the right party to perform this action");
          return cb('You are not permitted to perform this action.');
        }
      }else if(action === "adjust" || action === "cancel" || action === "adjust-form"){
        if(order.status !== "schedule" && order.status !== "preparing"){
          sails.log.error("order can only be adjusted at schedule or preparing");
          return cb('order can only be adjusted at schedule or preparing');
        }
        if(order.status === "schedule" && hostId && hostId === order.host.id){
          return cb(req.__('order-adjust-cancel-at-schedule-by-host'));
        }
        return cb();
      }else if(action === "ready"){
        if(order.status !== "preparing"){
          sails.log.error("order can only be ready at preparing");
          return cb("order can only be ready at preparing");
        }else if(!hostId || hostId !== order.host.id){
          return cb("you are not permitted to perform this action");
        }
        return cb();
      }else if(action === "receive"){
        if(order.status !== "ready"){
          return cb("order can only be received when ready");
        }
        if(!hostId || hostId !== order.host.id){
          return cb("you are not permitted to perform this action");
        }
        return cb();
      }else if(action === "deleteOrder" || action === "pay"){
        if(order.status !== "pending-payment"){
          return cb("you can only delete order that is not paid.");
        }
        return cb();
      }else if(action === "payment"){
        if(order.isPaid){
          return cb("order already paid");
        }
        return cb();
      }else{
        return cb('unauthorized action');
      }
    });
  }, function(err){
    if(err){
      return res.forbidden(err);
    }
    next();
  })
};
