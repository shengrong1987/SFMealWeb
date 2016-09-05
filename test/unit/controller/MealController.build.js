/**
 * Created by shengrong on 11/19/15.
 */

var assert = require('assert'),
    sinon = require('sinon');
var config = require('../../../config/stripe.js'),
    stripe = require('stripe')(config.StripeKeys.secretKey),
    request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('MealController', function() {

  this.timeout(12000);

  describe('build a meal with dishes', function() {

    var hostId;
    var email = 'aimbebe.r@gmail.com';
    var password = 'Rs89030659';
    var picture = "/images/thumbnail.jpg";
    var address1 = {"street":"1974 palou ave","city" : "San Francisco", "zip" : 94124, "phone" : "(415)802-3853","isDefault" : true};
    var address2 = {"street":"7116 Tiant Way","city" : "Elk Grove", "zip" : 95758, "phone" : "(415) 802-3853"};
    var userId = "";
    var firstname = "Shiga";
    var lastname = "Lian";
    var shopName = "Crispy, Tangy, Sweet, and Spicy";
    var phone = "(415)802-3853";

    it('should register an account', function (done) {
      agent
        .post('/auth/register')
        .send({email : email, password: password})
        .expect(200)
        .end(done)
    });

    it('should get user id', function (done) {
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

    it('should update addresses info', function (done) {
      agent
          .put('/user/' + userId)
          .send({address : [address1,address2]})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            if(Object.keys(res.body.address)[0].isDefault && !Object.keys(res.body.address)[1].isDefault && res.body.city != "San Francisco"){
              return done(Error('error geocoding the address'));
            }
            done();
          })
    });

    it('should become a host if isnt one', function (done) {
      agent
        .post('/user/becomeHost')
        .send({shopName: "山东健康面馆", intro: "从小吃了奶奶做的山东包子长大的我希望能分享家乡美食到湾区"})
        .expect(200)
        .end(function(err,res){
          if(res.body.user.host == undefined){
            return done(Error("become host for a logged user doesn't work"));
          }
          hostId = res.body.user.host;
          done();
        })
    });

    it('should create bank info for host', function (done) {
      stripe.tokens.create({
        bank_account: {
          country: 'US',
          currency: 'usd',
          //account_holder_name: 'Sheng Rong',
          //account_holder_type: 'individual',
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

    it('should update address info for host', function (done) {
        agent
          .put('/host/' + hostId)
          .send({address:[address1], picture: picture, shopName : shopName})
          .expect(200)
          .end(function(err,res){
            if(res.body.city != "San Francisco"){
              return done(Error("error geocoding or updating address"));
            }
            done();
          })
    });

    var dish1;
    var dish2;
    var dish3;
    var dish4;

    it('should create couple dishes', function (done) {
      agent
          .post('/dish')
          .send({title : '韭菜盒子',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId, description : "韭菜盒子是中国北方地区陕西、山西等地非常流行的汉族小吃，在有些地区也是节日食品。一般选春季头刀韭菜和鸡蛋为主要原料加工制作而成的食品，适宜于春季食用。该制品表皮金黄酥脆。馅心韭香脆嫩，滋味优美，是适时佳点。", isVerified : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish1 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '猪肉馅饼',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId, isVerified : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish2 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '五彩面',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'entree', chef : hostId, isVerified: true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish3 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '糖水',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'dessert', chef : hostId, isVerified : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish4 = res.body.id;
            done();
          })
    });

    it('should update host legal_entity', function(done){
      var legalObj = {
        dob : {
          day : 25,
          month : 12,
          year : 1987
        },
        first_name : "sheng",
        last_name : "rong",
        ssn_last_4 : "1234"
      };
      agent
        .put('/host/' + hostId)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        // .field('Content-Type', 'multipart/form-data')
        .field('legal_entity',JSON.stringify(legalObj))
        .field('hasImage',"true")
        .attach('image','/Users/shengrong/Documents/SFMealWeb/assets/images/dumplings.jpg')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    });

    it('should update host legal_entity', function(done){
      var legalObj = {
        personal_id_number : "123456789"
      };
      agent
        .put('/host/' + hostId)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .field('legal_entity',JSON.stringify(legalObj))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    });

    var mealId;
    var leftQty = {};
    var totalQty = {};

    it('should create an order type meal ', function (done) {
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
          .send({provideFromTime: now, provideTillTime: new Date(now.getTime() + 1000 * 3600), leftQty: leftQty, totalQty: totalQty, county : 'San Francisco County', title : "私房面馆", type : "order", dishes : dishes, status : "on",cover : dish1, minimalOrder : 5, isDelivery : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.chef != hostId){
              return done(Error("error creating meal"));
            }
            mealId = res.body.id;
            done();
          })
    })


    var preorderMealId;
    it('should create an preorder type meal ', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisco, CA 94124",
        "method" : "pickup",
        "phone" : "(415)993-9993"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery",
        "phone" : "(415)993-9993"
      }];
      agent
          .post('/meal')
          .send({provideFromTime: now, provideTillTime: new Date(now.getTime() + 1000 * 3600), pickups : JSON.stringify(pickups),  leftQty: leftQty, totalQty: totalQty, county : 'San Francisco County', title : "私房面馆", type : "preorder", dishes : dishes, status : "on", cover : dish1, minimalOrder : 5, isDelivery : true})
          .expect(200)
          .end(function(err,res){
            if(res.body.chef != hostId){
              return done(Error("error creating meal"));
            }
            preorderMealId = res.body.id;
            done();
          })
    })

    var guestId = "";
    var guestEmail = 'enjoymyself1987@gmail.com';

    it('should register an account for guest', function (done) {
      agent
        .post('/auth/register')
        .send({email : guestEmail, password: password})
        .expect(200)
        .end(done)
    });

    it('should get user id', function (done) {
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
          done();
        })
    });

    it('should update user info', function (done) {
      agent
        .post('/user/' + guestId)
        .send({firstname : firstname, lastname : lastname, phone : phone})
        .expect(200)
        .end(function(err,res){
          if(res.body.firstname != firstname){
            return done(Error("error updating user info"))
          }
          done();
        })
    });

    it('should create a new card', function (done) {
      var number = "4242424242424242";
      var street = "1974 palou ave";
      var city = "San Francisco";
      var state = "CA";
      var postal = "94124";
      var country = "US";
      var cardHolderName = "sheng rong";
      var expMonth = 2;
      var expYear = 2020;
      var cvv = 123;
      stripe.tokens.create({
        card:{
          number: number,
          cvc: cvv,
          exp_month: expMonth,
          exp_year: expYear,
          name: cardHolderName,
          address_line1: street,
          address_city: city,
          address_zip: postal,
          address_state: state,
          address_country: country
        }
      }, function(err, token){
        agent
            .post('/payment')
            .send({
              stripeToken : token.id,
              brand : token.card.brand,
              user : guestId,
              street : street,
              city : city,
              state : state,
              postal : postal,
              country : country,
              cardholder : cardHolderName,
              cardNumber : number,
              expMonth : expMonth,
              expYear : expYear,
              CVV : cvv,
              isDefaultPayment : true
            })
            .expect(200)
            .end(function(err,res){
              if(err){
                return done(err);
              }
              if(res.body.user!= guestId){
                return done(Error("error create new payment card"))
              }
              done();
            })
      });
    });

    var orders = {};
    var subtotal = 12;
    var orderId;

    it('should order a meal as a user', function(done){
      orders[dish1] = 0;
      orders[dish2] = 1;
      orders[dish3] = 1;
      orders[dish4] = 0;
      agent
          .post('/order')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({
            orders : orders,
            subtotal : subtotal,
            method : "pickup",
            mealId : preorderMealId,
            pickupOption : 1,
            phone : address1.phone,
            delivery_fee : 0,
            eta : new Date()
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            orderId = res.body.id;
            console.log("this is an order id: " + orderId);
            done();
          })
    })
    var newSubtotal = 4;
    it('should adjust an order as a user', function(done){
      orders[dish1] = 0;
      orders[dish2] = 1;
      orders[dish3] = 0;
      orders[dish4] = 0;
      agent
          .post('/order/' + orderId + '/adjust')
          .send({
            orders : orders,
            subtotal : newSubtotal
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            done();
          })
    });

    var preparingOrderId;
    it('should order a meal as a user', function(done){
      agent
          .post('/order')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({
            orders : orders,
            subtotal : newSubtotal,
            address : address1.street + address1.city + "CA" + address1.zip,
            method : "delivery",
            mealId : mealId,
            phone : address1.phone,
            delivery_fee : 0,
            eta : new Date()
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            preparingOrderId = res.body.id;
            done();
          })
    })

    it('should login an chef account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password,picture:picture})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should change an order to preparing', function(done){
      agent
        .put('/order/' + preparingOrderId)
        .send({
          status : 'preparing'
        })
        .expect(200)
        .end(function(err,res){
          done();
        })
    })

    it('should ready an order', function(done){
      agent
          .put('/order/' + preparingOrderId + "/ready")
          .expect(200)
          .end(function(err,res){
            done();
          })
    })

    it('should confirm an pickup or delivery for an order', function(done){
      agent
          .put('/order/' + preparingOrderId + "/receive")
          .expect(200)
          .end(function(err,res){
            done();
          })
    })

    it('should login an account for guest', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : guestEmail, password: password})
        .expect(302)
        .expect("Location","/auth/done")
        .end(done)
    });

    it('should leave a review for the dish of the meal', function (done) {
      agent
        .post('/review')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({meal : mealId, dish : dish2, host: hostId, score : 4.0, review : "Very delicious could be more"})
        .expect(200)
        .end(function(err,res){
          done();
        })
    })

  });
});
