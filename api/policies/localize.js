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
  // If no user is logged in, continue with the default locale.
  if (!req.session.authenticated) {return next();}
  // Load the user from the database
  var user = req.session.user;
  if(user.locale){
    req.setLocale(user.locale);
  }
  next();
};
