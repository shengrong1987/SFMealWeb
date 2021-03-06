
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
  var _this = this;
  var address = "221 Woodrow St, Daly City, CA 94014";
  var guestEmail = 'enjoymyself1987@gmail.com';
  var adminEmail = 'admin@sfmeal.com';
  var hostEmail = 'aimbebe.r@gmail.com';
  var password = '12345678';
  var guestId = "";
  var farAddress = "7116 Tiant way, Elk Grove, CA 95758";
  var phone = "1-415-802-3853";
  const SERVICE_FEE = 0;
  const TRANSACTION_FEE = 1.02;
  var pickupPickupOptionId, pickupNickname;
  var deliveryPickupOptionId, deliveryNickname;
  var highMinimalPickupOptionId, highMinimalNickname;

  describe('', function() {

    var dishId1,dishId2,dishId3,dishId4,dishId5,dishId6,dishId7;
    var price1,price2,price3,price4,price5,price6,price7;
    var dish1LeftQty;

    it('should login as administrator', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should get dishes', function(done){
      agent
        .get('/dish?isVerified=true')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          dishId1 = res.body[0].id;
          dishId2 = res.body[1].id;
          dishId3 = res.body[2].id;
          dishId4 = res.body[3].id;
          dishId5 = res.body[4].id;
          dishId6 = res.body[5].id;
          dishId7 = res.body[6].id;
          price1 = res.body[0].price;
          price2 = res.body[1].price;
          price3 = res.body[2].price;
          price4 = res.body[3].price;
          price5 = res.body[4].price;
          price6 = res.body[5].price;
          price7 = res.body[6].price;
          console.log("dishId1" + dishId1);
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
    var systemDeliveryMealId;
    it('should get a meal', function (done) {
      agent
        .get('/meal')
        .set('Accept','application/json')
        .expect('Content-type',/json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          var meal = res.body.meals.filter(function(m){
            return m.title === "预定订单四点";
          })[0];
          var systemDeliveryMeal = res.body.meals.filter(function(m){
            return m.title === "预定系统配送";
          })[0];
          mealId = meal.id;
          systemDeliveryMealId = systemDeliveryMeal.id;
          dish1LeftQty = meal.leftQty[dishId1];
          done();
        })
    });

    it('should login admin account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should get pickup options', function (done) {
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
          pickupNickname = res.body.filter(function(p){
            return p.method === "pickup" && p.minimalOrder !== 50;
          })[0].nickname;
          deliveryPickupOptionId = res.body.filter(function(p){
            return p.method === "delivery" && p.location === "1974 Palou Ave, San Francisco, CA 94124, USA";
          })[0].id;
          deliveryNickname = res.body.filter(function(p){
            return p.method === "delivery" && p.location === "1974 Palou Ave, San Francisco, CA 94124, USA";
          })[0].nickname;
          highMinimalPickupOptionId = res.body.filter(function(p){
            return p.minimalOrder === 50;
          })[0].id;
          highMinimalNickname = res.body.filter(function(p){
            return p.minimalOrder === 50;
          })[0].nickname;
          console.log("normal pickup:" + pickupPickupOptionId, " &normal delivery: " + deliveryPickupOptionId + "& hight limit pickup: " +  highMinimalPickupOptionId);
          done();
        })
    });

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
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

    it('should order the meal with nickname not found error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : [], extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : [], extra : 0},{ property : [], extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : address, phone : phone },
          method : "delivery",
          pickupOption : pickupPickupOptionId,
          pickupDate : "today"
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-56);
          done();
        })
    });

    it('should order the meal with pickup method not found error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : [], extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : [], extra : 0},{ property : [], extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : [], extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : [], extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : address, phone : phone },
          method : "delivery",
          pickupNickname : pickupNickname,
          pickupOption : 1,
          pickupDate : "today"
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-22);
          done();
        })
    });

    it('should order the meal with pickup method not match selected method error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : [], extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : [], extra : 0},{ property : [], extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : [], extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : [], extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : address, phone : phone },
          method : "delivery",
          pickupNickname : pickupNickname,
          pickupOption : pickupPickupOptionId,
          pickupDate : "today"
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
      dishObj[dishId1] = { number : 1 , preference : [{ property : [], extra : 0}], extra: 0, price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : [], extra : 0},{ property : [], extra : 0}], extra: 0, price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : [], extra : 0}], extra: 0, price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : [], extra : 0}], extra: 0, price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : address, phone : phone },
          method : "delivery",
          pickupNickname : pickupNickname,
          pickupDate : "today"
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

    it('should order the meal with out of range error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : [], extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : [], extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [{ property : [], extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [{ property : [], extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : farAddress, phone : phone },
          paymentInfo : { method : 'cash'},
          method : "delivery",
          pickupNickname : deliveryNickname,
          pickupOption : deliveryPickupOptionId,
          pickupDate : "today"
        })
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
      dishObj[dishId1] = { number : 1, preference : [{ property : [], extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2, preference : [{ property : [], extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0, preference : [{ property : [], extra : 0}], price : price3 };
      dishObj[dishId4] = { number : 0, preference : [{ property : [], extra : 0}], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          contactInfo : { address : address },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupNickname : deliveryNickname,
          pickupOption : deliveryPickupOptionId,
          pickupDate : "today"
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
      dishObj[dishId1] = { number : 1 , preference : [{ property : [], extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 2 , preference : [{ property : [], extra : 0},{ property : [], extra : 0}], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 2,  preference : [{ property : ['super sweet'], extra : 1},{ property : ['ultra sweet'], extra : 2}], price : price4 };
      var subtotal = parseFloat(price1*1) + parseFloat(price2*2) + parseFloat((price4*2+2));
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : subtotal,
          pickupOption : pickupPickupOptionId,
          method : "pickup",
          pickupNickname : pickupNickname,
          contactInfo : {
            name : 'sheng',
            phone : phone
          },
          paymentInfo : {
            method : 'online'
          },
          pickupDate : "today",
          tip : 10
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          var o = res.body;
          var chargesTotal = Math.round(((price1 + price2 * 2 + (price4*2+3)) * TRANSACTION_FEE + SERVICE_FEE + 10) * 100);
          userPoints += Math.floor(chargesTotal / 200);
          o.contactInfo.name.should.be.equal('sheng');
          o.contactInfo.phone.should.be.equal(phone);
          o.customer.should.be.equal(guestId);
          o.isPaid.should.be.true();
          Object.keys(o.charges).should.have.length(1);
          o.charges[Object.keys(o.charges)[0]].should.be.equal(chargesTotal);
          o.application_fees[Object.keys(o.application_fees)[0]].should.be.equal((price1 + price2 * 2 + (price4*2+3)) * 100 * 0.2 + 10 * 100);
          dish1LeftQty = dish1LeftQty - 1;
          o.leftQty[dishId1].should.be.equal(dish1LeftQty);
          parseFloat(o.tip).should.be.equal(10);
          orderId = o.id;
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
          res.body.points.should.be.equal(userPoints);
          done()
        })
    });

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

    it('should be able to remove a dish from a meal with no active order', function(done){
      agent
        .delete('/meal/' + mealId + '/dishes/' + dishId3)
        .expect(200, done)
    })

    it('should be able to add a dish from a meal with no active order', function(done){
      agent
        .post('/meal/' + mealId + '/dishes/' + dishId3)
        .expect(200, done)
    })

    it('should update dish price on active meal', function(done){
      agent
        .put('/dish/' + dishId1)
        .send({
          price : price1 - 1
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.price.should.be.equal(price1-1);
          price1--;
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

    it('should order the dish with preference and get preference not exist error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [{ property : ['hot'], extra : 0}], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 1,
          contactInfo : { address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupNickname : deliveryNickname,
          pickupOption : deliveryPickupOptionId,
          pickupDate : 'today'
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-70);
          done();
        })
    });

    it('should order the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
      dishObj[dishId2] = { number : 5 , preference : [], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price2 * 5,
          contactInfo : { address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupOption : deliveryPickupOptionId,
          pickupNickname : deliveryNickname,
          pickupDate : 'today',
          tip : 0
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-1);
          done();
        })
    });

    it('should adjust the full dish and get not enough quantity error', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
      dishObj[dishId2] = { number : 6 , preference : [], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
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

    it('should adjust the dish with less amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept','application/json')
        .send({orders : dishObj, subtotal : price1 * 1, mealId : mealId, delivery_fee : 0, tip: 8})
        .expect('Content-type',/json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          console.log("old points:" + userPoints);
          userPoints -= (Math.floor((price2*2+price4*2+3+2)*TRANSACTION_FEE/2));
          console.log("new points:" + userPoints);
          res.body.orders[0].leftQty[dishId1].should.be.equal(dish1LeftQty);
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
          res.body.points.should.be.equal(userPoints);
          done()
        })
    });

    it('should adjust the dish with equal amount successfully', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept', 'application/json')
        .send({orders : dishObj, subtotal : price1 * 1, mealId : mealId, delivery_fee : 0, tip: 8})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
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

    // it('should not order the meal with insufficient points', function (done) {
    //   var dishObj = {};
    //   dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
    //   dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
    //   dishObj[dishId3] = { number : 1 , preference : [], price : price3 };
    //   dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
    //   agent
    //     .post('/order')
    //     .send({
    //       orders : dishObj,
    //       subtotal : price3 * 1,
    //       contactInfo : { name : "sheng", address : address, phone : phone },
    //       paymentInfo : { method : 'online'},
    //       method : "delivery",
    //       pickupOption : deliveryPickupOptionId,
    //       pickupNickname : deliveryNickname,
    //       pickupDate : 'today',
    //       points : 30
    //     })
    //     .expect(400)
    //     .end(function(err,res){
    //       if(err){
    //         return done(err);
    //       }
    //       res.body.code.should.be.equal(-25);
    //       done();
    //     })
    // })

    it('should not order the meal with points and coupon at the same time', function (done) {
      var dishObj = {};
      dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
      dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
      dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1,
          contactInfo : { name : "sheng", address : address, phone : phone },
          paymentInfo : { method : 'online'},
          method : "delivery",
          pickupOption : deliveryPickupOptionId,
          pickupNickname : deliveryNickname,
          pickupDate : 'today',
          points : 10,
          coupon : 'XMAS'
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
      dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
      dishObj[dishId2] = { number : 1 , preference : [], price : price2 };
      dishObj[dishId3] = { number : 1 , preference : [], price : price3 };
      dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
      agent
        .post('/order/' + orderId + "/adjust")
        .set('Accept', 'application/json')
        .send({orders : dishObj, subtotal : price2 + price3, mealId : mealId, tip: 10})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          console.log("old user points: " + userPoints);
          userPoints += Math.floor((price2+price3-price1+2)*TRANSACTION_FEE/2);
          console.log("new user points: " + userPoints);
          dish1LeftQty++;
          res.body.orders[0].leftQty[dishId1].should.be.equal(dish1LeftQty);
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
          res.body[0].leftQty[dishId1].should.be.equal(dish1LeftQty);
          userPoints -= Math.round((price2+price3+10)*TRANSACTION_FEE/2);
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
          res.body.points.should.be.equal(userPoints);
          done()
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

    var _multipleOrderId;
    var _multipleOrderId2;

    describe("take order with multiple meals", function(){

      var guestId;
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

      it('should login admin', function(done){
        agent
          .post('/auth/login?type=local')
          .send({email : adminEmail, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
      })

      it('should update the user points', function (done) {
        agent
          .put('/user/' + guestId)
          .send({
            points : userPoints+350,
            emailVerified : true
          })
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

      it('should take order with multiple meals', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 2 , preference : [], price : price2 };
        dishObj[dishId6] = { number : 1 , preference : [], price : price6 };
        agent
          .post('/order')
          .set('Accept','application/json')
          .expect('Content-Type', /json/)
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2 + price6,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            customInfo : { comment : "hhh"},
            method : "delivery",
            pickupOption : deliveryPickupOptionId,
            pickupNickname : deliveryNickname,
            pickupDate : 'today',
            tip : 0,
            points : 350
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            dish1LeftQty--;
            var o = res.body;
            o.discount.should.be.equal(price1 * 1 + price2 * 2 + (35-price1-price2*2));
            o.customer.should.be.equal(guestId);
            o.customerName.should.be.equal("sheng");
            o.pickupInfo.comment.should.be.equal("hhhhhh");
            let ids = o.id.split("+");
            _multipleOrderId = ids[0];
            _multipleOrderId2 = ids[1];
            done();
          })
      })

      it('should adjust multiple orders', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 2 , preference : [], price : price2 };
        dishObj[dishId6] = { number : 2 , preference : [], price : price6 };
        agent
          .put('/order/' + _multipleOrderId + "+" + _multipleOrderId2 + "/adjust")
          .send({
            orders : dishObj,
            subtotal : price2 * 2 + price6 * 2
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            dish1LeftQty++;
            res.body.orders.should.have.length(2);
            var o1 = res.body.orders[0];
            var o2 = res.body.orders[1];
            [price2 * 2, price6 * 2].should.containDeep([o1.subtotal, o2.subtotal]);
            done();
          })
      })

      it('should get user address', function(done){
        agent
          .get('/user/me')
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            res.body.address.should.have.length(1);
            res.body.address[0].street.should.be.equal("221 Woodrow Street");
            done();
          })
      })

      it('should login as administrator', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : adminEmail, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
      });

      it('should turn one meal off', function (done) {
        agent
          .post('/meal/' + systemDeliveryMealId + "/off")
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(done)
      })

      it('should not take order with dishes not in active meal', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
        dishObj[dishId7] = { number : 1 , preference : [], price : price7 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 + price7,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "delivery",
            pickupOption : deliveryPickupOptionId,
            pickupNickname : deliveryNickname,
            pickupDate : 'today',
            tip : 0
          })
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.code.should.be.equal(-57);
            done();
          })
      })

      it('should turn one meal on', function (done) {
        agent
          .post('/meal/' + systemDeliveryMealId + "/on")
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(done)
      })

      it('should login as guest', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : guestEmail, password: password})
          .expect(302)
          .expect("Location","/auth/done")
          .end(done)
      });

      it('should not order dishes under different meals of custom pickup nickname', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
        dishObj[dishId7] = { number : 1 , preference : [], price : price7 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 + price7,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'cash'},
            method : "delivery",
            pickupOption : deliveryPickupOptionId,
            pickupNickname : deliveryNickname,
            pickupDate : 'today',
            tip : 0
          })
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.code.should.be.equal(-57);
            done();
          })
      })

      it('should not take order not reach minimal order ', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 4 , preference : [], price : price1 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 4,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'cash'},
            method : "pickup",
            pickupOption : highMinimalPickupOptionId,
            pickupNickname : highMinimalNickname,
            pickupDate : 'today',
            tip : 0
          })
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.code.should.be.equal(-60);
            done();
          })
      })
    })

    describe('order meal with points', function(){

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

      it('should order the meal again with points', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 * 1,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "delivery",
            pickupOption : deliveryPickupOptionId,
            pickupNickname : deliveryNickname,
            pickupDate : 'today',
            delivery_fee : 0,
            points : 13,
            tip : 0
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var o = res.body;
            if(o.customer !== guestId){
              return done(Error("error making order"));
            }
            o.redeemPoints.should.be.equal("13");
            var chargesTotal = ((price3 * 1) * TRANSACTION_FEE + SERVICE_FEE) + 3.99 - 1.3;
            o.charges[Object.keys(o.charges)[0]].should.be.equal(Math.round(chargesTotal * 100));
            o.application_fees[Object.keys(o.application_fees)[0]].should.be.equal(320);
            o.meal.leftQty[dishId1].should.be.equal(dish1LeftQty);
            done();
          })
      });
    })

    describe('order adjust, cancel and confirm', function(){
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

      it('should update any thing on meal with orders', function(done){
        var now = new Date();
        agent
          .put('/meal/' + mealId)
          .send({
            status : 'on',
            provideFromTime : now,
            provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
            delivery_fee : 10.00,
            type : "preorder",
            nickname : "pickupSet1",
            isDelivery : true
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
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
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
            done();
          })
      })

      it('should login as host', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : hostEmail, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
      });

      it('should request for adjusting', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order/' + orderId + "/adjust")
          .send({
            orders : dishObj,
            subtotal : price3,
            mealId : mealId,
            delivery_fee : 0,
            tip : 0
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            res.body.orders[0].orders[dishId2].number.should.be.equal(1);
            res.body.orders[0].adjusting_orders[dishId3].number.should.be.equal(1);
            res.body.orders[0].adjusting_tip.should.be.equal(0);
            done();
          })
      })
    //
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
            res.body.status.should.be.equal('preparing');
            res.body.lastStatus.should.be.equal('adjust');
            res.body.orders[dishId3].number.should.be.equal(1);
            res.body.meal.leftQty[dishId1].should.be.equal(dish1LeftQty);
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
            res.body.meal.leftQty[dishId1].should.be.equal(dish1LeftQty);
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
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
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
            dish1LeftQty--;
            res.body.meal.leftQty[dishId1].should.be.equal(dish1LeftQty);
            Object.keys(res.body.adjusting_orders).length.should.be.equal(0);
            res.body.orders[dishId3].number.should.be.equal(1);
            res.body.last_orders[dishId3].number.should.be.equal(1);
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
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 1 , preference : [{ property : '', extra : 0}], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [], price : price4 };
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
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
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
            res.body.meal.leftQty[dishId1].should.be.equal(dish1LeftQty);
            done();
          })
      });
      //
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
            res.body.meal.leftQty[dishId1].should.be.equal(dish1LeftQty);
            done();
          })
      });
    })

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
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
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

      var orderId;
      var hostId;
      it('should NOT order the meal with delivery with pickup info not match error', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 2 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 2,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "delivery",
            pickupNickname : pickupNickname,
            pickupOption : pickupPickupOptionId,
            tip : 0
          })
          .expect(400)
          .end(function(err, res){
            res.body.code.should.be.equal(-21);
            done();
          })
      });

      it('should login or register an account', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : hostEmail, password: password})
          .expect(302)
          .expect('Location','/auth/done')
          .end(done)
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

      it('should update the meal with support delivery', function(done){
        var now = new Date();
        var tenHourLater = moment().add('10','hours')._d;
        agent
          .put('/meal/' + mealId)
          .send({
            provideFromTime : now,
            provideTillTime : tenHourLater,
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
        dishObj[dishId1] = { number : 1,  preference : [], price : price1 };
        dishObj[dishId2] = { number : 1 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price2 * 1,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            pickupOption : deliveryPickupOptionId,
            method : "delivery",
            pickupNickname : deliveryNickname,
            address : address,
            tip : 0
          })
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            var o = res.body;
            o.customer.should.be.equal(guestId);
            done()
          })
      })
    });

    describe('order with shipping option', function(){

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
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
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
            dish1LeftQty = meal.leftQty[dishId1];
            done();
          })
      });

      var orderId;
      var hostId;
      it('should order the meal with shipping with dish invalid error', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 4 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1 + price4 * 4,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "shipping",
            pickupNickname : deliveryNickname,
            pickupOption : deliveryPickupOptionId,
            tip : 0
          })
          .expect(400)
          .end(function(err, res){
            res.body.code.should.be.equal(-2);
            done();
          })
      });

      it('should order the meal with shipping with minimal not reach error', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price4 * 1,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "shipping",
            pickupNickname : deliveryNickname,
            pickupOption : deliveryPickupOptionId,
            tip : 0
          })
          .expect(400)
          .end(function(err, res){
            res.body.code.should.be.equal(-14);
            done();
          })
      })

      it('should order the meal with shipping', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 0,  preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 4 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price4 * 4,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            pickupOption : deliveryPickupOptionId,
            method : "shipping",
            pickupNickname : deliveryNickname,
            address : address,
            tip : 0
          })
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            var o = res.body;
            o.method.should.be.equal("shipping");
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
          .send({email: guestEmail, password: password})
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

      let $5couponId;
      let $10couponId;
      it('should get user coupons', function(done){
        agent
          .get('/user/coupon')
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err)
            }
            res.body.should.have.length(3);
            $5couponId = res.body.filter(function(coupon){
              return coupon.amount == 5
            })[0].id;
            $10couponId = res.body.filter(function(coupon){
              return coupon.amount == 10
            })[0].id;
            done();
          })
      });

      it('should get a meal', function (done) {
        agent
          .get('/meal')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(err){
              console.log(err);
              return done(err);
            }
            var meal = res.body.meals.filter(function(m){
              return m.type === "preorder" && m.nickname.includes("pickupSet1") && m.title === "预定订单四点";
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

      let otherCouponId;
      it('should get coupon of type other', function(done){
        agent
          .get('/coupon?type=other')
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err)
            }
            otherCouponId = res.body[0].id;
            done();
          })
      });

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

      it('should not be able to order a meal with coupon because coupon not exists', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1,
            pickupOption : pickupPickupOptionId,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "pickup",
            pickupNickname : pickupNickname,
            coupon : "123456",
            tip : 0
          })
          .expect(400)
          .end(done)
      });

      it('should not be able to order a meal with coupon because user do not have coupon', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 1 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1,
            pickupOption : pickupPickupOptionId,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "pickup",
            pickupNickname : pickupNickname,
            coupon : otherCouponId,
            tip : 0
          })
          .expect(400)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            res.body.code.should.be.equal(-16);
            done()
          })
      });

      it('should be able to order a meal with coupon', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 5 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 * 5,
            pickupOption : pickupPickupOptionId,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "pickup",
            pickupNickname : pickupNickname,
            coupon : $10couponId,
            tip : 0
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var o = res.body;
            var applicationFee = price3 * 5 * 0.2 * 100;
            o.guestEmail.should.be.equal(guestEmail);
            o.discount.should.be.equal(10);
            o.transfer[Object.keys(o.transfer)[0]].should.be.equal(1000);
            o.charges[Object.keys(o.charges)[0]].should.be.equal(Math.round((price3*5*TRANSACTION_FEE+SERVICE_FEE-10)*100));
            o.application_fees[Object.keys(o.application_fees)[0]].should.be.equal(applicationFee);
            orderId = o.id;
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
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 1 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price1 * 1,
            pickupOption : pickupPickupOptionId,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "pickup",
            pickupNickname : pickupNickname,
            coupon : $5couponId,
            tip : 0
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var o = res.body;
            o.discount.should.be.equal(5);
            o.transfer[Object.keys(o.transfer)[0]].should.be.equal(500);
            orderId = o.id;
            o.leftQty[dishId1].should.be.equal(dish1LeftQty);
            done();
          })
      });

      it('should not be able to order another meal with used coupon', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 1 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 * 1,
            pickupOption : pickupPickupOptionId,
            contactInfo : { name : "sheng", address : address, phone : phone },
            paymentInfo : { method : 'online'},
            method : "pickup",
            pickupNickname : pickupNickname,
            coupon : $5couponId
          })
          .expect(400)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.code.should.be.equal(-16);
            done();
          })
      });

      it('should not adjust the order with coupon', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 2 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 2 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
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
        dishObj[dishId1] = { number : 2 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 2 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
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
      var userId, userPoints;

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
            userPoints = res.body.points;
            done()
          })
      });

      it('should get a meal', function (done) {
        agent
          .get('/meal')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(err){
              console.log(err);
              return done(err);
            }
            var meal = res.body.meals.filter(function(m){
              return m.type === "preorder";
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
      });

      it('should not be able to order a meal without name & phone', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 * 1,
            pickupOption : pickupPickupOptionId,
            contactInfo : {},
            paymentInfo : { method : 'cash'},
            method : "pickup",
            pickupNickname : pickupNickname,
            tip : 0
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
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 * 1,
            pickupOption : pickupPickupOptionId,
            contactInfo : {},
            paymentInfo : { method : 'cash'},
            method : "pickup",
            pickupNickname : pickupNickname,
            tip : 0
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var o = res.body;
            userPoints += Math.floor((price3+SERVICE_FEE)/2);
            o.application_fees['cash'].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
            o.transfer[Object.keys(o.transfer)[0]].should.be.equal((price3 * 0.8 - SERVICE_FEE) * 100);
            o.customerPhone.should.be.equal(customerPhone);
            o.customerName.should.be.equal(customerName);
            orderId = o.id;
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
            res.body.points.should.be.equal(userPoints);
            done()
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

      it('should adjust the dish with more amount successfully', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 1 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [], price : price4 };
        agent
          .post('/order/' + orderId + "/adjust")
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({orders : dishObj, subtotal : price2+price4, mealId : mealId, delivery_fee : 0})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            res.body.orders[0].transfer[Object.keys(res.body.orders[0].transfer)[0]].should.be.equal((price4 * 0.8 - SERVICE_FEE)*100);
            res.body.orders[0].transfer[Object.keys(res.body.orders[0].transfer)[1]].should.be.equal((price2 * 0.8 - SERVICE_FEE)*100);
            done();
          })
      });

      it('should adjust the dish with less amount successfully', function (done) {
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 1 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 0 , preference : [], price : price4 };
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
            res.body.orders[0].transfer[Object.keys(res.body.orders[0].transfer)[0]].should.be.equal((price4 * 0 - SERVICE_FEE)*100);
            res.body.orders[0].transfer[Object.keys(res.body.orders[0].transfer)[1]].should.be.equal((price2 * 0.8 - SERVICE_FEE)*100);
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
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 * 1,
            pickupOption : pickupPickupOptionId,
            method : "pickup",
            pickupNickname : pickupNickname,
            contactInfo : {},
            paymentInfo : { method : 'cash'},
            tip : 0
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var o = res.body;
            o.application_fees['cash'].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
            o.customerPhone.should.be.equal(customerPhone);
            o.customerName.should.be.equal(customerName);
            orderId = o.id;
            done();
          })
      });

      it('should be able to order a meal with cash with no card', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 * 1,
            pickupOption : pickupPickupOptionId,
            method : "pickup",
            pickupNickname : pickupNickname,
            contactInfo : {},
            paymentInfo : { method : 'cash'},
            tip : 0
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            var o = res.body;
            o.application_fees['cash'].should.be.equal((price3 * 0.2 + SERVICE_FEE) * 100);
            o.transfer[Object.keys(o.transfer)[0]].should.be.equal((price3 * 0.8 - SERVICE_FEE) * 100);
            o.customerPhone.should.be.equal(customerPhone);
            o.customerName.should.be.equal(customerName);
            o.isExpressCheckout.should.be.false();
            orderId = o.id;
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
            var o = res.body[0];
            o.paymentMethod.should.be.equal('cash');
            Object.keys(o.transfer).should.have.length(1);
            o.transfer[Object.keys(o.transfer)[0]].should.be.equal(0);
            o.charges['cash'].should.be.equal(0);
            o.application_fees['cash'].should.be.equal(0);
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

    describe('order a meal with Alipay, Venmo & Paypal', function(){
      var mealId,dishId1,dishId2,dishId3,dishId4,price1,price2,price3,price4,price5;
      var orderId;
      var dishId5;
      var mealProvideFrom;

      it('should login as guest', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : guestEmail, password: password})
          .expect(302)
          .expect("Location","/auth/done")
          .end(done)
      });

      it('should get meals', function (done) {
        agent
          .get('/meal')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            console.log(res.body.meals);
            var meal = res.body.meals.filter(function(m){
              return m.type === "preorder";
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
            mealProvideFrom = meal.provideFromTime;
            done();
          })
      });

      var sourceId,client_secret;

      it('should be able to submit order with Venmo', function(done){
        var dishObj = {};
        dishObj[dishId1] = { number : 0 , preference : [], price : price1 };
        dishObj[dishId2] = { number : 0 , preference : [], price : price2 };
        dishObj[dishId3] = { number : 0 , preference : [], price : price3 };
        dishObj[dishId4] = { number : 1 , preference : [], price : price4 };
        agent
          .post('/order')
          .send({
            orders : dishObj,
            subtotal : price3 ,
            pickupOption : pickupPickupOptionId,
            method : "pickup",
            pickupNickname : pickupNickname,
            tip : 0,
            contactInfo : { phone : "(415)111-1111", name : "abc", address : "1455 Market St, San Francisco"},
            paymentInfo : { method : 'venmo'}
          })
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            var o = res.body;
            o.paymentMethod.should.be.equal("venmo");
            done();
          })
      });

      // it('should be able to submit order with Paypal', function(done){
      //   var dishObj = {};
      //   dishObj[dishId1] = { number : 0 , preference : [{ property : '', extra : 0}], price : price1 };
      //   dishObj[dishId2] = { number : 0 , preference : [{ property : '', extra : 0}], price : price2 };
      //   dishObj[dishId3] = { number : 0 , preference : [{ property : '', extra : 0}], price : price3 };
      //   dishObj[dishId4] = { number : 1 , preference : [{ property : '', extra : 0}], price : price4 };
      //   agent
      //     .post('/order')
      //     .send({
      //       orders : dishObj,
      //       subtotal : price3 ,
      //       pickupOption : pickupPickupOptionId,
      //       method : "pickup",
      //       pickupNickname : pickupNickname,
      //       tip : 0,
      //       contactInfo : { phone : "(415)111-1111", name : "abc", address : "1455 Market St, San Francisco"},
      //       paymentInfo : { method : 'paypal'}
      //     })
      //     .expect(200)
      //     .end(function(err, res){
      //       if(err){
      //         return done(err);
      //       }
      //       var o = res.body.orders[0];
      //       o.paymentMethod.should.be.equal("paypal");
      //       done();
      //     })
      // })

      it('should login as host', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email : hostEmail, password: password})
          .expect(302)
          .expect("Location","/auth/done")
          .end(done)
      });

      var hostId;

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
            minimalOrder : 5,
            nickname : "pickupSet1",
            isDelivery : true
          })
          .expect(200)
          .end(done)
      })
    });


    describe('should order a meal and give referer points', function() {
      it('should log out user', function (done) {
        agent
          .get('/auth/logout')
          .expect(302)
          .end(done)
      });

      it('should login if account exist', function (done) {
        agent
          .post('/auth/login?type=local')
          .send({email: "referraltest@gmail.com", password: password})
          .expect(302)
          .expect('Location', '/auth/done')
          .end(done)
      });

      it('should set referrers code to null', function (done) {
        agent
          .get('/user/me')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }
            res.body.usedReferralBonus.should.be.true();
            done();
          })
      })
    });
  })
});
