/**
* Review.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    dish : {
      model : 'Dish'
    },
    title : {
      type : 'string',
      required : true
    },
    price : {
      type : 'string'
    },
    meal : {
      model : 'Meal'
    },
    score : {
      type : 'float',
      required : true
    },
    review : {
      type : 'string'
    },
    user : {
      model : 'User'
    },
    host : {
      model : "Host"
    },
    username : {
      type : 'string'
    },
    isPublic : {
      type : 'boolean',
      defaultsTo : true
    },
    get_formatted_time : function(){
      var month = this.updatedAt.getMonth()+1;
      var date = this.updatedAt.getDate();
      return month + "/" + date + "/" + this.updatedAt.getFullYear();
    }
  },
  afterCreate : function(review, cb){
    var dishId = review.dish;
    var mealId = review.meal;
    var score = review.score;
    var user = review.user;
    Dish.find(dishId).exec(function(err,dish){
      var dishRecord = dish.pop();
      dishRecord.score = ((dishRecord.score + score)/2).toFixed(2);
      dishRecord.numberOfReviews += 1;
      dishRecord.save(function(err,d){
        if(err){
          return cb(err);
        }
        sails.log.info("mealId: " + mealId);
        if(!mealId){
          return cb();
        }
        Meal.findOne(mealId).populate('dishes').exec(function(err,meal){
          var dishes = meal.dishes;
          var total_score = 0;
          dishes.forEach(function(dish){
            total_score += dish.score;
          });
          meal.score = (total_score/dishes.length).toFixed(2);
          meal.numberOfReviews += 1;
          meal.save(function(err, m){
            Host.findOne(dishRecord.chef).exec(function(err, host){
              host.numberOfReviews = host.numberOfReviews || 0;
              host.numberOfReviews += 1;
              sails.log.info("number of review: " + host.numberOfReviews);
              host.score = host.score || 0;
              host.score += score;
              host.avgScore = (host.score / host.numberOfReviews).toFixed(2);
              sails.log.info("average score of review: " + host.avgScore);
              host.save(cb);
            })
          })
        });
      });
    });
  }
};

