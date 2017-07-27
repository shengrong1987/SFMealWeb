/**
 * DishController
 *
 * @description :: Server-side logic for managing Dishes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * @error       :: -1 dish can not be deleted on active meal
 *                 -2 dish can not be updated on active meal
 */

var notification = require("../services/notification");
module.exports = {
	new_form : function(req, res){
    var user = req.session.user;
    return res.view("dish_new",{user : user});
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
    var isAdmin = req.session.user.auth.email === "admin@sfmeal.com";
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
        if(!meals.every(function(meal){
            if(meal.status == "off"){
              return true;
            }
            return meal.dishes.every(function(dish){
              return dish.id != dishId;
            });
          })){
          return res.badRequest({ code : -2, responseText : req.__("meal-active-update-dish")});
        }
        Dish.update(dishId, req.body).exec(function(err, dish){
          if(err){
            return res.badRequest(err);
          }
          return res.ok({dishId : dish[0].id});
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
          if(dish.title.indexOf(keyword) != -1 || dish.description.indexOf(keyword) != -1 || dish.type.indexOf(keyword) != -1){
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
    Review.find({ dish : dishId} ).exec(function(err, reviews){
      if(err){
        return res.badRequest(err);
      }
      res.ok(reviews);
    })
  }
};

