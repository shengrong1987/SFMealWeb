/**
 * UserController.js
 *
 * @module      :: Controller
 * @description :: Provides the base user
 *                 actions used to make waterlock work.
 *
 * @docs        :: http://waterlock.ninja/documentation
 * @error       :: -1, already is a host
 */

var AWS = require('aws-sdk');
AWS.config.accessKeyId = sails.config.aws.id;
AWS.config.secretAccessKey = sails.config.aws.key;
var stripe = require("../services/stripe.js");
var crypto = require("crypto");
var moment = require("moment");
var async = require('async');
var notification = require('../services/notification');
var mailChimp = require("../services/mailchimp");

module.exports = require('waterlock').actions.user({
  /* e.g.
    action: function(req, res){

    }
  */
  // session : function(req, res){
  //   return res.json(req.session.user);
  // },

  becomeHost : function(req, res){
    var userId = req.session.user.id;
    var user = req.session.user;
    var email = req.session.user.auth.email;
    var shopName = req.query.shopName;
    var phone = req.query.phone;
    var params = {};
    if(!phone && !user.phone){
      return res.badRequest({ code : -2, responseText : req.__('host-lack-of-phone')});
    }
    phone = phone || user.phone;
    params.user = userId;
    params.email = email;
    params.shopName = shopName;
    if(req.session.user.host){
      return res.badRequest({ code : -1, responseText : req.__('user-already-host')});
    }
    User.findOne(userId).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      if(user.host){
        return res.badRequest({ code : -1, responseText : req.__('user-already-host')});
      }
      Host.create(params).exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        Checklist.create({ host : host.id}).exec(function(err, checklist){
          if(err){
            return res.badRequest(err);
          }
          User.findOne(userId).exec(function(err, user){
            if(err){
              return res.badRequest(err);
            }
            var hostId = host.id;
            var ip = req.ip;
            var params = {
              type : "custom",
              country : 'US',
              email : email,
              legal_entity :{
                type : 'individual'
              },
              tos_acceptance : {
                date : parseInt(new Date().getTime()/1000),
                ip : ip
              },
              payout_schedule : {
                interval : "weekly",
                weekly_anchor : "monday"
              }
            }
            if(user.firstname){
              params.legal_entity.first_name = user.firstname;
            }
            if(user.lastname){
              params.legal_entity.last_name = user.lastname;
            }
            if(user.birthday){
              params.legal_entity.dob = {
                day : user.birthday.getDay(),
                month : user.birthday.getMonth() + 1,
                year : user.birthday.getFullYear()
              }
            }
            stripe.createManagedAccount(params,function(err,account){
              if(err){
                return res.badRequest(err);
              }
              host.accountId = account.id;
              host.save(function(err,host){
                if(err){
                  return res.badRequest(err);
                }
                User.update({id : userId},{host: hostId, phone : phone}).exec(function(err, user){
                  if(err){
                    res.badRequest(err);
                  }
                  mailChimp.addMemberToList({ email : host.email, shopName : shopName, firstname : user[0].firstname, lastname : user[0].lastname, language : req.getLocale() }, "chef");
                  user[0].host = host;
                  req.session.user = user[0];
                  res.ok({user:user[0]});
                });
              });
            });
          })
        })
      });
    });
  },

  contactForm : function(req, res){
    return res.view("contact",{ layout:false, user : req.session.user});
  },

  search : function(req, res){
    var email = req.query.email;
    delete req.query.email;
    User.find(req.query).populate('auth').exec(function (err, users) {
      if(err){
        return res.badRequest(err);
      }
      if(email){
        users = users.filter(function(user){
          return user.auth ? user.auth.email == email : false;
        });
      }
      return res.ok(users);
    })
  },

  update : function(req, res) {

    var params = req.body;
    var userId = req.params.id;

    async.auto({
      handleSubscription : function(cb){
        User.findOne(userId).populate("auth").exec(function(err, user) {
          if (err) {
            return cb(err);
          }
          if(params.isReceivedEmail && !user.receivedEmail && process.env.NODE_ENV == "production"){
            mailChimp.addMemberToList({ email : user.auth.email, firstname : user.firstname, lastname: user.lastname, language : req.getLocale()}, "subscriber");
            user.receivedEmail = true;
          }
          cb(null, user);
        });
      },
      handleAddress : ['handleSubscription', function(cb, result){
        var user = result.handleSubscription;
        if(!params.address){
          return cb(null, user);
        }
        var addresses = params.address;
        async.each(addresses, function(addObj, next){
          sails.log.debug(addObj);
          if(addObj.delete){
            if(user.address.length == 1){
              return next(req.__('user-only-address'));
            }
            var deletingAdd = user.address.filter(function(one){
              return one.id == addObj.id;
            })[0];
            user.address.splice(user.address.indexOf(deletingAdd),1);
            if(deletingAdd.isDefault){
              user.address[0].isDefault = true;
            }
            return next();
          }
          var actualAddress = addObj.street + " " + addObj.city;
          if(addObj.isDefault){
            user.phone = addObj.phone;
          }
          require('../services/geocode').geocode(actualAddress, function (err, result) {
            if (err) {
              sails.log.debug(err);
              return next(req.__('meal-error-address'));
            }
            sails.log.debug("geocoded result: " + result);
            if(result.length==0){
              return next(req.__('meal-error-address2'));
            }
            if(addObj.isDefault){
              user.address.forEach(function (one) {
                one.isDefault = false;
              });
              var administration = result[0].administrativeLevels;
              user.county = administration.level2long;
              user.city = result[0].city;
              user.full_address = result[0].formattedAddress;
              user.lat = result[0].latitude;
              user.long = result[0].longitude;
              user.zip = result[0].zipcode;
            }

            addObj.street = result[0].streetNumber + " " + result[0].streetName;
            addObj.city = result[0].city;
            addObj.zip = result[0].zipcode;

            if(addObj.id && addObj.id != 'undefined'){
              user.address.forEach(function(add, index){
                if(add.id == addObj.id){
                  user.address[index] = addObj;
                }
              });
            }else{
              var id = new Date().getTime();
              addObj.id = id;
              user.address.push(addObj);
            }
            return next();
          });
        },function(err){
          if(err){
            return cb(err);
          }
          delete params.address;
          sails.log.debug(user.address[0].isDefault);
          sails.log.debug("address updated");
          cb(null, user);
        });
      }],
      updateUser : ['handleAddress',function(cb, results){

        results.handleAddress.save(function(err, u){
          if(err){
            return cb(err);
          }
          var auth = req.session.user.auth;
          User.update({id: userId}, params).exec(function (err, user) {
            if (err) {
              return cb(err);
            }
            if(user[0].host && user[0].phone){
              var hostId = user[0].host.id || user[0].host;
              Host.update(hostId, {phone : user[0].phone}).exec(function(err, host){
                if(err){
                  return cb(err);
                }
                user[0].auth = auth;
                cb(null, user[0]);
              })
            }else{
              user[0].auth = auth;
              cb(null, user[0]);
            }
          });
        })

      }]}, function(err, results){
        if(err){
          return res.badRequest(err);
        }
        sails.log.info("updating user county: " + results.updateUser.county);
        req.session.user = results.updateUser;
        return res.ok(results.updateUser);
      })
  },

  me : function(req, res){
    var userId = req.session.user.id;
    User.findOne(userId).populate("host").populate("orders").populate('auth').populate("collects").exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      found.featureDishes = [];
      if(found.orders.length == 0 && found.collects.length == 0) {
        found.locale = req.getLocale();
        found.save(function(err, result){
          if(err){
            return res.badRequest(err);
          }
          Notification.destroy({user : userId}).exec(function(err){
            if(err){
              console.log(err);
            }
            if(req.wantsJSON){
              return res.ok(found);
            }
            return res.view('user', {user: found});
          });
        })
      }else{
        async.each(found.orders, function(order,next){
          Order.findOne(order.id).populate("dishes").populate("host").populate("meal").exec(function (err, result) {
            if(err){
              next(err);
            }else{
              order.dishes = result.dishes;
              order.host = result.host;
              order.meal = result.meal;
              if(order.status == "review"){
                Object.keys(order.orders).forEach(function(dishId){
                  if(order.orders[dishId]>0){
                    order.dishes.forEach(function(dish){
                      if(dish.id == dishId){
                        if(dish.isFeature()){
                          dish.meal = order.meal;
                          if(found.featureDishes.indexOf(dishId) == -1){
                            found.featureDishes.push(dish);
                          }
                        }
                      }
                    });
                  }
                });
              }
              next();
            }
          });
        },function(err){
          if(err){
            return res.badRequest(err);
          }
          async.each(found.collects, function(collect,next){
            Meal.findOne(collect.id).populate("chef").exec(function(err, meal){
              if(err){
                next(err);
              }else{
                collect.chef = meal.chef;
                next();
              }
            });
          },function(err){
            if(err){
              return res.badRequest(err);
            }
            req.session.user = found;
            Notification.destroy({user : userId}).exec(function(err){
              if(err){
                console.log(err);
              }
            });
            found.locale = req.getLocale();
            found.save(function(err, result){
              if(err){
                return res.badRequest(err);
              }
              if(req.wantsJSON){
                return res.ok(found);
              }
              return res.view('user',{user: found});
            })
          });
        });
      }
    });
  },

  activate : function(req, res){
    var userId = req.params.id;
    var msg = req.body.msg;
    User.update(userId, { status : 'active', msg : msg }).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      res.ok(user);
    })
  },

  deactivate : function(req, res){
    var userId = req.params.id;
    var msg = req.body.msg;
    User.update(userId, { status : 'frozen', msg : msg }).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      res.ok(user);
    })
  },

  // getSignedUrl : function(req, res){
  //   var bucket = sails.config.aws.bucket;
  //   var userId = req.session.user.id;
  //   var params = {Key : "users/" + userId + "/" + name, Bucket : bucket, ContentType : type, Body : "", ACL : "public-read"};
  //   var s3 = new AWS.S3({Bucket : sails.config.aws.bucket});
  //   this.signedUrl(req,res,params,s3);
  // },

  getMaxSize : function(module){
    var s3 = sails.config.aws;
    var maxSize = '5242880';
    if(s3.maxSizes.hasOwnProperty(module)){
      maxSize = s3.maxSizes[module];
    }
    return maxSize;
  },

  calculateSignature : function(req, res){
    var name = req.body.name;
    var module = req.body.module;
    var userId = req.session.user.id;
    var s3 = sails.config.aws;
    var bucket = s3.bucket;
    var key = s3.key;
    var filename = "users/" + userId + "/" + name;
    var expDate = new Date();
    expDate.setMinutes(expDate.getMinutes() + 5);
    expDate = expDate.toISOString();
    //var date = new Date().toISOString().replace(/-|\:|\./g, '');
    var date = "20151229T000000Z";
    var credential = s3.id + "/" + date + "/" + s3.region + "/s3/aws4_request";
    var url = "https://" + bucket + ".s3.amazonaws.com/";
    var maxSize = this.getMaxSize(module);
    var expiration = moment().add(5, 'minutes').toISOString();
    var signatureJSON = { "expiration": expiration,
      "conditions": [
        {"bucket": "sfmeal"},
        ["starts-with", "$key", "users/" + userId + "/"],
        {"acl": "public-read"},
        {"success_action_status": "201"},
        ["content-length-range","0",maxSize],
        ["starts-with", "$Content-Type", "image/"]
        //{"x-amz-meta-uuid": "14365123651274"},
        //{"x-amz-server-side-encryption": "AES256"},
        //{"x-amz-credential": credential},
        //{"x-amz-algorithm": "AWS4-HMAC-SHA256"},
        //{"x-amz-date": date }
      ]
    };
    var policyInUnicode = new Buffer(JSON.stringify(signatureJSON));
    var policy = policyInUnicode.toString('base64').replace(/\n|\r/, '');
    //var opts = {service : 's3', region : 'us-east-1', host : 'sfmeal.s3.amazonaws.com', path : '/sfmeal?X-Amz-Date=' + date, signQuery : true };
    //var v4 = aws4.sign(opts, {
    //  secretAccessKey: s3.key,
    //  accessKeyId: s3.id
    //})
    //console.log(opts);
    var hmac = crypto.createHmac("sha1", s3.key);
    var hash2 = hmac.update(policy);
    var signature = hmac.digest("base64");
    res.ok({url : encodeURI(url), policy : policy, signature : signature, key : encodeURI(filename), credential : encodeURI(credential), date : date, AWSAccessKeyId : s3.id});
  },

  deleteObject : function(req,res) {
    var s3 = new AWS.S3({Bucket : sails.config.aws.bucket});
    var bucket = sails.config.aws.bucket;
    var userId = req.session.user.id;
    var name = req.body.name;
    var modual = req.body.modual;
    var params = {Key : "users/" + userId + "/" + name, Bucket : bucket};
    s3.headObject(params, function (err, metadata) {
      if (err && err.code === 'NotFound') {
        return res.ok();
      } else {
        var deleteParams = {Bucket: params.Bucket, Key: params.Key};
        s3.deleteObject(deleteParams, function (err, data) {
          if (err) {
            return res.badRequest(err);
          }
          switch (modual){
            case "thumbnail":
                User.findOne(userId).exec(function(err,user){
                  if(err){
                    return res.badRequest(err);
                  }
                  user.picture = "";
                  user.save(function(err,result){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok();
                  });
                });
              break;
          }
          return res.ok();
        });
      }
    });
  }
});
