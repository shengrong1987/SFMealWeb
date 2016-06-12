/**
 * HostController
 *
 * @description :: Server-side logic for managing hosts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripe = require("../services/stripe.js");
var async = require('async');
module.exports = {

  me : function(req, res){
    var userId = req.session.user.id;
    var hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    User.findOne(userId).populate("auth").exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      Host.findOne(hostId).populate("dishes").populate("meals").populate('orders').exec(function(err,h){
        if(err){
          return res.badRequest(err);
        }
        if(!h.passGuide){
          h.checkGuideRequirement(function(err, pass){
            if(err){
              return res.badRequest(err);
            }
            async.each(h.orders,function(order, next){
              Order.findOne(order.id).populate("meal").exec(function(err, o){
                if(err){
                  return next(err);
                }
                order = o;
                next();
              });
            },function(err){
              if(err){
                return res.badRequest(err);
              }
              h.host_orders = h.orders;
              h.adjusting_orders = h.adjusting_orders;
              h.host_dishes = h.dishes;
              found.host = h;
              Notification.destroy({host : hostId}).exec(function(err){
                if(err){
                  console.log(err);
                }
              });
              return res.view('host',{user: found});
            });
          })
        }else{
          async.each(h.orders,function(order, next){
            Order.findOne(order.id).populate("meal").exec(function(err, o){
              if(err){
                return next(err);
              }
              order = o;
              next();
            });
          },function(err){
            if(err){
              return res.badRequest(err);
            }
            h.host_orders = h.orders;
            h.adjusting_orders = h.adjusting_orders;
            h.host_dishes = h.dishes;
            found.host = h;
            Notification.destroy({host : hostId}).exec(function(err){
              if(err){
                console.log(err);
              }
            });
            return res.view('host',{user: found});
          });
        }
      });
    });
  },

  update : function(req, res){
    var params = req.body;
    var hostId = req.params.id;
    var userId = req.session.user.id;
    if(params.address){
      //use googlemap api to geocode address
      //store it into lat, long
      var actual_address = params.address.street + params.address.city + ", " + params.address.zip;
      require('../services/geocode').geocode(actual_address,function(err,result){
        if(err){
          return res.badRequest(req.__('meal-error-address'));
        }else{
          if(result.length == 0){
            return res.badRequest(req.__('meal-error-address2'));
          }
          var administration= result[0].administrativeLevels;
          params.county = administration.level2long;
          params.city = result[0].city;
          params.full_address = result[0].formattedAddress;
          params.lat = result[0].latitude;
          params.long = result[0].longitude;
          params.street = result[0].streetNumber + " " + result[0].streetName;
          params.zip = result[0].zipcode;
        }
        Host.update({id: hostId}, params).exec(function(err,host){
          if(err){
            res.badRequest(err);
          }else{
            User.update(userId,{phone : params.address.phone}).exec(function(err,user){
              if(err){
                return res.badRequest(err);
              }
              res.ok(host[0]);
            });
          }
        });
      });
    }else{
      Host.update({id: hostId}, params).exec(function(err,host){
        if(err){
          res.badRequest(err);
        }else{
          res.ok(host[0]);
        }
      });
    }
  },

  createBank : function(req, res){
    var params = req.body;
    var hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    var token = params.token;
    Host.findOne(hostId).exec(function(err,host){
      if(err){
        return res.badRequest(err);
      }
      var accountId = host.accountId;
      stripe.updateBank({id : accountId, token : token, isNew : true},function(err, bank_account){
        if(err){
          console.log(err);
          return res.badRequest(err);
        }
        var bank_id = bank_account.id;
        host.bankId = bank_id;
        host.save(function(err,result){
          if(err){
            return res.badRequest(err);
          }
          //for testing only
          if(req.wantsJSON){
            return res.ok(bank_account);
          }
          res.ok(req.__('host-bank-ok'));
        });
      });
    });
  },

  updateBank : function(req, res){
    var params = req.body;
    var hostId = req.params.id;
    var myHostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    if(hostId != myHostId){
      res.forbidden();
    }
    var token = params.token;
    Host.findOne(hostId).exec(function(err,host) {
      if (err) {
        return res.badRequest(err);
      }
      var accountId = host.accountId;
      var bankId = host.bankId;
      stripe.updateBank({id : accountId, bankId : bankId, token : token, isNew : false}, function(err, bank_account){
        if(err){
          return res.badRequest(err);
        }
        res.ok(bank_account);
      });
    });
  },

  findOne : function(req, res){
    var hostId = req.params.id;
    Host.findOne(hostId).populate("dishes").populate("meals").exec(function(err, host){
      if(err){
        return res.badRequest(err);
      }
      if(!host){
        return res.notFound();
      }
      var publicHost = {};
      publicHost.dishes = host.dishes;
      publicHost.meals = host.meals;
      publicHost.shopName = host.shopName;
      publicHost.picture = host.picture;
      publicHost.intro = host.intro;
      publicHost.feature_dishes = host.feature_dishes;
      publicHost.shortIntro = host.shortIntro();
      Review.find({host : hostId}).exec(function(err, reviews){
        if(err){
          return res.badRequest(err);
        }
        publicHost.reviews = reviews;
        res.view("profile",{host : publicHost});
      });
    });
  },

  apply : function(req, res){
    var user = req.session.user;
    var hasAddress = false;
    var hasDish = false;
    var hasMeal = false;
    var hasAccount = false;
    if(user && user.host){
      var hostId = user.host;
      Host.findOne(hostId).populate("dishes").populate("meals").exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        if(host.full_address){
          hasAddress = true;
        }
        if(host.dishes.length > 0 && host.dishes.some(function(dish){
            return dish.isVerified;
          })){
          hasDish = true;
          if(host.meals.length > 0){
            hasMeal = true;
          }
        }
        if(host.bankId){
          hasAccount = true;
        }
        host.checkGuideRequirement(function(err, pass){
          if(err){
            return res.badRequest(err);
          }
          return res.view("apply", { user : req.session.user, hasAddress : hasAddress, hasDish : hasDish, hasMeal : hasMeal, hasAccount : hasAccount });
        });
      });
    }else{
      return res.view("apply", { user : req.session.user, hasAddress : hasAddress, hasDish : hasDish, hasMeal : hasMeal, hasAccount : hasAccount });
    }
  },

  //to-test
  cashout : function(req, res){
    //check account balance
    var hostId = req.params.id;
    Host.findOne(hostId).exec(function(err,host){
      if(err){
        return res.badRequest(err);
      }
      var bankId = host.bankId;
      var accountId = host.accountId;
      stripe.balance.retrieve({stripe_account: accountId},
          function(err, balance) {
            var totalAva = balance.available[0].amount;
            stripe.transfers.create({
              amount: totalAva,
              application_fee : 50,
              currency: "usd",
              destination: "default_for_currency",
              description: "Thanks for your housemade food - SFMeal.com"
            }, function(err, transfer) {
              // asynchronously called
              if(err){
                return res.badRequest(err);
              }
              //for testing only
              res.ok(transfer);
              //res.ok("Your money is transferring to your bank!");
            });
          });
    });
  }

};

