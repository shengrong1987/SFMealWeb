
var assert = require('assert'),
    sinon = require('sinon'),
    should = require('should'),
    request = require('supertest'),
    moment = require('moment');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('OrderController', function() {

  this.timeout(20000);
  var address = "221 Woodrow St, Daly City, CA 94014";
  var guestEmail = 'enjoymyself1987@gmail.com';
  var adminEmail = 'admin@sfmeal.com';
  var hostEmail = 'aimbebe.r@gmail.com';
  var password = '12345678';
  var guestId = "";
  var farAddress = "7116 Tiant way, Elk Grove, CA 95758";
  var phone = "1-415-802-3853";
  const SERVICE_FEE = 0

  describe('', function() {

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
    });

    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    var price4;
    var dish1LeftQty;
    it('should get a meal', function (done) {
      agent
          .get('/meal')
          .expect(200)
          .end(function(err,res){
            if(err){
              console.log(err);
              return done(err);
            }
            var meal = res.body.meals.meals[Object.keys(res.body.meals.meals)[0]].meals[0];
            mealId = meal.id;
            dishId1 = meal.dishes[0].id;
            dishId2 = meal.dishes[1].id;
            dishId3 = meal.dishes[2].id;
            dishId4 = meal.dishes[3].id;
            price1 = meal.dishes[0].price;
            price2 = meal.dishes[1].price;
            price3 = meal.dishes[2].price;
            price4 = meal.dishes[3].price;
            dish1LeftQty = meal.leftQty[dishId1];
            done();
          })
    });

    it('should order the meal with pickup method not match selected method error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : address, phone : phone },
          method : "delivery",
          mealId : mealId,
          pickupOption : 1
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-21);
          done();
        })
    });

    it('should order the meal with no pickup option selected error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
    });

    it('should order the meal with out of range error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({orders : dishObj, subtotal : price1 * 1 + price2 * 2, contactInfo : { address : farAddress, phone : phone }, method : "delivery", mealId : mealId, pickupOption : 2})
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          console.log(res.body);
          if(res.body.code !== -6){
            return done(Error("not getting address out of range error"));
          }
          done();
        })
    });

    it('should order the meal with delivery but get lack of phone error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
    });

    // it('should order the meal with pickup but get lack of name error', function (done) {
    //   var dishObj = {};
    //   dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
    //   dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
    //   dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
    //   dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
    //   agent
    //     .post('/order')
    //     .send({
    //       orders : dishObj,
    //       subtotal : price1 * 1 + price2 * 2,
    //       contactInfo : { phone : phone },
    //       paymentInfo : { method : 'online'},
    //       method : "pickup",
    //       mealId : mealId,
    //       pickupOption : 1
    //     })
    //     .expect(400)
    //     .end(function(err,res){
    //       if(err){
    //         return done(err);
    //       }
    //       res.body.code.should.be.equal(-31);
    //       done();
    //     })
    // });

    it('should order the meal with pickup but get lack of phone error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
    });

    var orderId;
    var userPoints = 0;
    it('should order the meal', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 2,  preference : [{ property : 'super sweet', extra : 1 },{ property : 'super sweet', extra : 1 }], price : price4 };
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
            // var tax = Math.round((price1 + price2 * 2 + (price4*2+2))*0.085*100);
            var chargesTotal = Math.round(((price1 + price2 * 2 + (price4*2 + 2)) + SERVICE_FEE) * 100);
            userPoints += Math.floor(chargesTotal / 100);
            // res.body.tax.should.be.equal(tax);
            res.body.customerName.should.be.equal('sheng');
            res.body.customerPhone.should.be.equal(phone);
            res.body.customer.should.be.equal(guestId);
            Object.keys(res.body.charges).should.have.length(1);
            res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(chargesTotal);
            dish1LeftQty = dish1LeftQty - 1;
            res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
            orderId = res.body.id;
            done();
          })
    });
  //
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
      dishObj[dishId1] = { number : 1 , preference : [{ property : 'hot', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 1,
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
          res.body.code.should.be.equal(-20);
          done();
        })
    });

    // it('should order the dish with preference and get subtotal not match error', function (done) {
    //   var dishObj = {};
    //   dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1};
    //   dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2};
    //   dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3};
    //   dishObj[dishId4] = { number : 1 , preference : [{ property : 'super sweet', extra : 5}], price : price4};
    //   agent
    //     .post('/order')
    //     .send({
    //       orders : dishObj,
    //       subtotal : price4 * 1,
    //       contactInfo : { address : address, phone : phone },
    //       paymentInfo : { method : 'online'},
    //       method : "delivery",
    //       mealId : mealId,
    //       pickupOption : 2
    //     })
    //     .expect(400)
    //     .end(function(err,res){
    //       if(err){
    //         return done(err);
    //       }
    //       res.body.code.should.be.equal(-3);
    //       done();
    //     })
    // });

    it('should order the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 5 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price2 * 5,
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
  //
    it('should adjust the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 6 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
          .post('/order/' + orderId + "/adjust")
          .send({
            orders : dishObj,
            subtotal : price2 * 6,
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
  //
    it('should adjust the dish with less amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept','application/json')
        .send({orders : dishObj, subtotal : price1 * 1, mealId : mealId, delivery_fee : 0})
        .expect('Content-type',/json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          // var tax = Math.round(price1 * 0.085 * 100);
          // res.body.tax.should.be.equal(tax);
          userPoints -= Math.floor((price2 * 2 + (price4 + 1) * 2));
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
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
  //
    it('should adjust the dish with equal amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept', 'application/json')
        .send({orders : dishObj, subtotal : price2 * 1, mealId : mealId, delivery_fee : 0})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          // var tax = Math.round(price2 * 0.085 * 100);
          // res.body.tax.should.be.equal(tax);
          dish1LeftQty++;
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
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
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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

    it('should not order the meal with points and coupon at the same time', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
    });

    it('should adjust the dish with greater amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept', 'application/json')
        .send({orders : dishObj, subtotal : price2 + price3, mealId : mealId})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          userPoints += Math.floor(price3 * 1);
          // var tax = Math.round((price2 + price3) * 0.085 * 100);
          // res.body.tax.should.be.equal(tax);
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          done();
        })
    });

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
        .set('Accept','application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          done();
        })
    });

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
    });

    it('should update the user name', function (done) {
      agent
        .put('/user/' + guestId)
        .send({
          firstname : "guest"
        })
        .expect(200)
        .end(done)
    });

    it('should order the meal again', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
          dish1LeftQty--;
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          orderId = res.body.id;
          done();
        })
    })

    it('should not order the meal again with points', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-48);
          done();
        })
    });

    it('logout user account', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    })

    it('should login as administrator', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should verify user email', function (done) {
      agent
        .put('/user/' + guestId)
        .send({emailVerified : true})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.emailVerified.should.be.true();
          done();
        })
    })

    it('should login as guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect("Location","/auth/done")
        .end(done)
    });
  //
    it('should order the meal again with points', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
          if(res.body.customer !== guestId){
            return done(Error("error making order"));
          }
          res.body.redeemPoints.should.be.equal("13");
          var chargesTotal = ((price3 * 1) + SERVICE_FEE) + 3.99 - 1.3;
          res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(Math.round(chargesTotal * 100));
          res.body.application_fees[Object.keys(res.body.application_fees)[0]].should.be.equal(160);
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          done();
        })
    });

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
      var now = new Date();
      agent
        .put('/meal/' + mealId)
        .send({
          status : 'on',
          provideFromTime : now,
          provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
          delivery_fee : 10.00
        })
        .expect(200)
        .end(function(err, res){
          res.body.delivery_fee.should.be.equal(10.00);
          done();
        })
    });

    it('should not cancel the order at schedule as a host', function(done){
      agent
        .put('/order/' + orderId + '/cancel')
        .expect(403)
        .end(done)
    });

    it('should not adjust the order at schedule as a host', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
            if(res.body.status !== "preparing"){
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
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
        .set('Accept','application/json')
        .expect('Content-type',/json/)
        .expect(200)
        .end(function(err,res){
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
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
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
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
        .set('Accept','application/json')
        .expect('Content-type',/json/)
        .expect(200)
        .end(function(err,res){
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
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

    it('should request for adjusting for less order amount', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
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
        .set('Accept','application/json')
        .expect('Content-type',/json/)
        .expect(200)
        .end(function(err,res){
          dish1LeftQty++;
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
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
        .set('Accept', 'application/json')
        .expect('Content-type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          done();
        })
      });
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
      var price4;
      var dish1LeftQty;

      it('should get a order meal', function (done) {
        agent
          .get('/meal')
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var meal = res.body.meals.meals.orders.meals[0];
            mealId = meal.id;
            dishId1 = meal.dishes[0].id;
            dishId2 = meal.dishes[1].id;
            dishId3 = meal.dishes[2].id;
            dishId4 = meal.dishes[3].id;
            price1 = meal.dishes[0].price;
            price2 = meal.dishes[1].price;
            price3 = meal.dishes[2].price;
            price4 = meal.dishes[3].price;
            dish1LeftQty = meal.leftQty[dishId1];
            console.log("meal id: " + mealId);
            done();
          })
      })

      var orderId;
      it('should order the meal with delivery with pickup option invalid error', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
        dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
        dishObj[dishId1] = { number : 1,  preference : [{ property : '', extra : 0}], price : price1 };
        dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
            dish1LeftQty--;
            res.body.tax.should.be.equal(0);
            res.body.customer.should.be.equal(guestId);
            res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
            done()
          })
      })
    })

  describe('order a meal with coupon', function() {

    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    var price4;
    var orderId;
    var phone = "1(415)802-3853";
    var guestEmail = 'enjoymyself1987@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
    var password = '12345678';
    var email = 'aimbebe.r@gmail.com';
    var dish1LeftQty;

    it('should login a guest account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });


    var userId;

    it('should get user id', function(done){
      agent
        .get('/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          userId = res.body.id;
          done();
        })

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
          var meal = res.body.meals.meals[Object.keys(res.body.meals.meals)[1]].meals[0];
          mealId = meal.id;
          dishId1 = meal.dishes[0].id;
          dishId2 = meal.dishes[1].id;
          dishId3 = meal.dishes[2].id;
          dishId4 = meal.dishes[3].id;
          price1 = meal.dishes[0].price;
          price2 = meal.dishes[1].price;
          price3 = meal.dishes[2].price;
          price4 = meal.dishes[3].price;
          dish1LeftQty = meal.leftQty[dishId1];
          done();
        })
    });

    it('logout user account', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    })

    it('login as admin', function(done){
      agent
        .post('/auth/login?type=local')
        .send({
          email : adminEmail,
          password : password
        })
        .expect(302)
        .end(done)
    })

    it('should verify users email', function(done){
      agent
        .put('/user/' + userId)
        .send({
          emailVerified : false
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.emailVerified.should.be.false();
          done();
        })
    });

    it('logout user account', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    })

    it('login as user', function(done){
      agent
        .post('/auth/login?type=local')
        .send({
          email : guestEmail,
          password : password
        })
        .expect(302)
        .end(done)
    })

    it('should not be able to order a meal with coupon because email unverified', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-48);
          done();
        })
    });

    it('logout user account', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    })

    it('login as admin', function(done){
      agent
        .post('/auth/login?type=local')
        .send({
          email : adminEmail,
          password : password
        })
        .expect(302)
        .end(done)
    })

    it('should verify users email', function(done){
      agent
        .put('/user/' + userId)
        .send({
          emailVerified : true
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.emailVerified.should.be.true();
          done();
        })
    });

    it('logout user account', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    })

    it('login as user', function(done){
      agent
        .post('/auth/login?type=local')
        .send({
          email : guestEmail,
          password : password
        })
        .expect(302)
        .end(done)
    })

    it('should be able to order a meal with coupon', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
          res.body.transfer[Object.keys(res.body.transfer)[0]].should.be.equal(100);
          res.body.charges[Object.keys(res.body.charges)[0]].should.be.equal(Math.round((price1+SERVICE_FEE-1)*100));
          res.body.application_fees[Object.keys(res.body.application_fees)[0]].should.be.equal(80);
          dish1LeftQty--;
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          orderId = res.body.id;
          done();
        })
    });

    it('should get adjust order view', function (done){
      agent
        .get('/order/' + orderId + '/adjust-form')
        .expect(200, done)
    });

    it('should be able to order a meal with coupon greater than original order', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
          res.body.discountAmount.should.be.equal(price2);
          res.body.transfer[Object.keys(res.body.transfer)[0]].should.be.equal((price2 - price2*0.2)*100);
          orderId = res.body.id;
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          done();
        })
    });

    it('should not be able to order another meal with same coupon', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
      dishObj[dishId1] = { number : 2 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
      dishObj[dishId1] = { number : 2 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
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
          res.body.status.should.be.equal('preparing');
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

    it('should update the order to ready', function(done){
      agent
        .put('/order/' + orderId + '/ready')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.status.should.be.equal('ready');
          done();
        })
    })

    it('should update the order to received', function(done){
      agent
        .put('/order/' + orderId + '/receive')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.status.should.be.equal('review');
          done();
        })
    })
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
    var price4;
    var orderId;
    var phone = "(415)802-3853";
    var adminEmail = 'admin@sfmeal.com';
    var password = '12345678';
    var user5Email = "referraltest@gmail.com";
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
          var meal = res.body.meals.meals[Object.keys(res.body.meals.meals)[0]].meals[0];
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
    });

    it('should not be able to order a meal without name & phone', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
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
    });

    it('should be able to order a meal with cash with no card', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
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
          // res.body.tax.should.be.equal(price3 * 0.085 * 100);
          res.body.application_fees['cash'].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
          res.body.feeCharges[Object.keys(res.body.feeCharges)[0]].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
          res.body.customerPhone.should.be.equal(customerPhone);
          res.body.customerName.should.be.equal(customerName);
          orderId = res.body.id;
          done();
        })
    });

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should login referrer account', function (done) {
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

    it('should get points', function (done) {
      agent
        .get('/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.points.should.be.equal(50);
          done();
        })
    });

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should login user account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : user5Email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    });
  //
    it('should adjust the dish with more amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({orders : dishObj, subtotal : price1+price3, mealId : mealId, delivery_fee : 0})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          // var tax = Math.round((price1+price3) * 0.085 * 100);
          // res.body.tax.should.be.equal(tax);
          Object.keys(res.body.feeCharges).should.have.length(2);
          res.body.feeCharges[Object.keys(res.body.feeCharges)[0]].should.be.equal(((price3) * 0.2 + SERVICE_FEE) * 100);
          res.body.feeCharges[Object.keys(res.body.feeCharges)[1]].should.be.equal(((price2) * 0.2) * 100);
          done();
        })
    });

    it('should adjust the dish with less amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({orders : dishObj, subtotal : price1 * 1, mealId : mealId, delivery_fee : 0})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          // var tax = Math.round(price1 * 0.085 * 100);
          // res.body.tax.should.be.equal(tax);
          res.body.feeCharges[Object.keys(res.body.feeCharges)[0]].should.be.equal(SERVICE_FEE * 100);
          res.body.feeCharges[Object.keys(res.body.feeCharges)[1]].should.be.equal((price2 * 0.2) * 100);
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
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
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
          // res.body.tax.should.be.equal(price3 * 0.085 * 100);
          res.body.application_fees['cash'].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
          res.body.customerPhone.should.be.equal(customerPhone);
          res.body.customerName.should.be.equal(customerName);
          orderId = res.body.id;
          done();
        })
    });

    it('should be able to order a meal with cash with no card', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
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
          // res.body.tax.should.be.equal(price3 * 0.085 * 100);
          res.body.application_fees['cash'].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
          res.body.feeCharges[Object.keys(res.body.feeCharges)[0]].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
          res.body.customerPhone.should.be.equal(customerPhone);
          res.body.customerName.should.be.equal(customerName);
          res.body.isExpressCheckout.should.be.false();
          orderId = res.body.id;
          done();
        })
    });

    it('should be able to cancel a cash order', function(done){
      agent
        .post('/order/' + orderId + '/cancel')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.paymentMethod.should.be.equal('cash');
          res.body.should.have.property('feeCharges');
          Object.keys(res.body.feeCharges).should.have.length(1);
          res.body.feeCharges[Object.keys(res.body.feeCharges)[0]].should.be.equal(0);
          res.body.charges['cash'].should.be.equal(0);
          res.body.application_fees['cash'].should.be.equal(0);
          done();
        })
    });

    it('should get home page filter by county with no results', function(done){
      agent
        .get('/')
        .set('Cookie', ['county=San Francisco County'])
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('hosts').with.length(1);
          done();
        })
    });

  });

  describe('order a meal with express checkout', function() {

    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    var price4;
    var orderId;

    it('should logged out current user', function (done) {
      agent
        .post('/auth/logout')
        .expect(200)
        .end(function(err,res){
          done();
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
          var meal = res.body.meals.meals[Object.keys(res.body.meals.meals)[1]].meals[0];
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

    it('should be able to order a meal', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 * 1,
          pickupOption : 1,
          method : "pickup",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc"},
          paymentInfo : { method : 'cash'}
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          // res.body.tax.should.be.equal(price3 * 0.085 * 100);
          res.body.application_fees['cash'].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
          res.body.customerPhone.should.be.equal("(415)111-1111");
          res.body.customerName.should.be.equal("abc");
          res.body.isExpressCheckout.should.be.true();
          orderId = res.body.id;
          done();
        })
    });

    it("should get an order receipt", function(done){
      agent
        .get('/order/' + orderId + "/receipt")
        .expect(200, done)
    });

    it("should download an order receipt", function(done){
      agent
        .get('/order/' + orderId + "/receipt/download")
        .expect(200, done)
    });
  });

  describe('order a meal with party order', function() {

    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    var price4;
    var price5;
    var orderId;
    var dishId5;
    var dish1LeftQty;

    it('should get meals', function (done) {
      agent
        .get('/meal')
        .expect(200)
        .end(function(err,res){
          if(err){
            console.log(err);
            return done(err);
          }
          var meal = res.body.meals.meals[Object.keys(res.body.meals.meals)[0]].meals[0];
          mealId = meal.id;
          dishId1 = meal.dishes[0].id;
          dishId2 = meal.dishes[1].id;
          dishId3 = meal.dishes[2].id;
          dishId4 = meal.dishes[3].id;
          price1 = meal.dishes[0].price;
          price2 = meal.dishes[1].price;
          price3 = meal.dishes[2].price;
          price4 = meal.dishes[3].price;
          dish1LeftQty = meal.leftQty[dishId1];
          done();
        })
    })

    it('should get a meal"s catering menu', function(done){
      agent
        .get('/meal/' + mealId + '?party=true')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('partyRequirement');
          res.body.should.have.property('dishes').with.length(5);
          var dish5 = res.body.dishes[4];
          dishId5 = dish5.id;
          price5 = dish5.price;
          done();
        })
    })

    it('should be able to order a catering meal', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 5 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 5 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 5 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId5] = { number : 5 , preference : [{ property : '', extra : 0}], price : price4 };
      var deliveryDate = moment().add(2,'days')._d;
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 5 + price2 * 5 + price3 * 5 + price5 * 5,
          pickupOption : 5,
          method : "delivery",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc", address : "7116 tiant way, Elk Grove, CA 95758"},
          paymentInfo : { method : 'cash'},
          customInfo : { time : deliveryDate, comment : "so exciting, please bring some utensils"},
          isPartyMode : true
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.isPartyMode.should.be.true();
          res.body.delivery_fee.should.be.above(30);
          new Date(res.body.pickupInfo.pickupFromTime).getTime().should.be.equal(deliveryDate.getTime());
          res.body.pickupInfo.deliveryCenter.should.be.equal("1974 Palou Ave, San Francisco, CA 94124, USA");
          res.body.leftQty[dishId1].should.be.equal(dish1LeftQty);
          done();
        })
    });

    it('should not be able to order a catering meal with less than minimal amount', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId5] = { number : 0 , preference : [{ property : '', extra : 0}], price : price5 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1,
          pickupOption : 5,
          method : "delivery",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc", address : "1455 Market St, San Francisco"},
          paymentInfo : { method : 'cash'},
          customInfo : { time : new Date(2018, 5, 29), comment : "so exciting, please bring some utensils"},
          isPartyMode : true
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-33);
          done();
        })
    });

    it('should not be able to order a catering meal within 24 hours from now', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 5 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 5 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 5 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId5] = { number : 5 , preference : [{ property : '', extra : 0}], price : price5 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 5 + price2 * 5 + price3 * 5 + price5 * 5,
          pickupOption : 5,
          method : "delivery",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc", address : "1455 Market St, San Francisco"},
          paymentInfo : { method : 'cash'},
          customInfo : { time : new Date(), comment : "so exciting, please bring some utensils"},
          isPartyMode : true
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-34);
          done();
        })
    });

    it('should not be able to order a catering meal without custom info', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 5 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 5 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 5 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId5] = { number : 5 , preference : [{ property : '', extra : 0}], price : price5 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 5 + price2 * 5 + price3 * 5 + price5 * 5,
          pickupOption : 5,
          method : "delivery",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc", address : "1455 Market St, San Francisco"},
          paymentInfo : { method : 'cash'},
          isPartyMode : true
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-35);
          done();
        })
    });

    it('should not be able to order a catering meal with wrong pickup method', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 5 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 5 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 5 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId5] = { number : 5 , preference : [{ property : '', extra : 0}], price : price5 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 5 + price2 * 5 + price3 * 5 + price5 * 5,
          pickupOption : 4,
          method : "pickup",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc", address : "1455 Market St, San Francisco"},
          paymentInfo : { method : 'cash'},
          customInfo : { time : new Date(2017, 5, 29), comment : "so exciting, please bring some utensils"},
          isPartyMode : true
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-36);
          done();
        })
    });
  });

  describe('order a meal with dynamic price dish', function(){
    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var minimalPrice1 = 3;
    var qtyRate1 = 10;
    var priceRate1 = 1;
    var price2;
    var price3;
    var price4;
    var minimalPrice4 = 6;
    var qtyRate4 = 10;
    var priceRate4 = 2;
    var price5;
    var orderId;
    var dishId5;
    var guestEmail = 'enjoymyself1987@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
    var hostEmail = 'aimbebe.r@gmail.com';
    var password = '12345678';
    var dynamicDishOrderNumber;
    var dish1OrderNumber;
    var dish4OrderNumber;

    it('should get meals', function (done) {
      agent
        .get('/meal')
        .expect(200)
        .end(function(err,res){
          if(err){
            console.log(err);
            return done(err);
          }
          var meal = res.body.meals.meals[Object.keys(res.body.meals.meals)[0]].meals[0];
          mealId = meal.id;
          dishId1 = meal.dishes[0].id;
          dishId2 = meal.dishes[1].id;
          dishId3 = meal.dishes[2].id;
          dishId4 = meal.dishes[3].id;
          price1 = meal.dishes[0].price;
          price2 = meal.dishes[1].price;
          price3 = meal.dishes[2].price;
          price4 = meal.dishes[3].price;
          dynamicDishOrderNumber = parseInt(meal.totalQty[dishId1]) - parseInt(meal.leftQty[dishId1]);
          dynamicDishOrderNumber += parseInt(meal.totalQty[dishId4]) - parseInt(meal.leftQty[dishId4]);
          dish1OrderNumber = parseInt(meal.totalQty[dishId1]) - parseInt(meal.leftQty[dishId1]);
          dish4OrderNumber = parseInt(meal.totalQty[dishId4]) - parseInt(meal.leftQty[dishId4]);
          done();
        })
    });

    it('should login as host', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : hostEmail, password: password})
        .expect(302)
        .expect("Location","/auth/done")
        .end(done)
    });

    it('should be able to update dish left qty on active meal', function(done){
      var totalQty = {};
      totalQty[dishId1] = 20;
      totalQty[dishId2] = 20;
      totalQty[dishId3] = 20;
      totalQty[dishId4] = 25;
      var now = new Date();
      agent
        .put('/meal/' + mealId)
        .send({
          totalQty : totalQty,
          provideFromTime: now,
          provideTillTime: new Date(now.getTime() + 1000 * 60 * 30),
          status : "on",
          isSupportDynamicPrice : true
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.totalQty[dishId1].should.be.equal(20);
          res.body.leftQty[dishId1].should.be.equal(20-dish1OrderNumber);
          res.body.leftQty[dishId4].should.be.equal(25-dish4OrderNumber);
          done();
        })
    });

    it('should not be able to enable dynamic price on a dish without price info', function(done){
      agent
        .put('/dish/' + dishId1)
        .set('Accept', 'application/json')
        .send({
          isDynamicPriceOn : true
        })
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-3);
          done();
        })
    });

    it('should be able to enable dynamic price on a dish', function(done){
      agent
        .put('/dish/' + dishId1)
        .set('Accept', 'application/json')
        .send({
          isDynamicPriceOn : true,
          qtyRate : qtyRate1,
          priceRate : priceRate1,
          minimalPrice : minimalPrice1
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isDynamicPriceOn.should.be.true();
          res.body.qtyRate.should.be.equal(qtyRate1);
          done();
        })
    });

    it('should be able to add dynamic dish to a meal', function(done){
      agent
        .post('/dish/' + dishId1 + "/dynamicMeals/" + mealId)
        .expect(200)
        .end(done)
    });

    it('should be able to enable dynamic price on a dish', function(done){
      agent
        .put('/dish/' + dishId4)
        .set('Accept', 'application/json')
        .send({
          isDynamicPriceOn : true,
          qtyRate : qtyRate4,
          priceRate : priceRate4,
          minimalPrice : minimalPrice4
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isDynamicPriceOn.should.be.true();
          done();
        })
    });

    it('should be able to add dynamic dish to a meal', function(done){
      agent
        .post('/dish/' + dishId4 + "/dynamicMeals/" + mealId)
        .expect(200)
        .end(done)
    });

    it('should login as guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect("Location","/auth/done")
        .end(done)
    });

    var newPrice1;
    it('should be able to order a meal', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 10 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 10,
          pickupOption : 1,
          method : "pickup",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc"},
          paymentInfo : { method : 'online'}
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          dynamicDishOrderNumber += 10;
          var meal = res.body;
          newPrice1 = price1 - parseInt(dynamicDishOrderNumber / qtyRate1) * priceRate1;
          newPrice1 = Math.max(minimalPrice1, newPrice1);
          res.body.orders[dishId1].price.should.be.equal(newPrice1);
          res.body.subtotal.should.be.equal(newPrice1 * 10);
          orderId = res.body.id;
          done();
        })
    });

    it('should order a meal with outdated dynamic price', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : '', extra : 0}], price : 10 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 7 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : 10 + 8 * price4,
          pickupOption : 1,
          method : "pickup",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc"},
          paymentInfo : { method : 'online'}
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          dynamicDishOrderNumber += 8;
          price4 = price4 - (dynamicDishOrderNumber / qtyRate4) * priceRate4;
          price4 = Math.max(price4, minimalPrice4);
          res.body.subtotal.should.be.equal(newPrice1+price4*7);
          done();
        })
    });

    it('should logged out current user', function (done) {
      agent
        .post('/auth/logout')
        .expect(200)
        .end(function(err,res){
          done();
        })
    });

    it('should order a meal of dynamic price with cash', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 2 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price4 * 2,
          pickupOption : 2,
          method : "delivery",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc", address : address},
          paymentInfo : { method : 'cash'}
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          dynamicDishOrderNumber += 2;
          var newPrice4 = price4 - (dynamicDishOrderNumber / qtyRate4) * priceRate4;
          newPrice4 = Math.max(newPrice4, minimalPrice4);
          res.body.orders[dishId4].price.should.be.equal(newPrice4);
          res.body.subtotal.should.be.equal(newPrice4 * 2);
          done();
        })
    });
  });

  describe('order a meal with Alipay', function(){
    var mealId;
    var dishId1;
    var dishId2;
    var dishId3;
    var dishId4;
    var price1;
    var price2;
    var price3;
    var price4;
    var price5;
    var orderId;
    var dishId5;
    var mealProvideFrom;

    it('should get meals', function (done) {
      agent
        .get('/meal')
        .expect(200)
        .end(function(err,res){
          if(err){
            console.log(err);
            return done(err);
          }
          var meal = res.body.meals.meals[Object.keys(res.body.meals.meals)[0]].meals[0];
          mealId = meal.id;
          dishId1 = meal.dishes[0].id;
          dishId2 = meal.dishes[1].id;
          dishId3 = meal.dishes[2].id;
          dishId4 = meal.dishes[3].id;
          price1 = meal.dishes[0].price;
          price2 = meal.dishes[1].price;
          price3 = meal.dishes[2].price;
          price4 = meal.dishes[3].price;
          mealProvideFrom = meal.provideFromTime;
          done();
        })
    });

    var sourceId,client_secret;

    it('should be able to submit order with Alipay', function(done){
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price3 ,
          pickupOption : 1,
          method : "pickup",
          mealId : mealId,
          contactInfo : { phone : "(415)111-1111", name : "abc", address : "1455 Market St, San Francisco"},
          paymentInfo : { method : 'alipay'}
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('sourceId');
          res.body.should.have.property('source');
          res.body.source.status.should.be.equal('pending');
          sourceId = res.body.source.id;
          client_secret = res.body.source.client_secret;
          done();
        })
    })

    it('should response to alipay callback with error with wrong sourceId', function(done){
      agent
        .get('/order/process?source=123123' + '&client_secret' + client_secret)
        .expect(400, done)
    })

    it('should response to Alipay callback with error with no secret', function(done){
      agent
        .get('/order/process?source='+sourceId)
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-38);
          done();
        })
    })

    it('should response to alipay callback with error with wrong secret', function(done){
      agent
        .get('/order/process?source='+sourceId+"&client_secret=123123123")
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-38);
          done();
        })
    });

    it('should response to alipay callback waiting payment by default', function(done){
      agent
        .get('/order/process?source='+sourceId+"&client_secret="+client_secret)
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-39);
          done();
        })
    });

    it('should login as host', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : hostEmail, password: password})
        .expect(302)
        .expect("Location","/auth/done")
        .end(done)
    });

    it('should update the meals provideTillTime to 3 minute later and see meal schedule end job', function(done){
      var now = moment()._d;
      var threeMinutesLater = moment().add('3','minutes')._d;
      mealProvideFrom = moment(mealProvideFrom).subtract('30','minutes')._d;
      agent
        .put('/meal/' + mealId)
        .send({
          status : 'on',
          provideFromTime : mealProvideFrom,
          provideTillTime : threeMinutesLater,
          minimalOrder : 5
        })
        .expect(200)
        .end(done)
    })
  })

  describe('should order a meal and give referer points', function(){
    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should login if account exist', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : "referraltest@gmail.com", password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('referral should have 50 points', function(done){
      agent
        .get('/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.points.should.be.equal(50);
          done();
        })
    })
  })
});
