/**
 * EmailController
 *
 * @description :: Server-side logic for managing emails
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var notification = require('../services/notification');

module.exports = {
  create : function(req, res){
    var $this = this;
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
        params.isSendToHost = true;
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
        var mealId = metaData.mealId;
        if(!mealId){
          return cb({ code : -1, responseText : "Can not find 'mealId'"});
        }
        switch(action){
          case "mealScheduleEnd":
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
              Order.find({ meal : mealId, status : status}).exec(function(err, orders){
                if(err){
                  return cb(err);
                }
                async.each(orders, function(order, next){
                  Order.findOne(order.id).populate("customer").exec(function(err, o){
                    if(err){
                      return next(err);
                    }
                    order.customer = o.customer;
                    next();
                  });
                },function(err){
                  if(err){
                    return cb(err);
                  }
                  meal.orders = orders;
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
