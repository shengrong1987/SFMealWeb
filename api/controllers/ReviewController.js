/**
 * ReviewController
 *
 * @description :: Server-side logic for managing Reviews
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Notification = require("../services/notification.js");
var async = require('async');
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
          $this.reviewForDish(dishId, mealId, user, hostId, orders, score, review, function(err, results){
            if(err){
              return next(err);
            }
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
            return res.ok({});
          });
        }, req);
      }else{
        var score = req.body.score;
        var review = req.body.review;
        $this.reviewForDish(dishId, mealId, user, hostId, orders, score, review, function(err, results){
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
            return res.ok(results);
          });
        }, req);
      }
    });
  },

  reviewForDish : function(dishId, mealId, user, hostId, orders, score, content, cb, req){
    var isValidReview = false;
    async.auto({
      checkReviewForMeal : function(cb){
        if(!mealId) {
          return cb(Error(req.__('review-invalid')));
        }
        if(dishId){
          return cb();
        }
        isValidReview = orders.some(function(order){
          if(order.meal == mealId && order.reviewing_orders.indexOf(dishId) != -1){
            order.reviewing_orders.splice(order.reviewing_orders.indexOf(dishId),1);
            if(order.reviewing_orders.length == 0){
              order.status = "complete";
            }
            return true;
          }
          return false;
        });
        if(!isValidReview){
          cb(Error(req.__('review-invalid')))
        }else{
          cb();
        }
      },
      checkReviewForDish : function(cb){
        if(!dishId){
          return cb();
        }
        orders.forEach(function(order){
          if(order.reviewing_orders.indexOf(dishId) != -1){
            order.reviewing_orders.splice(order.reviewing_orders.indexOf(dishId),1);
            if(order.reviewing_orders.length == 0){
              order.status = "complete";
            }
            isValidReview = true;
            return cb();
          }
        });
        if(!isValidReview){
          cb(Error(req.__('review-invalid')))
        }
      },
      getDish : function(cb){
        if(!dishId){
          return cb();
        }
        Dish.findOne(dishId).exec(function(err, dish) {
          if(err) {
            return cb(err);
          }
          cb(null, dish);
        });
      },
      getMeal : function(cb){
        Meal.findOne(mealId).exec(function(err, meal){
          if(err){
            return cb(err);
          }
          cb(null, meal);
        })
      },
      createReview : ['getDish','getMeal', function(cb, results){
        var dish = results.getDish;
        var meal = results.getMeal;
        Review.create({
          dish : dish ? dish.id : null,
          title : dish ? dish.title : meal.title,
          price : dish ? dish.price : 'N/A',
          meal : mealId,
          score : score,
          review : content,
          user : user.id,
          host : hostId,
          username : user.firstname
        }).exec(function(err, review){
          if(err){
            return cb(err);
          }
          Host.findOne(hostId).exec(function(err, host){
            if(err){
              return false;
            }
            review.host = host;
            if(mealId){
              Meal.findOne(mealId).exec(function(err, meal){
                if(err){
                  return false;
                }
                review.meal = meal;
                review.hostEmail = host.email;
                Notification.notificationCenter("Order", "review", review, true, false, req);
                cb(null,review);
              })
            }
          })
        });
      }]
    },function(err, results){
      if(err){
        return cb(err);
      }
      cb(null, results);
    });
  }
};


