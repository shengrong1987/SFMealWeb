/**
 * AuthController
 *
 * @module      :: Controller
 * @description	:: Provides the base authentication
 *                 actions used to make waterlock work.
 *
 * @docs        :: http://waterlock.ninja/documentation
 */

var mailChimp = require("../services/mailchimp");
var wechatToken = sails.config.wechat.token;
var wechatAppId = sails.config.wechat.appId;
var wechatAppSecret = sails.config.wechat.secret;
var wechatNonceStr = sails.config.wechat.nonceStr;
var crypto = require('crypto');
var request = require('request');

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
          var typeOfUser = params.receivedEmail ? "subscriber" : "member";
          mailChimp.addMemberToList({ email : params.email, firstname : params.firstname, lastname : params.lastname, language : req.getLocale() }, typeOfUser);
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
  },

  wechat : function(req, res){
    var signature =  req.query.signature,
      timestamp = req.query.timestamp,
      nonce = req.query.nonce,
      echostr = req.query.echostr;

    console.log("signature: " + signature, "timestamp: " + timestamp, "nonce: " + nonce, 'echostr: ' + echostr );
    console.log("token:" + wechatToken);

    var sha1 = crypto.createHash('sha1'),
      sha1Str = sha1.update([wechatToken, timestamp, nonce].sort().join('')).digest('hex');

    console.log(sha1Str, signature);

    if (sha1Str == signature) {
      res.set('Content-Type', 'text/plain');
      console.log('validation success');
      return res.ok(echostr);
    } else {
      console.log('validation error');
      return res.notFound();
    }
  },

  wechatSignature : function(req, res){
    sails.log.info(wechatAppId, wechatAppSecret);
    var originalUrl = req.query.url;
    var url = "https://api.wechat.com/cgi-bin/token?grant_type=client_credential&appid=" + wechatAppId + "&secret=" + wechatAppSecret;
    request.get({
      url : url
    }, function(err, response){
      if(err){
        return res.badRequest(err);
      }
      var body = JSON.parse(response.body);
      var ticketUrl = "https://api.wechat.com/cgi-bin/ticket/getticket?access_token=" + body.access_token + "&type=jsapi";
      request.get({
        url : ticketUrl
      }, function(err, response){
        if(err){
          return res.badRequest(err);
        }
        body = JSON.parse(response.body);
        var ticket = body.ticket;
        var nonceStr = wechatNonceStr;
        var timestamp = parseInt(new Date().getTime()/1000);
        var preSignatureStr = "jsapi_ticket=" + ticket + "&noncestr=" + nonceStr + "&timestamp=" + timestamp + "&url=" + originalUrl;
        var sha1 = crypto.createHash('sha1'),
          signature = sha1.update(preSignatureStr).digest('hex');
        return res.ok({
          appid : wechatAppId,
          timestamp : timestamp,
          nonceStr : nonceStr,
          signature : signature,
          url : originalUrl
        });
      })
    })
  }


});
