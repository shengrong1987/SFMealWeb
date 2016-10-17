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
   error
   * -1 : user already exist
   * -2 : user email or password needed
   * -3 : chef incomplete profile
   * -8 : meal contain unverified dish
   * -9 : fail to decrease totalQty because of the dish has been ordered
   * -10 : fail to add/remove dish on active meal
   * -11 : dish can not be empty
  */
  register: function(req, res) {
    var params = req.params.all(),
      def = waterlock.Auth.definition,
      criteria = { },
      scopeKey = 'email';
    if(!params.password || !params.email){
      return res.serverError({code : -2, text : req.__('user-credential-needed')});
    }
    var attr = {
      password: params.password
    }
    attr[scopeKey] = params[scopeKey];
    criteria[scopeKey] = attr[scopeKey];
    waterlock.engine.findAuth(criteria, function(err, user) {
      if(user){
        return res.badRequest({code : -1, text : req.__('user-exist-error')});
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
      if(req.query.state){
        res.redirect(req.query.state);
      }else{
        res.redirect('back');
      }
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
