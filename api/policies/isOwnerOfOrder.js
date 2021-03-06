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
  var hostId = req.session.user.host ? (req.session.user.host.id ? req.session.user.host.id : req.session.user.host) : "" ;
  var orderId = req.params.id || (req.body ? req.body.order : "");
  Order.findOne(orderId).populate('host').exec(function(err,order){
    if(err){
      return res.badRequest(err);
    }
    if(order==undefined){
      return res.notFound();
    }
    if(hostId == order.host.id){
      return next();
    }else{
      return res.forbidden('You are not onwer of the order');
    }
  });
};
