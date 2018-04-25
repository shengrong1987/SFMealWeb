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
  if(req.session.authenticated){
    var email = req.session.user.auth.email;
    var emailVerified = req.session.user.emailVerified;
    if(email === "admin@sfmeal.com"){
      if(process.env.NODE_ENV === "development" || (process.env.NODE_ENV === "production" && emailVerified)){
        next();
      }else{
        return res.forbidden('You are not admin');
      }
    }else{
      return res.forbidden('You are not admin');
    }
  }else{
    return res.forbidden('You are not admin');
  }
};
