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

describe('EmailController', function() {

  this.timeout(5000);

  describe('', function() {

    var hostEmail = "aimbebe.r@gmail.com"
    var guestEmail = 'enjoymyself1987@gmail.com'
    var password = '12345678';
    var guestId = "";
    var address = "1455 Market St, San Francisco";
    var farAddress = "7116 Tiant way, Elk Grove, CA 95758";
    var phone = "1-415-802-3853";
    var hostId;

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : hostEmail, password: password})
        .expect(200)
        .end(function(err,res){
          if(res.body.auth.email != email){
            return done(Error("not login with the same account(email not the same)"))
          }
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
            console.log(res.body);
            if(res.body.bank_name != "STRIPE TEST BANK"){
              return done(Error("error creating bank, bank name doesen't match(STRIPE TEST BANK)"));
            }
            done();
          })
      });
    });

    var dish1, price1 = 4;
    var dish2, price2 = 4;
    var dish3, price3 = 8;
    var dish4, price4 = 8;
    it('should create couple dishes', function (done) {
      agent
        .post('/dish')
        .send({title : '韭菜盒子',price: price1, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId, isVerified : true})
        .expect(200)
        .end(function(err,res){
          if(res.body.id == undefined){
            return done(Error("error creating dish"))
          }
          dish1 = res.body.id;
        })

      agent
        .post('/dish')
        .send({title : '猪肉馅饼',price: price2, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId, isVerified : true})
        .expect(200)
        .end(function(err,res){
          if(res.body.id == undefined){
            return done(Error("error creating dish"))
          }
          dish2 = res.body.id;
        })

      agent
        .post('/dish')
        .send({title : '五彩面',price: price3, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'entree', chef : hostId, isVerified : true})
        .expect(200)
        .end(function(err,res){
          if(res.body.id == undefined){
            return done(Error("error creating dish"))
          }
          dish3 = res.body.id;
        })

      agent
        .post('/dish')
        .send({title : '糖水',price: price4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'dessert', chef : hostId, isVerified : true})
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


    it('should create a order type meal and'
      + hostEmail
      + 'should receive order starts reminder email 1 minutes later', function (done) {
      var now = new Date();
      var elevenMinutesLater = new Date(now.getTime() + 11 * 60 * 1000);
      var oneHourLater = new Date(now.getTime() + 3600 * 1000);
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
        .send({
          provideFromTime: elevenMinutesLater,
          provideTillTime: oneHourLater,
          leftQty: leftQty,
          totalQty: totalQty,
          county : 'San Francisco County',
          title : "私房面馆",
          type : "order",
          dishes : dishes,
          status : "on",
          cover : dish1
        })
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

    it('should create an preorder type meal and '
      + hostEmail
      + ' should receive guest list email 30 minutes later', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var thirtyMinutesLater = new Date(now.getTime() + 60 * 30 * 1000);
      var onHourAndOneMinuteLater = new Date(now.getTime() + 1000 * 60 * 61);
      var twoHourLater = new Date(now.getTime() + 1000 * 3600 * 2);
      var pickups = [{
        "pickupFromTime" : onHourAndOneMinuteLater,
        "pickupTillTime" : twoHourLater,
        "location" : "1455 Market St, San Francisoc, CA 94124"
      }];
      agent
        .post('/meal')
        .send({provideFromTime: now, provideTillTime: thirtyMinutesLater, pickups : JSON.stringify(pickups),  leftQty: leftQty, totalQty: totalQty, county : 'San Francisco County', title : "私房面馆", type : "preorder", dishes : dishes, status : "off", cover : dish1, minimalOrder : 1})
        .expect(200)
        .end(function(err,res){
          if(res.body.chef != hostId){
            return done(Error("error creating meal"));
          }
          preorderMealId = res.body.id;
          done();
        })
    })

    //UC#1 order 'preorder' type meal, adjust and cancel directly at scheduled

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
    it('should order the meal and ' + hostEmail + "should receive a new order email", function (done) {
      var dishObj = {};
      dishObj[dish1] = 1;
      dishObj[dish2] = 2;
      dishObj[dish3] = 0;
      dishObj[dish4] = 0;
      var now = new Date();
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          pickupOption : 1,
          method : "pickup",
          mealId : preorderMealId,
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

    it('should adjust the dish successfully and ' + hostEmail + "should receive an adjust order email", function (done) {
      var dishObj = {};
      dishObj[dish1] = 1;
      dishObj[dish2] = 0;
      dishObj[dish3] = 0;
      dishObj[dish4] = 0;
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

    it('should cancel the dish at schedule successfully and '
      + hostEmail
      + "should receive a cancel order email "
      + "and shoudnt receive arrive reminder email at: "
      + guestEmail, function (done) {
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

    //UC#2 order 'preorder' type meal and request for cancel

    it('should order the meal again', function (done) {
      var dishObj = {};
      dishObj[dish1] = 1;
      dishObj[dish2] = 2;
      dishObj[dish3] = 0;
      dishObj[dish4] = 0;
      agent
        .post('/order')
        .send({
          orders : dishObj,
          subtotal : price1 * 1 + price2 * 2,
          address : address,
          phone : phone,
          method : "delivery",
          mealId : preorderMealId,
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

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : hostEmail, password: password})
        .expect(200)
        .end(function(err,res){
          if(res.body.auth.email != email){
            return done(Error("not login with the same account(email not the same)"))
          }
          done();
        })
    });

    it('should turn the order to preparing', function (done) {
      agent
        .put('/order/' + orderId)
        .send({status : 'preparing'})
        .expect(200)
        .end(function(err,res){
          if(res.body.id != orderId){
            return done(Error("error change the order to preparing"))
          }
          done();
        })
    });

    it('should login or register an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(200)
        .end(function(err,res){
          if(res.body.auth.email != email){
            return done(Error("not login with the same account(email not the same)"))
          }
          done();
        })
    });

    it('should request for cancelling and confirm ' + hostEmail + 'receive a cancelling request email', function (done) {
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
        .send({email : hostEmail, password: password})
        .expect(200)
        .end(function(err,res){
          if(res.body.auth.email != email){
            return done(Error("not login with the same account(email not the same)"))
          }
          done();
        })
    });

    it('should reject a cancelling order and confirm ' + guestEmail + 'receive reject cancelling email', function (done) {
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
        .expect(200)
        .end(function(err,res){
          if(res.body.auth.email != guestEmail){
            return done(Error("not login with the same account(email not the same)"))
          }
          guestId = res.body.id;
          done();
        })
    });

    it('should request for cancelling and confirm ' + hostEmail + 'receive cancelling request email', function (done) {
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
        .expect(200)
        .end(function(err,res){
          if(res.body.auth.email != email){
            return done(Error("not login with the same account(email not the same)"))
          }
          done();
        })
    });

    it('should confirm a cancelling order and confirm ' + guestEmail + 'receive confirm cancel email', function (done) {
      agent
        .put('/order/' + orderId + "/confirm")
        .expect(200)
        .end(function(err,res){
          done();
        })
    });

  });

});
