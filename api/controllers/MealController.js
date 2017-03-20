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
 * -1 : geo service not available
 * -2 : address not valid
 * -3 : meal not found
 * -4 : meal have orders can not offline
 * -5 : meal invalid date
 * -6 : meal invalid requirement
 * -7 : chef incomplete profile
 * -8 : meal contain unverified dish
 * -9 : fail to decrease totalQty because of the dish has been ordered
 * -10 : fail to add/remove dish on active meal
 * -11 : dish can not be empty
 * -12 : system delivery provided but delivery option is off
 * -13 : support delivery but no delivery time was added
 * -14 : fail to modify info on active meal
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
    var county = req.cookies['county'] || req.param('county') || "San Francisco County";
    var user = req.session.user;
    if(req.session.authenticated){
      Meal.find({type : 'order', status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}).sort('score DESC').limit(12).populate('dishes').populate('chef').exec(function(err,orders){
        if(err){
          return res.badRequest(err);
        }
        orders = orders.filter(function(meal){
          return meal.county.split("+").indexOf(county) != -1;
        })
        Meal.find({type : 'preorder',status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>=' : now}}).sort('score DESC').limit(6).populate('dishes').populate('chef').exec(function(err, preorders){
          if(err){
            return res.badRequest(err);
          }

          preorders = preorders.filter(function(meal){
            return meal.county.split("+").indexOf(county) != -1;
          })

          User.findOne(user.id).populate("collects").exec(function(err,u){
            if(err){
              return res.badRequest(err);
            }
            return res.view('meals',{meals : orders.concat(preorders), user : u, county : county});
          });
        })
      });
    }else{
      Host.find({ passGuide : true, intro : { '!' : ''}}).populate("orders").populate("meals").exec(function(err, hosts){
        if(err){
          return res.badRequest(err);
        }
        var publicHosts = [];
        hosts.filter(function(host){
          var _host = {};
          _host.score = null;
          var popularHost = host.orders.length >= 0;
          var highScore = host.meals.every(function(meal){
            if(meal.score >= 4.8){
              _host.score = meal.score;
              return true;
            }
            return false;
          })
          if(popularHost && highScore){
            _host.shortIntro = host.shortIntro();
            _host.shopName = host.shopName;
            _host.picture = host.picture;
            _host.id = host.id;
            publicHosts.push(_host);
          }
        })
        return res.view('home',{user : user, hosts : publicHosts});
      });
    }
  },

	current : function(req, res){
    var county;
    var now = new Date();
    if(req.session.user && req.session.user.county){
      county = req.session.user.county;
    }else{
      county = "San Francisco";
    }

    Meal.find({status : "on",provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}).exec(function(err, found){
      if(err){
        res.badRequest(err);
      }else{
        found = found.filter(function(meal){
          return meal.county.split("+").indexOf(county) != -1;
        })
        res.view("meals",{meals : found, county : county});
      }
    });
  },

  county : function(req, res){
    var county = req.param('county');
    var now = new Date();
    Meal.find({status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}).exec(function(err, found){
      if(err){
        res.badRequest(err);
      }else{
        found = found.filter(function(meal){
          return meal.county.split("+").indexOf(county) != -1;
        })
        res.view("meals",{meals : found, county : county});
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
    var county = req.cookies['county'] || req.param('county') || "San Francisco County";;
    var type = req.param('type');
    var now = new Date();
    var params = {
      status : 'on',
      provideFromTime : {'<' : now},
      provideTillTime : {'>' : now}
    }
    if(type){
      params.type = type;
    }
    Meal.find(params).populate('dishes').populate('chef').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }

      found = found.filter(function(meal){
        return meal.county.split("+").indexOf(county) != -1;
      })

      if(typeof zipcode !== 'undefined' && zipcode && zipcode !== 'undefined' && typeof county !== 'undefined' && county && county !== 'undefined'){
        GeoCoder.geocode(zipcode, function(err, result){
          if (err) {
            return res.badRequest({ code : -1, responseText : req.__('meal-error-address')});
          }  else {
            if(result.length==0){
              return res.badRequest({ code : -2, responseText : req.__('meal-error-address2')});
            }
            var location = { lat : result[0].latitude, long : result[0].longitude };
            if(keyword){
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
            if(req.wantsJSON) {
              res.ok({meals: found, search : true, keyword : keyword, user: req.session.user, zipcode : zipcode, anchor : location});
            }else{
              res.view("meals",{ meals : found, search : true, keyword : keyword, user: req.session.user, zipcode : zipcode, anchor : location, county : county });
            }
          }
        });
      }else{
        if(keyword){
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
        return res.badRequest({ code : -3, responseText : req.__('meal-not-found')});
      }
      User.find(userId).populate("payment").populate("orders").exec(function(err,user){
        user[0].orders = user[0].orders.filter(function(order){
          return order.status == "schedule" || order.status == "preparing";
        })
        res.view("confirm",{meal : m[0], user : user[0]});
      });
    });
  },

  off : function(req, res){
    var mealId = req.param("id");
    var user = req.session.user;
    var hostId = user.host.id || user.host;
    var isAdmin = user.auth.email === 'admin@sfmeal.com';
    var $this = this;
    Order.find({meal : mealId, status : { '!' : ['complete','review','cancel']}}).exec(function(err,orders){
      if(err){
        return res.badRequest(err);
      }

      if(orders.length > 0) {
        return res.badRequest({ code : -4, responseText : req.__('meal-active-error')});
      }

      Meal.update({id : mealId},{status : "off", isScheduled : false, chef : hostId }).exec(function(err, meal){
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
    var county = req.cookies['county'] || req.param('county') || "San Francisco County";
    var now = new Date();
    Meal.find({ status : 'on', provideFromTime : {'<' : now}, provideTillTime : {'>' : now}  }).populate('dishes').populate('chef').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      found = found.filter(function(meal){
        return meal.county.split("+").indexOf(county) != -1;
      });
      //test only
      if(req.wantsJSON){
        return res.ok({meals : found});
      }
      return res.view("meals",{meals : found, user : req.session.user, county : county});
    });
  },

  create : function(req, res){
    var hostId = req.session.user.host.id? req.session.user.host.id : req.session.user.host;
    req.body.chef = hostId;
    var $this = this;

    if(this.dateIsValid(req.body)){
      this.requirementIsValid(req.body, null, req, function(err){
        if(err){
          return res.badRequest(err);
        }
        $this.dishIsValid(req.body, function(valid){
          if(valid){
            Host.findOne(hostId).populate("meals").populate("dishes").exec(function(err, host){
              if(err){
                return res.badRequest(err);
              }
              $this.updateDelivery(req.body, host, function(err, params){
                if(err){
                  return res.badRequest(err);
                }
                req.body = params;
                if(req.body.status == 'on'){
                  host.checkGuideRequirement(function(err){
                    if(err){
                      return res.badRequest(err);
                    }
                    if(!host.passGuide || !host.dishVerifying){
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
            });
          }else{
            console.log("meal contain unverified dishes");
            return res.badRequest({responseText : req.__('meal-unverify-dish'), code : -8});
          }
        });
      });
    }else{
      console.log("Date format of meal is not valid");
      return res.badRequest({responseText : req.__('meal-invalid-date'), code : -5});
    }
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
        !$this.mealActiveCheck(req.body, meal, req, function(err){
          if(err){
            return res.badRequest(err);
          }
          $this.requirementIsValid(req.body, meal, req, function (err) {
            if(err){
              return res.badRequest(err);
            }
            $this.updateDelivery(req.body, meal.chef, function(err, params){
              if(err){
                return res.badRequest(err);
              }
              req.body = params;
              if(status == "on"){
                async.auto({
                  updateQty : function(cb){
                    if(!req.body.totalQty && meal.status != "on"){
                      return cb();
                    }
                    req.body.leftQty = $this.updateDishQty(meal.leftQty, meal.totalQty, req.body.totalQty);
                    if(!req.body.leftQty){
                      return cb({responseText : req.__('meal-adjust-qty-fail'), code : -9});
                    }
                    cb();
                  }
                }, function(err){
                  if(err){
                    return res.badRequest(err);
                  }
                  meal.chef.dishes = meal.dishes;
                  if(!meal.dishIsValid()){
                    sails.log.debug("meal contain unverified dishes");
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
                        return res.ok(result[0]);
                      });
                    })
                  })
                });
              }else{
                $this.cancelMealJobs(mealId, function(err){
                  if(err){
                    return res.badRequest(err);
                  }
                  if(req.body.totalQty){
                    req.body.leftQty = req.body.totalQty;
                  }
                  req.body.isScheduled = false;
                  req.body.chef = hostId;
                  Meal.update({id : mealId}, req.body).exec(function(err, result){
                    if(err){
                      return res.badRequest(err);
                    }
                    return res.ok(result[0]);
                  });
                })
              }
            })
          });
        });
      });
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

  updateDelivery : function(params, host, cb){

    if(params.isDeliveryBySystem){
      params.delivery_fee = "3.99";
    }
    if(params.isDelivery && (!params.delivery_center || params.delivery_center == "undefined")){
      params.delivery_center = host.full_address;
    }

    var counties = [];
    async.auto({
      updatePickupLocation : function(cb){
        if(!params.pickups){
          return cb();
        }
        async.each(JSON.parse(params.pickups), function(pickup, next){
          if(!pickup.county){
            return next();
          }
          if(counties.indexOf(pickup.county) == -1){
            counties.push(pickup.county);
          }
          next();
        }, function(err){
          if(err){
            return cb(err);
          }
          cb();
        });
      }
    }, function(err){
      if(err){
        return cb(err);
      }
      if(counties.length == 0){
        sails.log.info("something went wrong and we need to setup a default county");
        params.county = host.county;
      }else{
        params.county = counties.join("+");
      }
      sails.log.info("counties are: " + counties.join("+"))
      cb(null, params);
    });
  },

  updateDishQty : function(leftQty, oldTotalQty, newTotalQty){
    if(!newTotalQty){
      return leftQty;
    }
    Object.keys(newTotalQty).forEach(function(dishId){
      leftQty[dishId] = parseInt(leftQty[dishId] || 0) + parseInt(newTotalQty[dishId]) - parseInt(oldTotalQty[dishId]);
      if(leftQty[dishId] < 0){
        leftQty = false;
        return;
      }
    });
    return leftQty;
  },

  requirementIsValid : function(params, meal, req, cb){
    var minOrderNumber = parseInt(params.minimalOrder);
    var minOrderTotal = parseFloat(params.minimalTotal);
    if(!minOrderNumber && !minOrderTotal){
      console.log("minimal order number and minimal order bill amount are required(one of them)");
      return cb({ code : -6, responseText : req.__('')});
    }
    var type = params.type;
    if(params.isDelivery && type == 'preorder' && !JSON.parse(params.pickups).some(function(pickup){
        return pickup.method == 'delivery';
      })){
      sails.log.debug("support delivery but no delivery time was added");
      return cb({ code : -13, responseText : req.__('meal-delivery-lack-of-method')});
    }

    if(!params.isDelivery && params.isDeliveryBySystem){
      sails.log.debug("system delivery provided but delivery option is off");
      return cb({ code : -12, responseText : req.__('meal-delivery-conflict')});
    }
    cb();
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
    }else if(new Date(provideTillTime) < now){
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

  mealActiveCheck : function(params, meal, req, cb){
    Order.find({meal : meal.id, status : { '!' : ['complete','review','cancel']}}).exec(function(err,orders) {
      if (err) {
        return cb(err);
      }

      if (orders.length > 0) {
        if(params.status == "on"){
          if(params.pickups || params.title || meal.type || params.minimalOrder || params.minimalTotal){
            cb({ code : -14, responseText : req.__("meal-modify-active-error")});
          }else{
            cb();
          }
        }else{
          return cb({code: -4, responseText: req.__('meal-active-error')});
        }
      }else{
        cb();
      }
    });
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

