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
            return res.badRequest("You can not delete the only address");
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
            return res.badRequest("地址解析错误，请刷新再试。");
          }  else {
            if(result.length==0){
              return res.badRequest("地址格式不对或地址不存在。");
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
    var async = require('async');
    var userId = req.session.user.id;
    User.findOne(userId).populate("host").populate("orders").populate("collects").exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      found.featureDishes = [];
      if(found.orders.length == 0) {
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
        req.session.user = found;
        return res.view('user',{user: found});
      });
    });
  },

  getSignedUrl : function(req, res){
    var bucket = sails.config.aws.bucket;
    var userId = req.session.user.id;
    var name = req.body.name;
    var type = req.body.type;
    var index = req.body.index;
    var params = {Key : "users/" + userId + "/" + name, Bucket : bucket, ContentType : type, Body : "", ACL : "public-read"};
    var s3 = new AWS.S3({Bucket : sails.config.aws.bucket});
    this.signedUrl(req,res,params,s3);
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
            return res.badRequest("not a host");
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
            return res.badRequest("not a host");
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
          return res.badRequest("need a moduel");
          break;
      }
    });
  },

  pocket : function(req, res){
    var userId = req.session.user.id;
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
            if(u.host){
              var hostId = u.host.id;
              Host.findOne(hostId).exec(function(err,host){
                if(err){
                  return res.badRequest(err);
                }
                var accountId = host.accountId;
                //fetching account info
                stripe.getBalance({id : accountId}, function(err, balance){
                  if(err){
                    return res.badRequest(err);
                  }
                  var totalBalance = 0;
                  balance.available.forEach(function(balanceObj){
                    totalBalance += (balanceObj.amount / 100).toFixed(2);
                  });
                  u.pocket.balance = totalBalance;
                  u.pocket.available_balances = balance.available;
                  u.pocket.pending_balances = balance.pending;
                  stripe.listTransactions({id : accountId}, function(err, transactions){
                    if(err){
                      return res.badRequest(err);
                    }
                    u.pocket.transaction_history = transactions.data;
                    u.pocket.save(function(err,result){
                      if(err){
                        return res.badRequest(err);
                      }
                      res.view('pocket',{user : user});
                    })
                  });
                });
              });
            }else{
              res.view('pocket',{user : user});
            }
          })
        });
      }else{
        if(user.host){
          var hostId = user.host.id;
          var pocket = user.pocket;
          Host.findOne(hostId).exec(function(err,host){
            if(err){
              return res.badRequest(err);
            }
            var accountId = host.accountId;
            //fetching account info
            stripe.getBalance({id : accountId}, function(err, balance){
              if(err){
                return res.badRequest(err);
              }
              var totalBalance = 0;
              balance.available.forEach(function(balanceObj){
                totalBalance += (balanceObj.amount / 100).toFixed(2);
              });
              pocket.balance = totalBalance;
              pocket.available_balances = balance.available;
              pocket.pending_balances = balance.pending;
              stripe.listTransactions({id : accountId}, function(err, transactions){
                if(err){
                  return res.badRequest(err);
                }
                pocket.transaction_history = transactions.data;
                pocket.save(function(err,result){
                  if(err){
                    return res.badRequest(err);
                  }
                  res.view('pocket',{user : user});
                })
              });
            });
          });
        }else{
          return res.view('pocket',{user: user});
        }
      }
      //get account info such as balance, balance history and transaction detail
    });
  }

});
