/**
 * HostController
 *
 * @description :: Server-side logic for managing hosts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * @error       :: -1 address decode error
 *                 -2 address not found
 *                 -3 Can only like one host once
 *                 -4 can not like yourself
 */

var stripe = require("../services/stripe.js");
var async = require('async');
var fs = require("fs");
var notification = require('../services/notification');
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil.js');
var moment = require('moment');

module.exports = {
  me : function(req, res){
    var userId = req.session.user.id;
    var hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    User.update(userId, {locale : req.getLocale()}).populate("auth").limit(1).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      Host.findOne(hostId).populate("dishes",{ sort: 'createdAt DESC' }).populate("meals",{ sort: 'createdAt DESC' }).populate('orders').exec(function(err,host){
        if(err){
          return res.badRequest(err);
        }
        host.locale = req.getLocale();
        host.checkGuideRequirement(function(err, host){
          if(err){
            return res.badRequest(err);
          }
          //construct orders for host
          host.host_orders = host.orders.map(function(o){
            if(!o){
              return;
            }
            var meal = host.meals.filter(function(m){
              return m.id === o.meal;
            })[0];
            if(!meal){
              return;
            }
            o.serviceFee = meal.serviceFee;
            return o;
          });
          host.host_orders = host.host_orders.sort(function(a,b){
            return new Date(b.pickupInfo.pickupTillTime).getTime() - new Date(a.pickupInfo.pickupTillTime).getTime();
          })
          host.host_dishes = host.dishes;
          Notification.destroy({host : hostId}).exec(function(err){
            if(err){
              console.log(err);
            }
          });
          var u = user[0];
          u.host = host;
          if(req.wantsJSON && process.env.NODE_ENV === "development"){
            return res.ok(u);
          }
          return res.view('host',{user: u});
        })
      });
    });
  },

  search : function(req, res){
    Host.find({ where : req.query, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req)}).exec(function (err, hosts) {
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
      if(!params.address.street || !params.address.city || !params.address.zip){
        return res.badRequest({ code : -2, responseText : req.__('meal-error-address2')});
      }
      var actual_address = params.address.street + ", " + params.address.city + ", " + params.address.zip;
      var cellphone = params.address.phone;
      require('../services/geocode').geocode(actual_address,function(err,result){
        if(err){
          sails.log.error(err);
          return res.badRequest({code : -1, responseText : req.__('meal-error-address')});
        }else{
          if(result.length === 0){
            return res.badRequest({ code : -2, responseText : req.__('meal-error-address2')});
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
          host = host[0];
          var addressObj = {};
          if(host.city){
            addressObj["city"] = host.city;
          }
          if(host.street){
            addressObj["line1"] = host.street;
          }
          if(host.zip){
            addressObj["postal_code"] = host.zip;
          }
          if(host.state){
            addressObj["state"] = host.state;
          }
          stripe.updateManagedAccount(host.accountId, {
              legal_entity: {
                address: addressObj
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
      var legal_entity;
      if(params.legal_entity){
        legal_entity = JSON.parse(params.legal_entity);
        delete params.legal_entity;
      }
      Host.findOne(hostId).populate('user').exec(function(err,host){
        if(err){
          return res.badRequest(err);
        }
        if(params.license){
          params.license = JSON.parse(params.license);
          params.license.valid = false;
          params.license.issuedTo = host.user.firstname + " " + host.user.lastname;
          host.admin = "581bce5a28f2161558473296";
          notification.notificationCenter("User","licenseUpdated",host,false,false,req,true);
        }
        Host.update({id : hostId}, params).exec(function (err, host) {
          if(err){
            return res.badRequest(err);
          }
          host = host[0];
          async.auto({
            uploadDocument : function(cb){
              req.file("image").upload({
                dirname: require('path').resolve(sails.config.appPath, 'assets/images/uploads')
              },function(err, files){
                if(err){
                  return cb(err);
                }
                if(files.length === 0){
                  return cb();
                }
                var file = files[0];
                sails.log.info("uploading document: " + file.filename);
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
                  sails.log.info("document uploaded: " + data.id);
                  legal_entity = legal_entity || {};
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
              if(req.wantsJSON && process.env.NODE_ENV === "development"){
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
          if(req.wantsJSON && process.env.NODE_ENV === "development"){
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
    if(hostId !== myHostId){
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

  hostPage : function(req, res){
    var hostId = req.params.id;
    Host.findOne(hostId).populate("dishes").populate("meals").exec(function(err, host){
      if(err){
        return res.badRequest(err);
      }
      // host.meals = host.meals.filter(function(meal){
      //   return meal.status === "on" && moment(meal.provideFromTime).isAfter();
      // });
      if(!host){
        return res.notFound();
      }
      Review.find({ where : { host : hostId }, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req) }).exec(function(err, reviews){
        if(err){
          return res.badRequest(err);
        }
        var publicHost = {};
        publicHost.id = host.id;
        publicHost.dishes = host.dishes;
        publicHost.meals = host.meals;
        publicHost.shopName = host.shopName;
        publicHost.shopName_en = host.shopName_en;
        publicHost.picture = host.picture;
        publicHost.intro = host.intro;
        publicHost.intro_en = host.intro_en;
        publicHost.feature_dishes = host.feature_dishes;
        publicHost.shortIntro = host.shortIntro();
        publicHost.license = host.license;
        publicHost.reviews = reviews;
        publicHost.likes = host.likes;
        publicHost.shopNameI18n = host.shopNameI18n;
        publicHost.introI18n = host.introI18n;
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok(publicHost);
        }
        return res.view("profile",{host : publicHost, user : req.session.user, locale : req.getLocale()});
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
      Review.find({ where : { host : hostId }, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req) }).exec(function(err, reviews){
        if(err){
          return res.badRequest(err);
        }
        host.reviews = reviews;
        return res.ok(host);
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
        host.checkGuideRequirement(function(err){
          if(err){
            return res.badRequest(err);
          }
          if(req.wantsJSON && process.env.NODE_ENV === "development"){
            return res.ok(host);
          }
          return res.view("apply", { user : req.session.user, hasAddress : hasAddress, hasDish : hasDish, hasMeal : hasMeal, hasAccount : hasAccount, verification : host.verification, passGuide: host.passGuide, dishVerifying : host.dishVerifying });
        });
      });
    }else{
      return res.view("apply", { user : req.session.user, hasAddress : hasAddress, hasDish : hasDish, hasMeal : hasMeal, hasAccount : hasAccount, passGuide: false, verification : null, dishVerifying : null});
    }
  },

  like : function(req, res){
    var hostId = req.params.id;
    var userId = req.session.user.id;
    User.findOne(userId).populate("likes").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      if(user.host && user.host == hostId){
        return res.badRequest({ code : -4, responseText : req.__('host-like-himself-error')});
      }
      var alreadyLike = false;
      if(user.likes){
        alreadyLike = user.likes.some(function(host){
          return host.id == hostId;
        })
      }
      if(alreadyLike){
        return res.badRequest({ code : -3, responseText : req.__('host-like-once-error')});
      }

      Host.findOne(hostId).exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        host.likes = host.likes || 0;
        host.likes++;
        host.save(function(err, h){
          if(err){
            return res.badRequest(err);
          }
          user.likes.add(hostId);
          user.save(function(err, u){
            if(err){
              return res.badRequest(err);
            }
            res.ok(u);
          });
        });
      })
    });
  },

  follow : function(req, res){
    var hostId = req.params.id;
    var userId = req.session.user.id;
    User.findOne(userId).populate("follow").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      if(user.host && user.host == hostId){
        return res.badRequest({ code : -4, responseText : req.__('host-like-himself-error')});
      }

      Host.findOne(hostId).exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        user.follow = hostId;
        user.save(function(err, u){
          if(err){
            return res.badRequest(err);
          }
          req.session.user.follow = user.follow;
          res.ok(user);
        });
      })
    });
  },

  unfollow : function(req, res){
    var hostId = req.params.id;
    var userId = req.session.user.id;
    User.findOne(userId).populate("follow").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      if(user.host && user.host === hostId){
        return res.badRequest({ code : -4, responseText : req.__('host-like-himself-error')});
      }

      Host.findOne(hostId).exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        user.follow = null;
        user.save(function(err, u){
          if(err){
            return res.badRequest(err);
          }
          req.session.user.follow = u.follow;
          res.ok({});
        });
      })
    });
  },

  findReview : function(req, res){
    var hostId = req.params.id;
    Review.find({ where : { host : hostId}, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req)}).exec(function(err, reviews){
      if(err){
        return res.badRequest(err);
      }
      res.ok(reviews);
    })
  },

  findMeal : function(req, res){
    var hostId = req.params.id;
    Meal.find({ where : { chef : hostId}, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req)}).exec(function(err, meals){
      if(err){
        return res.badRequest(err);
      }
      res.ok(meals);
    })
  },

  findDish : function(req, res){
    var hostId = req.params.id;
    Dish.find({ where : { chef : hostId}, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req) }).exec(function(err, dishes){
      if(err){
        return res.badRequest(err);
      }
      res.ok(dishes);
    })
  }

};

