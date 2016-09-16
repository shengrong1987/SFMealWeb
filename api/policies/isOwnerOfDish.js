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
  var hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
  var dishId = req.param('parentid') || req.param('id') || req.body.dish;
  Dish.findOne(dishId).populate("chef").exec(function(err,dish){
    if(hostId && hostId == dish.chef.id){
      return next();
    }
    return res.forbidden("You are not permitted to perform this action.");
  });
};
