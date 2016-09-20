/**
 * MealController
 *
 * @description :: Server-side logic for managing Meals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var GeoCoder = require("../services/geocode.js");
var moment = require("moment");

/*
 error
 * -5 : meal invalid date
 * -6 : meal invalid requirement
 * -7 : chef incomplete profile
 * -8 : meal contain unverified dish
 * -9 : fail to decrease totalQty because of the dish has been ordered
 * -10 : fail to add/remove dish on active meal
 * -11 : dish can not be empty
 */

module.exports = {

  new_form : function(req, res){
    var user = req.session.user;
    var hostId = user.host.id ? user.host.id : user.host;
    Host.findOne(hostId).populate("dishes").populate('user').exec(function(err,host){
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

  searchAll : function(req, res){
    var keyword = req.query.keyword;
    delete req.query.keyword;
    Meal.find(req.query).populate('dishes').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }

      if(keyword) {
        found = found.filter(function(meal){
          var dishes = meal.dishes;
          var valid = false;
          for(var i=0; i < dishes.length; i++){
            var dish = dishes[i];
            if(meal.title.indexOf(keyword) != -1 || dish.title.indexOf(keyword) != -1 || dish.description.indexOf(keyword) != -1 || dish.type.indexOf(keyword) != -1){
              valid = true;
              break;
            }
          }
          return valid;
        });
      }
      return res.ok(found);
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
                if(meal.title.indexOf(keyword) != -1 || dish.title.indexOf(keyword) != -1 || dish.description.indexOf(keyword) != -1 || dish.type.indexOf(keyword) != -1){
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
            if(meal.title.indexOf(keyword) != -1 || dish.title.indexOf(keyword) != -1 || dish.description.indexOf(keyword) != -1 || dish.type.indexOf(keyword) != -1){
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
    var user = req.session.user;
    var isAdmin = user.auth.email === 'admin@sfmeal.com';
    var $this = this;
    Order.find({meal : mealId, status : { '!' : ['complete','review','cancel']}}).exec(function(err,orders){
      if(err){
        return res.badRequest(err);
      }

      if(orders.length > 0) {
        return res.badRequest(req.__('meal-active-error'));
      }

      Meal.update({id : mealId},{status : "off", isScheduled : false}).exec(function(err, meal){
        if(err){
          return res.badRequest(err);
        }
        $this.cancelMealJobs( mealId, function(err){
          if(err){
            return res.badRequest(err);
          }
          if(isAdmin) {
            return res.ok(meal);
          }
          return res.redirect("/host/me#mymeal");
        });
      });

    });
  },

  on : function(req, res){
    var mealId = req.param("id");
    var user = req.session.user;
    var isAdmin = user.auth.email === 'admin@sfmeal.com';
    var $this = this;
    if(isAdmin){
      Meal.findOne(mealId).populate('dishes').exec(function(err, meal){
        if(err){
          return res.badRequest(err);
        }
        Host.findOne(meal.chef).populate('meals').populate('dishes').exec(function(err, host){
          if(err){
            return res.badRequest(err);
          }
          host.checkGuideRequirement(function(err) {
            if(err){
              return res.badRequest(err);
            }
            if(!host.passGuide){
              return res.badRequest({responseText : req.__('meal-chef-incomplete'), code : -7});
            }
            if(!meal.dateIsValid()){
              console.log("Date format of meal is not valid");
              return res.badRequest({responseText : req.__('meal-invalid-date'), code : -5});
            }
            if(!meal.dishIsValid()){
              console.log("meal contain unverified dishes");
              return res.badRequest({responseText : req.__('meal-unverify-dish'), code : -8});
            }
            $this.cancelMealJobs( mealId, function(err){
              if(err){
                return res.badRequest(err);
              }
              meal.status = "on";
              meal.isScheduled = false;
              meal.save(function(err,result){
                if(err){
                  return res.badRequest(err);
                }
                return res.ok(meal);
              });
            })
          });
        });
      })
    }else{
      var hostId = req.session.user.host;
      var now = new Date();
      Host.findOne(hostId).populate("meals").populate("dishes").exec(function(err, host){
        if(err){
          return res.badRequest(err);
        }
        host.checkGuideRequirement(function(err){
          if(err){
            return res.badRequest(err);
          }
          if(!host.passGuide || !host.dishVerifying){
            return res.redirect("/apply");
          }
          Meal.findOne(mealId).populate("dishes").exec(function(err,meal){
            if(err){
              return res.badRequest(err);
            }
            if(!meal.dateIsValid()){
              console.log("Date format of meal is not valid");
              return res.badRequest({responseText : req.__('meal-invalid-date'), code : -5});
            }
            if(!meal.dishIsValid()){
              console.log("meal contain unverified dishes");
              return res.badRequest({responseText : req.__('meal-unverify-dish'), code : -8});
            }

            $this.cancelMealJobs(mealId, function(err){
              if(err){
                return res.badRequest(err);
              }
              meal.status = "on";
              meal.isScheduled = false;
              meal.save(function(err,result){
                if(err){
                  return res.badRequest(err);
                }
                if(req.wantsJSON){
                  return res.ok(meal);
                }
                return res.redirect("/host/me#mymeal");
              });
            })
          });
        });
      });
    }
  },

  findAll : function(req, res){
    Meal.find().exec(function(err, meals){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(meals);
    })
  },

  find : function(req, res){
    var county = req.param('county');
    county = county || "San Francisco County";
    var now = new Date();
    Meal.find({ county : county, status : 'on', provideFromTime : {'<' : now}, provideTillTime : {'>' : now}  }).populate('dishes').populate('chef').exec(function(err,found){
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
            Host.findOne(hostId).populate("meals").populate("dishes").exec(function(err, host){
              if(err){
                return res.badRequest(err);
              }
              if(req.body.status == 'on'){
                host.checkGuideRequirement(function(err){
                  if(err){
                    return res.badRequest(err);
                  }
                  if(!host.passGuide){
                    return res.badRequest({responseText : req.__('meal-chef-incomplete'), code : -7});
                  }
                  Meal.create(req.body).exec(function(err,meal){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok(meal);
                  });
                })
              }else{
                Meal.create(req.body).exec(function(err,meal){
                  if(err){
                    return res.badRequest(err);
                  }
                  return res.ok(meal);
                });
              }
            });
          }else{
            console.log("meal contain unverified dishes");
            return res.badRequest({responseText : req.__('meal-unverify-dish'), code : -8});
          }
        });
      }else{
        console.log("meal requirement are not valid");
        return res.badRequest({responseText : req.__('meal-invalid-requirement'), code : -6});
      }
    }else{
      console.log("Date format of meal is not valid");
      return res.badRequest({responseText : req.__('meal-invalid-date'), code : -5});
    }
  },

  add : function(req, res){
    var mealId = req.param('parentid');
    var dishId = req.param('id');
    Meal.findOne(mealId).populate('dishes').exec(function(err, meal){
      if(err){
        return res.badRequest(err);
      }
      if(meal.status == 'on'){
        return res.badRequest({responseText : req.__('meal-active-update-dish'), code : -10});
      }
      meal.dishes.add(dishId);
      meal.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        return res.ok({});
      });
    });
  },

  remove : function(req, res){
    var mealId = req.param('parentid');
    var dishId = req.param('id');
    Meal.findOne(mealId).populate('dishes').exec(function(err, meal){
      if(err){
        return res.badRequest(err);
      }
      if(meal.status == 'on'){
        return res.badRequest({responseText : req.__('meal-active-update-dish'), code : -10});
      }
      if(meal.dishes.filter(function(dish){
        return dish.id != dishId;
      }) == 0){
        return res.badRequest({responseText : req.__('meal-dishes-empty'), code : -11});
      }
      meal.dishes.remove(dishId);
      meal.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        return res.ok({});
      });
    });
  },

  updateDishQty : function(leftQty, oldTotalQty, newTotalQty){
    if(!newTotalQty){
      return leftQty;
    }
    Object.keys(leftQty).forEach(function(dishId){
      leftQty[dishId] = parseInt(leftQty[dishId]) + parseInt(newTotalQty[dishId]) - parseInt(oldTotalQty[dishId]);
      if(leftQty[dishId] < 0){
        leftQty = false;
        return;
      }
    });
    return leftQty;
  },

  update : function(req, res){
    var mealId = req.param("id");
    var hostId = req.session.user.host.id? req.session.user.host.id : req.session.user.host;
    var status = req.body.status;
    var $this = this;
    if(this.dateIsValid(req.body)){
      Meal.findOne(mealId).populate("dishes").populate("chef").exec(function(err,meal){
        if(err){
          return res.badRequest(err);
        }
        if($this.requirementIsValid(req.body, meal)){
          req.body.leftQty = $this.updateDishQty(meal.leftQty, meal.totalQty, req.body.totalQty);
          if(!req.body.leftQty){
            return res.badRequest({responseText : req.__('meal-adjust-qty-fail'), code : -9});
          }else{
            if(status == "on"){
              meal.chef.dishes = meal.dishes;
              if(!meal.dishIsValid()){
                console.log("meal contain unverified dishes");
                return res.badRequest({responseText : req.__('meal-unverify-dish'), code : -8});
              }
              meal.chef.checkGuideRequirement(function(err){
                if(err){
                  return res.badRequest(err);
                }
                if(!meal.chef.passGuide){
                  return res.badRequest({responseText : req.__('meal-chef-incomplete'), code : -7});
                }
                $this.cancelMealJobs(mealId, function(err){
                  if(err){
                    return res.badRequest(err);
                  }
                  req.body.isScheduled = false;
                  req.body.chef = hostId;
                  Meal.update({id : mealId}, req.body).exec(function(err, result){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok(result);
                  });
                })
              })
            }else{
              $this.cancelMealJobs(mealId, function(err){
                if(err){
                  return res.badRequest(err);
                }
                req.body.isScheduled = false;
                req.body.chef = hostId;
                Meal.update({id : mealId}, req.body).exec(function(err, result){
                  if(err){
                    return res.badRequest(err);
                  }
                  return res.ok(result);
                });
              })
            }
          }
        }else{
          console.log("meal minimal requirement are not valid");
          return res.badRequest({responseText : req.__('meal-invalid-requirement'), code : -6});
        }
      });
    }else{
      console.log("Date format of meal is not valid");
      return res.badRequest({responseText : req.__('meal-invalid-date'), code : -5});
    }
  },

  requirementIsValid : function(params, meal){
    var minOrderNumber = parseInt(params.minimalOrder);
    var minOrderTotal = parseFloat(params.minimalTotal);
    if(!minOrderNumber && !minOrderTotal){
      console.log("minimal order number and minimal order bill amount are required(one of them)");
      return false;
    }
    var type = meal ? meal.type : params.type;
    if(params.isDelivery && type == 'preorder' && !JSON.parse(params.pickups).some(function(pickup){
        return pickup.method == 'delivery';
      })){
      console.log("support delivery but no delivery time was added");
      return false;
    }
    return true;
  },

  dishIsValid : function(params, cb){
    var dishes = params.dishes.split(",");
    if(dishes.length == 0){
      return cb(false);
    }
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
    var now = new Date();
    if(provideFromTime >= provideTillTime){
      return false;
    }else if(moment.duration(moment(provideTillTime).diff(moment(provideFromTime))).asMinutes() < 30){
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
  },

  cancelMealJobs : function(mealId, cb){
    Jobs.cancel({'data.mealId' : mealId}, function(err, numberRemoved){
      if(err){
        return cb(err);
      }
      sails.log.debug(numberRemoved + " order jobs of meal : " + mealId +  " removed");
      return cb();
    })
  }

  //To test after finishing review model

};

