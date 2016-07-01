/**
 * ReviewController
 *
 * @description :: Server-side logic for managing Reviews
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Notification = require("../services/notification.js");

module.exports = {
  create : function(req, res){
    var async = require('async');
    var userId = req.session.user.id;
    var hostId = req.body.host;
    var mealId = req.body.meal;
    var dishId = req.body.dish;
    var reviews = req.body.reviews;
    var $this = this;
    //check if the dish need to be reviewed
    User.findOne(userId).populate("orders").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      var orders = user.orders.filter(function(order){
        return order.status == "review" && order.customer == userId;
      });
      if(orders.length == 0){
        console.log("no available orders for review");
        return res.forbidden(req.__('review-no-available'));
      }
      if(reviews && reviews.length > 0){
        async.each(reviews, function(review, next){
          var dishId = review.dish;
          var score = review.score;
          var review = review.content;
          var reviewModel;
          $this.reviewForDish(dishId, mealId, user, hostId, orders, score, review, function(err, result){
            if(err){
              return next(err);
            }
            reviewModel = result;
            next();
          });
        },function(err){
          if(err){
            return res.badRequest(err);
          }
          async.each(orders, function(order,next){
            order.save(function(err,o){
              if(err){
                return next(err);
              }
              next();
            });
          },function(err){
            if(err){
              return res.badRequest(err);
            }
            console.log(reviewModel);
            return res.ok(reviewModel);
          });
        });
      }else{
        var score = req.body.score;
        var review = req.body.review;
        var reviewModel;
        $this.reviewForDish(dishId, mealId, user, hostId, orders, score, review, function(err, review){
          async.each(orders, function(order,next){
            order.save(function(err,o){
              if(err){
                return next(err);
              }
              reviewModel = review;
              next();
            });
          },function(err){
            if(err){
              return res.badRequest(err);
            }
            console.log(reviewModel);
            return res.ok(reviewModel);
          });
        });
      }
    });
  },

  reviewForDish : function(dishId, mealId, user, hostId, orders, score, content, cb){
    var isValidReview = false;
    if(mealId){
      //it's an review for a meal
      isValidReview = orders.some(function(order){
        if(order.meal == mealId && order.reviewing_orders.indexOf(dishId) != -1){
          order.reviewing_orders.splice(order.reviewing_orders.indexOf(dishId),1);
          if(order.reviewing_orders.length == 0){
            order.status = "complete";
            var tempOrder = Object.assign({}, order);
            tempOrder.host = { id : hostId};
            Notification.notificationCenter("Order", "review", tempOrder, true);
          }
          return true;
        }
        return false;
      });
    }else{
      orders.forEach(function(order){
        if(order.reviewing_orders.indexOf(dishId) != -1){
          order.reviewing_orders.splice(order.reviewing_orders.indexOf(dishId),1);
          if(order.reviewing_orders.length == 0){
            order.status = "complete";
            var tempOrder = Object.assign({}, order);
            tempOrder.host = { id : hostId};
            Notification.notificationCenter("Order", "review", tempOrder, true);
          }
          isValidReview = true;
        }
      });
    }
    if(!isValidReview){
      console.log("Review for the meal/dish is not valid");
      return cb(Error("Review for the meal/dish is not valid"));
    }
    Dish.findOne(dishId).exec(function(err, dish){
      if(err){
        return cb(err);
      }
      Review.create({dish : dishId, title : dish.title, price : dish.price, meal : mealId, score : score, review : content, user : user.id, host : hostId, username : user.firstname}).exec(function(err, review){
        console.log(err);
        if(err){
          return cb(err);
        }
        cb(null,review);
      });
    })
  }
};


