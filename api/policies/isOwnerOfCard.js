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
  var userId = req.session.user.id;
  var paymentId = req.param('id');
  Payment.findOne(paymentId).exec(function(err,p){
    if(err){
      return res.badRequest(err);
    }
    if(p==undefined){
      return res.notFound();
    }
    if(userId == p.user){
      return next();
    }else{
      return res.forbidden('You are not owner of the card');
    }
  });
};
