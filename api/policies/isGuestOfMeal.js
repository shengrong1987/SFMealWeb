/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
var async = require('async');
module.exports = function(req, res, next) {
  // User is allowed, proceed to the next policy,
  // or if this is the lagrunt st policy, the controller
  var userId = req.session.user.id;
  var meal = req.param('id') || req.body.meal;
  User.findOne(userId).populate("orders").exec(function(err,user){
    if(err){
      return res.badRequest(err);
    }
    var guestOfMeal = false;
    async.each(user.orders, function(o, loopNext){
      Order.findOne(o.id).exec(function(err, order){
        if(err){
          return loopNext(err);
        }
        if(order.meal == meal){
          guestOfMeal = true;
          loopNext();
        }else{
          return loopNext();
        }
      })
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      if(guestOfMeal){
        next();
      }else{
        res.forbidden("You are not permitted to perform this action.");
      }
    });
  });
};
