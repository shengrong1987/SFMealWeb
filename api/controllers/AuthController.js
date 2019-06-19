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
var notification = require("../services/notification");
var crypto = require('crypto');
var request = require('request');
var async = require('async');
var nlp = require('../services/nlp');

const WECHAT_FOLLOW_AND_SIGNIN = "wechat_follow_and_signin";

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
   * -12 : wechat signature no response
   * -20 : wechat unionId not exist
  */
  register: function(req, res) {
    var _this = this;
    var params = req.params.all(),
      def = waterlock.Auth.definition,
      criteria = { },
      scopeKey = 'email';
    if(!params.password || !params.email){
      return res.badRequest({code : -2, responseText : req.__('user-credential-needed')});
    }
    var attr = {
      password: params.password
    };
    attr[scopeKey] = params[scopeKey];
    criteria[scopeKey] = attr[scopeKey];
    waterlock.engine.findAuth(criteria, function(err, user) {
      if(user){
        return res.badRequest({code : -1, responseText : req.__('user-exist-error')});
      }else{
        waterlock.engine.findOrCreateAuth(criteria, attr, function(err, user) {
          if(err){
            return res.badRequest(err);
          }
          delete params.password;
          params.verifyToken = notification.generateToken();
          user.generateCode(params, function(err, code){
            if(err){
              return res.badRequest(err);
            }
            params.referralCode = code;
            User.update(user.id, params).exec(function(err, u){
              if(err){
                return res.badRequest(err);
              }
              u[0].auth = user.auth;
              req.session.user = u[0];
              req.session.authenticated = true;
              var host = process.env.NODE_ENV === 'production' ? process.env.BASE_URL : 'localhost:1337';
              params.verificationUrl = host + "/user/verify/" + params.verifyToken.token;
              notification.sendEmail("User","verification",params,req);
              _this.checkReferralProgram(req, function(err, me){
                if(err){
                  return res.badRequest(err);
                }
                if(me){
                  u[0].points = me.points;
                  u[0].referralBonus = me.referralBonus;
                }
                return res.ok(u[0]);
              })
            });
          })
        });
      }
    });
  },

  registerWechat: function(attrs, state, req, res) {
    var _this = this;
    var isNewUser = false;
    var openid = attrs.openid;
    var unionid = attrs.unionid;
    if(!openid){
      return res.badRequest({code : -20, responseText : req.__('user-unionid-needed')});
    }
    waterlock.engine.findAuth({ '$or' : [ { openid : openid }, { unionid : unionid }] }, function(err, user) {
      if (!user) {
        isNewUser = true;
      }
      waterlock.engine.findOrCreateAuth({ '$or' : [ { openid : openid }, { unionid : unionid }] }, attrs, function(err, user) {
        if(err){
          return res.badRequest(err);
        }
        async.auto({
          newUser : function(next){
            if(!isNewUser){
              return next();
            }
            attrs.verifyToken = notification.generateToken();
            user.generateCode(attrs, function(err, code) {
              if (err) {
                return next(err);
              }
              attrs.referralCode = code;
              next();
            });
          }
        }, function(err){
          if(err){
            return res.badRequest(err);
          }
          attrs.id = user.id;
          User.update(user.id, attrs).exec(function(err, u){
            if(err){
              return res.badRequest(err);
            }
            u[0].auth = user.auth;
            req.session.user = u[0];
            req.session.authenticated = true;
            req.setLocale(attrs.language);

            var host = process.env.NODE_ENV === 'production' ? process.env.BASE_URL : process.env.LOCAL_HOST;
            attrs.verificationUrl = host + "/user/verify/" + u[0].verifyToken.token;
            //notification.sendEmail("User","verification",attrs,req);
            _this.checkReferralProgram(req, function(err, me){
              if(err){
                return res.badRequest(err);
              }
              res.redirect(state);
            })
          });
        })
      });
    });
  },

  checkReferralProgram : function(req, cb){
    var referralCode = req.session.referralCode;
    var userId = req.session.user.id;
    if(!referralCode){
      return User.update({ id : userId }, { referralBonus : true }).exec(function(err, u){
        if(err){
          return cb(err);
        }
        cb(null, u[0]);
      });
    }
    req.session.referralCode = null;
    User.findOne({ referralCode : referralCode }).exec(function(err, referrer){
      if(err){
        return cb(err);
      }
      if(!referrer){
        return User.update({ id : userId }, { referralBonus : true }).exec(cb);
      }
      User.findOne(userId).exec(function(err, me){
        if(err){
          return cb(err);
        }
        if(me.referralBonus){
          return cb();
        }
        me.points += 50;
        me.referralBonus = true;
        me.referrerCode = referralCode;
        me.save(cb);
      });
    })
  },

  loginSuccess : function(req, res){
    console.log("login success...");
    var auth = req.session.user.auth;
    var county = req.session.user.county;
    if(county && (!req.cookies['county'] || req.cookies['county'] === 'undefined')){
      res.cookie('county',county);
    }

    this.checkReferralProgram(req, function(err, me){
      if(err){
        return res.badRequest(err);
      }
      if(me){
        req.session.user.points = me.points;
        req.session.user.referralBonus = me.referralBonus;
      }
      if(auth.facebookId){
        if(req.session.user.redirectUrl){
          res.redirect(req.session.user.redirectUrl);
        }else{
          res.redirect('back');
        }
      }else if(auth.googleEmail){
        if(req.session.user.redirectUrl){
          res.redirect(req.session.user.redirectUrl);
        }else{
          res.redirect('back');
        }
      }else{
        res.ok(req.session.user);
      }
    });
  },

  admin : function(req, res){
    return res.view('admin',{
      layout : 'admin_layout'
    });
  },

  resetForm : function(req, res){
    return res.view("resetPassword");
  },

  wechatCode : function(req, res){
    var code = req.query.code;
    var state = req.query.state;
    this.exchangeToken(code, state, req, res, "mobile");
  },

  wechatCodeWeb : function(req, res){
    var code = req.query.code;
    var state = req.query.state;
    this.exchangeToken(code, state, req, res, "web");
  },

  getQRCodeTicket : function(req, res){
    var url = "https://api.wechat.com/cgi-bin/token?grant_type=client_credential&appid=" + wechatAppId + "&secret=" + wechatAppSecret;
    request.get({
        url : url
      }, function(err, response) {
      if (err) {
        return res.badRequest(err);
      }
      try {
        var body = JSON.parse(response.body);
        var accessToken = body.access_token;
      } catch (err) {
        return res.badRequest(err);
      }
      var getQRTicketUrl = "https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=" + accessToken;
      request.post({
        url : getQRTicketUrl,
        form : '{"expire_seconds": 604800, "action_name": "QR_STR_SCENE", "action_info": {"scene": {"scene_str": ' + WECHAT_FOLLOW_AND_SIGNIN + ' }}}'

    }, function(err,httpResponse,body){
        if(err){
          return res.badRequest(err);
        }
        var body = JSON.parse(body);
        if(body.errorcode){
          return res.badRequest(body);
        }
        res.ok({ ticket : body.ticket });
      })
    });
  },

  exchangeToken : function(code, state, req, res, type){
    var _this = this;
    var appID = type === "mobile" ? process.env.WECHAT_APPID : process.env.WECHAT_APPID_WEB;
    var appSecret = type === "mobile" ? process.env.WECHAT_SECRET : process.env.WECHAT_SECRET_WEB;
    var accessTokenUrl = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=$APPID&secret=$SECRET&code=$CODE&grant_type=authorization_code";
    accessTokenUrl = accessTokenUrl.replace('$APPID', appID);
    accessTokenUrl = accessTokenUrl.replace('$SECRET',appSecret);
    accessTokenUrl = accessTokenUrl.replace('$CODE', code);
    request.get({
      url : accessTokenUrl
    }, function(err, response){
      if(err){
        return res.badRequest(err);
      }
      try{
        var body = JSON.parse(response.body);
        var accessToken = body.access_token;
        var refreshToken = body.refresh_token;
        var openId = body.openid;
      }catch(e){
        return res.badRequest(e);
      }
      var userProfileUrl = "https://api.weixin.qq.com/sns/userinfo?access_token=$ACCESS_TOKEN&openid=$OPENID&lang=zh_CN";
      userProfileUrl = userProfileUrl.replace('$ACCESS_TOKEN', accessToken);
      userProfileUrl = userProfileUrl.replace('$OPENID',openId);
      request.get({
        url : userProfileUrl
      }, function(err, userRes){
        if(err){
          return res.badRequest(err);
        }
        try{
          var userData = JSON.parse(userRes.body);
        }catch(e){
          return res.badRequest(e);
        }
        _this.registerWechat(userData, state, req, res);
      });
    });
  },

  wechat : function(req, res){
    var signature =  req.query.signature,
      timestamp = req.query.timestamp,
      nonce = req.query.nonce,
      echostr = req.query.echostr;

    var buffer = [];
    req.on('data', function(data){
      buffer.push(data);
    })

    req.on('end',function(){
      if(buffer.length){
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        require('xml2js').parseString(msgXml, {explicitArray : false}, function(err, result){
          if(err){
            sails.log.error(err);
          }
        })
      }else{
        if(signature && timestamp && nonce){
          var sha1 = crypto.createHash('sha1'),
            sha1Str = sha1.update([wechatToken, timestamp, nonce].sort().join('')).digest('hex');


          if (sha1Str === signature) {
            res.set('Content-Type', 'text/plain');
            return res.ok(echostr);
          } else {
            return res.badRequest({ responseText : "validation error"});
          }
        }else{
          return res.forbidden();
        }
      }
    })
  },

  wechatSignature : function(req, res){
    var originalUrl = req.query.url;
    var url = "https://api.wechat.com/cgi-bin/token?grant_type=client_credential&appid=" + wechatAppId + "&secret=" + wechatAppSecret;
    request.get({
      url : url
    }, function(err, response){
      if(err){
        return res.badRequest(err);
      }
      try{
        var body = JSON.parse(response.body);
      }catch(err){
        return res.badRequest(err);
      }
      var ticketUrl = "https://api.wechat.com/cgi-bin/ticket/getticket?access_token=" + body.access_token + "&type=jsapi";
      request.get({
        url : ticketUrl
      }, function(err, response) {
        if (err) {
          return res.badRequest(err);
        }
        if (!response.body) {
          return res.badRequest({code: -12, responseText: "wechat signature no response"});
        }
        try {
          body = JSON.parse(response.body);
        } catch (err) {
          return res.badRequest(err);
        }
        var ticket = body.ticket;
        var nonceStr = wechatNonceStr;
        var timestamp = parseInt(new Date().getTime() / 1000);
        var preSignatureStr = "jsapi_ticket=" + ticket + "&noncestr=" + nonceStr + "&timestamp=" + timestamp + "&url=" + originalUrl;
        var sha1 = crypto.createHash('sha1'),
          signature = sha1.update(preSignatureStr).digest('hex');
        return res.ok({
          appid: wechatAppId,
          timestamp: timestamp,
          nonceStr: nonceStr,
          signature: signature,
          url: originalUrl
        });
      })
    })
  }


});
