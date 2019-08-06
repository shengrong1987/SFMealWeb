
var assert = require('assert'),
    sinon = require('sinon');
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
});

describe('ReviewController', function() {

  this.timeout(12000);

  describe('', function() {

    var hostId;
    var email = 'aimbebe.r@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
    var password = '12345678';
    var address = "1455 Market St, San Francisco, CA 94103";
    var phone = "1-415-802-3853";
    var pickupPickupOptionId;
    var deliveryPickupOptionId;
    var highMinimalPickupOptionId;
    var guestEmail = 'enjoymyself1987@gmail.com';

    it('should login admin account', function (done){
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should get pickup options', function (done){
      agent
        .get('/pickupOption')
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(5);
          pickupPickupOptionId = res.body.filter(function(p){
            return p.method === "pickup" && p.minimalOrder !== 50;
          })[0].id;
          deliveryPickupOptionId = res.body.filter(function(p){
            return p.method === "delivery" && p.location === "1974 Palou Ave, San Francisco, CA 94124, USA";
          })[0].id;
          highMinimalPickupOptionId = res.body.filter(function(p){
            return p.minimalOrder === 50;
          })[0].id;
          done();
        })
    });

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should login host account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should get host info', function(done){
      agent
        .get('/host/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          hostId = res.body.host.id;
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
    var price4;
    it('should get a meal ', function (done) {
      agent
          .get('/meal')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(res.body.length === 0){
              return done(Error("error getting any meal"));
            }
            var meal = res.body.meals.filter(function(m){
              return m.type === "order";
            })[0];
            mealId = meal.id;
            dishId1 = meal.dishes[0].id;
            dishId2 = meal.dishes[1].id;
            dishId3 = meal.dishes[2].id;
            dishId4 = meal.dishes[3].id;
            price1 = meal.dishes[0].price;
            price2 = meal.dishes[1].price;
            price3 = meal.dishes[2].price;
            price4 = meal.dishes[3].price;
            done();
          })
    })

    var guestId = "";

    it('should login or register an account for guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should get user info with collects', function(done){
      agent
        .get('/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('collects').with.length(1);
          guestId = res.body.id;
          done()
        })
    })

    var orderId;
    it('should order the meal', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1, preference : [{ property : '', extra : 0}], price : price1};
      dishObj[dishId2] = { number : 0, preference : [{ property : '', extra : 0}], price : price2};
      dishObj[dishId3] = { number : 1, preference : [{ property : '', extra : 0}], price : price3};
      dishObj[dishId4] = { number : 1, preference : [{ property : '', extra : 0}], price : price4};
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 + price3 + price4,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "pickup",
          pickupMeal : mealId,
          pickupOption : 1,
          tip : 0
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.orders[0].customer !== guestId){
            return done(Error("error making order"));
          }
          orderId = res.body.orders[0].id;
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
          res.body.should.have.property('reviewing_orders').with.length(3);
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

    it('should get user info including orders that need to be reviewed', function(done){
      agent
        .get('/user/me')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.orders.some(function(order){
            return order.status === "review";
          }).should.be.true();
          done();
        })
    });

    it('should leave a private review for one dish of the meal', function (done) {
      agent
        .post('/review')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({meal : mealId, dish : dishId4, score : 1.0, review : "not so good.",user: guestId})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('meal');
          res.body.meal.id.should.be.equal(mealId);
          res.body.dish.id.should.be.equal(dishId4);
          res.body.isPublic.should.be.false();
          done();
        })
    })

    it('should leave batch reviews', function (done) {
      var reviews = [{
        "dish" : dishId1,
        "score" : 4.0,
        "content" : "Very delicious could be more"
      },{
        "dish" : dishId2,
        "score" : 5.0,
        "content" : "Perfect"
      }];
      agent
        .post('/review')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({meal : mealId, reviews : reviews,user: guestId})
        .expect(200, done)
    })

    it('should leave a review for the meal', function (done) {
      agent
        .post('/review')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({meal : mealId, score : 5.0, review : "Very delicious could be more",user: guestId})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.meal.id !== mealId){
            return done(Error("error creating review"));
          }
          done();
        })
    })

    it('should not leave a review for another dish of the meal', function (done) {
      agent
        .post('/review')
        .send({meal : mealId, dish : dishId2, score : 4.5, review : "Very delicious could be more",user: guestId})
        .expect(400)
        .end(function(err, res){
          if(err){
            console.log(err);
            return done(err);
          }
          res.body.code.should.be.equal(-1);
          done();
        })
    })

    it('should not be able to leave a review for the already reviewed meal', function (done) {
      agent
        .post('/review')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({meal : mealId, dish : dishId1, score : 5, review : "Very delicious could be more",user: guestId})
        .expect(400)
        .end(function(err,res){
          res.body.code.should.be.equal(-1);
          done();
        })
    })

    it('should get host profile of correct number of reviews', function (done){
      agent
        .get('/host/public/' + hostId)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('reviews').with.length(4);
          // res.body.numberOfReviews.should.be.equal(4);
          // res.body.avgScore.should.be.equal("3.75");
          done();
        })
    });

  });

});
