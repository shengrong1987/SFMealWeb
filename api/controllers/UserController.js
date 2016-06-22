/**
 * UserController.js
 *
 * @module      :: Controller
 * @description :: Provides the base user
 *                 actions used to make waterlock work.
 *
 * @docs        :: http://waterlock.ninja/documentation
 */

var AWS = require('aws-sdk');
AWS.config.accessKeyId = sails.config.aws.id;
AWS.config.secretAccessKey = sails.config.aws.key;
var stripe = require("../services/stripe.js");
var crypto = require("crypto");
var moment = require("moment");
var async = require('async');

module.exports = require('waterlock').actions.user({
  /* e.g.
    action: function(req, res){

    }
  */
  session : function(req, res){
    return res.json(req.session.user);
  },

  becomeHost : function(req, res){
    var userId = req.session.user.id;
    var email = req.session.user.auth.email;
    var params = {};
    params.user = userId;
    params.email = email;
    if(req.session.user.host){
      return res.badRequest(req.__('user-already-host'));
    }
    Host.create(params).exec(function(err, host){
      if(err){
        return res.badRequest(err);
      }
      var hostId = host.id;
      stripe.createManagedAccount({email : email},function(err,account){
        if(err){
          return res.badRequest(err);
        }
        host.accountId = account.id;
        host.save(function(err,host){
          if(err){
            return res.badRequest(err);
          }
          User.update({id : userId},{host: hostId}).exec(function(err, user){
            if(err){
              res.badRequest(err);
            }
            req.session.user = user[0];
            res.ok({user:user[0]});
          });
        });
      });
    });
  },

  search : function(req, res){
    var email = req.query.email;
    delete req.query.email;
    User.find(req.query).populate('auth').exec(function (err, users) {
      if(err){
        return res.badRequest(err);
      }
      users = users.filter(function(user){
        return user.auth.email == email;
      });
      return res.ok(users);
    })
  },

  update : function(req, res) {
    var addAddress = function(address,res,user){
      if(address.id){
        //address exist, just to update with the id
        if(address.isDefault){
          for (var key in user.address_list) {
            if(user.address_list.hasOwnProperty(key)) {
              user.address_list[key].isDefault = false;
            }
          }
        }
        user.address_list[address.id] = address;
        user.save(function(err,found){
          if(err){
            return res.badRequest(err);
          }
          res.ok(found);
        })
      }else{
        //adding as it's a new address
        if(address.isDefault){
          for (var key in user.address_list) {
            if(user.address_list.hasOwnProperty(key)) {
              user.address_list[key].isDefault = false;
            }
          }
        }
        //var address_count = Object.keys(user.address_list).length;
        var id = new Date().getTime();
        address.id = id;
        user.address_list[id] = address;
        user.save(function(err,found) {
          if (err) {
            return res.badRequest(err);
          }
          res.ok(found);
        });
      }
    };
    var params = req.body;
    var userId = req.params.id;
    if (params.address) {
      var address = params.address;
      if(address.delete){
        User.findOne(userId).exec(function(err,user) {
          if (err) {
            return res.badRequest(err);
          }
          var keys = Object.keys(user.address_list);
          if(keys.length == 1){
            return res.badRequest(req.__('user-only-address'));
          }
          var isDefault = user.address_list[address.id].isDefault;
          delete user.address_list[address.id];
          keys = Object.keys(user.address_list);
          if(isDefault){
            user.address_list[keys[0]].isDefault = true;
          }

          user.save(function(err,found) {
            if (err) {
              return res.badRequest(err);
            }
            res.ok(found);
          });
        });
      }else if(address.isDefault){
        //isDefault address, need to geocode it
        var actualAddress = address.street + " " + address.city;
        require('../services/geocode').geocode(actualAddress, function (err, result) {
          if (err) {
            return res.badRequest(req.__('meal-error-address'));
          }  else {
            if(result.length==0){
              return res.badRequest(req.__('meal-error-address2'));
            }
            var administration = result[0].administrativeLevels;
            User.findOne(userId).exec(function(err,user){
              if(err){
                return res.badRequest(err);
              }
              user.county = administration.level2long;
              user.city = result[0].city;
              user.full_address = result[0].formattedAddress;
              user.lat = result[0].latitude;
              user.long = result[0].longitude;
              addAddress(address,res,user);
            });
          }
        });
      }else{
        User.findOne(userId).exec(function(err,user) {
          if (err) {
            return res.badRequest(err);
          }
          addAddress(address,res, user);
        });
      }
    } else {
      User.update({id: userId}, params).exec(function (err, user) {
        if (err) {
          return res.badRequest(err);
        }
        req.session.user = user[0];
        res.ok(user[0]);
      });
    }
  },

  me : function(req, res){
    var userId = req.session.user.id
    User.findOne(userId).populate("host").populate("orders").populate("collects").exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      found.featureDishes = [];
      if(found.orders.length == 0 && found.collects.length == 0) {
        return res.view('user', {user: found});
      }

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
          return res.view('user',{user: found});
        });
      });
    });
  },

  getSignedUrl : function(req, res){
    var bucket = sails.config.aws.bucket;
    var userId = req.session.user.id;
    var params = {Key : "users/" + userId + "/" + name, Bucket : bucket, ContentType : type, Body : "", ACL : "public-read"};
    var s3 = new AWS.S3({Bucket : sails.config.aws.bucket});
    this.signedUrl(req,res,params,s3);
  },

  calculateSignature : function(req, res){
    var name = req.body.name;
    var userId = req.session.user.id;
    var s3 = sails.config.aws;
    var bucket = s3.bucket;
    var key = s3.key;
    var filename = "users/" + userId + "/" + name
    var expDate = new Date();
    expDate.setMinutes(expDate.getMinutes() + 5);
    expDate = expDate.toISOString();
    //var date = new Date().toISOString().replace(/-|\:|\./g, '');
    var date = "20151229T000000Z";
    var credential = s3.id + "/" + date + "/" + s3.region + "/s3/aws4_request";
    var url = "http://" + bucket + ".s3.amazonaws.com/";
    //var aws4 = require('aws4');
    var signatureJSON = { "expiration": "2016-12-30T12:00:00.000Z",
      "conditions": [
        {"bucket": "sfmeal"},
        ["starts-with", "$key", "users/" + userId + "/"],
        {"acl": "public-read"},
        {"success_action_status": "201"},
        ["content-length-range","0",s3.maxSize],
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
  },

  signedUrl : function(req, res, params, s3){
    var root = sails.config.aws.host;
    var modual = req.body.modual;
    var name = req.body.name;
    var isDelete = req.body.isDelete;
    var userId = req.session.user.id;
    var path = "users/" + userId + "/" + name;
    s3.getSignedUrl('putObject',params,function(err,url){
      if(err){
        return res.badRequest(err);
      }
      switch(modual){
        case "thumbnail":
          User.findOne(userId).exec(function(err,user){
            if(err){
              return res.badRequest(err);
            }
            user.picture = root + path;
            user.save(function(err,result){
              if(err){
                return res.badRequest(err);
              }
              return res.ok({ S3URL:url, publicURL : root + path});
            });
          });
          break;
        case "license":
          var host = req.session.user.host;
          if(!host){
            return res.badRequest(req.__('user-not-host'));
          }
          Host.findOne(host).exec(function(err,host){
            if(err){
              return res.badRequest(err);
            }
            host.license = root + path;
            host.save(function(err,result){
              if(err){
                return res.badRequest(err);
              }
              return res.ok({ S3URL:url, publicURL : root + path});
            });
          });
          break;
        case "story":
          var host = req.session.user.host;
          if(!host){
            return res.badRequest(req.__('user-not-host'));
          }
          Host.findOne(host).exec(function(err,host){
            if(err){
              return res.badRequest(err);
            }
            host.picture = root + path;
            host.save(function(err,result){
              if(err){
                return res.badRequest(err);
              }
              return res.ok({ S3URL:url, publicURL : root + path});
            });
          });
          break;
        case "dish":
          return res.ok({ S3URL:url, publicURL : root + path});
          break;
        default:
          return res.badRequest(req.__('user-upload-need-module'));
          break;
      }
    });
  },

  pocket : function(req, res){
    var userId = req.session.user.id;
    var _this = this;
    User.findOne(userId).populate("payment").populate("pocket").populate("host").populate("orders").exec(function(err,user){
        if(err){
        return res.badRequest(err);
      }
      //lazy intiallize pocket
      if(!user.pocket){
        Pocket.create({user: userId}).exec(function(err,pocket){
          if(err){
            return res.badRequest(err);
          }
          user.pocket = pocket;
          user.save(function(err,u){
            if(err){
              return res.badRequest(err);
            }
            user.pocket.transactions_history = [];
            if(user.host){
              _this.getHostBalance(user, function(err, newPocket){
                if(err){
                  return res.badRequest(err);
                }
                _this.getUserBalance(user, function(err, finalPocket){
                  if(err){
                    return res.badRequest(err);
                  }
                  finalPocket.save(function(err, p){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.view('pocket', {user : user});
                  })
                });
              });
            }else{
              _this.getUserBalance(user, function(err, finalPocket){
                if(err){
                  return res.badRequest(err);
                }
                finalPocket.save(function(err, p){
                  if(err){
                    return res.badRequest(err);
                  }
                  return res.view('pocket', {user : user});
                })
              });
            }
          })
        });
      }else{
        user.pocket.transactions_history = [];
        if(user.host){
          _this.getHostBalance(user, function(err, newPocket){
            if(err){
              return res.badRequest(err);
            }
            _this.getUserBalance(user, function(err, finalPocket){
              if(err){
                return res.badRequest(err);
              }
              finalPocket.save(function(err, p){
                if(err){
                  return res.badRequest(err);
                }
                return res.view('pocket', {user : user});
              })
            });
          });
        }else{
          _this.getUserBalance(user, function(err, finalPocket){
            if(err){
              return res.badRequest(err);
            }
            finalPocket.save(function(err, p){
              if(err){
                return res.badRequest(err);
              }
              return res.view('pocket', {user : user});
            })
          });
        }
      }
    });
  },

  getHostBalance : function(user, cb){
    var hostId = user.host.id;
    var pocket = user.pocket;
    Host.findOne(hostId).populate("orders").exec(function (err, host) {
      if (err) {
        return res.badRequest(err);
      }
      var accountId = host.accountId;
      //fetching account info
      stripe.getBalance({id: accountId}, function (err, balance) {
        if (err) {
          return cb(err);
        }
        var totalBalance = 0;
        balance.available.forEach(function (balanceObj) {
          totalBalance += (balanceObj.amount / 100).toFixed(2);
        });
        pocket.balance = totalBalance;
        pocket.available_balances = balance.available;
        pocket.pending_balances = balance.pending;
        async.each(host.orders, function (order, next) {
          var charges = order.charges;
          async.each(Object.keys(charges), function(chargeId , next){
            stripe.retrieveCharge(chargeId, function(err, charge){
              if(err){
                return next(err);
              }
              var hostId = charge.metadata.hostId;
              Host.findOne(hostId).exec(function (err, host) {
                if (err) {
                  return next(err);
                }
                charge.host = host;
                var date = moment(charge.created * 1000);
                charge.month = moment.months()[date.month()];
                charge.day = date.date();
                charge.type = "payment";
                //console.log("adding new transaction");
                pocket.transactions_history.push(charge);
                next();
              })
            });
          },function(err){
            if(err){
              return next(err);
            }
            next();
          });
        },function(err){
          if(err){
            return cb(err);
          }
          cb(null, pocket);
        });
      });
    });
  },

  getUserBalance : function(user, cb){
    var pocket = user.pocket;
    async.each(user.orders, function (order, next) {
      var charges = Object.keys(order.charges);
      async.each(charges, function (chargeId, next) {
        stripe.retrieveCharge(chargeId, function(err, charge){
          if(err){
            return next(err);
          }
          Host.findOne(charge.metadata.hostId).exec(function(err, host){
            if(err){
              return next(err);
            }
            charge.host = host;
            charge.type = "charge";
            var date = moment(charge.created * 1000);
            charge.month = moment.months()[date.month()];
            charge.day = date.date();
            pocket.transactions_history.push(charge);
            next();
          });
        });
      }, function (err) {
        if(err){
          return next(err);
        }
        next();
      });
    }, function (err) {
      if(err){
        return cb(err);
      }
      cb(null, pocket);
    });
  },

  getBalanceHistory : function(user, res){
    Host.findOne(user.host.id).exec(function (err, host) {
      if (err) {
        return res.badRequest(err);
      }
      stripe.getBalance({id: host.accountId}, function (err, balance) {
        if (err) {
          return res.badRequest(err);
        }
        var pocket = user.pocket;
        var totalBalance = 0;
        balance.available.forEach(function (balanceObj) {
          totalBalance += (balanceObj.amount / 100).toFixed(2);
        });
        pocket.balance = totalBalance;
        pocket.available_balances = balance.available;
        pocket.pending_balances = balance.pending;
        stripe.listTransactions({
          id : host.accountId
        },function(err, transactions){
          if(err){
            return res.badRequest(err);
          }
          pocket.transactions_history = transactions.data;
          pocket.save(function(err, p){
            if(err){
              return res.badRequest(err);
            }
            return res.view('pocket', {user : user});
          })
        });
      });
    });
  }
});
