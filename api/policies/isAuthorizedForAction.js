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
  var orderId = req.param('id');
  var action = req.path.split("/").pop();
  Order.findOne(orderId).populate('host').exec(function(err,order){
    if(err){
      return res.badRequest(err);
    }
    if(action === "confirm" || action === "reject"){
      if(order.isSendToHost && hostId && hostId === order.host.id){
        return next();
      }else if(!order.isSendToHost && (!hostId || hostId !== order.host.id)){
        return next();
      }else{
        sails.log.warn("You are not the right party to perform this action");
        return res.forbidden('You are not permitted to perform this action.');
      }
    }else if(action === "adjust" || action === "cancel" || action === "adjust-form"){
      if(order.status !== "schedule" && order.status !== "preparing"){
        sails.log.warn("order can only be adjusted at schedule or preparing");
        return res.forbidden('order can only be adjusted at schedule or preparing');
      }
      if(order.status === "schedule" && hostId && hostId === order.host.id){
        return res.forbidden(req.__('order-adjust-cancel-at-schedule-by-host'));
      }
      return next();
    }else if(action === "ready"){
      if(order.status !== "preparing"){
        sails.log.warn("order can only be ready at preparing");
        return res.forbidden("order can only be ready at preparing");
      }else if(!hostId || hostId !== order.host.id){
        return res.forbidden("you are not permitted to perform this action");
      }
      return next();
    }else if(action === "receive"){
      if(order.status !== "ready"){
        return res.forbidden("order can only be received when ready");
      }
      if(!hostId || hostId !== order.host.id){
        return res.forbidden("you are not permitted to perform this action");
      }
      return next();
    }else if(action === "deleteOrder" || action === "pay"){
      if(order.status !== "pending-payment"){
        return res.forbidden("you can only delete order that is not paid.");
      }
      return next();
    }else{
      return res.forbidden('unauthorized action');
    }
  });
};
