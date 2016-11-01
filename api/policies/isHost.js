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
  var host = req.session.user.host;
  if(host){
    return next();
  }else{
    User.findOne(userId).exec(function(err,user){
      var host = user.host;
      if(host){
        req.session.user = user;
        return next();
      }else{
        return res.forbidden(req.__('notHostError'));
      }
    });
  }
};
