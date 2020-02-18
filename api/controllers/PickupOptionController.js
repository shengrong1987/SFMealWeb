/**
 * PickupController
 *
 * @description :: Server-side logic for managing Pickups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async');
var moment = require('moment');

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
            if(!pickup){
              return false;
            }
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
          Driver.find().exec(function(err, drivers){
            if(err){
              return res.badRequest(err);
            }
            pickupOptions[0].drivers = drivers;
            res.ok(pickupOptions[0]);
          })
        });
      })
    })
  },

  current: function(req, res){
	  var day = req.query.day;
	  var month = req.query.month;
	  PickupOption.find({ pickupFromTime : { '>' : moment().toDate() }}).sort({ pickupFromTime: 1 }).exec(function(err, options){
	    if(err){
	      return res.badRequest(err);
      }
	    if(day != -1 && month != -1){
        options = options.filter(function(opt){
          let optDay = moment(opt.pickupFromTime).date();
          let optMonth = moment(opt.pickupFromTime).month() + 1;
          return optDay == day && optMonth == month;
        })
      }
	    var dates = [];
	    options.forEach(function(opt){
	      if(!dates.length || !dates.some(function(date){
	        return date.date === opt.day && date.weekDate === opt.weekDate
        })){
	        let isLast = opt.weekDate === "周六";
	        let dateOpt = {
	          date: opt.day,
            weekDate: opt.weekDate,
            last : isLast
          }
          dates.push(dateOpt)
        }
      })
	    res.ok({ options: options, dates: dates});
    })
  },

  map: function(req, res){
	  res.view("deliveryMap", { layout:'popup', month: req.query.month || -1, day: req.query.day || -1});
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
  },

  drivers : function(req, res){
    Driver.find().exec(function(err, drivers){
      if(err){
        return res.badRequest(err);
      }
      res.ok(drivers);
    })
  },

  updateWeek : function(req, res){
	  PickupOption.find().exec(function(err, options){
	    if(err){
	      return res.badRequest(err);
      }
	    async.each(options, function(option, next){
	      let fromDate = moment(option.pickupFromTime).add(1, 'week');
	      option.pickupFromTime = fromDate._d;
        option.pickupTillTime = moment(option.pickupTillTime).add(1, 'week')._d;
        option.day = fromDate.date();
        option.weekDate = fromDate.format('ddd');
        option.save(next);
      }, function(err){
	      if(err){
	        return res.badRequest(err);
        }
	      //update meals
        Meal.find().exec(function(err, meals){
          if(err){
            return res.badRequest(err);
          }
          meals = meals.filter(function(meal){
            return meal.pickups.some(function(pickup){
              if(!pickup){
                return false;
              }
              return options.some(function(o){
                return o.id === pickup.id;
              });
            })
          });

          async.each(meals, function(meal, next){
            //update meal pickup options
            var newPickup = [];
            meal.pickups.forEach(function(pickup){
              options.forEach(function(option){
                if(option.id === pickup.id){
                  newPickup.push(option);
                  return;
                }
              })
            })
            delete newPickup.drivers;
            meal.pickups = newPickup;
            meal.save(next);
          }, function(err){
            if(err){
              return res.badRequest(err);
            }
            res.ok(options);
          });
        })


      })
    })
  }

};

