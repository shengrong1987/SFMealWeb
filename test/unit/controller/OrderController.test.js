
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
  var address = "1974 Palou Ave, San Francisco, CA 94124";

  describe('', function() {

    var guestEmail = 'enjoymyself1987@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
    var hostEmail = 'aimbebe.r@gmail.com';
    var password = '12345678';
    var guestId = "";
    var farAddress = "7116 Tiant way, Elk Grove, CA 95758";
    var phone = "1-415-802-3853";

    it('should login as guest', function (done) {
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
    var price4;
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
            price4 = meal.dishes[3].price;
            done();
          })
    })

    it('should order the meal with pickup method not match selected method error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, contactInfo : { address : address, phone : phone }, method : "delivery", mealId : mealId, pickupOption : 1})
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-21);
          done();
        })
    })

    it('should order the meal with no pickup option selected error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, contactInfo : { address : address, phone : phone }, method : "delivery", mealId : mealId})
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-20);
          done();
        })
    })

    it('should order the meal with out of range error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, contactInfo : { address : farAddress, phone : phone }, method : "delivery", mealId : mealId, pickupOption : 2})
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

    it('should order the meal with delivery but get lack of phone error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : address },
          paymentInfo : { method : 'online'},
          method : "delivery",
          mealId : mealId,
          pickupOption : 2})
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-31);
          done();
        })
    })

    it('should order the meal with pickup but get lack of name error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { phone : phone },
          paymentInfo : { method : 'online'},
          method : "pickup",
          mealId : mealId,
          pickupOption : 1
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-31);
          done();
        })
    })

    it('should order the meal with pickup but get lack of phone error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { name : "sheng" },
          paymentInfo : { method : 'online'},
          method : "pickup",
          mealId : mealId,
          pickupOption : 1
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-31);
          done();
        })
    })

    var orderId;
    var userPoints = 0;
    it('should order the meal', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 2, preference : [{ property : 'super sweet', extra : 1 },{ property : 'super sweet', extra : 1 }]};
      var subtotal = parseFloat(price1*1) + parseFloat(price2*2) + parseFloat((price4*2+2));
      agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : subtotal,
            pickupOption : 1,
            method : "pickup",
            mealId : mealId,
            contactInfo : {
              name : 'sheng',
              phone : phone
            },
            paymentInfo : {
              method : 'online'
            }
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var tax = Math.round((price1 + price2 * 2 + (price4*2+2))*0.085*100);
            var chargesTotal = Math.round(((price1 * 1 + price2 * 2 + (price4*2 + 2)) * 1.085 + 1) * 100);
            userPoints += Math.floor(chargesTotal / 100);
            res.body.tax.should.be.equal(tax);
            res.body.customerName.should.be.equal('sheng');
            res.body.customerPhone.should.be.equal(phone);
            res.body.customer.should.be.equal(guestId);
            Object.keys(res.body.charges).should.have.length(1);
            res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(chargesTotal);
            orderId = res.body.id;
            done();
          })
    })

    it('user should get certain reward points', function(done){
      agent
        .get('/user/me')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.points.should.be.equal(userPoints);
          done()
        })
    });

    it('should order the dish with preference and get preference not exist error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : 'hot', extra : 0}]};
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}]  };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}]  };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 1,
          contactInfo : { address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          mealId : mealId,
          })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-20);
          done();
        })
    })

    it('should order the dish with preference and get subtotal not match error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}]  };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}]  };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}]  };
      dishObj[dishId4] = { number : 1 , preference : [{ property : 'super sweet', extra : 5}]};
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price4 * 1,
          contactInfo : { address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          mealId : mealId,
          pickupOption : 2
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-3);
          done();
        })
    })

    it('should order the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2,
            contactInfo : { address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "delivery",
            mealId : mealId,
            pickupOption : 2
          })
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.code.should.be.equal(-1);
            done();
          })
    })

    it('should adjust the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
          .post('/order/' + orderId + "/adjust")
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2,
            mealId : mealId
            })
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.code.should.be.equal(-1);
            done();
          })
    })

    it('should adjust the dish with less amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
          .post('/order/' + orderId + "/adjust")
          .send({orders : dishObj, subtotal : price1 * 1, mealId : mealId, delivery_fee : 0})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var tax = Math.round(price1 * 0.085 * 100);
            res.body.tax.should.be.equal(tax);
            var points = Math.floor((price2 * 2 + ((price4+1) * 2)) * 1.085);
            userPoints -= points;
            done();
          })
    })

    it('user should get certain reward points', function(done){
      agent
        .get('/user/me')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.points.should.be.equal(userPoints);
          done()
        })
    });

    it('should adjust the dish with equal amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
          .post('/order/' + orderId + "/adjust")
          .send({orders : dishObj, subtotal : price2 * 1, mealId : mealId, delivery_fee : 0})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var tax = Math.round(price2 * 0.085 * 100);
            res.body.tax.should.be.equal(tax);
            done();
          })
    })

    it('user should get certain reward points', function(done){
      agent
        .get('/user/me')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.points.should.be.equal(userPoints);
          done()
        })
    });

    it('should not order the meal with insufficient points', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupOption : 2,
          mealId : mealId,
          points : 30
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-25);
          done();
        })
    })

    it('should not order the meal with points and coupon', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupOption : 2,
          mealId : mealId,
          points : 10,
          couponCode : 'XMAS'
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-23);
          done();
        })
    })

    it('should adjust the dish with greater amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order/' + orderId + "/adjust")
        .send({orders : dishObj, subtotal : price2 + price3, mealId : mealId})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          var points = Math.floor(price3 * 1 * 1.085);
          userPoints += points;
          var tax = Math.round((price2 + price3) * 0.085 * 100);
          res.body.tax.should.be.equal(tax);
          done();
        })
    })

    it('user should get certain reward points', function(done){
      agent
        .get('/user/me')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          console.log("user points is: " + userPoints);
          res.body.points.should.be.equal(userPoints);
          done()
        })
    });

    it('should cancel the order at schedule successfully', function (done) {
      agent
          .post('/order/' + orderId + "/cancel")
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.tax.should.be.equal(0);
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

    it('should update the user name', function (done) {
      agent
        .put('/user/' + guestId)
        .send({
          firstname : "guest"
        })
        .expect(200)
        .end(done)
    })

    it('should order the meal again', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupOption : 2,
          mealId : mealId
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.customer.should.be.equal(guestId);
          res.body.customerName.should.be.equal("sheng");
          orderId = res.body.id;
          done();
        })
    })

    it('should order the meal again with points', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupOption : 2,
          mealId : mealId,
          delivery_fee : 0,
          points : 13
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.customer != guestId){
            return done(Error("error making order"));
          }
          res.body.discountAmount.should.be.equal(1.3);
          var chargesTotal = ((price3 * 1)*1.085 + 1) + 3.99 - 1.3;
          res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(Math.round(chargesTotal * 100));
          res.body.application_fees[Object.keys(res.body.application_fees)[0]].should.be.equal(260);
          done();
        })
    })

    var hostId;
    it('should login host account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : hostEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    });

    it('should get host id', function (done) {
      agent
        .get('/host/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('host');
          hostId = res.body.host.id;
          done();
        })
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
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
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

    it('should login as host', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should request for adjusting', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order/' + orderId + "/adjust")
        .send({
          orders : dishObj,
          subtotal : price3,
          mealId : mealId,
          delivery_fee : 0
        })
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

    it('should not confirm an adjusting order', function (done) {
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

    it('should reject an adjusting order', function (done) {
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

    it('should request for adjusting for same order amount', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order/' + orderId + "/adjust")
        .send({
          orders : dishObj,
          subtotal : price1 + price3,
          mealId : mealId,
          delivery_fee : 0
        })
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

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should confirm an adjusting order', function (done) {
      agent
          .put('/order/' + orderId + "/confirm")
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

    it('should request for adjusting for greater order amount', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order/' + orderId + "/adjust")
        .send({
          orders : dishObj,
          subtotal : price1 + price3 + price4,
          mealId : mealId,
          delivery_fee : 0
        })
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

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should confirm an adjusting order', function (done) {
      agent
        .put('/order/' + orderId + "/confirm")
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

    it('should request for adjusting for lesser order amount', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order/' + orderId + "/adjust")
        .send({
          orders : dishObj,
          subtotal : price4,
          mealId : mealId,
          delivery_fee : 0
        })
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

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should confirm an adjusting order', function (done) {
      agent
        .put('/order/' + orderId + "/confirm")
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

      it('should get a order meal', function (done) {
        agent
          .get('/meal')
          .expect(200)
          .end(function(err,res){
            if(err){
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
            console.log("meal id: " + mealId);
            done();
          })
      })

      var orderId;
      it('should order the meal with delivery with pickup option invalid error', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
        dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
        dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
        dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "delivery",
            mealId : mealId,
            pickupOption : 2
          })
          .expect(400)
          .end(function(err, res){
            res.body.code.should.be.equal(-11)
            done();
          })
      })

      it('should login or register an account', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : hostEmail, password: password})
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
            status : 'on',
            type : 'order',
            isTaxIncluded : true
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
        dishObj[dishId1] = { number : 1,  preference : [{ property : '', extra : 0}]};
        dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}] };
        dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
        dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 1,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            pickupOption : 2,
            method : "delivery",
            mealId : mealId,
            address : address
          })
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            res.body.tax.should.be.equal(0);
            res.body.customer.should.be.equal(guestId);
            done()
          })
      })
    })

    // describe('update dish number on active meal', function(){
    //
    //   var dishObj = {};
    //   it('should login or register an account', function (done) {
    //     agent
    //       .post('/auth/login?type=local')
    //       .send({email : email, password: password})
    //       .expect(302)
    //       .expect('Location','/auth/done')
    //       .end(done)
    //   });
    //
    //   // it('should be able to set dish that is not ordered to 0', function(done){
    //   //   var now = new Date();
    //   //   dishObj[dishId1] = 5;
    //   //   dishObj[dishId2] = 5;
    //   //   dishObj[dishId3] = 5;
    //   //   dishObj[dishId4] = 1;
    //   //   agent
    //   //     .put("/meal/" + mealId)
    //   //     .send({
    //   //       provideFromTime : now,
    //   //       provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
    //   //       totalQty : dishObj,
    //   //       minimalOrder : 5,
    //   //       status : 'on'
    //   //     })
    //   //     .expect(200)
    //   //     .end(done);
    //   // });
    //
    //   // it('should not set dish number lower than ordered number', function(done){
    //   //   var now = new Date();
    //   //   dishObj[dishId1] = 0;
    //   //   dishObj[dishId2] = 0;
    //   //   dishObj[dishId3] = 1;
    //   //   dishObj[dishId4] = 1;
    //   //   agent
    //   //     .put("/meal/" + mealId)
    //   //     .send({
    //   //       provideFromTime : now,
    //   //       provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
    //   //       totalQty : dishObj,
    //   //       minimalOrder : 5,
    //   //       status : 'on'
    //   //     })
    //   //     .expect(400)
    //   //     .end(function(err, res){
    //   //       if(err){
    //   //         return done(err);
    //   //       }
    //   //       res.body.should.have.property("code");
    //   //       res.body.code.should.be.equal(-9);
    //   //       done();
    //   //     });
    //   // });
    // })
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
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1,
          pickupOption : 1,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
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
          res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(Math.round(400*1.085));
          res.body.application_fees[Object.keys(res.body.application_fees)[0]].should.be.equal(180);
          orderId = res.body.id;
          done();
        })
    });

    it('should be able to order a meal with coupon greater than original order', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1,
          pickupOption : 1,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "pickup",
          mealId : mealId,
          couponCode : "5Dollar"
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.discountAmount.should.be.equal(4.34);
          res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(100);
          res.body.application_fees[Object.keys(res.body.application_fees)[0]].should.be.equal(180);
          orderId = res.body.id;
          done();
        })
    });

    it('should not be able to order another meal with same coupon', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          pickupOption : 1,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
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
      dishObj[dishId1] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
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
      dishObj[dishId1] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
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

  describe('order a meal with cash', function() {
    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    var orderId;
    var phone = "(415)802-3853";
    var adminEmail = 'admin@sfmeal.com';
    var password = '123456789';
    var user5Email = "user5@sfmeal.com";
    var userId;

    it('should login a guest account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : user5Email, password: password})
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
          res.body.should.have.property("auth");
          res.body.auth.email.should.be.equal(user5Email, "login user email does not match");
          userId = res.body.id;
          done()
        })
    })

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

    it('should not be able to order a meal without name & phone', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          pickupOption : 1,
          contactInfo : {},
          paymentInfo : { method : 'cash'},
          method : "pickup",
          mealId : mealId
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-31);
          done();
        })
    });

    var customerPhone = "(415)888-8888";
    var customerName = "user5";
    it('should update user profile', function (done) {
      agent
        .put('/user/' + userId)
        .send({
          firstname : customerName,
          phone : customerPhone
        })
        .expect(200)
        .end(function(err,res){
          done();
        })
    })

    it('should be able to order a meal with cash with no card', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          pickupOption : 1,
          contactInfo : {},
          paymentInfo : { method : 'cash'},
          method : "pickup",
          mealId : mealId
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.tax.should.be.equal(price3 * 0.085 * 100);
          res.body.application_fees['cash'].should.be.equal((price3 * 0.2 + 1) * 100);
          res.body.customerPhone.should.be.equal(customerPhone);
          res.body.customerName.should.be.equal(customerName);
          orderId = res.body.id;
          done();
        })
    });

    it('should adjust the dish with less amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order/' + orderId + "/adjust")
        .send({orders : dishObj, subtotal : price1 * 1, mealId : mealId, delivery_fee : 0})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          var tax = Math.round(price1 * 0.085 * 100);
          res.body.tax.should.be.equal(tax);
          done();
        })
    })

    it('should cancel the order with cash', function(done){
      agent
        .post('/order/' + orderId + "/cancel")
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          done();
        })
    });

    it('should be able to order a meal with cash with no card', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}] };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}] };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          pickupOption : 1,
          method : "pickup",
          mealId : mealId,
          contactInfo : {},
          paymentInfo : { method : 'cash'}
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.tax.should.be.equal(price3 * 0.085 * 100);
          res.body.application_fees['cash'].should.be.equal((price3 * 0.2 + 1) * 100);
          res.body.customerPhone.should.be.equal(customerPhone);
          res.body.customerName.should.be.equal(customerName);
          orderId = res.body.id;
          done();
        })
    });
  });

});
