/**
 * ReviewController
 *
 * @description :: Server-side logic for managing Reviews
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * @error       :: -1 no order is available for review
 *              :: -2 invalid review
 *              :: -3 no such dish available for review
 */

var Notification = require("../services/notification.js");
var async = require('async');
module.exports = {

  orderReview : function(req, res){
    var isLogin = req.session.authenticated;
    var orderId = req.params.id;
    var reviews = req.body.reviews;
    var _this = this;
    //check order dish belongs to this order
    if(!reviews || !reviews.length || !orderId){
      return res.badRequest({ code : -1, responseText : req.__('review-no-available')});
    }
    Order.findOne(orderId).populate('customer').exec(function(err, order){
      if(err){
        return res.badRequest(err);
      }
      if(order.status !== "review"){
        return res.badRequest({ code : -2, responseText : req.__('review-invalid')});
      }
      async.each(reviews, function(review, next){
        var dishId = review.dish;
        var score = review.score;
        var content = review.content;
        var hasDish = order.orders.hasOwnProperty(dishId);
        if(hasDish){
          var amount = order.orders[dishId].number;
        }
        if(!hasDish || !amount){
          return next({ code : -3, responseText : req.__('review-dish-unavailable')});
        }
        _this.reviewForOrder(dishId, order.meal, order, order.customer, score, content, req, function(err, results){
          if(err){
            return next(err);
          }
          next();
        });
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        order.status = "complete";
        order.reviewing_orders = [];
        order.save(function(err, o){
          if(err){
            return res.badRequest(err);
          }
          return res.ok(order);
        })
      })
    });
  },

  create : function(req, res){
    var userId = req.session.user.id;
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
        return order.status === "review" && order.customer === userId;
      });
      if(orders.length === 0){
        return res.badRequest({ code : -1, responseText : req.__('review-no-available')});
      }
      if(reviews && reviews.length > 0){
        var hostId;
        async.each(reviews, function(r, next){
          var dishId = r.dish;
          var score = r.score;
          var review = r.content;
          $this.reviewForDish(dishId, mealId, user, orders, score, review, function(err, results){
            if(err){
              return next(err);
            }
            hostId = results.host.id;
            next();
          }, req);
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
            return res.ok({ host : hostId });
          });
        }, req);
      }else{
        var score = req.body.score;
        var review = req.body.review;
        $this.reviewForDish(dishId, mealId, user, orders, score, review, function(err, results){
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
            return res.ok(results);
          });
        }, req);
      }
    });
  },

  reviewForOrder : function(dishId, mealId, order, user, score, content, req, cb){
    async.auto({
      getDish : function(cb){
        if(!dishId){
          return cb();
        }
        Dish.findOne(dishId).populate('chef').exec(function(err, dish) {
          if(err) {
            return cb(err);
          }
          cb(null, dish);
        });
      },
      getMeal : function(cb){
        Meal.findOne(mealId).populate('chef').exec(function(err, meal){
          if(err){
            return cb(err);
          }
          cb(null, meal);
        })
      },
      createReview : ['getDish','getMeal', function(cb, results){
        var dish = results.getDish;
        var meal = results.getMeal;
        if(score <= 1){
          var isPublic = false;
        }else{
          isPublic = true;
        }
        Review.create({
          dish : dish ? dish.id : null,
          title : dish ? dish.title : meal.title,
          price : dish ? dish.price.toString() : '',
          meal : mealId,
          score : score,
          review : content,
          user : user ? user.id : '',
          host : dish ? dish.chef.id : meal.chef.id,
          username : user ? user.firstname : order.customerName,
          isPublic : isPublic
        }).exec(function(err, review){
          if(err){
            return cb(err);
          }
          var host = dish?dish.chef:meal.chef;
          review.host = host;
          if(meal){
            review.meal = meal;
            review.hostEmail = host.email;
          }
          if(dish){
            review.dish = dish;
            review.hostEmail = host.email;
          }
          if(!meal && !dish){
            return cb({code : -2, responseText : req.__('review-invalid')})
          }
          sails.log.debug("Review Created! Score: " + score + " Content: " + content + " For: " + review.title);
          sails.log.debug("NOTIFICATION - Model: Order, Action: [Review] To: Host: " + review.hostEmail);
          Notification.notificationCenter("Order", "review", review, true, false, req);
          cb(null,review);
        });
      }]
    },function(err, results){
      if(err){
        return cb(err);
      }
      cb(null, results.createReview);
    });
  },

  reviewForDish : function(dishId, mealId, user, orders, score, content, cb, req){
    var isValidReview = false;
    async.auto({
      checkReviewForMeal : function(cb){
        if(!mealId) {
          return cb({code : -2, responseText : req.__('review-invalid')});
        }
        if(dishId){
          return cb();
        }
        isValidReview = orders.some(function(order){
          if(order.meal === mealId){
            order.reviewing_orders = [];
            order.status = "complete";
            return true;
          }
          return false;
        });
        if(!isValidReview){
          cb({code : -2, responseText : req.__('review-invalid')})
        }else{
          cb();
        }
      },
      checkReviewForDish : function(cb){
        if(!dishId){
          return cb();
        }
        isValidReview = orders.some(function(order){
          if(order.reviewing_orders.indexOf(dishId) !== -1){
            order.reviewing_orders.splice(order.reviewing_orders.indexOf(dishId),1);
            if(order.reviewing_orders.length === 0){
              order.status = "complete";
            }
            return true;
          }
          return false;
        })
        if(!isValidReview){
          return cb({code : -2, responseText : req.__('review-invalid')})
        }
        cb();
      },
      getDish : function(cb){
        if(!dishId){
          return cb();
        }
        Dish.findOne(dishId).populate('chef').exec(function(err, dish) {
          if(err) {
            return cb(err);
          }
          cb(null, dish);
        });
      },
      getMeal : function(cb){
        Meal.findOne(mealId).populate('chef').exec(function(err, meal){
          if(err){
            return cb(err);
          }
          cb(null, meal);
        })
      },
      createReview : ['getDish','getMeal', function(cb, results){
        var dish = results.getDish;
        var meal = results.getMeal;
        if(score <= 1){
          var isPublic = false;
        }else{
          isPublic = true;
        }
        Review.create({
          dish : dish ? dish.id : null,
          title : dish ? dish.title : meal.title,
          price : dish ? dish.price.toString() : '',
          meal : mealId,
          score : score,
          review : content,
          user : user.id,
          host : dish ? dish.chef.id : meal.chef.id,
          username : user.firstname,
          isPublic : isPublic
        }).exec(function(err, review){
          if(err){
            return cb(err);
          }
          var host = dish?dish.chef:meal.chef;
          review.host = host;
          if(meal){
            review.meal = meal;
            review.hostEmail = host.email;
          }
          if(dish){
            review.dish = dish;
            review.hostEmail = host.email;
          }
          if(!meal && !dish){
            return cb({code : -2, responseText : req.__('review-invalid')})
          }
          sails.log.debug("Review Created! Score: " + score + " Content: " + content + " For: " + review.title);
          sails.log.debug("NOTIFICATION - Model: Order, Action: [Review] To: Host: " + review.hostEmail);
          Notification.notificationCenter("Order", "review", review, true, false, req);
          cb(null,review);
        });
      }]
    },function(err, results){
      if(err){
        return cb(err);
      }
      cb(null, results.createReview);
    });
  },

  private : function(req, res){
    var reviewId = req.params.id;
    Review.update(reviewId, { isPublic : false}).exec(function(err, review){
      if(err){
        return res.badRequest(err);
      }
      res.ok(review[0]);
    })
  },

  reviewPopup : function(req, res){
    var orderIds = req.params.id.split("+");
    var _orders = [];
    async.eachSeries(orderIds, function(orderId, next){
      Order.findOne(orderId).populate('dishes').exec(function(err, order){
        if(err){
          return next(err);
        }
        _orders.push(order);
        next();
      })
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      res.view('review',{ orders : _orders, layout : 'popup' });
    })
  }
};


