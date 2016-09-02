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

describe('OrderController', function() {

  this.timeout(5000);

  describe('', function() {

    var guestEmail = 'enjoymyself1987@gmail.com'
    var password = '12345678';
    var guestId = "";
    var address = "1455 Market St, San Francisco";
    var farAddress = "7116 Tiant way, Elk Grove, CA 95758";
    var phone = "1-415-802-3853";

    it('should login or register an account for guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect("Location","/auth/done")
        .end(done)
    });

    it('should get user info', function(done){
      agent
        .get('/user/me')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          guestId = res.body.id;
          done()
        })
    })

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
            if(err){
              console.log(err);
              return done(err);
            }
            if(res.body.meals.length == 0){
              return done(Error("error getting any meal"));
            }
            var meal = res.body.meals[1];
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

    it('should order the meal with out of range error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 1;
      dishObj[dishId2] = 2;
      dishObj[dishId3] = 0;
      dishObj[dishId4] = 0;
      agent
        .post('/order')
        .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, address : farAddress, phone : phone, method : "delivery", mealId : mealId})
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          console.log(res.body);
          if(res.body.code != -6){
            return done(Error("not getting address out of range error"));
          }
          done();
        })
    })

    var orderId;
    it('should order the meal', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 1;
      dishObj[dishId2] = 2;
      dishObj[dishId3] = 0;
      dishObj[dishId4] = 0;
      agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2,
            pickupOption : 1,
            phone : phone,
            method : "pickup",
            mealId : mealId
          })
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

    it('should order the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 1;
      dishObj[dishId2] = 2;
      dishObj[dishId3] = 0;
      dishObj[dishId4] = 0;
      agent
          .post('/order')
          .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, address : address, phone : phone, method : "delivery", mealId : mealId, delivery_fee : 0})
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            if(res.body.code != -1){
              return done(Error("not getting not enough quantity error"));
            }
            done();
          })
    })

    it('should adjust the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 2;
      dishObj[dishId2] = 2;
      dishObj[dishId3] = 0;
      dishObj[dishId4] = 0;
      agent
          .post('/order/' + orderId + "/adjust")
          .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, mealId : mealId, delivery_fee : 0})
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            if(res.body.code != -1){
              return done(Error("not getting not enough quantity error"));
            }
            done();
          })
    })

    it('should adjust the dish successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 1;
      dishObj[dishId2] = 0;
      dishObj[dishId3] = 0;
      dishObj[dishId4] = 0;
      agent
          .post('/order/' + orderId + "/adjust")
          .send({orders : dishObj, subtotal : price1 * 1, mealId : mealId, delivery_fee : 0})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    })

    it('should adjust the dish again successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 1;
      dishObj[dishId2] = 2;
      dishObj[dishId3] = 3;
      dishObj[dishId4] = 0;
      agent
          .post('/order/' + orderId + "/adjust")
          .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2 + price3 * 3, mealId : mealId, delivery_fee : 0})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    })

    it('should cancel the dish at schedule successfully', function (done) {
      agent
          .post('/order/' + orderId + "/cancel")
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    })

    it('should not adjust the cancelled order', function (done) {
      agent
          .post('/order/' + orderId + "/adjust")
          .expect(403)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    })

    it('should order the meal again', function (done) {
      var dishObj = {};
      dishObj[dishId1] = 1;
      dishObj[dishId2] = 2;
      dishObj[dishId3] = 0;
      dishObj[dishId4] = 0;
      agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2,
            address : address,
            phone : phone,
            method : "delivery",
            pickupOption : 2,
            mealId : mealId,
            delivery_fee : 0
          })
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

    it('should change the order to preparing', function (done) {
      agent
          .put('/order/' + orderId)
          .send({status : "preparing"})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            if(res.body.status != "preparing"){
              return done(Error("error changing order to preapring"));
            }
            orderId = res.body.id;
            done();
          })
    })

    it('should request for cancelling', function (done) {
      agent
          .post('/order/' + orderId + "/cancel")
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    })

    var email = 'aimbebe.r@gmail.com';
    var password = '12345678';

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should reject an cancelling order', function (done) {
      agent
          .put('/order/' + orderId + "/reject")
          .send({msg:"The meal is being cooked, too late to cancel"})
          .expect(200)
          .end(function(err,res){
            done();
          })
    });

    it('should login or register an account for guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should request for cancelling', function (done) {
      agent
          .post('/order/' + orderId + "/cancel")
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    })

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should confirm an cancelling order', function (done) {
      agent
          .put('/order/' + orderId + "/confirm")
          .expect(200)
          .end(function(err,res){
            done();
          })
    });

  });

});
