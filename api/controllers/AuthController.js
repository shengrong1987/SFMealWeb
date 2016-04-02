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
      scopeKey = def.email !== undefined ? 'email' : 'username';
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
            if(req.wantsJSON){
              return res.ok(user);
            }else{
              return res.view("home");
            }
          });
        });
      }
    });
  },

  facebookLogin : function(req, res){
    var Facebook = require('machinepack-facebook');

    var FBCode = req.param('code');
    if(FBCode){
      // Get the URL on facebook.com that a user should visit to allow/deny the specified Facebook Developer app (i.e. your app).
      Facebook.getAccessToken({
        appId: '556466254501032',
        appSecret: '02f7b4b026d9d2029c2f372f84cbc9ed',
        code: FBCode,
        callbackUrl: 'http://localhost:1337/auth/facebookLogin',
      }).exec({
        error: function (err){
          res.json(err);
        },
        success: function (result){
          Facebook.getUserByAccessToken({
            accessToken: result.token,
            fields : 'email,name,gender,first_name,last_name,locale'
          }).exec({
            error: function (err){

            },
            success: function (result){
              //successfully get user info
              console.log(result);

              result.username = result.name;
              result.fbId = result.id;
              delete result.id;

              var criteria = {};
              criteria.fbId = result.id;

              if(req.session.authenticated){
                result['user'] = req.session.user.id;
                waterlock.engine.attachAuthToUser(criteria, req.session.user, userFound);
              }else{
                waterlock.engine.findOrCreateAuth(criteria, result, userFound);
              }

              function userFound(err, user){
                if(err){
                  waterlock.logger.debug(err);
                  waterlock.cycle.loginFailure(req, res, null, {error: 'trouble creating model'});
                }
                User.cloneToUser(user,user.auth,function(err,newUser){
                  req.session.user = newUser;
                  req.session.authenticated = true;
                  res.redirect("");
                });
              }
            },
          });
        }
      });
    }else{
      Facebook.getLoginUrl({
        appId: '556466254501032',
        callbackUrl: 'http://localhost:1337/auth/facebookLogin',
        permissions: [ 'email' ]
      }).exec({
        // An unexpected error occurred.
        error: function (err){
          return res.badRequest(err);
        },
        // OK.
        success: function (result){
          return res.ok(result);
        }
      });
    }
  },

  resetForm : function(req, res){
    return res.view("resetPassword");
  }
});
