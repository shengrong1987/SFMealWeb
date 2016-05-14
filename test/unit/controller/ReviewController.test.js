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

describe('ReviewController', function() {

  describe('', function() {

    var hostId;
    var email = 'host@gmail.com';
    var password = '12345678';
    var address = "1455 Market St, San Francisco";
    var phone = "1-415-802-3853";

    var guestEmail = 'guest@gmail.com'

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

    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    it('should get a meal ', function (done) {
      agent
          .get('/meal')
          .expect(200)
          .end(function(err,res){
            if(res.body.length == 0){
              return done(Error("error getting any meal"));
            }
            var meal = res.body.meals[0];
            mealId = meal.id;
            dishId1 = meal.dishes[0].id;
            dishId2 = meal.dishes[1].id;
            dishId3 = meal.dishes[2].id;
            dishId4 = meal.dishes[3].id;
            price1 = meal.dishes[0].price;
            price2 = meal.dishes[1].price;
            price3 = meal.dishes[2].price;
            done();
          })
    })

    var guestId = "";

    it('should login or register an account for guest', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : guestEmail, password: password})
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != guestEmail){
              return done(Error("not login with the same account(email not the same)"))
            }
            guestId = res.body.id;
            done();
          })
    });

    var orderId;
    it('should order the meal', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 1;
      dishObj[dishId2] = 2;
      dishObj[dishId3] = 0;
      dishObj[dishId4] = 0;
      agent
        .post('/order')
        .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, address : address, phone : phone, method : "pickup", mealId : mealId, delivery_fee : 0})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.customer != guestId){
            return done(Error("error making order"));
          }
          orderId = res.body.id;
          done();
        })
    })

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

    it('should change the order to complete', function(done){
      agent
        .put("/order/" + orderId + "/ready")
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    });

    it('should change the order status to receive', function(done){
      agent
        .put("/order/" + orderId + "/receive")
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    });

    it('should login or register an account for guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(200)
        .end(function(err,res){
          if(res.body.auth.email != guestEmail){
            return done(Error("not login with the same account(email not the same)"))
          }
          guestId = res.body.id;
          done();
        })
    });


    it('should leave a review for one dish of the meal', function (done) {
      agent
          .post('/review')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({meal : mealId, dish : dishId1, score : 4.0, review : "Very delicious could be more",user: guestId})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            if(res.body.meal != mealId || res.body.dish != dishId1){
              return done(Error("error creating review"));
            }
            done();
          })
    })

    it('should leave a review for another dish of the meal', function (done) {
      agent
        .post('/review')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({meal : mealId, dish : dishId2, score : 4.5, review : "Very delicious could be more",user: guestId})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.meal != mealId || res.body.dish != dishId2){
            return done(Error("error creating review"));
          }
          done();
        })
    })

    it('should not be able to leave a review for the already reviewed meal', function (done) {
      agent
        .post('/review')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({meal : mealId, dish : dishId1, score : 5, review : "Very delicious could be more",user: guestId})
        .expect(403)
        .end(function(err,res){
          done();
        })
    })

  });

});
