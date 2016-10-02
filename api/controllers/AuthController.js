/**
 * AuthController
 *
 * @module      :: Controller
 * @description	:: Provides the base authentication
 *                 actions used to make waterlock work.
 *
 * @docs        :: http://waterlock.ninja/documentation
 */

module.exports = require('waterlock').waterlocked({
  /* e.g.
    action: function(req, res){

    }
  */
  register: function(req, res) {
    var params = req.params.all(),
      def = waterlock.Auth.definition,
      criteria = { },
      scopeKey = 'email';
    if(!params.password || !params.email){
      return res.serverError('email and password needed');
    }
    var attr = {
      password: params.password
    }
    attr[scopeKey] = params[scopeKey];
    criteria[scopeKey] = attr[scopeKey];
    waterlock.engine.findAuth(criteria, function(err, user) {
      if(user){
        return res.badRequest({code : -1, text : "User already exists"});
      }else{
        waterlock.engine.findOrCreateAuth(criteria, attr, function(err, user) {
          if(err){
            return res.serverError(err);
          }
          User.cloneToUser(user,params,function(err,s){
            if(err){
              return res.badRequest(err);
            }
            req.session.user = s;
            req.session.authenticated = true;
            return res.ok(user);
          });
        });
      }
    });
  },

  loginSuccess : function(req, res){
    console.log("login success...");
    var auth = req.session.user.auth;
    var county = req.session.user.county;
    if(county && (!req.cookies['county'] || req.cookies['county'] == 'undefined')){
      res.cookie('county',county);
    }
    if(auth.facebookId){
      res.redirect('back');
    }else if(auth.googleEmail){
      res.redirect('back');
    }else{
      res.ok(req.session.user);
    }
  },

  admin : function(req, res){
    return res.view('admin/hello',{
      layout : 'admin_layout'
    });
  },

  resetForm : function(req, res){
    return res.view("resetPassword");
  }
});
