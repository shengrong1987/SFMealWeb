/**
 * MealController
 *
 * @description :: Server-side logic for managing Meals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

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
    var midnightToday = new Date().setHours(0,0,0,0);
    var county = req.param('county');
    county = county || "San Francisco County";
    Meal.find({county : county, type : 'order',status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}).sort('score DESC').limit(12).populate('dishes').populate('chef').exec(function(err,orders){
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
            return res.view('home',{orders : orders, preorders : preorders, user : u});
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
    var county = req.param('county');
    var now = new Date();
    Meal.find({ county : county,status : "on",provideFromTime : {'<' : now}, provideTillTime : {'>' : now}
    }).populate('dishes').populate('chef').exec(function(err,found){
      if(err){
        res.badRequest(err);
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
          res.ok({meals: found, search : true, keyword : keyword, user: req.session.user});
        }else{
          res.view("meals",{ meals : found, search : true, keyword : keyword, user: req.session.user });
        }
      }
    });
  },

  confirm : function(req, res){
    var mealId = req.param("id");
    var userId = req.session.user.id;
    Meal.find(mealId).populate("dishes").exec(function(err,m){
      if(err){
        return res.badRequest(err);
      }
      if(m.length==0){
        return res.badRequest("No meal is founded");
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
          return res.badRequest("There are ongoing orders for this meal.Please finish all orders before turning it off.")
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
    Meal.findOne(mealId).exec(function(err,meal){
      if(err){
        return res.badRequest(err);
      }
      if(meal.status != "off"){
        return res.badRequest("Meal is invalid, please see meal editing page for details");
      }
      if(meal.provideTillTime < now){
        return res.badRequest("Meal设定的结束时间已过");
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
        Meal.create(req.body).exec(function(err,meal){
          if(err){
            console.log("ddd");
            return res.badRequest(err);
          }
          return res.ok(meal);
        });
      }else{
        console.log("meal minimal requirement are not valid");
        return res.badRequest("meal minimal requirement are not valid");
      }
    }else{
      console.log("Date format of meal is not valid");
      return res.badRequest("Date format of meal is not valid");
    }
  },

  update : function(req, res){
    var mealId = req.param("id");
    if(this.dateIsValid(req.body)){
      if(this.requirementIsValid(req.body)){
        Meal.update(mealId,req.body).exec(function(err, meal){
          if(err){
            return res.badRequest(err);
          }
          res.ok(meal);
        });
      }else{
        console.log("meal minimal requirement are not valid");
        return res.badRequest("meal minimal requirement are not valid");
      }
    }else{
      console.log("Date format of meal is not valid");
      return res.badRequest("Date format of meal is not valid");
    }
  },

  dateIsValid : function(params){
    var provideFromTime = new Date(params.provideFromTime).getTime();
    var provideTillTime = new Date(params.provideTillTime).getTime();
    if(params.type == "order" && provideFromTime >= provideTillTime){
      return false;
    }else if(params.type == "preorder" && provideFromTime > provideTillTime){
      return false;
    }

    var now = Date.now();
    if(params.type == "preorder"){
      var midNightToday = new Date().setHours(0,0,0,0);
      if(provideTillTime < midNightToday){
        console.log(" pickup time has passed");
        return false;
      }
      var pickupFromTime = new Date(params.pickupFromTime).getTime();
      var pickupTillTime = new Date(params.pickupTillTime).getTime();

      if(pickupFromTime >= pickupTillTime){
        console.log("pickup time period not long enough");
        return false;
      }
      if(pickupFromTime <= now){
        console.log("pickup time has started");
        return false;
      }
      if(pickupFromTime < provideTillTime){
        console.log("pickup time can not be earlier than meal booking end date");
        return false;
      }
    }else{
      if(provideFromTime > now){
        return false;
      }
    }
    return true;
  },

  requirementIsValid : function(params){
    var minOrderNumber = parseInt(params.minimalOrder);
    var minOrderTotal = parseFloat(params.minimalTotal);
    if(!minOrderNumber && !minOrderTotal){
      console.log("minimal order number and minimal order bill amount are required(one of them)");
      return false;
    }
    return true;
  }

  //To test after finishing review model

};

