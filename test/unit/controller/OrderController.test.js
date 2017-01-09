
var assert = require('assert'),
    sinon = require('sinon'),
    should = require('should'),
    request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('OrderController', function() {

  this.timeout(20000);

  describe('', function() {

    var guestEmail = 'enjoymyself1987@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
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
    it('should get a meal', function (done) {
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
      dishObj[dishId1] = { number : 1};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
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
      dishObj[dishId1] = { number : 1};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
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
            var chargesTotal = price1 * 1 + price2 * 2 + 1;
            res.body.customer.should.be.equal(guestId);
            Object.keys(res.body.charges).should.have.length(1);
            res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(chargesTotal * 100);
            orderId = res.body.id;
            done();
          })
    })

    it('should order the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
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
      dishObj[dishId1] = { number : 2};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
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
      dishObj[dishId1] = { number : 1};
      dishObj[dishId2] = { number : 0};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
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
      dishObj[dishId1] = { number : 1};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 3};
      dishObj[dishId4] = { number : 0};
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

    it('should cancel the order at schedule successfully', function (done) {
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
      dishObj[dishId1] = { number : 1};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
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

    it('should login host account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });


    it('should not update any thing on meal with orders', function(done){
      var now = new Date()
      agent
        .put('/meal/' + mealId)
        .send({
          status : 'on',
          provideFromTime : now,
          provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
          delivery_fee : 10.00
        })
        .expect(400)
        .end(function(err, res){
          res.body.code.should.be.equal(-14);
          done();
        })
    })

    it('should not cancel the order at schedule as a host', function(done){
      agent
        .put('/order/' + orderId + '/cancel')
        .expect(403)
        .end(done)
    });

    it('should not adjust the order at schedule as a host', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0};
      dishObj[dishId2] = { number : 0};
      dishObj[dishId3] = { number : 1};
      dishObj[dishId4] = { number : 0};
      agent
        .post('/order/' + orderId + "/adjust")
        .send({
          orders : dishObj,
          subtotal : price3,
          mealId : mealId,
          delivery_fee : 0
        })
        .expect(403)
        .end(done)
    });

    it('should login as administrator', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

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

    it('should login as guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should request for cancelling', function (done) {
      agent
        .post('/order/' + orderId + "/cancel")
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    })

    it('should not confirm an cancelling order', function (done) {
      agent
        .put('/order/' + orderId + "/confirm")
        .expect(403)
        .end(done)
    });

    it('should login a guest account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should reject an cancelling order', function (done) {
      agent
        .put('/order/' + orderId + "/reject")
        .send({msg : "I am starving"})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }
          // res.body.status.should.be.equal('preparing');
          // res.body.lastStatus.should.be.equal('cancelling');
          done();
        })
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

    var email = 'aimbebe.r@gmail.com';
    var password = '12345678';

    it('should login host account', function (done) {
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
        .set('Accept', 'application/json')
        .send({msg : "I am starving"})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          // res.body.status.should.be.equal("preparing");
          // res.body.lastStatus.should.be.equal("cancelling");
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

    describe('order with delivery option', function(){
      it('should login or register an account for guest', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : guestEmail, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
      });

      var mealId;
      var dishId1;
      var dishId2;
      var dishId3;
      var dishId4;
      var price1;
      var price2;
      var price3;
      it('should get a order meal ', function (done) {
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

      var orderId;
      it('should not order the meal with delivery', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1};
        dishObj[dishId2] = { number : 2};
        dishObj[dishId3] = { number : 0};
        dishObj[dishId4] = { number : 0};
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2,
            phone : phone,
            method : "delivery",
            mealId : mealId
          })
          .expect(400)
          .end(done)
      })

      it('should login or register an account', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : email, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
      });

      it('should update the meal with support delivery', function(done){
        var now = new Date();
        agent
          .put('/meal/' + mealId)
          .send({
            provideFromTime : now,
            provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
            minimalOrder : 5,
            isDelivery : true,
            status : 'on'
          })
          .expect(200)
          .end(done)
      });

      it('should login or register an account for guest', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : guestEmail, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
      });

      it('should order the meal with delivery', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1, preference : 'make it super hot, plz'};
        dishObj[dishId2] = { number : 1};
        dishObj[dishId3] = { number : 0};
        dishObj[dishId4] = { number : 0};
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 1,
            phone : phone,
            pickupOption : 1,
            method : "delivery",
            mealId : mealId,
            address : address
          })
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            if(res.body.customer != guestId){
              return done(Error('error taking order'))
            }
            done()
          })
      })
    })

    describe('update dish number on active meal', function(){

      var dishObj = {};
      it('should login or register an account', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : email, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
      });

      it('should be able to set dish that is not ordered to 0', function(done){
        var now = new Date();
        dishObj[dishId1] = 5;
        dishObj[dishId2] = 5;
        dishObj[dishId3] = 5;
        dishObj[dishId4] = 1;
        agent
          .put("/meal/" + mealId)
          .send({
            provideFromTime : now,
            provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
            totalQty : dishObj,
            minimalOrder : 5,
            status : 'on'
          })
          .expect(200)
          .end(done);
      });

      it('should not set dish number lower than ordered number', function(done){
        var now = new Date();
        dishObj[dishId1] = 0;
        dishObj[dishId2] = 0;
        dishObj[dishId3] = 1;
        dishObj[dishId4] = 1;
        agent
          .put("/meal/" + mealId)
          .send({
            provideFromTime : now,
            provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
            totalQty : dishObj,
            minimalOrder : 5,
            status : 'on'
          })
          .expect(400)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            res.body.should.have.property("code");
            res.body.code.should.be.equal(-9);
            done();
          });
      });
    })
  });

  describe('order a meal with coupon', function() {

    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    var orderId;
    var phone = "1(415)802-3853";
    var guestEmail = 'enjoymyself1987@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
    var password = '12345678';

    it('should login a guest account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should get a meal', function (done) {
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

    it('should be able to order a meal with coupon', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 1};
      dishObj[dishId2] = { number : 0};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1,
          pickupOption : 1,
          phone : phone,
          method : "pickup",
          mealId : mealId,
          couponCode : "XMAS"
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.discountAmount.should.be.equal(1);
          res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(400);
          res.body.application_fees[Object.keys(res.body.application_fees)[0]].should.be.equal(180);
          orderId = res.body.id;
          done();
        })
    });

    it('should not be able to order another meal with same coupon', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0};
      dishObj[dishId2] = { number : 0};
      dishObj[dishId3] = { number : 1};
      dishObj[dishId4] = { number : 0};
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          pickupOption : 1,
          phone : phone,
          method : "pickup",
          mealId : mealId,
          couponCode : "XMAS"
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-15);
          done();
        })
    });

    it('should not adjust the order with coupon', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 2};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
      agent
        .post('/order/' + orderId + "/adjust")
        .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, mealId : mealId, delivery_fee : 0})
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-18);
          done();
        })
    });

    it('should not cancel the order with coupon', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 2};
      dishObj[dishId2] = { number : 2};
      dishObj[dishId3] = { number : 0};
      dishObj[dishId4] = { number : 0};
      agent
        .post('/order/' + orderId + "/cancel")
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-19);
          done();
        })
    });

  })

});
