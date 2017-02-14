
var assert = require('assert'),
    sinon = require('sinon');
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('ReviewController', function() {

  this.timeout(12000);

  describe('', function() {

    var hostId;
    var email = 'aimbebe.r@gmail.com';
    var password = '12345678';
    var address = "1455 Market St, San Francisco";
    var phone = "1-415-802-3853";

    var guestEmail = 'enjoymyself1987@gmail.com'

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
          hostId = res.body.id;
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

    it('should get user info', function(done){
      agent
        .get('/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          guestId = res.body.id;
          done()
        })
    })

    var orderId;
    it('should order the meal', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0};
      dishObj[dishId2] = { number : 1};
      dishObj[dishId3] = { number : 1};
      dishObj[dishId4] = { number : 1};
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price2 + price3 + price4,
          address : address,
          phone : phone,
          method : "delivery",
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
          res.body.dish.should.be.equal(dishId4);
          res.body.isPublic.should.be.false();
          done();
        })
    })


    it('should leave a review for one dish of the meal', function (done) {
      agent
          .post('/review')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({meal : mealId, dish : dishId3, score : 4.0, review : "Very delicious could be more",user: guestId})
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            if(res.body.meal.id != mealId || res.body.dish != dishId3){
              return done(Error('error reviewing dish'));
            }
            done();
          })
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
          if(res.body.meal.id != mealId){
            return done(Error("error creating review"));
          }
          done();
        })
    })

    it('should not leave a review for another dish of the meal', function (done) {
      agent
        .post('/review')
        .send({meal : mealId, dish : dishId2, score : 4.5, review : "Very delicious could be more",user: guestId})
        .expect(403)
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
        .expect(403)
        .end(function(err,res){
          res.body.code.should.be.equal(-1);
          done();
        })
    })

  });

});
