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
  var path = req.url;
  if (path.indexOf('host') !== -1 ){
    var hostId = req.param('id') || req.param('parentid');
    var userId = req.session.user.id;
    User.findOne(userId).exec(function(err,user){
      if(err){
        return res.badRequest(err);
      }else if(user && user.host === hostId){
        return next();
      }else{
        // User is not allowed
        // (default res.forbidden() behavior can be overridden in `config/403.js`)
        return res.forbidden('You are not permitted to perform this action.');
      }
    })
  }else if(path.indexOf('user')!==-1){
    userId = req.param('parentid');
    if(!userId){
      userId = req.param('id');
    }
    if(userId === req.session.user.id){
      return next();
    }else{
      return res.forbidden('You are not permitted to perform this action.');
    }
  }else{
    return next();
  }
};
