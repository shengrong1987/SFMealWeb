/**
 * MealController
 *
 * @description :: Server-side logic for managing Meals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var GeoCoder = require("../services/geocode.js");
var moment = require("moment");

module.exports = {

  new_form : function(req, res){
    var user = req.session.user;
    var hostId = user.host.id ? user.host.id : user.host;
    Host.findOne(hostId).populate("dishes").exec(function(err,host){
      if(err){
        return res.badRequest(err);
      }
      return res.view("meal_new",{dishes : host.dishes, host : host});
    });
  },

  feature : function(req, res){
    var now = new Date();
    var county = req.param('county');
    county = county || "San Francisco County";
    Meal.find({county : county, type : 'order', status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}).sort('score DESC').limit(12).populate('dishes').populate('chef').exec(function(err,orders){
      if(err){
        return res.badRequest(err);
      }
      Meal.find({county : county, type : 'preorder',status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>=' : now}}).sort('score DESC').limit(6).populate('dishes').populate('chef').exec(function(err, preorders){
        if(err){
          return res.badRequest(err);
        }
        var user = req.session.user;
        if(user){
          var userId = user.id;
          User.findOne(userId).populate("collects").exec(function(err,u){
            if(err){
              return res.badRequest(err);
            }
            return res.view('meals',{meals : orders.concat(preorders), user : u});
          });
        }else {
          return res.view('home',{orders : orders, preorders : preorders, user : user});
        }
      })
    });
  },

	current : function(req, res){
    var county;
    var now = new Date();
    if(req.session.user && req.session.user.county){
      county = req.session.user.county;
    }else{
      county = "San Francisco";
    }

    Meal.find({county : county,status : "on",provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}).exec(function(err, found){
      if(err){
        res.badRequest(err);
      }else{
        res.view("meals",{meals : found});
      }
    });
  },

  county : function(req, res){
    var county = req.param('county');
    var now = new Date();
    Meal.find({county : county, status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}).exec(function(err, found){
      if(err){
        res.badRequest(err);
      }else{
        res.view("meals",{meals : found});
      }
    });
  },

  search : function(req, res){
    var keyword = req.param('keyword');
    var zipcode = req.param('zipcode');
    var county = req.param('county');
    var now = new Date();
    Meal.find({ county : county,status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>' : now}
    }).populate('dishes').populate('chef').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }

      if(typeof zipcode !== 'undefined' && zipcode && zipcode !== 'undefined' && typeof county !== 'undefined' && county && county !== 'undefined'){
        GeoCoder.geocode(zipcode, function(err, result){
          if (err) {
            return res.badRequest(req.__('meal-error-address'));
          }  else {
            if(result.length==0){
              return res.badRequest(req.__('meal-error-address2'));
            }
            var location = { lat : result[0].latitude, long : result[0].longitude };
            found = found.filter(function(meal){
              var dishes = meal.dishes;
              var valid = false;
              for(var i=0; i < dishes.length; i++){
                var dish = dishes[i];
                if(dish.title.indexOf(keyword) != -1 || dish.description.indexOf(keyword) != -1 || dish.type.indexOf(keyword) != -1){
                  valid = true;
                  break;
                }
              }
              return valid;
            });
            if(req.wantsJSON) {
              res.ok({meals: found, search : true, keyword : keyword, user: req.session.user, zipcode : zipcode, anchor : location});
            }else{
              res.view("meals",{ meals : found, search : true, keyword : keyword, user: req.session.user, zipcode : zipcode, anchor : location });
            }
          }
        });
      }else{
        found = found.filter(function(meal){
          var dishes = meal.dishes;
          var valid = false;
          for(var i=0; i < dishes.length; i++){
            var dish = dishes[i];
            if(dish.title.indexOf(keyword) != -1 || dish.description.indexOf(keyword) != -1 || dish.type.indexOf(keyword) != -1){
              valid = true;
              break;
            }
          }
          return valid;
        });
        if(req.wantsJSON) {
          res.ok({meals: found, search : true, keyword : keyword, user: req.session.user, zipcode : null, anchor : null});
        }else{
          res.view("meals",{ meals : found, search : true, keyword : keyword, user: req.session.user, zipcode : null, anchor : null });
        }
      }
    });
  },

  confirm : function(req, res){
    var mealId = req.param("id");
    var userId = req.session.user.id;
    Meal.find(mealId).populate("dishes").populate("chef").exec(function(err,m){
      if(err){
        return res.badRequest(err);
      }
      if(m.length==0){
        return res.badRequest(req.__('meal-not-found'));
      }
      User.find(userId).populate("payment").exec(function(err,user){
        res.view("confirm",{meal : m[0], user : user[0]});
      });
    });
  },

  off : function(req, res){
    var mealId = req.param("id");
    var hostId = req.session.user.host;
    Order.find({host : hostId,meal : mealId}).exec(function(err,orders){
      if(err){
        return res.badRequest(err);
      }
      if(orders.length == 0){
        Meal.findOne(mealId).exec(function(err,found){
          if(err){
            return res.badRequest(err);
          }
          found.status = "off";
          found.save(function(err,meal){
            if(err){
              return res.badRequest(err);
            }
            return res.redirect("/host/me#mymeal");
          });
        });
      }else{
        var hasActiveOrder = false;
        orders.forEach(function(order){
          if(order.status != "complete" || order.status != "cancel"){
            hasActiveOrder = true;
          }
        });
        if(hasActiveOrder){
          return res.badRequest(req.__('meal-active-error'));
        }
        Meal.update(mealId,{status : "off"}).exec(function(err, meal){
          if(err){
            return res.badRequest(err);
          }
          return res.redirect("/host/me#mymeal");
        });
      }
    });
  },

  on : function(req, res){
    var mealId = req.param("id");
    var hostId = req.session.user.host;
    var now = new Date();
    Host.findOne(hostId).populate("meals").populate("dishes").exec(function(err, host){
      if(err){
        return res.badRequest(err);
      }
      if(!host.isValid(false)){
        return res.redirect("/apply");
      }
      Meal.findOne(mealId).exec(function(err,meal){
        if(err){
          return res.badRequest(err);
        }
        if(meal.status == "on"){
          return res.ok(meal);
        }
        meal.status = "on";
        meal.save(function(err,result){
          if(err){
            return res.badRequest(err);
          }
          return res.redirect("/host/me#mymeal");
        });
      });
    });
  },

  find : function(req, res){
    var county = req.param('county');
    county = county || "San Francisco County";
    var now = new Date();
    Meal.find({ county : county,status : "on",provideFromTime : {'<' : now}, provideTillTime : {'>' : now}
    }).populate('dishes').populate('chef').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      //test only
      if(req.wantsJSON){
        return res.ok({meals : found});
      }
      return res.view("meals",{meals : found, user : req.session.user});
    });
  },

  create : function(req, res){
    var hostId = req.session.user.host.id? req.session.user.host.id : req.session.user.host;
    req.body.chef = hostId;
    if(this.dateIsValid(req.body)){
      if(this.requirementIsValid(req.body)){
        this.dishIsValid(req.body, function(valid){
          if(valid){
            if(req.body.status === "on"){
              Host.findOne(hostId).populate("meals").populate("dishes").exec(function(err, host){
                if(err){
                  return res.badRequest(err);
                }
                if(!host.isValid(true)){
                  return res.badRequest(req.__('meal-chef-incomplete'));
                }
                Meal.create(req.body).exec(function(err,meal){
                  if(err){
                    return res.badRequest(err);
                  }
                  return res.ok(meal);
                });
              });
            }else{
              Meal.create(req.body).exec(function(err,meal){
                if(err){
                  return res.badRequest(err);
                }
                return res.ok(meal);
              });
            }
          }else{
            console.log("meal contain unverified dishes");
            return res.badRequest(req.__('meal-unverify-dish'));
          }
        });
      }else{
        console.log("meal minimal requirement are not valid");
        return res.badRequest(req.__('meal-invalid-requirement'));
      }
    }else{
      console.log("Date format of meal is not valid");
      return res.badRequest(req.__('meal-invalid-date'));
    }
  },

  update : function(req, res){
    var mealId = req.param("id");
    if(this.dateIsValid(req.body)){
      if(this.requirementIsValid(req.body)){
        Meal.update(mealId, req.body).exec(function(err, meal){
          if(err){
            return res.badRequest(err);
          }
          res.ok(meal);
        });
      }else{
        console.log("meal minimal requirement are not valid");
        return res.badRequest(req.__('meal-invalid-requirement'));
      }
    }else{
      console.log("Date format of meal is not valid");
      return res.badRequest(req.__('meal-invalid-date'));
    }
  },

  requirementIsValid : function(params){
    var minOrderNumber = parseInt(params.minimalOrder);
    var minOrderTotal = parseFloat(params.minimalTotal);
    if(!minOrderNumber && !minOrderTotal){
      console.log("minimal order number and minimal order bill amount are required(one of them)");
      return false;
    }
    return true;
  },

  dishIsValid : function(params, cb){
    var dishes = params.dishes.split(",");
    async.each(dishes, function(dishId, next){
      Dish.findOne(dishId).exec(function(err, dish){
        if(err){
          return next(err);
        }
        if(!dish.isVerified){
          return next(err);
        }
        next();
      });
    }, function(err){
      if(err){
        return cb(false);
      }
      cb(true);
    });
  },

  dateIsValid : function(params){
    var provideFromTime = params.provideFromTime;
    var provideTillTime = params.provideTillTime;
    if(provideFromTime >= provideTillTime){
      return false;
    }else if(moment.duration(moment(provideTillTime).diff(moment(provideFromTime))).asMinutes() < 60){
      return false;
    }
    var valid = true;
    if(params.pickups){
      JSON.parse(params.pickups).forEach(function(pickup){
        var pickupFromTime = pickup.pickupFromTime;
        var pickupTillTime = pickup.pickupTillTime;
        if(pickupFromTime >= pickupTillTime){
          console.log("pickup time not valid");
          valid = false;
          return;
        }else if(moment.duration(moment(pickupTillTime).diff(moment(pickupFromTime))).asMinutes() < 30){
          console.log("pickup time too short");
          valid = false;
          return;
        }else if(pickupFromTime <= provideTillTime){
          console.log("pickup time too early");
          valid = false;
          return;
        }
      });
    }
    return valid;
  }

  //To test after finishing review model

};

