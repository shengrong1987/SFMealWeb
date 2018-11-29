/**
 * PickupController
 *
 * @description :: Server-side logic for managing Pickups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async');

module.exports = {
	update : function(req, res){
	  var pickupOptionId = req.param("id");
	  PickupOption.update({ id : pickupOptionId }, req.body, function(err, pickupOptions){
	    if(err){
	      return res.badRequest(err);
      }
      Meal.find().exec(function(err, meals){
        if(err){
          return res.badRequest(err);
        }
        meals = meals.filter(function(meal){
          return meal.pickups.some(function(pickup){
            return pickup.id === pickupOptionId;
          })
        });
        async.each(meals, function(meal, next){
          var pickups = meal.pickups.map(function(pickup){
            if(pickup.id === pickupOptionId){
              return pickupOptions[0];
            }else{
              return pickup;
            }
          })
          meal.pickups = pickups;
          meal.save(next);
        }, function(err){
          if(err){
            return res.badRequest(err);
          }
          res.ok(pickupOptions[0]);
        });
      })
    })
  },

  find : function(req, res){
	  PickupOption.find().exec(function(err, options){
	    if(err){
	      return res.badRequest(err);
      }
      Driver.find().exec(function(err, drivers){
        if(err){
          return res.badRequest(err);
        }
        options.forEach(function(option){
          option.drivers = drivers;
        })
        res.ok(options);
      })
    });
  }

};

