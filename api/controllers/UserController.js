/**
 * UserController.js
 *
 * @module      :: Controller
 * @description :: Provides the base user
 *                 actions used to make waterlock work.
 *
 * @docs        :: http://waterlock.ninja/documentation
 * @error       :: -1, already is a host
 *              :: -2, user lack of phone
 *              :: -3, token expire
 *              :: -4, referral code not found
 *              :: -5, user lack of email
 *              :: -6, user email already exist
 *              :: -7, not authenticated
 *              :: -8, email not verified
 *              :: -9, reward already redeemed
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
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil.js');

module.exports = require('waterlock').actions.user({
  /* e.g.
    action: function(req, res){

    }
  */
  // session : function(req, res){
  //   return res.json(req.session.user);
  // },

  coupon : function(req, res){
    let userId = req.session.user.id;
    User.findOne(userId).populate("coupons").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      res.ok(user.coupons)
    })
  },

  card: function(req, res){
    let userId = req.session.user.id;
    User.findOne(userId).populate("payment").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      res.ok(user.payment)
    })
  },

  transaction: function(req, res){
    let userId = req.session.user.id;
    let query = req.query;
    query.sort = 'createdAt DESC';
    let _this = this;
    User.findOne(userId).populate("orders",query).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      var transactions = [];
      async.eachSeries(user.orders, function (order, next1) {
        Host.findOne(order.host).exec(function(err, host){
          if(err){
            return next1(err);
          }
          if(!order.charges){
            return next1();
          }
          var charges = Object.keys(order.charges);
          async.each(charges, function (chargeId, next2) {
            stripe.retrieveCharge(chargeId, function(err, charge){
              if(err){
                return next2(err);
              }
              charge = _this.composeCharge(charge, order, host);
              charge.application_fee = 0;
              charge.type = "type-charge";
              transactions.push(charge);
              next2();
            });
          }, function (err) {
            if(err){
              return next1(err);
            }
            next1();
          });
        });
      }, function (err) {
        if(err){
          return res.badRequest(err);
        }
        res.ok(transactions)
      });
    })
  },

  becomeHost: function(req, res){
    var userId = req.session.user.id;
    var user = req.session.user;
    var email = req.session.user.auth.email;
    var shopName = req.query.shopName;
    var phone = req.query.phone;
    let _this = this;
    if(!phone && !user.phone){
      return res.badRequest({ code : -2, responseText : req.__('host-lack-of-phone')});
    }
    if(!email){
      return res.badRequest({ code : -5, responseText : req.__('user-lack-of-email')});
    }
    phone = phone || user.phone;
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
      Host.create({
        user: userId,
        email: email,
        shopName: shopName
      }).exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        let accountAttr = _this.composeBusinessEntity(req, user);
        stripe.createManagedAccount(accountAttr,function(err,account){
          if(err){
            return res.badRequest(err);
          }
          host.accountId = account.id;
          host.save(function(err,host){
            if(err){
              return res.badRequest(err);
            }
            user.host = host.id;
            user.phone = phone;
            user.save(function(err, u){
              if(err){
                return res.badRequest(err);
              }
              if(user.birthday){
                var birthdayDate = new Date(user.birthday);
                var birthday = birthdayDate.getMonth()+1+"/"+birthdayDate.getDate();
                mailChimp.updateMember({ email : user.email, birthday : birthday }, "member");
              }
              mailChimp.addMemberToList({ email : host.email, shopName : shopName, firstname : user.firstname, lastname : user.lastname, language : req.getLocale() }, "chef");
              user.host = host;
              req.session.user = user;
              res.ok( {user:user});
            });
          });
        });
      });
    });
  },

  composeBusinessEntity: function(req, user){
    var params = {
      type : "custom",
      country : 'US',
      email : req.session.user.auth.email,
      business_type : 'individual',
      tos_acceptance : {
        date : parseInt(new Date().getTime()/1000),
        ip : req.ip
      },
      settings: {
        payouts : {
          schedule : {
            interval : "weekly",
            weekly_anchor : "monday"
          }
        }
      },
      individual: {
        first_name: user.firstname,
        last_name: user.lastname
      },
      business_profile: {
        url: "http://sfmeal.com"
      },
      requested_capabilities: ["transfers"]
    }
    if(user.birthday){
      params.individual.dob = {
        day : user.birthday.getDate(),
        month : user.birthday.getMonth() + 1,
        year : user.birthday.getFullYear()
      };
    }
    return params;
  },

  contactForm : function(req, res){
    return res.view("contact",{ layout:false, user : req.session.user});
  },

  search : function(req, res){
    var email = req.query.email;
    delete req.query.email;
    User.find({ where : req.query, skip : actionUtil.parseSkip(req), limit : actionUtil.parseLimit(req) }).populate('auth').exec(function (err, users) {
      if(err){
        return res.badRequest(err);
      }
      if(email){
        users = users.filter(function(user){
          return user.auth ? user.auth.email === email : false;
        });
      }
      return res.ok(users);
    })
  },

  update : function(req, res) {
    var params = req.body;
    var userId = req.params.id;
    var isAdmin = (req.session.user.emailVerified || process.env.NODE_ENV === "development") && req.session.user.auth.email === "admin@sfmeal.com";
    User.findOne(userId).populate("auth").exec(function(err, user) {
      if (err) {
        return cb(err);
      }
      if(params.email && user.auth.email && !isAdmin && user.auth.email !== params.email){
        return res.badRequest({ code : -6, responseText : req.__('user-email-can-not-change')});
      }
      sails.log.debug("UPDATING User Info for: " + user.id);
      var email = user.auth.email || params.email;

      async.auto({
        handleSubscription : function(cb){
          if(params.isReceivedEmail && !user.receivedEmail && process.env.NODE_ENV === "production"){
            mailChimp.addMemberToList({ email : email, firstname : user.firstname, lastname: user.lastname, language : req.getLocale()}, "subscriber");
            params.receivedEmail = true;
          }
          cb();
        },
        handleAddress : function(cb){
          if(!params.address){
            return cb();
          }
          var addresses = params.address;
          var updatingAddress = user.address || [];
          async.each(addresses, function(addObj, next){
            if(addObj.delete){
              if(updatingAddress.length === 1){
                return next(req.__('user-only-address'));
              }
              var deletingAdd = updatingAddress.filter(function(one){
                return one.id === addObj.id;
              })[0];
              updatingAddress.splice(updatingAddress.indexOf(deletingAdd),1);
              if(deletingAdd.isDefault){
                updatingAddress[0].isDefault = true;
              }
              return next();
            }
            var actualAddress = addObj.street + " " + addObj.city;
            if(addObj.isDefault){
              params.phone = addObj.phone;
            }
            require('../services/geocode').geocode(actualAddress, function (err, result) {
              if (err) {
                sails.log.debug(err);
                return next(req.__('meal-error-address'));
              }
              if(result.length===0){
                return next(req.__('meal-error-address2'));
              }
              sails.log.debug("Success in Geocoding address: " + actualAddress);
              if(addObj.isDefault){
                updatingAddress.forEach(function (one) {
                  one.isDefault = false;
                });
                var administration = result[0].administrativeLevels;
                params.county = administration.level2long;
                params.city = result[0].city;
                params.full_address = result[0].formattedAddress;
                params.lat = result[0].latitude;
                params.long = result[0].longitude;
                params.zip = result[0].zipcode;
              }

              addObj.street = result[0].streetNumber + " " + result[0].streetName;
              addObj.city = result[0].city;
              addObj.zip = result[0].zipcode;

              if(addObj.id && addObj.id !== 'undefined'){
                updatingAddress.forEach(function(add, index){
                  if(add.id === addObj.id){
                    updatingAddress[index] = addObj;
                  }
                });
              }else{
                addObj.id = new Date().getTime();
                updatingAddress.push(addObj);
              }
              return next();
            });
          },function(err){
            if(err){
              return cb(err);
            }
            params.address = updatingAddress;
            cb();
          });
        },
        handleReferralCode : function (cb) {
          user.generateCode(params, function(err, code){
            if(err){
              return cb(err);
            }
            params.referralCode = code;
            sails.log.debug("Success in generating Referral Code: " + code);
            cb();
          })
        },
        updateBirthday : function(cb){
          if(!params.birthday) {
            return cb();
          }
          var birthdayDate = new Date(params.birthday);
          var birthday = birthdayDate.getMonth()+1+"/"+birthdayDate.getDate();
          if(email){
            mailChimp.updateMember({ email : email, birthday : birthday }, "member");
          }
          cb();
        }}, function(err){
        if(err){
          return res.badRequest(err);
        }
        User.update({id: userId}, params).exec(function (err, user) {
          if (err) {
            return res.badRequest(err);
          }
          if(user[0].host && user[0].phone){
            var hostId = user[0].host.id || user[0].host;
            Host.update(hostId, {phone : user[0].phone}).exec(function(err, host){
              if(err){
                return res.badRequest(err);
              }
              user[0].auth = req.session.user.auth;
              req.session.user = user[0];
              return res.ok(user[0]);
            })
          }else{
            user[0].auth = req.session.user.auth;
            req.session.user = user[0];
            return res.ok(user[0]);
          }
        });
      })
    });
  },

  packOrders : function(orders){
    orders.forEach(function(order){
      var orderList = order.orders;
      var newOrderList = {}
      if(orderList) {
        Object.keys(orderList).forEach(function (dishId) {
          let number = orderList[dishId].number;
          if (number > 0) {
            newOrderList[dishId] = orderList[dishId];
            let dishes = order.dishes.filter(function(d) {
              return d.id === dishId;
            });
            if(dishes.length){
              newOrderList[dishId].title = dishes[0].title;
            }
          }
        })
        order.orders = newOrderList;
        delete order.dishes;
      }
    })
  },

  combineOrders : function(orders){
    var newOrders = [];
    orders.forEach(function(order){
      var isSamePickup = newOrders.some(function(oldOrder){
        var _isSame = oldOrder.status === order.status && moment(new Date(oldOrder.pickupInfo.pickupFromTime).toISOString()).isSame(moment(new Date(order.pickupInfo.pickupFromTime).toISOString()), 'minute') && moment(new Date(oldOrder.pickupInfo.pickupTillTime).toISOString()).isSame(moment(new Date(order.pickupInfo.pickupTillTime).toISOString()), "minute") && oldOrder.customerName === order.customerName && oldOrder.customerPhone === order.customerPhone && oldOrder.pickupInfo.method === order.pickupInfo.method && ((oldOrder.pickupInfo.method === "delivery" && oldOrder.contactInfo.address === order.contactInfo.address) || (oldOrder.pickupInfo.method === "pickup" && oldOrder.pickupInfo.location === order.pickupInfo.location));
        if(_isSame){
          Object.keys(order.orders).forEach(function(dishId){
            if(oldOrder.orders.hasOwnProperty(dishId)){
              oldOrder.orders[dishId].number += order.orders[dishId].number;
              if(oldOrder.orders[dishId].preference && Array.isArray(oldOrder.orders[dishId].preference)){
                oldOrder.orders[dishId].preference.concat(order.orders[dishId].preference);
              }
            }else{
              oldOrder.orders[dishId] = order.orders[dishId];
            }
          });
          oldOrder.id += "+" + order.id;
          oldOrder.subtotal = parseFloat(oldOrder.subtotal) + parseFloat(order.subtotal);
          oldOrder.tip = parseFloat(oldOrder.tip) + parseFloat(order.tip);
          oldOrder.pickupInfo.comment += order.pickupInfo.comment;
          order.dishes = order.dishes.filter(function(d){
            return !oldOrder.dishes.some(function(d2){
              return d2.id === d.id
            })
          });
          oldOrder.dishes = oldOrder.dishes.concat(order.dishes);
          oldOrder.discount += order.discount;
          if(oldOrder.paymentMethod === "cash" && oldOrder.charges && order.charges){
            oldOrder.charges['cash'] += order.charges['cash'];
          }
        }
        return _isSame;
      });
      if(!isSamePickup){
        newOrders.push(order);
      }
    });
    return newOrders;
  },

  orders : function(req, res){
    let userId = req.session.user.id;
    let _this = this;
    Order.find({
      customer: userId,
      sort: 'createdAt DESC',
      skip: req.query.skip,
      limit: req.query.limit
    }).populate("host").populate("dishes").exec(function(err, orders){
      if(err) {
        return res.badRequest(err)
      }
      let combinedOrders = _this.combineOrders(orders)
      return res.ok({
        orders : combinedOrders,
        length: orders.length
      });
    })
  },

  me : function(req, res){
    var userId = req.session.user.id;
    User.findOne(userId).populate("host").populate("orders",{ sort: 'createdAt DESC' }).populate('auth').populate("collects").exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      found.featureDishes = [];
      if(found.orders.length === 0 && found.collects.length === 0) {
        found.locale = req.getLocale();
        found.save(function(err, result){
          if(err){
            return res.badRequest(err);
          }
          Notification.destroy({user : userId}).exec(function(err){
            if(err){
              sails.log.error(err);
            }
            if(req.wantsJSON && process.env.NODE_ENV === "development"){
              return res.ok(found);
            }
            return res.view('user', {user: found});
          });
        })
      }else{
        //combine dishes and get feature dishes
        async.each(found.orders, function(order,next){
          Order.findOne(order.id).populate("dishes").populate("host").populate("meal").exec(function (err, result) {
            if(err){
              next(err);
            }else{
              order.dishes = result.dishes;
              order.host = result.host;
              order.meal = result.meal;
              if(order.status === "review"){
                Object.keys(order.orders).forEach(function(dishId){
                  if(order.orders[dishId]>0){
                    order.dishes.forEach(function(dish){
                      if(dish.id === dishId){
                        if(dish.isFeature()){
                          dish.meal = order.meal;
                          if(found.featureDishes.indexOf(dishId) === -1){
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
        }, function(err){
          if(err){
            return res.badRequest(err);
          }
          var newOrders = [], dishIds = [];
          found.orders.forEach(function(order){
            var isSamePickup = newOrders.some(function(oldOrder){
              var _isSame = oldOrder.status === order.status && moment(new Date(oldOrder.pickupInfo.pickupFromTime).toISOString()).isSame(moment(new Date(order.pickupInfo.pickupFromTime).toISOString()), 'minute') && moment(new Date(oldOrder.pickupInfo.pickupTillTime).toISOString()).isSame(moment(new Date(order.pickupInfo.pickupTillTime).toISOString()), "minute") && oldOrder.customerName === order.customerName && oldOrder.customerPhone === order.customerPhone && oldOrder.pickupInfo.method === order.pickupInfo.method && ((oldOrder.pickupInfo.method === "delivery" && oldOrder.contactInfo.address === order.contactInfo.address) || (oldOrder.pickupInfo.method === "pickup" && oldOrder.pickupInfo.location === order.pickupInfo.location));
              if(_isSame){
                Object.keys(order.orders).forEach(function(dishId){
                  if(oldOrder.orders.hasOwnProperty(dishId)){
                    oldOrder.orders[dishId].number += order.orders[dishId].number;
                    if(oldOrder.orders[dishId].preference && Array.isArray(oldOrder.orders[dishId].preference)){
                      oldOrder.orders[dishId].preference.concat(order.orders[dishId].preference);
                    }
                  }else{
                    oldOrder.orders[dishId] = order.orders[dishId];
                  }
                });
                oldOrder.id += "+" + order.id;
                oldOrder.subtotal = parseFloat(oldOrder.subtotal) + parseFloat(order.subtotal);
                oldOrder.tip = parseFloat(oldOrder.tip) + parseFloat(order.tip);
                oldOrder.pickupInfo.comment += order.pickupInfo.comment;
                oldOrder.dishes = oldOrder.dishes.concat(order.dishes);
                oldOrder.dishes = oldOrder.dishes.filter(function(item, pos){
                  return oldOrder.dishes.indexOf(item) === pos;
                });
                oldOrder.discount += order.discount;
                if(oldOrder.paymentMethod === "cash" && oldOrder.charges && order.charges){
                  oldOrder.charges['cash'] += order.charges['cash'];
                }
              }
              return _isSame;
            })
            if(!isSamePickup){
              newOrders.push(order);
            }
          });
          newOrders.forEach(function(order){
            dishIds = dishIds.concat(Object.keys(order.orders));
            dishIds = dishIds.filter(function(item, pos){
              return dishIds.indexOf(item) === pos;
            });
          })
          found.orders = newOrders;
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
                sails.log.error(err);
              }
            });
            found.locale = req.getLocale();
            found.save(function(err, result){
              if(err){
                return res.badRequest(err);
              }
              if(req.wantsJSON && process.env.NODE_ENV === "development"){
                return res.ok(found);
              }
              return res.view('user',{user: found});
            })
          });
        })
      }
    });
  },

  myorder : function(req, res){
    var userId = req.session.user.id;
    User.findOne(userId).populate("host").populate("orders",{ sort: 'createdAt DESC' }).populate('auth').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      found.featureDishes = [];
      if(found.orders.length === 0) {
        found.locale = req.getLocale();
        found.save(function(err, result){
          if(err){
            return res.badRequest(err);
          }
          Notification.destroy({user : userId}).exec(function(err){
            if(err){
              console.log(err);
            }
            if(req.wantsJSON && process.env.NODE_ENV === "development"){
              return res.ok(found);
            }
            return res.view('myorder', {user: found});
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
              if(order.status === "review"){
                Object.keys(order.orders).forEach(function(dishId){
                  if(order.orders[dishId]>0){
                    order.dishes.forEach(function(dish){
                      if(dish.id === dishId){
                        if(dish.isFeature()){
                          dish.meal = order.meal;
                          if(found.featureDishes.indexOf(dishId) === -1){
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
        }, function(err) {
          if (err) {
            return res.badRequest(err);
          }
          var newOrders = [], dishIds = [];
          found.orders.forEach(function(order){
            var isSamePickup = newOrders.some(function(oldOrder){
              var _isSame = oldOrder.status === order.status && moment(oldOrder.pickupInfo.pickupFromTime).isSame(moment(order.pickupInfo.pickupFromTime), 'minute') && moment(oldOrder.pickupInfo.pickupTillTime).isSame(moment(order.pickupInfo.pickupTillTime), "minute") && oldOrder.customerName === order.customerName && oldOrder.customerPhone === order.customerPhone && oldOrder.pickupInfo.method === order.pickupInfo.method && ((oldOrder.pickupInfo.method === "delivery" && oldOrder.contactInfo.address === order.contactInfo.address) || (oldOrder.pickupInfo.method === "pickup" && oldOrder.pickupInfo.location === order.pickupInfo.location));
              if(_isSame){
                Object.keys(order.orders).forEach(function(dishId){
                  oldOrder.orders[dishId] = order.orders[dishId];
                })
                oldOrder.id += "+" + order.id;
                oldOrder.subtotal = parseFloat(oldOrder.subtotal) + parseFloat(order.subtotal);
                oldOrder.tip = parseFloat(oldOrder.tip) + parseFloat(order.tip);
                oldOrder.pickupInfo.comment += order.pickupInfo.comment;
                oldOrder.dishes = oldOrder.dishes.concat(order.dishes);
                if(oldOrder.paymentMethod === "cash" && oldOrder.charges && order.charges){
                  oldOrder.charges['cash'] += order.charges['cash'];
                }
              }
              return _isSame;
            })
            if(!isSamePickup){
              newOrders.push(order);
            }
          });
          newOrders.forEach(function(order){
            dishIds = dishIds.concat(Object.keys(order.orders));
            dishIds = dishIds.filter(function(item, pos){
              return dishIds.indexOf(item) === pos;
            });
          })
          found.orders = newOrders;
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
            if(req.wantsJSON && process.env.NODE_ENV === "development"){
              return res.ok(found);
            }
            return res.view('myorder',{user: found});
          })
        });
      }
    });
  },

  emailVerificationView : function(req, res){
    res.view('emailVerification', { layout : 'popup', user : req.session.user});
  },

  sendEmailVerification : function(req, res){
    var userId = req.params.id;
    var email = req.body.email;
    if(!email){
      return res.badRequest({ code : -5, responseText : req.__('user-lack-of-email')});
    }
    var verifyToken = notification.generateToken();
    User.update(userId, { verifyToken : verifyToken, email : email }).exec(function(err, users){
      if(err){
        return res.badRequest(err);
      }
      var user = users[0];
      var host = process.env.NODE_ENV === 'production' ? process.env.BASE_URL : 'localhost:1337';23
      User.findOne(userId).populate('auth').exec(function(err, u){
        if(err){
          return res.badRequest(err);
        }
        if(u.emailVerified){
          return res.ok(u);
        }
        u.verificationUrl = host + "/user/verify/" + verifyToken.token;
        notification.sendEmail("User","verification",u,req);
        res.ok(u);
      })
    })
  },

  verify : function(req, res){
    var token = req.params.token;
    User.findOne({ "verifyToken.token" : token}).exec(function(err, user){
      if(err){
        return res.forbidden(err);
      }
      if(!user){
        return res.forbidden({ code : -2, responseText : req.__('email-token-invalid')});
      }
      var expire = new Date(user.verifyToken.expires);
      if(expire.getTime() < new Date().getTime()){
        return res.forbidden({ code : -3, responseText : req.__('email-verification-link-expire')});
      }
      user.emailVerified = true;
      if(req.session.authenticated){
        req.session.user.emailVerified = true;
      }
      user.save(function(err,u){
        if(err){
          return res.forbidden(err);
        }
        var birthdayDate = new Date(user.birthday);
        var birthday = birthdayDate.getMonth()+1+"/"+birthdayDate.getDate();
        mailChimp.addMemberToList({ email : user.email, firstname : user.firstname, lastname: user.lastname, language : req.getLocale()}, "subscriber");
        res.redirect("/meal?from=emailverification");
      });
    });
  },

  verifyEmail : function(req, res){
    var userId = req.params.id;
    User.update(userId, { emailVerified : true}).exec(function (err, user) {
      if(err){
        return res.badRequest(err);
      }
      res.ok(user);
    })
  },

  unverifyEmail : function(req, res){
    var userId = req.params.id;
    User.update(userId, { emailVerified : false}).exec(function (err, user) {
      if(err){
        return res.badRequest(err);
      }
      res.ok(user);
    })
  },

  redeemReward : function(req, res){
    var isLogin = req.session.authenticated;
    if(!isLogin){
      return res.badRequest({ code : -7, responseText: req.__('user-not-authenticated') });
    }
    var userId = req.params.id;
    if(userId !== req.session.user.id){
      return res.badRequest({ code : -7, responseText: req.__('user-not-authenticated') })
    }
    User.findOne(userId).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      var emailVerified = user.emailVerified;
      if(!emailVerified){
        return res.badRequest({ code : -8, responseText: req.__('email-unverified') });
      }
      var newUserRewardIsRedeemed = user.newUserRewardIsRedeemed;
      if(newUserRewardIsRedeemed){
        return res.badRequest({ code : -9, responseText: req.__('user-reward-redeemed') });
      }
      user.points = 100;
      user.newUserRewardIsRedeemed = true;
      req.session.user = user;
      user.save(function(err, u){
        if(err){
          return res.badRequest(err);
        }
        res.ok(u);
      })
    })
  },

  reward : function(req, res){
    var type = req.params.type;
    if(!req.session.authenticated){
      return res.view("newUserReward", { layout : 'popup', user : null});
    }
    User.findOne(req.session.user.id).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      if(type === "newUser"){
        return res.view("newUserReward", { layout : 'popup', user : user});
      }else{
        return res.ok();
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

  join : function(req, res){
    var code = req.query.code;
    var baseUrl = process.env.NODE_ENV === "development" ? process.env.LOCAL_HOST : process.env.BASE_URL;
    if(req.session.authenticated){
      var userId = req.session.user.id;
      User.findOne(userId).exec(function(err, user){
        if(err){
          return res.forbidden(err);
        }
        if(!code){
          return res.redirect('/join?code=' + encodeURIComponent(user.referralCode));
        }
        User.find({ referrerCode : user.referralCode}).exec(function (err, referrals) {
          if(err){
            return res.badRequest(err);
          }
          if(req.wantsJSON && process.env.NODE_ENV === "development"){
            return res.ok({ user : user, baseUrl : baseUrl, referrals : referrals });
          }
          return res.view('join', { user : user, baseUrl : baseUrl, referrals : referrals });
        })
      })
    }else{
      User.find({ referralCode : code }).exec(function(err, users){
        if(err){
          return res.notFound(err);
        }
        if(!users || !users.length){
          return res.notFound({ responseText: req.__('referralCode-not-found')});
        }
        req.session.referralCode = code;
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok({ referrer : users[0], user : null});
        }
        res.view('join', { referrer : users[0], user : null});
      });
    }
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
    var date = new Date();
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
    var hmac = crypto.createHmac("sha1", s3.key);
    var hash2 = hmac.update(policy);
    var signature = hmac.digest("base64");
    res.ok({url : encodeURI(url), policy : policy, signature : signature, key : encodeURI(filename), credential : encodeURI(credential), date : date, AWSAccessKeyId : s3.id});
  },

  deleteUserFile : function(req,res) {
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

  deleteUser : function(req, res){
    var s3 = new AWS.S3({ Bucket : sails.config.aws.bucket});
    var bucket = sails.config.aws.bucket;
    var userId = req.params.id;
    async.auto({
      deleteUserResource : function(next){
        s3.headObject({
          Key : "users/" + userId,
          Bucket : bucket
        }, function(err, metadata){
          if(err && err.code === "NotFound"){
            return next();
          }
          s3.deleteObject({
            Key : "users/" + userId,
            Bucket : bucket
          }, function(err, data){
            if(err){
              sails.log.error(err);
              return next(err);
            }
            next();
          })
        });
      },
      deleteUserDB : function(next){
        User.destroy(userId).exec(function(err, users){
          if(err){
            return next(err);
          }
          if(!users || users.length === 0){
            return next({ code : -2, responseText : "can not find user"});
          }
          var auth = users[0].auth;
          Auth.destroy(auth).exec(next);
        });
      }
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      res.ok();
    });
  },

  clean : function(req, res){
    var s3 = new AWS.S3({ Bucket : sails.config.aws.bucket });
    var bucket = sails.config.aws.bucket;
    s3.listObjects({
      Prefix : "users/",
      Delimiter : '/',
      Bucket : bucket
    }, function(err, objects){
      if(err){
        return res.badRequest(err);
      }
      var deleteObjects = [];
      async.each(objects.CommonPrefixes, function(object, next){
        if(!object || !object.Prefix){
          return next();
        }
        var userId = object.Prefix.match(/\w{24}/)[0];
        User.count(userId).exec(function(err, number){
          if(err){
            sails.log.error(err);
            return next();
          }
          if(number === 0){
            deleteObjects.push({ Key : object.Prefix });
            s3.listObjects({
              Prefix : object.Prefix,
              Delimiter : '/',
              Bucket : bucket
            }, function(err, userObjects){
              if(err){
                return next(err);
              }
              async.each(userObjects.Contents, function(userObj, next2){
                if(!userObj){
                  return next2();
                }
                deleteObjects.push({ Key : userObj.Key});
                next2();
              }, function(err){
                if(err){
                  return next(err)
                }
                next();
              })
            });
          }else{
            next();
          }
        })
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        s3.deleteObjects({
          Delete : { Objects : deleteObjects },
          Bucket : bucket
        }, function(err, data){
          if(err){
            sails.log.error(err);
            return res.badRequest(err);
          }
          res.ok({});
        })
      })
    })
  },

  composeCharge : function(charge, order, host){
    var chargeId = charge.id;
    if(chargeId === "cash"){
      charge.amount = order.charges[chargeId];
      charge.amount_refunded = 0;
      charge.paymentMethod = "cash";
      charge.status = "cash";
      charge.metadata = {
        orderId : order.id,
        deliveryFee : order.delivery_fee,
        tax : order.tax
      }
    }else{
      charge.paymentMethod = "online";
    }
    charge.tip = order.tip;
    charge.deliveryFee = order.delivery_fee;
    charge.orderStatus = order.status;
    charge.host = {
      id : host.id,
      shopName : host.shopName,
      picture : host.picture
    };
    var date = moment(order.createdAt);
    charge.month = moment.months()[date.month()];
    charge.day = date.date();
    charge.created = parseInt(new Date(order.createdAt).getTime()/1000);
    return charge;
  }
});
