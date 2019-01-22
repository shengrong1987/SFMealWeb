/**
 * EmailController
 *
 * @description :: Server-side logic for managing emails
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var notification = require('../services/notification');
var moment = require('moment');

module.exports = {
  create : function(req, res){
    var $this = this;
    var metaData = req.body.metadata;
    if(metaData){
      metaData = JSON.parse(metaData);
      req.body.metaData = metaData;
    }
    Email.create(req.body).exec(function(err, email){
      if(err){
        return res.badRequest(err);
      }
      $this.fetchData(email.model, email.action, email.metaData, function(err, params){
        if(err){
          return res.badRequest(err);
        }
        if(email.metaData){
          Object.keys(email.metaData).forEach(function(key){
            params[key] = email.metaData[key];
          });
        }
        params.isSendToAdmin = true;
        notification.transitLocaleTimeZone(params);
        notification.sendEmail(email.model, email.action, params, req);
        res.ok(params);
      })
    })
  },

  fetchData : function(model, action, metaData, cb){
    switch (model){
      case "Order":
        var orderId = metaData.orderId;
        if(orderId){
          Order.findOne(orderId).populate("meal").populate("dishes").populate("host").populate("customer").populate('coupon').exec(function(err, order){
            if(err){
              return cb(err);
            }
            cb(null, order);
          });
        }else{
          return cb({ code : -1, responseText : "Can not find 'orderId'"});
        }
          break;
      case "Meal":
        switch(action){
          case "chefSelect":
            var hostId = metaData.hostId;
            if(hostId){
              var now = new Date();
              var nextMon = moment().day(7)._d;
              Meal.find({ chef : hostId, status : 'on', provideFromTime : { '<=' : now}, provideTillTime : { '<' : nextMon }}).populate("dishes").exec(function(err, meals){
                if(err){
                  return cb(err);
                }
                if(!meals.length){
                  return cb({ code : -4, responseText : "no results"});
                }
                Host.findOne(hostId).exec(function(err, host){
                  if(err){
                    return cb(err);
                  }
                  var params = {
                    meals : meals,
                    host : host
                  }
                  cb(null, params);
                })
              })
            }else{
              return cb({ code : -1, responseText : "Can not find 'hostId'"});
            }
            break;
          case "mealScheduleEnd":
            var mealId = metaData.mealId;
            if(!mealId){
              return cb({ code : -1, responseText : "Can not find 'mealId'"});
            }
            var status = metaData.status;
            if(!status){
              return cb({ code : -1, responseText : "Can not find 'status'"});
            }
            Meal.findOne(mealId).populate("chef").populate("dishes").exec(function(err, meal){
              if(err){
                return cb(err);
              }
              if(!meal){
                return cb({ code : -4, responseText : "no results"});
              }
              Order.find({ meal : mealId, status : status }).exec(function(err, orders){
                if(err){
                  return cb(err);
                }
                async.each(orders, function(order, next){
                  Order.findOne(order.id).populate("dishes").populate("customer").exec(function(err, o){
                    if(err){
                      return next(err);
                    }
                    order.customer = o.customer;
                    order.dishes = o.dishes;
                    next();
                  });
                },function(err){
                  if(err){
                    return cb(err);
                  }
                  var orderSummary = {};
                  orders.forEach(function(order){
                    Object.keys(order.orders).forEach(function(dishId){
                      var dish = order.dishes.filter(function(d){
                        return d.id === dishId;
                      })[0];
                      if(!dish){
                        return;
                      }
                      var orderDetail = order.orders[dishId];
                      if(orderSummary.hasOwnProperty(dishId)){
                        if(order.orders[dishId].number){
                          orderSummary[dishId].amount = parseInt(orderDetail.number) + parseInt(orderSummary[dishId].amount);
                          if(orderDetail.preference && Array.isArray(orderDetail.preference)){
                            orderDetail.preference.forEach(function(prefs){
                              if(prefs.property && Array.isArray(prefs.property)){
                                prefs.property.forEach(function(prop){
                                  if(orderSummary[dishId].preference){
                                    orderSummary[dishId].preference += ",";
                                  }
                                  if(prop.property && prop.property !== "undefined"){
                                    orderSummary[dishId].preference += prop.property;
                                  }
                                })
                              }
                            })
                          }
                        }
                      }else if(order.orders[dishId].number){
                        var dishObj = {};
                        dishObj.title = dish.title;
                        dishObj.amount = orderDetail.number;
                        dishObj.price = orderDetail.price;
                        dishObj.preference = "";
                        if(orderDetail.preference && Array.isArray(orderDetail.preference)){
                          orderDetail.preference.forEach(function(prefs){
                            if(prefs.property && Array.isArray(prefs.property)){
                              prefs.property.forEach(function(prop){
                                if(dishObj.preference){
                                  dishObj.preference += ",";
                                }
                                if(prop.property && prop.property !== "undefined"){
                                  dishObj.preference += prop.property;
                                }
                              })
                            }
                          })
                        }
                        orderSummary[dishId] = dishObj;
                      }
                    })
                  })
                  meal.orders = orders;
                  meal.orderSummary = orderSummary;
                  meal.hostEmail = meal.chef.email;
                  cb(null, meal);
                })
              })
            });
            break;
          default:
            return cb({ code : -2, responseText : "action: " + action + " not supported"});
            break;
        }
        break;
      default:
        return cb({ code : -3, responseText : "model: " + model + " not supported"});
        break;
    }
  }
};
