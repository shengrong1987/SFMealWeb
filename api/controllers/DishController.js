/**
 * DishController
 *
 * @description :: Server-side logic for managing Dishes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * @error       :: -1 dish can not be deleted on active meal
 *                 -2 dish can not be updated on active meal
 *                 -3 insufficient info for dynamic dish
 */

var notification = require("../services/notification");
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil.js');
var moment = require("moment");

module.exports = {
	new_form : function(req, res){
    var user = req.session.user;
    return res.view("dish_new",{user : user});
  },

  preference : function(req, res){
	  var dishId = req.params.id;
	  Dish.findOne(dishId).exec(function(err, dish){
	    if(err){
	      return res.badRequest(err);
      }
      res.view('preference', { layout : "popup", dish : dish });
    })
  },

  verify : function(req, res){
    var dishId = req.params.id;
    Dish.findOne(dishId).populate("chef").exec(function(err, dish){
      if(err){
        return res.badRequest(err);
      }
      if(!dish.chef.dishVerifying){
        notification.sendEmail("Host","congrat",{ host : dish.chef, hostEmail : dish.chef.email, isSendToHost : true});
      }
      dish.isVerified = true;
      dish.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        res.ok(result);
      });
    })
  },

  fail : function(req, res){
    var dishId = req.params.id;
    Dish.update(dishId, { isVerified : false}).exec(function(err, dish){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(dish[0]);
    });
  },

  update : function(req, res){
    var dishId = req.params.id;
    var hostId;
    var isAdmin = req.session.user.auth.email === "admin@sfmeal.com" && (req.session.user.emailVerified || process.env.NODE_ENV === "development");
    async.auto({
      findChef : function(next){
        if(!isAdmin){
          return next();
        }
        Dish.findOne(dishId).populate("chef").exec(function(err, dish){
          if(err){
            return next(err);
          }
          hostId = dish.chef.id;
          next();
        })
      },
      getChef : function(next){
        if(isAdmin){
          return next();
        }
        hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
        next();
      }
    }, function(err){
      if(err){
        return res.badRequest(err);
      }
      Meal.find({chef : hostId}).populate("dishes").exec(function(err, meals){
        if(err){
          return res.badRequest(err);
        }
        var dishIsNotActive = meals.every(function(meal){
          if(meal.status === "off" || !req.body.price){
            return true;
          }
          return meal.dishes.every(function(dish){
            return dish.id !== dishId;
          });
        });
        Dish.findOne(dishId).exec(function(err, d){
          if(err) {
            return res.badRequest(err);
          }
          if(req.body.canPintuan && !req.body.minimalOrder){
            return res.badRequest({ code : -3, responseText : req.__("dish-update-dynamic-insufficient-info")});
          }
          if(req.body.tags){
            req.body.tags = req.body.tags.split(",");
          }
          Dish.update(dishId, req.body).exec(function(err, dish){
            if(err){
              return res.badRequest(err);
            }
            if(req.wantsJSON && process.env.NODE_ENV === "development"){
              return res.ok(dish[0]);
            }
            return res.ok({ dishId : dish[0].id });
          })
        })
      });
    })
  },

  search : function(req, res){
    var keyword = req.query.keyword;
    delete req.query.keyword;
    Dish.find(req.query).exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }

      if(keyword) {
        found = found.filter(function(dish){
          if(dish.title.indexOf(keyword) !== -1 || dish.description.indexOf(keyword) !== -1 || dish.type.indexOf(keyword) !== -1){
            return true;
          }
          return false;
        });
      }
      return res.ok(found);
    });
  },

  create : function(req, res){
    var hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    var params = req.body;
    params.chef = hostId;
    if(params.tags){
      params.tags = params.tags.split(",");
    }
    Dish.create(params).exec(function(err, dish){
      if(err){
        return res.badRequest(err);
      }
      Host.findOne(hostId).exec(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        dish.host = result;
        return res.ok(dish);
      });
    })
  },

  destroy : function(req, res){
    var dishId = req.params.id;
    var hostId = req.session.user.host.id ? req.session.user.host.id : req.session.user.host;
    Meal.find({chef : hostId}).populate("dishes").exec(function(err, meals){
      if(err){
        return res.badRequest(err);
      }
      if(!meals.every(function(meal){
          if(meal.status === "off"){
            return true;
          }
          return meal.dishes.every(function(dish){
            return dish.id !== dishId;
          });
      })){
        return res.badRequest({ code : -1, responseText : req.__("meal-active-delete-dish")});
      }
      Dish.destroy(dishId).exec(function(err, dish){
        if(err){
          return res.badRequest(err);
        }
        return res.ok({dishId : dish.id});
      })
    });
  },

  findReview : function(req, res){
    var dishId = req.params.id;
    Review.find({ where : { dish : dishId}, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req)} ).exec(function(err, reviews){
      if(err){
        return res.badRequest(err);
      }
      res.ok(reviews);
    })
  },

  findActive : function(req, res){
    var _this = this, _meals = [];
    var pickupNickname = req.param('pickup');
    Meal.find({ where : { status : "on", provideFromTime : { '<' : moment().toDate()}, provideTillTime : { '>' : moment().toDate()}}}).populate('dishes').exec(function(err, meals){
      if(err){
        return res.badRequest(err);
      }
      _meals = meals;
      if(pickupNickname){
        pickupNickname = decodeURI(pickupNickname)
        _meals = meals.filter(function(meal){
          return meal.pickups.some(function(p){
            return p.nickname && p.nickname === pickupNickname;
          })
        })
      }
      var _dishes=[];
      async.auto({
        findDishes : function(next){
          _meals.forEach(function(meal){
            meal.dishes.forEach(function(dish){
              if(!_dishes.some(function(d){
                return d.id === dish.id;
              })){
                dish.leftQty = meal.leftQty[dish.id];
                _dishes.push(dish);
              }
            })
          });
          next();
        }
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        res.ok(_dishes);
      })
    })
  }
};

