/**
 * Created by shengrong on 11/19/15.
 */

var assert = require('assert'),
    sinon = require('sinon');
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('MealController', function() {

  this.timeout(5000);

  describe('build a meal with dishes', function() {

    var hostId;
    var email = 'host@gmail.com';
    var password = '12345678';

    it('should login or register an account', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : email, password: password})
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != email){
              return done(Error("not login with the same account(email not the same)"))
            }
            hostId = res.body.host;
            done();
          })
    });

    it('should become a host if is not one', function (done) {
      if(!hostId){
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
      }else{
        done();
      }
    });

    var dish1;
    var dish2;
    var dish3;
    var dish4;
    it('should create couple dishes', function (done) {
      agent
          .post('/dish')
          .send({title : '韭菜盒子',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish1 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '猪肉馅饼',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish2 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '五彩面',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'entree', chef : hostId})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish3 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '糖水',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'dessert', chef : hostId})
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
          .send({provideFromTime: new Date(now.getTime() - 3600 * 60 * 5), provideTillTime: new Date(now.getTime() + 3600 * 60 * 5), leftQty: leftQty, totalQty: totalQty, county : 'San Francisco County', title : "私房面馆", type : "order", dishes : dishes, status : "on",cover : dish1})
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
      agent
          .post('/meal')
          .send({provideFromTime: new Date(now.getTime() - 3600 * 60 * 5), provideTillTime: new Date(now.getTime() + 3600 * 60 * 5), pickupFromTime : new Date(now.getTime() + 7200 * 60 * 5), pickupTillTime : new Date(now.getTime() + 7500 * 60 * 5),  leftQty: leftQty, totalQty: totalQty, county : 'San Francisco County', title : "私房面馆", type : "preorder", dishes : dishes, status : "on", cover : dish1})
          .expect(200)
          .end(function(err,res){
            if(res.body.chef != hostId){
              return done(Error("error creating meal"));
            }
            done();
          })
    })

    it('should search the meals in San Francisco and with a keyword of 菜式', function (done) {
      agent
          .get('/meal/search?keyword=猪肉馅饼&county=San%20Francisco%20County')
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

    it('should turn one meal off', function (done) {
      agent
          .post('/meal/' + mealId + "/off")
          .expect(302)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    })

    it('should search the meals in San Francisco and with a keyword of 菜式 again', function (done) {
      agent
          .get('/meal/search?keyword=猪肉馅饼&county=San%20Francisco%20County')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(res.body.meals.length != 1){
              return done(Error("error searching for meal"));
            }
            done();
          })
    })



  });

});
