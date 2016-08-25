/**
 * Created by shengrong on 11/19/15.
 */

var assert = require('assert'),
    sinon = require('sinon'),
    config = require('../../../config/stripe.js'),
    stripe = require('stripe')(config.StripeKeys.secretKey),
    request = require("supertest-as-promised");
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('MealController', function() {

  this.timeout(32000);

  describe('build a meal with dishes', function() {

    var hostId;
    var email = 'aimbebe.r@gmail.com';
    var password = '12345678';
    var address = {"street":"1974 palou ave","city" : "San Francisco", "zip" : 94124, "phone" : "(415)802-3853"};

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should become a host if is not one', function (done) {
      agent
        .post('/user/becomeHost')
        .expect(200)
        .end(function(err,res){
          if(res.body.user.host == undefined){
            return done(Error("become host for a logged user doesn't work"));
          }
          hostId = res.body.user.host;
          done();
        })
    });

    it('should create bank info for host', function (done) {
      stripe.tokens.create({
        bank_account: {
          country: 'US',
          currency: 'usd',
          routing_number: '110000000',
          account_number: '000123456789'
        }
      }, function(err, token) {
        agent
          .post("/bank")
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({
            token : token.id
          })
          .expect(200)
          .end(function(err, res){
            if(res.body.bank_name != "STRIPE TEST BANK"){
              return done(Error("error creating bank, bank name doesen't match(STRIPE TEST BANK)"));
            }
            done();
          })
      });
    });

    var dish1;
    var dish2;
    var dish3;
    var dish4;
    it('should create couple dishes', function (done) {
      agent
          .post('/dish')
          .send({title : '韭菜盒子',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId, isVerified : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish1 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '猪肉馅饼',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId, isVerified : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish2 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '五彩面',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'entree', chef : hostId, isVerified : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish3 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '糖水',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'dessert', chef : hostId, isVerified : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish4 = res.body.id;
            done();
          })
    });


    var mealId;
    var preorderMealId;
    var leftQty = {};
    var totalQty = {};


    it('should create a order type meal ', function (done) {
      var now = new Date();
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      for(var i=1; i<=4; i++){
        switch(i){
          case 1:
            leftQty[dish1] = i;
            totalQty[dish1] = 5;
            break;
          case 2:
            leftQty[dish2] = i;
            totalQty[dish2] = 5;
            break;
          case 3:
            leftQty[dish3] = i;
            totalQty[dish3] = 5;
            break;
          case 4:
            leftQty[dish4] = i;
            totalQty[dish4] = 5;
            break;
        }
      }
      agent
          .post('/meal')
          .send({provideFromTime: new Date(now.getTime() + 1000 * 60 * 11), provideTillTime: new Date(now.getTime() + 1000 * 2 * 3600), leftQty: leftQty, totalQty: totalQty, county : 'San Francisco County', title : "私房面馆", type : "order", dishes : dishes, cover : dish1, minimalOrder : 5, status : 'off'})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            if(res.body.chef != hostId){
              return done(Error("error creating meal"));
            }
            mealId = res.body.id;
            done();
          })
    })

    it('should create an preorder type meal ', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisoc, CA 94124",
        "method" : "pickup"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery"
      }];
      agent
          .post('/meal')
          .send({provideFromTime: now, provideTillTime: new Date(now.getTime() + 1000 * 3600), pickups : JSON.stringify(pickups),  leftQty: leftQty, totalQty: totalQty, county : 'San Francisco County', title : "私房面馆", type : "preorder", dishes : dishes, status : "off", cover : dish1, minimalOrder : 1})
          .expect(200)
          .end(function(err,res){
            if(res.body.chef != hostId){
              return done(Error("error creating meal"));
            }
            preorderMealId = res.body.id;
            done();
          })
    })

    it('should search the meals in San Francisco and with a keyword of 菜式 but no records are found', function (done) {
      agent
          .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(res.body.meals.length != 0){
              return done(Error("error searching for meal"));
            }
            done();
          })
    })

    it('should not turn one meal on, because missing address info', function (done) {
      agent
        .post('/meal/' + mealId + "/on")
        .expect(302)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          done();
        })
    })

    it('should update address info for host', function (done) {
      agent
        .put('/host/' + hostId)
        .send({address:[address]})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.city != "San Francisco"){
            return done(Error("error geocoding or updating address"));
          }
          done();
        })
    });

    it('should turn one meal on', function (done) {
      agent
        .post('/meal/' + mealId + "/on")
        .expect(200)
        .toPromise()
        .delay(31000)
        .then(function(res){
          agent
            .get('/job?name=MealStartJob&data.mealId=' + mealId)
            .expect(200)
            .then(function(res){
              if(res.body.length != 1){
                return done(Error('meal start reminding jobs count not right'));
              }
              done();
            })
            .catch(function(err){
              done(err)
            })
        })
        .catch(function(err){
          done(err);
        })
    })


    it('should search the meals in San Francisco and with a keyword of 菜式 with no results', function (done) {
      agent
        .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(res.body.meals.length != 0){
            return done(Error("meal should be not active yet"));
          }
          done();
        })
    })

    it('should update the meals provideFromTime to now and appear in the search results', function(done){
      var now = new Date()
      agent
        .put('/meal/' + mealId)
        .send({
          status : 'on',
          provideFromTime : now,
          provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
          minimalOrder : 5
        })
        .expect(200)
        .toPromise()
        .delay(31000)
        .then(function(res){
          agent
            .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err,res){
              if(res.body.meals.length != 1){
                return done(Error("meal should be not active yet"));
              }
              done();
            })
        })
        .catch(function(err){
          done(err);
        })
    })

    it('should cancel the meal starting reminder and should not start a new one because start time less than 10 minutes', function(done){
      agent
        .get('/job?data.mealId=' + mealId)
        .expect(200)
        .then(function(res){
          if(res.body.length != 0){
            return done(Error('meal start reminding jobs count not right'));
          }
          done();
        })
        .catch(function(err){
          done(err)
        })
    })


    it('should turn another meal on and schedule preorder schedule end job', function (done) {
      agent
        .post('/meal/' + preorderMealId + "/on")
        .expect(200)
        .toPromise()
        .delay(31000)
        .then(function(res){
          agent
            .get('/job?name=MealScheduleEndJob&data.mealId=' + preorderMealId)
            .expect(200)
            .then(function(res){
              if(res.body.length != 1){
                return done(Error('meal shedule end jobs not get scheduled correctly'));
              }
              done();
            })
            .catch(function(err){
              done(err)
            })
        })
        .catch(done)
    })



    it('should search the meals in San Francisco and with a keyword of 菜式 again', function (done) {
      agent
          .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(res.body.meals.length != 2){
              return done(Error("error searching for meal"));
            }
            done();
          })
    })

  });

});
