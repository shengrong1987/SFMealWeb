/**
 * HostController
 *
 * @description :: Server-side logic for managing hosts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripe = require("../services/stripe.js");
var async = require('async');
var fs = require("fs");
module.exports = {

  me : function(req, res){
    var userId = req.session.user.id;
    var hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    User.update(userId, {locale : req.getLocale()}).populate("auth").limit(1).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      Host.findOne(hostId).populate("dishes").populate("meals").populate('orders').exec(function(err,host){
        if(err){
          return res.badRequest(err);
        }
        host.locale = req.getLocale();
        host.save(function(err, h){
          if(err){
            return res.badRequest(err);
          }
          host.checkGuideRequirement(function(err, pass){
            if(err){
              return res.badRequest(err);
            }
            //construct orders for host
            async.each(host.orders,function(order, next){
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
              host.host_orders = host.orders;
              host.adjusting_orders = host.adjusting_orders;
              host.host_dishes = host.dishes;
              Notification.destroy({host : hostId}).exec(function(err){
                if(err){
                  console.log(err);
                }
              });
              var u = user[0];
              u.host = host;
              if(req.wantsJSON){
                return res.ok(u);
              }
              return res.view('host',{user: u});
            });
          })
        });
      });
    });
  },

  search : function(req, res){
    Host.find(req.query).exec(function (err, hosts) {
      if(err){
        return res.badRequest(err);
      }
      return res.ok(hosts);
    })
  },

  verifyLicense : function(req, res){
    var year = req.body.year;
    var month = req.body.month;
    var day = req.body.day;
    var expDate = new Date(year,month-1,day);
    var hostId = req.params.id;
    Host.findOne(hostId).exec(function(err, host){
      if(err){
        return res.badRequest(err);
      }
      if(!host.license){
        return res.badRequest("none license");
      }
      host.license.exp = expDate;
      host.license.valid = true;
      host.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        return res.ok(result);
      })
    });
  },

  unverifyLicense : function(req, res){
    var hostId = req.params.id;
    var reason = req.body.reason;
    Host.findOne(hostId).exec(function(err, host){
      if(err){
        return res.badRequest(err);
      }
      if(!host.license){
        return res.badRequest("none license");
      }
      host.license.reason = reason;
      host.license.valid = false;
      host.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        return res.ok(result);
      })
    });
  },

  update : function(req, res){
    var params = req.body;
    var hostId = req.params.id;
    var userId = req.session.user.id;
    if(params.address){
      //use googlemap api to geocode address
      //store it into lat, long
      params.address = params.address[0];
      var actual_address = params.address.street + params.address.city + ", " + params.address.zip;
      var cellphone = params.address.phone;
      require('../services/geocode').geocode(actual_address,function(err,result){
        if(err){
          console.log(err);
          return res.badRequest(req.__('meal-error-address'));
        }else{
          if(result.length == 0){
            return res.badRequest(req.__('meal-error-address2'));
          }
          var administration= result[0].administrativeLevels;
          params.county = administration.level2long;
          params.state = administration.level1short;
          params.city = result[0].city;
          params.full_address = result[0].formattedAddress;
          params.lat = result[0].latitude;
          params.long = result[0].longitude;
          params.street = result[0].streetNumber + " " + result[0].streetName;
          params.zip = result[0].zipcode;
          delete params.address;
        }
        Host.update({id: hostId}, params).limit(1).exec(function(err,host){
          if(err){
            return res.badRequest(err);
          }
          var host = host[0];
          stripe.updateManagedAccount(host.accountId, {
              legal_entity: {
                address: {
                  city: host.city,
                  line1: host.street,
                  postal_code: host.zip,
                  state : host.state
                }
              }
            },function(err, result){
              if(err){
                return res.badRequest(err);
              }
              User.update(userId,{phone : cellphone}).exec(function(err,user){
                if(err){
                  return res.badRequest(err);
                }
                return res.ok(host);
              });
            });
        });
      });
    }else{
      if(params.legal_entity){
        var legal_entity = JSON.parse(params.legal_entity);
        delete params.legal_entity;
      }
      if(params.hasImage){
        var hasImage = params.hasImage;
        delete params.hasImage;
      }
      Host.findOne(hostId).populate('user').exec(function(err,host){
        if(err){
          return res.badRequest(err);
        }
        if(params.license){
          params.license = JSON.parse(params.license);
          params.license.valid = false;
          params.license.issuedTo = host.user.firstname + " " + host.user.lastname;
        }
        Host.update({id : hostId}, params).exec(function (err, host) {
          if(err){
            return res.badRequest(err);
          }
          host = host[0];
          async.auto({
            uploadDocument : function(cb){
              if(!hasImage){
                return cb();
              }
              req.file("image").upload(function(err, files){
                var file = files[0];
                stripe.uploadFile({
                  purpose : 'identity_document',
                  file : {
                    data : fs.readFileSync(file.fd),
                    name : file.filename,
                    type: 'application/octet-stream'
                  }
                }, host.accountId, function(err, data){
                  if(err){
                    return cb(err);
                  }
                  legal_entity.verification = {document : data.id};
                  cb();
                });
              });
            },
            updateAccount : ['uploadDocument', function(cb){
              if(!legal_entity){
                return cb();
              }
              stripe.updateManagedAccount(host.accountId, {legal_entity : legal_entity},function(err, result){
                if(err){
                  return cb(err)
                }
                cb();
              });
            }]
          }, function(err, result){
            if(err){
              return res.badRequest(err);
            }
            var updatingToUser = {};
            if(!legal_entity){
              return res.ok({});
            }
            if(legal_entity.dob){
              updatingToUser.birthday = new Date(legal_entity.dob.year,legal_entity.dob.month-1,legal_entity.dob.day);
            }if(legal_entity.first_name && legal_entity.last_name){
              updatingToUser.firstname = legal_entity.first_name;
              updatingToUser.lastname = legal_entity.last_name;
            }
            User.update(userId,updatingToUser).exec(function(err,user){
              if(err){
                return res.badRequest(err);
              }
              if(req.wantsJSON){
                return res.ok(user[0]);
              }
              return res.ok({});
            });
          });
        })
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
          res.ok(host);
        });
      });
    });
  },

  updateBank : function(req, res){
    var params = req.body;
    var hostId = req.params.id;
    var myHostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    if(hostId != myHostId){
      return res.forbidden();
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
      publicHost.license = host.license;
      Review.find({host : hostId}).exec(function(err, reviews){
        if(err){
          return res.badRequest(err);
        }
        publicHost.reviews = reviews;
        if(req.wantsJSON){
          return res.ok(publicHost);
        }
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
      var hostId = user.host.id ? user.host.id : user.host;
      Host.findOne(hostId).populate("dishes").populate("meals").exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        if(host.full_address){
          hasAddress = true;
        }
        if(host.dishes.length > 0){
          hasDish = true;
          if(host.meals.length > 0){
            hasMeal = true;
          }
        }
        if(host.bankId){
          hasAccount = true;
        }
        host.checkGuideRequirement(function(err, valid){
          if(err){
            return res.badRequest(err);
          }
          if(req.wantsJSON){
            return res.ok(host);
          }
          return res.view("apply", { user : req.session.user, hasAddress : hasAddress, hasDish : hasDish, hasMeal : hasMeal, hasAccount : hasAccount, verification : host.verification, passGuide : host.passGuide });
        });
      });
    }else{
      return res.view("apply", { user : req.session.user, hasAddress : hasAddress, hasDish : hasDish, hasMeal : hasMeal, hasAccount : hasAccount, verification : null, passGuide : false });
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

