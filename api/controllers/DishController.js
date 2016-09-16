/**
 * DishController
 *
 * @description :: Server-side logic for managing Dishes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	new_form : function(req, res){
    var user = req.session.user;
    return res.view("dish_new",{user : user});
  },

  verify : function(req, res){
    var dishId = req.params.id;
    Dish.update(dishId, { isVerified : true}).exec(function(err, dish){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(dish[0]);
    });
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
          if(meal.status == "off"){
            return true;
          }
          return meal.dishes.every(function(dish){
            return dish.id != dishId;
          });
      })){
        return res.badRequest(req.__("meal-active-delete-dish"));
      }
      Dish.destroy(dishId).exec(function(err, dish){
        if(err){
          return res.badRequest(err);
        }
        return res.ok({dishId : dish.id});
      })
    });
  }
};

