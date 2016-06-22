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
      return res.ok(dish);
    });
  },

  fail : function(req, res){
    var dishId = req.params.id;
    Dish.update(dishId, { isVerified : false}).exec(function(err, dish){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(dish);
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
  }
};

