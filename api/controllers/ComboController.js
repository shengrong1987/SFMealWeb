/**
 * ComboController
 *
 * @description :: Server-side logic for managing comboes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    find: function(req, res){
      Combo.find().populate("dishes").populate("chefs").exec(function(err, combos){
        if(err){
          return res.badRequest(err)
        }
        res.ok(combos);
      })
    },
    updateDishes: function(req, res){
      let dishes = req.body.dishes;
      let comboId = req.param('id');
      Combo.findOne(comboId).populate("dishes").exec(function(err, combo){
        if(err){
          return res.badRequest(err);
        }
        dishes = dishes.split(",");
        async.each(dishes, function(dishId, next){
          if(combo.dishes.some(function(d){return d.id === dish.id})){
            return next();
          }
          Dish.findOne(dishId).exec(function(err, dish){
            if(err){
              return next(err)
            }
            combo.dishes.add(dishId);
            combo.chefs.add(dish.chef);
            combo.save(next)
          })
        }, function(err){
          if(err){
            return res.badRequest(err)
          }
          res.ok(combo)
        })
      })
    },
    updatePickupOptions: function(req, res){
      let pickupOptions = req.body.pickupOptions;
      let comboId = req.param('id');
      Combo.findOne(comboId).populate("pickupOptions").exec(function(err, combo){
        if(err){
          return res.badRequest(err);
        }
        pickupOptions.split(",").forEach(function(pickupOptionId){
          if(!combo.pickupOptions.some(function(option){
            return option.id === pickupOptionId
          })){
            combo.pickupOptions.add(pickupOptionId);
          }
        });
        combo.save(function(err, c){
          if(err){
            return res.badRequest(err);
          }
          res.ok(combo)
        })
      })
    }
};

