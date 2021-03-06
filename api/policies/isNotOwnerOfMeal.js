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
  var hostId = req.session.user.host;
  var meal = req.body.mealId;
  Meal.findOne(meal).populate("chef").exec(function(err,m){
    if(hostId && hostId == m.chef.id){
      return res.forbidden("You are owner of the meal.");
    }
    return next();
  });
};
