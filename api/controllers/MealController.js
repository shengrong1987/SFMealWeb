/**
 * MealController
 *
 * @description :: Server-side logic for managing Meals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var GeoCoder = require("../services/geocode.js");
var moment = require("moment");
var notification = require("../services/notification");
var util = require("../services/util");
var stripe = require("../services/stripe");
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil.js');
var async = require('async');
const DELIVERY_FEE = 0;
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
 * -15 : meal support delivery but no delivery option was provided
 * -16 : meal query is invalid
 * -17 : meal lack of party requirement
 * -18 : meal lack county information, unable to perform search
 * -19 : meal lack of order information
 * -20 : meal use custom store hour but lack of pickup options
 * -21 : provide from time is later than provide till time
 * -22 : provide till time is in the past
 * -23 : provide time too short
 * -24 : can not find any pickup options by the given nickname
 */

module.exports = {

  new_form : function(req, res){
    var user = req.session.user;
    var hostId = user.host.id ? user.host.id : user.host;
    Host.findOne(hostId).populate("dishes").populate('user').exec(function(err,host){
      if(err){
        return res.badRequest(err);
      }
      if(req.wantsJSON && process.env.NODE_ENV === "development"){
        return res.ok({ dishes : host.dishes, host : host});
      }
      Driver.find().exec(function(err, d){
        if(err){
          return res.badRequest(err);
        }
        var _pickups = []
        PickupOption.find().exec(function(err, pickups){
          if(err){
            return res.badRequest(err);
          }
          pickups.forEach(function(p){
            if(!_pickups.includes(p.nickname)){
              _pickups.push(p.nickname);
            }
          })
          _pickups.push("custom");
          return res.view("meal_new",{dishes : host.dishes, host : host, drivers : d, pickups : _pickups});
        })
      })
    });
  },

  catering : function(req, res){
    Host.find({ passGuide : true }).populate("dishes").exec(function(err, hosts){
      if(err){
        return res.badRequest(err);
      }

      var _dishes = [],_types = [];
      async.auto({
        findDishes : function(next){
          hosts.forEach(function(host){
            var dishes = host.dishes.filter(function(dish){
              return dish.isVerified;
            });
            _dishes = _dishes.concat(dishes);
          })
          next();
        },
        findDishTypes : ['findDishes', function(next){
          _dishes.forEach(function(dish){
            if(dish.type){
              if(!_types.includes(dish.type)){
                _types.push(dish.type);
              }
            }
          })
          next();
        },
        ]
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        Meal.find({ where : { status : "on", provideFromTime : { '<' : moment().toDate()}, provideTillTime : { '>' : moment().toDate()}}}).populate("dishes").exec(function(err, meals) {
          if (err) {
            return res.badRequest(err);
          }
          meals.forEach(function (meal) {
            meal.dishes.forEach(function (dish) {
              _dishes = _dishes.map(function (d) {
                if (d && dish && d.id === dish.id) {
                  d.availableAfter = util.humanizeDate(meal.pickups[0].pickupFromTime);
                }
                return d;
              })
            })
          })
          _dishes = _dishes.map(function(d){
            if(!d || d.availableAfter){
              return d;
            }
            var availableDate = moment().add(d.prepareDay,'days');
            d.availableDate = availableDate;
            return d;
          })
          res.view("catering", { dishes : _dishes, types : _types});
        });
      })
    })

  },

  find : function(req,res){
    //find out meals that provide start today or ends today
    moment.locale('zh-cn');
    var _this = this;
    var pickupNickname = req.param('pickup');
    var county = req.cookies['county'] || req.param('county') || "San Francisco County";
    var withinSevenDay = moment().add(7,'days');
    Meal.find({ where : { status : "on", provideFromTime : { '<' : moment().toDate()}, provideTillTime : { '>' : moment().toDate()}}}).populate('dishes').populate('chef').exec(function(err, meals){
      if(err){
        return res.badRequest(err);
      }
      // meals = meals.filter(function(meal){
      //   return meal.county.split("+").indexOf(county) !== -1;
      // });
      if(pickupNickname){
        meals = meals.filter(function(meal){
          return meal.pickups.some(function(p){
            return p.nickname && p.nickname === pickupNickname;
          })
        })
      }
      var _u=null,_tags=[];
      async.auto({
        findUser : function(next){
          if(!req.session.authenticated){
            return next();
          }
          User.findOne(req.session.user.id).exec(function(err, u){
            if(err){
              return next(err);
            }
            _u = u;
            next();
          })
        },
        findDishTags : function(next){
          meals.forEach(function(meal){
            meal.dishes.forEach(function(dish){
              if(dish.tags){
                dish.tags.forEach(function(tag){
                  if(!_tags.includes(tag) && !_tags.includes(req.__(tag))){
                    _tags.push(tag);
                  }
                })
              }
            })
          })
          var tagOrder = {
            "select" : 100,
            "限时礼品" : 90,
            "limited" : 80,
            "dessert" : 0
          };
          _tags = _tags.sort(function(a,b){
            if(tagOrder.hasOwnProperty(a) && tagOrder.hasOwnProperty(b)){
              return tagOrder[b] - tagOrder[a];
            }else{
              return 0;
            }
          })
          next();
        },
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok({ meals : meals, user : _u, tags: _tags });
        }
        meals = _this.composeMealWithDate(meals);
        res.view("dayOfMeal",{ meals : meals, user : _u, tags: _tags, pickupNickname : pickupNickname, locale : req.getLocale()});
      })
    })
  },

  feature : function(req, res){
    var now = new Date();
    var county = req.cookies['county'] || req.param('county') || "San Francisco County";
    var user = req.session.user;
    var _this = this;
    if(req.session.authenticated){
      Meal.find({ where : {status : "on", provideFromTime : {'<' : now}, provideTillTime : {'>' : now}}, skip : actionUtil.parseSkip(req), limit : actionUtil.parseLimit(req)}).sort('score DESC').populate('dishes').populate("dynamicDishes").populate('chef').exec(function(err,meals){
        if(err){
          return res.badRequest(err);
        }
        meals = meals.filter(function(meal){
          return meal.county.split("+").indexOf(county) !== -1;
        });

        User.findOne(user.id).populate("collects").exec(function(err,u){
          if(err){
            // return res.badRequest(err);
          }
          meals = _this.composeMealWithDate(meals);
          if(req.wantsJSON && process.env.NODE_ENV === "development"){
            return res.ok({meals : meals, user : u, county : county, locale : req.getLocale()});
          }
          return res.redirect('/meal');
        });
      });
    }else{
      Host.find({ where : { passGuide : true, intro : { '!' : ''}}, skip : 0, limit : actionUtil.parseLimit(req)}).sort('score DESC').populate("orders").populate("meals").exec(function(err, hosts){
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
          });
          if(popularHost && highScore){
            _host.shortIntro = host.shortIntro;
            _host.shopName = host.shopName;
            _host.shopName_en = host.shopName_en;
            _host.shopNameI18n = host.shopNameI18n;
            _host.intro = host.intro;
            _host.intro_en = host.intro_en;
            _host.introI18n = host.introI18n;
            _host.picture = host.picture;
            _host.id = host.id;
            publicHosts.push(_host);
          }
        });
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok({user : user, hosts : publicHosts, locale : req.getLocale()});
        }
        return res.view('home',{user : user, hosts : publicHosts, locale : req.getLocale(), layout : 'index'});
      });
    }
  },

  searchAll : function(req, res){
    var keyword = req.query.keyword;
    delete req.query.keyword;
    Meal.find({ where : req.query, skip : actionUtil.parseSkip(req), limit : actionUtil.parseLimit(req)}).populate('dishes').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }

      if(keyword) {
        found = found.filter(function(meal){
          var dishes = meal.dishes;
          var valid = false;
          if(meal.title === keyword){
            return true;
          }
          for(var i=0; i < dishes.length; i++){
            var dish = dishes[i];
            if(dish.title.indexOf(keyword) !== -1 || dish.description.indexOf(keyword) !== -1 || dish.type.indexOf(keyword) !== -1){
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
    var _this = this;
    var query = req.query;
    var keyword = query['keyword'];
    var zipcode = query['zip'];
    var method = query['method'];
    var county = query['county'] || req.cookies['county'] || "San Francisco County";
    var type = req.param('type');
    var now = new Date();
    var params = {
      status : 'on',
      provideFromTime : {'<' : now },
      provideTillTime : {'>' : now }
    };
    if(type){
      params.type = type;
    }
    Meal.find({ where : params, limit : actionUtil.parseLimit(req), skip : actionUtil.parseSkip(req)}).populate('dishes').populate("dynamicDishes").populate('chef').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }

      async.auto({
        matchCounty : function(next){
          if(!county){
            return next();
          }
          found = found.filter(function(meal){
            return meal.county.split("+").indexOf(county) !== -1;
          });
          next();
        },
        matchZipCode : function(next){
          if(!zipcode){
            return next();
          }
          //find which county the zip belongs to, exclude it if it does not match the meal's county
          GeoCoder.geocode(zipcode, function(err, result){
            if(err){
              return next({ code : -1, responseText : req.__('meal-error-address')})
            }else if(result.length===0){
              return next({ code : -2, responseText : req.__('meal-error-address2')})
            }
            found = found.filter(function(meal){
              return meal.county.split("+").indexOf(result[0].administrativeLevels.level2long) !== -1;
            });
            next();
          })
        },
        matchMethod : function(next){
          if(!method){
            return next();
          }
          found = found.filter(function(meal){
            return meal.pickups.some(function(pickup){
              return pickup.method === method;
            });
          });
          next();
        },
        matchKeyword : function(next){
          if(!keyword){
            return next();
          }
          found = found.filter(function(meal){
            var dishes = meal.dishes;
            for(var i=0; i < dishes.length; i++){
              var dish = dishes[i];
              if(meal.title.indexOf(keyword) !== -1 || dish.title.indexOf(keyword) !== -1 || dish.description.indexOf(keyword) !== -1 || dish.type.indexOf(keyword) !== -1){
                return true;
              }
            }
            return false;
          });
          next();
        }
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        found = _this.composeMealWithDate(found);
        if(req.wantsJSON && process.env.NODE_ENV === "development") {
          res.ok({meals: found, search : true, keyword : keyword, user: req.session.user, zipcode : zipcode, county : county});
        }else{
          res.view("meals",{ meals : found, search : true, keyword : keyword, user: req.session.user, zipcode : zipcode, county : county });
        }
      });
    });
  },

  checkout : function(req, res) {
    var _this = this;
    var orderedDishes = req.query.dishes;
    if (!orderedDishes){
      return res.badRequest({code: -19, responseText: req.__('meal-checkout-lack-of-order')});
    }

    orderedDishes = orderedDishes.split(",");

    var pickupNickname = req.param("pickup");

    Meal.find({where: {status: "on", provideFromTime : { '<' : moment().toDate()}, provideTillTime: {'>': moment().toDate()}}}).populate('dishes').exec(function(err, meals){
      if(err){
        return res.badRequest(err);
      }
      // meals = meals.filter(function(meal){
      //   return meal.county.split("+").indexOf(county) !== -1;
      // });

      //get all meals that contain the order dishes
      meals = meals.filter(function(meal){
        return meal.dishes.some(function(d){
          return orderedDishes.includes(d.id);
        });
      });

      //remove dates of meals which can not have all the ordered dishes
      var dateDescs = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      dateDescs.forEach(function(dateDesc){
        var mealsOnSameDate = meals.filter(function(meal){
          var pickupDate = moment(meal.pickups[0].pickupFromTime).format('dddd');
          return pickupDate === dateDesc;
        });
        if(!mealsOnSameDate.length){
          return;
        }
        var mealHaveAllOrderedDishes = orderedDishes.every(function(orderedDishId){
          var dishInMeal = mealsOnSameDate.some(function(m){
            return m.dishes.some(function(d){
              return d.id === orderedDishId;
            });
          });
          return dishInMeal;
        });
        if(!mealHaveAllOrderedDishes){
          meals = meals.filter(function(m){
            var mealNeedToRemove = mealsOnSameDate.some(function(m2){
              return m2.id === m.id;
            })
            return !mealNeedToRemove;
          })
        }
      });

      if(pickupNickname){
        meals = meals.filter(function(meal){
          return meal.pickups.some(function(p){
            return p.nickname && p.nickname === pickupNickname;
          })
        })
      }
      if(!meals.length){
        return res.badRequest({ code : -3, responseText: req.__('meal-not-found')});
      }
      var pickups = [], u = {};
      async.auto({
        combinePickups : function(next){
          meals.forEach(function(meal){
            var newPickups = meal.pickups.filter(function(p1){
              if(!pickups.length){
                return true;
              }
              return !pickups.some(function(p2){
                return p1.pickupFromTime === p2.pickupFromTime && p1.pickupTillTime === p2.pickupTillTime && p1.location === p2.location;
              })
            });
            newPickups = newPickups.map(function(pickup){
              pickup.meal = meal.id;
              return pickup;
            });
            pickups = pickups.concat(newPickups);
          })
          next();
        },
        getUser : function(next){
          if(!req.session.authenticated){
            return next();
          }
          User.findOne(req.session.user.id).populate("payment").populate("collects").exec(function(err, user){
            if(err){
              return next(err);
            }
            u = user;
            next()
          })
        }
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok({ pickups : pickups, meals: meals, user : u, locale : req.getLocale()});
        }
        meals = _this.composeMealWithDate(meals);
        return res.view("checkout",{ pickups : pickups, meals: meals, user : u, locale : req.getLocale()});
      })
    })
  },

  off : function(req, res){
    var mealId = req.param("id");
    var user = req.session.user;
    var isAdmin = user.auth.email === 'admin@sfmeal.com' && (user.emailVerified || process.env.NODE_ENV === "development");
    var hostId;
    var $this = this;
    Order.find({meal : mealId, status : { '!' : ['complete','review','cancel']}}).exec(function(err,orders){
      if(err){
        return res.badRequest(err);
      }

      if(orders.length > 0) {
        return res.badRequest({ code : -4, responseText : req.__('meal-active-error')});
      }

      async.auto({
        findHost : function(next){
          if(!isAdmin){
            hostId = user.host.id || user.host;
            return next();
          }
          Meal.findOne(mealId).exec(function(err, meal){
            if(err){
              return next(err);
            }
            hostId = meal.chef;
            next();
          });
        }
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        Meal.findOne(mealId).exec(function(err, m){
          if(err){
            return res.badRequest(err);
          }
          Meal.update({ id : mealId },{ status : "off", isScheduled : false, chef : hostId, leftQty : m.totalQty}).exec(function(err, meal){
            if(err){
              return res.badRequest(err);
            }
            $this.cancelMealJobs(mealId, function(err){
              if(err){
                return res.badRequest(err);
              }
              if(isAdmin) {
                return res.ok(meal[0]);
              }
              return res.ok(meal[0]);
            });
          });
        });
      })

    });
  },

  on : function(req, res){
    var mealId = req.param("id");
    var user = req.session.user;
    var isAdmin = user.auth.email === 'admin@sfmeal.com' && (user.emailVerified || process.env.NODE_ENV === "development");
    var $this = this;

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
          if(!host.passGuide || !host.dishVerifying){
            return res.badRequest({responseText : req.__('meal-chef-incomplete'), code : -7});
          }
          if(!meal.dateIsValid()){
            console.log("Date format of meal is not valid");
            return res.badRequest({responseText : req.__('meal-invalid-date'), code : -5});
          }
          meal.dishIsValid(req, function(err){
            if(err){
              return res.badRequest(err);
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
                res.ok(meal);
              });
            })
          });
        });
      });
    });
  },

  oldmeals : function(req, res){
    var county = req.query['county'] || req.cookies['county'] || req.param('county') || "San Francisco County";
    var now = new Date();
    var _this = this;
    Meal.find( { where : { status : 'on', provideFromTime : {'<' : now}, provideTillTime : {'>' : now}  }, skip : actionUtil.parseSkip(req), limit : actionUtil.parseLimit(req)}).populate('dishes').populate("dynamicDishes").populate('chef').exec(function(err,found){
      if(err){
        return res.badRequest(err);
      }
      found = found.filter(function(meal){
        return meal.county.split("+").indexOf(county) !== -1;
      });
      //test only
      if(req.wantsJSON && process.env.NODE_ENV === "development"){
        return res.ok({meals : found});
      }
      found = _this.composeMealWithDate(found);
      return res.view("meals",{ meals : found, user : req.session.user, county : county});
    });
  },

  create : function(req, res){
    var hostId = req.session.user.host.id? req.session.user.host.id : req.session.user.host;
    req.body.chef = hostId;
    var $this = this;

    this.dateIsValid(req.body, req, function(err){
      if(err){
        return res.badRequest(err);
      }
      sails.log.info("pass date check");
      $this.requirementIsValid(req.body, null, req, function(err){
        if(err){
          return res.badRequest(err);
        }
        sails.log.info("pass meal requirement check");
        $this.dishIsValid(req.body, req, function(err){
          if(err){
            return res.badRequest(err);
          }
          sails.log.info("pass dish check");
          Host.findOne(hostId).populate("meals").populate("dishes").populate("user").exec(function(err, host){
            if(err){
              return res.badRequest(err);
            }
            $this.updateDelivery(req.body, host, req, function(err, params){
              if(err){
                return res.badRequest(err);
              }
              req.body = params;
              req.body.commission = host.commission;
              req.body.chef = host.id;
              if(req.body.status === 'on'){
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
        });
      });
    });
  },

  update : function(req, res){
    var mealId = req.param("id");
    var isAdmin = req.session.user.auth.email === "admin@sfmeal.com" && (req.session.user.emailVerified || process.env.NODE_ENV === "development");
    var user = req.session.user;
    var status = req.body.status;
    var $this = this;
    var hostId;
    sails.log.info("meal id: " + mealId);
    async.auto({
      findChef : function(next){
        if(!isAdmin){
          return next();
        }
        Meal.findOne(mealId).populate("chef").exec(function(err, meal){
          if(err){
            return next(err);
          }
          hostId = meal.chef.id;
          next();
        })
      },
      getChef : function(next){
        if(isAdmin){
          return next();
        }
        hostId = req.session.user.host.id? req.session.user.host.id : req.session.user.host;
        next();
      }
    },function(err){
      if(err){
        return res.badRequest(err);
      }
      sails.log.info("chef id: " + hostId);
      $this.dateIsValid(req.body, req, function(err){
        if(err){
          return res.badRequest(err);
        }
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
              Host.findOne(meal.chef.id).populate("user").exec(function(err, host){
                if(err){
                  return res.badRequest(err);
                }
                $this.updateDelivery(req.body, host, req, function(err, params){
                  if(err){
                    return res.badRequest(err);
                  }
                  req.body = params;
                  if(status === "on"){
                    async.auto({
                      updateQty : function(cb){
                        if(!req.body.totalQty && meal.status !== "on"){
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
                      meal.dishIsValid(req, function(err){
                        if(err){
                          return res.badRequest(err);
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
              })
            });
          });
        });
      })
    });
  },

  add : function(req, res){
    var mealId = req.param('parentid');
    var dishId = req.param('id');
    var email = req.session.user.auth.email;
    var isAdmin = email === "admin@sfmeal.com" && (req.session.user.emailVerified || process.env.NODE_ENV === "development");
    Meal.findOne(mealId).populate('dishes').exec(function(err, meal){
      if(err){
        return res.badRequest(err);
      }
      // if(!isAdmin && meal.status === 'on'){
      //   return res.badRequest({responseText : req.__('meal-active-update-dish'), code : -10});
      // }
      meal.dishes.add(dishId);
      if(!meal.leftQty.hasOwnProperty(dishId)){
        meal.leftQty[dishId] = 10;
      }
      if(!meal.totalQty.hasOwnProperty(dishId)){
        meal.totalQty[dishId] = 10;
      }
      meal.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        Order.find({ $and : [{$or:[{status : "schedule"},{status : "preparing"}]},{meal:mealId}]}).populate("dynamicDishes").populate("dishes").exec(function(err, orders){
          if(err){
            return res.badRequest(err);
          }
          async.each(orders, function(order, next){
            order.dishes.add(dishId);
            order.dynamicDishes.add(dishId);
            order.save(function(err, o){
              if(err){
                return next(err);
              }
              next();
            });
          }, function(err){
            if(err){
              return res.badRequest(err);
            }
            res.ok({});
          })
        })
      });
    });
  },

  remove : function(req, res){
    var mealId = req.param('parentid');
    var dishId = req.param('id');
    Meal.findOne(mealId).populate('dishes').populate("dynamicDishes").exec(function(err, meal){
      if(err){
        return res.badRequest(err);
      }
      if(meal.status === 'on'){
        return res.badRequest({responseText : req.__('meal-active-update-dish'), code : -10});
      }
      if(meal.dishes.filter(function(dish){
        return dish.id !== dishId;
      }) === 0){
        return res.badRequest({responseText : req.__('meal-dishes-empty'), code : -11});
      }
      if(meal.leftQty.hasOwnProperty(dishId)){
        delete meal.leftQty[dishId];
      }
      if(meal.totalQty.hasOwnProperty(dishId)){
        delete meal.totalQty[dishId];
      }
      meal.dynamicDishes.remove(dishId);
      meal.dishes.remove(dishId);
      meal.save(function(err, result){
        if(err){
          return res.badRequest(err);
        }
        Order.find({ $and : [{$or:[{status : "schedule"},{status : "preparing"}]},{meal:mealId}]}).populate("dynamicDishes").populate("dishes").exec(function(err, orders){
          if(err){
            return res.badRequest(err);
          }
          async.each(orders, function(order, next){
            order.dishes.remove(dishId);
            order.dynamicDishes.remove(dishId);
            order.save(next);
          }, function(err){
            if(err){
              return res.badRequest(err);
            }
            res.ok({});
          })
        })
      });
    });
  },

  updateDelivery : function(params, host, req, cb){

    if(params.isDeliveryBySystem){
      params.delivery_fee = DELIVERY_FEE;
    }

    if(params.isDelivery && params.type === "preorder" && (!params.pickups || (params.pickups && !params.pickups.some(function(pickup){
      return pickup.method === "delivery";
    })))){
      return cb({ responseText : req.__('meal-delivery-on-option'), code : -15})
    }

    var counties = [];
    async.auto({
      updatePickupLocation : function(cb){
        if(!params.pickups){
          return cb();
        }
        var pickupArrays = params.pickups;
        pickupArrays.forEach(function(pickup, index){
          if(!pickup.county){
            return;
          }
          if(!pickup.phone || pickup.phone === 'undefined'){
            pickup.phone = host.user.phone;
          }
          pickup.index = index+1;
          sails.log.info("phone is : " + pickup.phone);
          sails.log.info("county is : " + pickup.county);
          if(counties.indexOf(pickup.county) === -1){
            counties.push(pickup.county);
          }
        });
        if(params.supportPartyOrder){
          var now = moment();
          var kitchenDelivery = {
            pickupFromTime : now.toDate(),
            pickupTillTime : now.add(7, 'days').toDate(),
            deliveryCenter : host.full_address,
            method : "delivery",
            area : host.city,
            phone : host.phone,
            county : host.county,
            index : pickupArrays.length + 1,
            isDateCustomized : true
          }
          pickupArrays.push(kitchenDelivery);
        }
        params.pickups = pickupArrays;
        cb();
      }
    }, function(err){
      if(err){
        return cb(err);
      }
      if(counties.length !== 0){
        params.county = counties.join("+");
      }
      sails.log.info("counties are: " + counties.join("+"));
      cb(null, params);
    });
  },

  updateDishQty : function(leftQty, oldTotalQty, newTotalQty){
    if(!newTotalQty){
      return leftQty;
    }
    Object.keys(newTotalQty).forEach(function(dishId){
      sails.log.info("left qty: " + leftQty[dishId], " & new total: " + newTotalQty[dishId], " & old total: " + oldTotalQty[dishId]);
      leftQty[dishId] = parseInt(leftQty[dishId] || 0) + parseInt(newTotalQty[dishId]) - parseInt(oldTotalQty[dishId]);
      if(leftQty[dishId] < 0){
        leftQty = false;
      }
    });
    return leftQty;
  },

  requirementIsValid : function(params, meal, req, cb){
    // var minOrderNumber = parseInt(params.minimalOrder);
    // var minOrderTotal = parseFloat(params.minimalTotal);
    // if(!minOrderNumber && !minOrderTotal){
    //   console.log("minimal order number and minimal order bill amount are required(one of them)");
    //   return cb({ code : -6, responseText : req.__('')});
    // }
    var type = params.type;
    if(params.isDelivery && type === 'preorder' && !params.pickups.some(function(pickup){
        return pickup.method === 'delivery';
      })){
      sails.log.debug("support delivery but no delivery time was added");
      return cb({ code : -13, responseText : req.__('meal-delivery-lack-of-method')});
    }

    if(!params.isDelivery && params.isDeliveryBySystem){
      sails.log.debug("system delivery provided but delivery option is off");
      return cb({ code : -12, responseText : req.__('meal-delivery-conflict')});
    }

    if(params.supportPartyOrder && !params.partyRequirement){
      return cb({ code : -17, responseText : req.__('meal-lack-of-party-requirement')});
    }

    if(params.storeHourNickname === "custom" && !params.pickups){
      return cb({ code : -20, responseText : req.__('meal-custom-hour-lack-of-pickup-options')})
    }

    if(!params.isDelivery && params.pickups && params.pickups.some(function(pickup){
      return pickup.method === "delivery";})
    ){
      return cb({ code : -12, responseText : req.__('meal-delivery-conflict')});
    }
    cb();
  },

  dishIsValid : function(params, req, cb){
    if(params.status === 'off'){
      return cb();
    }
    var dishes = params.dishes.split(",");
    if(dishes.length === 0){
      return cb({ code : -11, responseText : req.__('meal-dishes-empty')});
    }
    async.each(dishes, function(dishId, next){
      Dish.findOne(dishId).exec(function(err, dish){
        if(err){
          return next(err);
        }
        if(!dish.isVerified){
          return next({ code : -8, responseText : req.__('meal-unverify-dish')});
        }
        next();
      });
    }, function(err){
      if(err){
        return cb(err);
      }
      cb();
    });
  },

  dateIsValid : function(params, req, cb){
    var provideFromTime = params.provideFromTime;
    var provideTillTime = params.provideTillTime;
    var now = new Date();

    sails.log.info("start: " + provideFromTime, " end: " + provideTillTime);

    if(provideFromTime >= provideTillTime){
      return cb({ code : -21, responseText : req.__('provide-from-time-is-later-than-provide-till-time')});
    }else if(new Date(provideTillTime) < now){
      return cb({ code : -22, responseText : req.__('provide-till-time-is-in-the-past')});
    }else if(moment.duration(moment(provideTillTime).diff(moment(provideFromTime))).asMinutes() < 30){
      return cb({ code : -23, responseText : req.__('provide-time-too-short')});
    }

    sails.log.info("provide time checked");
    async.auto({
      findPickups : function(next){
        if(params.type === "order"){
          return next();
        }else{
          if(params.pickups){
            try{
              params.pickups = JSON.parse(params.pickups);
              next();
            }catch(e){
              return next(e);
            }
          }else if(params.nickname && params.nickname !== "custom"){
            PickupOption.find({ nickname: params.nickname}).exec(function(err, options){
              if(err){
                return next(err);
              }
              if(!options || !options.length){
                return next({code: -24, responseText : req.__('meal-nickname-empty')});
              }
              sails.log.info("pickup options: " + options);
              params.pickups = options;
              next();
            })
          }else{
            return next({ code : -20, responseText : req.__('meal-custom-hour-lack-of-pickup-options')});
          }
        }
      }
    }, function(err){
      if(err){
        return cb(err);
      }
      var valid = true;
      if(params.pickups){
        params.pickups.forEach(function(pickup){
          if(!pickup.isDateCustomized){
            var pickupFromTime = pickup.pickupFromTime;
            var pickupTillTime = pickup.pickupTillTime;
            if(pickupFromTime >= pickupTillTime){
              console.log("pickup time not valid");
              valid = false;
            }else if(moment.duration(moment(pickupTillTime).diff(moment(pickupFromTime))).asMinutes() < 30){
              console.log("pickup time too short");
              valid = false;
            }else if(pickupFromTime <= provideTillTime && params.type === "preorder"){
              console.log("pickup time too early");
              valid = false;
            }
          }
        });
      }
      if(!valid){
        return cb({ code : -5, responseText : req.__('meal-invalid-date')});
      }
      cb();
    })
  },

  mealActiveCheck : function(params, meal, req, cb){
    Order.find({meal : meal.id, status : { '!' : ['complete','review','cancel']}}).exec(function(err,orders) {
      if (err) {
        return cb(err);
      }

      if (orders.length > 0) {
        if(params.status === "on"){
          // if(params.pickups){
          //   cb({ code : -14, responseText : req.__("meal-modify-active-error")});
          // }else{
          //   cb();
          // }
          cb();
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
  },

  report : function(req, res){
    var mealId = req.param("id");
    var status = req.query.status || 'preparing';
    Meal.findOne(mealId).populate("chef").populate("dishes").exec(function(err, meal){
      if(err || !meal){
        return done();
      }
      meal.hostEmail = meal.chef.email;

      Order.find({ meal : mealId, status : status }).exec(function(err, orders){
        if(err){
          return done();
        }
        Dish.find({ chef : meal.chef.id }).exec(function(err, dishes) {
          if (err) {
            return cb(err);
          }
          meal.dishes = dishes;
          meal.orders = orders;
          notification.transitLocaleTimeZone(meal);
          return res.view('report',{ meal : meal });
        });
      });
    })
  },

  findOne : function(req, res){
    var mealId = req.param('id');
    if(!mealId){
      return res.badRequest({ code : -3, responseText : req.__('meal-not-found')})
    }

    var isEditMode = req.query["edit"];
    if(isEditMode === 'true'){
      var user = req.session.user;
      if(!user){
        return res.forbidden();
      }
      var host = user.host;
      var hostId = host ? (host.id ? host.id : host) : null;
      if(!hostId){
        return res.forbidden();
      }
    }
    var isPartyMode = req.query['party'];
    if(isPartyMode && isEditMode){
      return res.notFound(req.__('meal-query-invalid'));
    }

    Meal.findOne(mealId).populate("dishes").populate("dynamicDishes").populate("chef").exec(function(err, meal){
      if(err){
        return res.badRequest(err);
      }
      if(!meal){
        return res.notFound();
      }
      var _orders,_user,_drivers,_pickups=[];
      async.auto({
        isEditMode : function(cb){
          if(!isEditMode){
            return cb();
          }
          meal.userId = user.id;
          Host.findOne(hostId).populate("user").populate("dishes").exec(function(err,host){
            if(err){
              return cb(err);
            }
            meal.kitchen_address = host.full_address;
            meal.allDishes = host.dishes;
            meal.phone = host.user.phone;
            cb();
          });
        },
        isPartyMode : function(cb){
          if(!isPartyMode){
            return cb();
          }
          Dish.find({ chef : meal.chef.id, isVerified : true }).exec(function(err, dishes){
            if(err){
              return cb(err);
            }
            meal.dishes = dishes;
            meal.isPartyMode = true;
            meal.delivery_range = meal.delivery_range * stripe.PARTY_ORDER_RANGE_MULTIPLIER;
            cb();
          });
        },
        getDrivers : function(cb){
          if(!isEditMode){
            return cb();
          }
          Driver.find().exec(function(err, drivers){
            if(err){
              return cb(err);
            }
            _drivers = drivers;
            cb();
          })
        },
        getStoreHours : function(cb){
          if(!isEditMode){
            return cb();
          }
          PickupOption.find().exec(function(err, pickups){
            if(err){
              return cb(err);
            }
            pickups.forEach(function(p){
              if(!_pickups.includes(p.nickname)){
                _pickups.push(p.nickname);
              }
            })
            _pickups.push("custom");
            cb();
          })
        },
        getMealExtraInfo : ['isPartyMode', function(cb){
          Order.find({meal : meal.id, status : ["schedule","preparing"]}).exec(function(err, orders){
            if(err){
              return res.badRequest(err);
            }
            _orders = orders;
            if(!req.session.authenticated || isEditMode){
              return cb();
            }
            var userId = req.session.user.id;
            User.findOne(userId).populate('auth').populate("collects").exec(function(err,user){
              if(err){
                return cb(err);
              }
              _user = user;
              cb();
            });
          });
        }]
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        if(req.wantsJSON && process.env.NODE_ENV === "development"){
          return res.ok(meal);
        }
        if(isEditMode){
          res.view('meal_edit',{ meal : meal, drivers: _drivers, pickups : _pickups });
        }else if(req.session.authenticated){
          res.view('meal',{ meal : meal, locale : req.getLocale(), user : _user, orders : _orders});
        }else{
          res.view('meal',{ meal : meal, locale : req.getLocale(), user : null, orders : _orders});
        }
      });
    });
  },

  findReview : function(req, res){
    var mealId = req.params.id;
    Review.find({ where : { meal : mealId}, skip : actionUtil.parseSkip(req), limit : actionUtil.parseLimit(req) }).exec(function(err, reviews){
      if(err){
        return res.badRequest(err);
      }
      res.ok(reviews);
    })
  },

  findOrder : function(req, res){
    var mealId = req.params.id;
    Order.find({ where : { meal : mealId}, skip : actionUtil.parseSkip(req), limit : actionUtil.parseLimit(req) } ).exec(function(err, orders){
      if(err){
        return res.badRequest(err);
      }
      res.ok(orders);
    })
  },

  composeMealWithDate : function(meals){
    var mealDateObj = {
      summary : {},
      meals : {}
    };
    var preOrderCount = 0;
    var orderCount = 0;
    meals.forEach(function(meal){
      var dateDesc = util.humanizeDate(meal.pickups[0].pickupFromTime);
      if(mealDateObj.meals.hasOwnProperty(dateDesc)){
        mealDateObj.meals[dateDesc].meals.push(meal);
      }else{
        mealDateObj.meals[dateDesc] = {};
        mealDateObj.meals[dateDesc].meals = [meal];
      }
      if(meal.type==="order"){
        orderCount++;
      }else{
        preOrderCount++;
      }
    });
    mealDateObj.summary.orderCount = orderCount;
    mealDateObj.summary.preOrderCount = preOrderCount;
    return mealDateObj;
  }

  //To test after finishing review model

};

