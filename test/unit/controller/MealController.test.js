
var assert = require('assert'),
    should = require('should'),
    sinon = require('sinon'),
    config = require('../../../config/stripe.js'),
    stripe = require('stripe')(config.StripeKeys.secretKey),
    request = require("supertest-as-promised");
var agent;
var moment = require('moment');
const DELIVERY_FEE = 0;

before(function(done){
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('MealController', function() {

  this.timeout(35000);

  describe('build a meal with dishes', function() {

    var hostId;
    var userId;
    var email = 'aimbebe.r@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
    var user2Email = "user2@sfmeal.com";
    var password2 = "123456789";
    var password = '12345678';
    var address = {"street":"1974 palou ave","city" : "San Francisco", "zip" : 94124, "phone" : "(415)802-3853"};
    var outOfSFAddress = {"street":"25 Washington St","city" : "Daly City", "zip" : 94014, "phone" : "(415)802-3853"};
    var invalidAddress = {"street" : "", "city" : '', "zip" : -1, "phone" : ""};
    var guestEmail = 'enjoymyself1987@gmail.com';
    var tempPhone = "(415)609-2357";

    it('should login an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
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
          userId = res.body.id;
          done();
        })
    });

    var dish1;
    var dish2;
    var dish3;
    var dish4;
    var dish5;
    it('should create couple dishes', function (done) {
      agent
          .post('/dish')
          .send({title : '韭菜盒子',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId})
          .expect(200)
          .end(function(err,res){
            should.exist(res.body.id);
            dish1 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '猪肉馅饼',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId})
          .expect(200)
          .end(function(err,res){
            should.exist(res.body.id);
            dish2 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '五彩面',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'entree', chef : hostId})
          .expect(200)
          .end(function(err,res){
            should.exist(res.body.id);
            dish3 = res.body.id;
          })

      agent
          .post('/dish')
          .send({
            title : '糖水',
            price: 8,
            photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]',
            type: 'dessert',
            chef : hostId,
            preference : {
              sweetness : [ { property : 'super sweet', extra : 1}, { property : 'normal', extra : 0}, { property : 'ultra sweet', extra : 2} ],
              spicy : [ { property : 'super spicy', extra : 1}, { property : 'normal', extra : 0}]
            }
          })
          .expect(200)
          .end(function(err,res){
            should.exist(res.body.id);
            dish4 = res.body.id;
          })

      agent
        .post('/dish')
        .send({
          title : '隐藏菜式',
          price: 10,
          photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]',
          type: 'dessert',
          chef : hostId,
          preference : {
            sweetness : [ { property : 'super sweet', extra : 1}, { property : 'normal', extra : 0}, { property : 'ultra sweet', extra : 2} ],
            spicy : [ { property : 'super spicy', extra : 1}, { property : 'normal', extra : 0}]
          }
        })
        .expect(200)
        .end(function(err,res){
          should.exist(res.body.id);
          dish5 = res.body.id;
          done();
        })
    });

    it('should update a dish with preference', function(done){
      agent
        .put('/dish/' + dish1)
        .set('Accept', 'application/json')
        .send({
          preference : {
            "馅料" : ["猪肉","素"]
          }
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.id.should.be.equal(dish1);
          done();
        })
    });

    it('should not update invalid address info for host', function (done) {
      agent
        .put('/host/' + hostId)
        .send({
          address:[invalidAddress]
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-2);
          done();
        })
    });

    it('should update phone for user and update host phone', function (done) {
      agent
        .put('/user/' + userId)
        .send({
          phone : tempPhone
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          done();
        })
    });

    it('should update address info for host', function (done) {
      agent
        .put('/host/' + hostId)
        .send({
          address:[address],
          phone : "(415)802-3853"
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.city !== "San Francisco"){
            return done(Error("error geocoding or updating address"));
          }
          done();
        })
    });

    var mealId;
    var preorderMealId;
    var sysDeliveryMealId;
    var leftQty = {};
    var totalQty = {};

    it('should get meal creation view', function (done){
      agent
        .get('/host/me/createMeal')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('dishes').with.length(5);
          res.body.host.id.should.be.equal(hostId);
          done();
        })
    })

    it('should create an order type meal ', function (done) {
      var now = new Date();
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      for(var i=1; i<=4; i++){
        switch(i){
          case 1:
            leftQty[dish1] = 5;
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
            leftQty[dish4] = 10;
            totalQty[dish4] = 10;
            break;
        }
      }
      var preference = {
        "spicy" : ["mild", "very-spicy"],
        "meat" : ["white", "brown"]
      };
      agent
          .post('/meal')
          .send({
            provideFromTime: new Date(now.getTime() + 1000 * 60 * 11),
            provideTillTime: new Date(now.getTime() + 1000 * 60 * 120),
            leftQty: leftQty,
            totalQty: totalQty,
            title : "即点单",
            type : "order",
            dishes : dishes,
            cover : dish1,
            minimalOrder : 5,
            status : 'off',
            isDelivery : false,
            preference : preference,
            isTaxIncluded : true
          })
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err);
            }
            if(res.body.chef !== hostId){
              return done(Error("error creating meal"));
            }
            res.body.county.should.be.equal("San Francisco County");
            res.body.commission.should.be.equal(0.2);
            mealId = res.body.id;
            done();
          })
    })

    it('should not create an preorder type meal with lack of catering requirement', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisco, CA 94124",
        "publicLocation" : "Uber HQ",
        "pickupInstruction" : "11th st and Market st",
        "method" : "pickup",
        "area" : "Market & Downtown",
        "county" : "San Francisco County"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery",
        "deliveryCenter" : "1974 Palou Ave, San Francisco, CA 94124, USA",
        "area" : "Bay View",
        "county" : "San Francisco County",
        "phone" : "(415)222-2222"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "25 Washington St, Daly City",
        "publicLocation" : "John Daly Blvd",
        "pickupInstruction" : "John Daly Blvd",
        "method" : "pickup",
        "county" : "San Mateo County",
        "area" : "Daly City",
        "phone" : "(415)333-3333"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 5),
        "location" : "665 W Olive Ave, Sunnyvale, CA 94086",
        "publicLocation" : "Sunnyvalue",
        "pickupInstruction" : "Sunnyvalue library",
        "method" : "pickup",
        "county" : "Santa Clara County",
        "area" : "Sunnyvale",
        "phone" : "(415)444-4444"
      }];
      agent
        .post('/meal')
        .send({
          provideFromTime: now,
          provideTillTime: new Date(now.getTime() + 1000 * 3600),
          pickups : JSON.stringify(pickups),
          isDelivery : true,
          leftQty: leftQty,
          totalQty: totalQty,
          title : "私房面馆",
          type : "preorder",
          dishes : dishes,
          status : "off",
          cover : dish1,
          minimalOrder : 1,
          supportPartyOrder : true
        })
        .expect(400)
        .end(function(err,res){
          res.body.code.should.be.equal(-17)
          done();
        })
    })

    it('should create an preorder type meal ', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisco, CA 94124",
        "publicLocation" : "Uber HQ",
        "pickupInstruction" : "11th st and Market st",
        "method" : "pickup",
        "area" : "Market & Downtown",
        "county" : "San Francisco County",
        "phone" : "(415)802-3853"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery",
        "deliveryCenter" : "1974 Palou Ave, San Francisco, CA 94124, USA",
        "area" : "Bay View",
        "county" : "San Francisco County",
        "phone" : "(415)802-3854"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "25 Washington St, Daly City",
        "publicLocation" : "John Daly Blvd",
        "pickupInstruction" : "John Daly Blvd",
        "method" : "pickup",
        "county" : "San Mateo County",
        "area" : "Daly City",
        "phone" : "(415)802-3853"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 5),
        "location" : "665 W Olive Ave, Sunnyvale, CA 94086",
        "publicLocation" : "Sunnyvalue",
        "pickupInstruction" : "Sunnyvalue library",
        "method" : "pickup",
        "county" : "Santa Clara County",
        "area" : "Sunnyvale",
        "phone" : "(415)802-3853"
      }];
      agent
          .post('/meal')
          .send({
            provideFromTime: now,
            provideTillTime: new Date(now.getTime() + 1000 * 3600),
            pickups : JSON.stringify(pickups),
            isDelivery : true,
            leftQty: leftQty,
            totalQty: totalQty,
            title : "预定订单四点",
            type : "preorder",
            dishes : dishes,
            status : "off",
            cover : dish1,
            minimalOrder : 1,
            partyRequirement : JSON.stringify({
              "minimal" : 50,
              "delivery_center" : "1974 Palou Ave, San Francisco, CA 94124"
            }),
            supportPartyOrder : true,
            isTaxIncluded : true
          })
          .expect(200)
          .end(function(err,res){
            if(res.body.chef !== hostId){
              return done(Error("error creating meal"));
            }
            res.body.should.have.property('pickups').with.length(5);
            res.body.pickups[0].publicLocation.should.be.equal("Uber HQ");
            res.body.pickups[0].phone.should.be.equal("(415)802-3853");
            res.body.pickups[1].phone.should.be.equal("(415)802-3854");
            res.body.should.have.property('county');
            res.body.county.should.containEql('San Francisco County');
            res.body.county.should.containEql('San Mateo County');
            res.body.county.should.containEql('Santa Clara County');
            preorderMealId = res.body.id;
            done();
          })
    })

    it('should create an preorder type meal with system delivery', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery",
        "deliveryCenter" : "455 Post St, San Francisco",
        "county" : "San Francisco County"
      }];
      agent
        .post('/meal')
        .send({
          provideFromTime: now,
          provideTillTime: new Date(now.getTime() + 1000 * 3600),
          pickups : JSON.stringify(pickups),
          delivery_fee : "4.99",
          isDelivery : true,
          isDeliveryBySystem : true,
          leftQty: leftQty,
          totalQty: totalQty,
          county : 'San Mateo County',
          title : "私房面馆2",
          type : "preorder",
          dishes : dishes,
          status : "off",
          cover : dish1,
          minimalOrder : 1,
          isTaxIncluded : true
        })
        .expect(200)
        .end(function(err,res){
          if(res.body.chef !== hostId){
            return done(Error("error creating meal"));
          }
          sysDeliveryMealId = res.body.id;
          res.body.delivery_fee.should.be.equal(DELIVERY_FEE);
          res.body.county.should.be.equal("San Francisco County");
          done();
        })
    })

    it('should not create an preorder type meal with wrong delivery setting', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery",
        "deliveryCenter" : "Union Square, San Francisco",
        "county" : "San Francisco County"
      }];
      agent
        .post('/meal')
        .send({
          provideFromTime: now,
          provideTillTime: new Date(now.getTime() + 1000 * 3600),
          pickups : JSON.stringify(pickups),
          delivery_fee : "4.99",
          isDelivery : false,
          isDeliveryBySystem : true,
          leftQty: leftQty,
          totalQty: totalQty,
          county : 'San Francisco County',
          title : "私房面馆2",
          type : "preorder",
          dishes : dishes,
          status : "off",
          cover : dish1,
          minimalOrder : 1
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-12);
          done();
        })
    })

    it('should not create an active preorder type meal', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisco, CA 94124",
        "method" : "pickup"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery"
      }];
      agent
        .post('/meal')
        .send({
          provideFromTime: now,
          provideTillTime: new Date(now.getTime() + 1000 * 3600),
          pickups : JSON.stringify(pickups),
          isDelivery : true,
          leftQty: leftQty,
          totalQty: totalQty,
          county : 'San Francisco County',
          title : "私房面馆",
          type : "preorder",
          dishes : dishes,
          status : "on",
          cover : dish1,
          minimalOrder : 1
        })
        .expect(400)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-8);
          done();
        })
    })

    it('should not update meals with certain fields', function(done){
      var now = new Date();
      agent
        .put('/meal/' + preorderMealId)
        .send({
          score : "5.0",
          provideFromTime: now,
          provideTillTime: new Date(now.getTime() + 1000 * 3600),
          minimalOrder : 1,
          status : 'off',
          commission : 0.1
        })
        .expect(403)
        .end(done)
    });

    it('should be able to remove a dish from a meal with no active order', function(done){
      agent
        .delete('/meal/' + preorderMealId + '/dishes/' + dish1)
        .expect(200, done)
    })

    it('should be able to add a dish from a meal with no active order', function(done){
      agent
        .post('/meal/' + preorderMealId + '/dishes/' + dish1)
        .expect(200, done)
    })

    it('should be able to update meals with no orders', function(done){
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisco, CA 94124",
        "publicLocation" : "Uber HQ",
        "pickupInstruction" : "11th st and Market st",
        "method" : "pickup",
        "area" : "Market & Downtown",
        "county" : "San Francisco County",
        "phone" : "(415)123-1234"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "method" : "delivery",
        "deliveryCenter" : "1974 Palou Ave, San Francisco, CA 94124, USA",
        "area" : "Bay View",
        "county" : "San Francisco County",
        "phone" : "(415)123-1234"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "25 Washington St, Daly City",
        "publicLocation" : "John Daly Blvd",
        "pickupInstruction" : "John Daly Blvd",
        "method" : "pickup",
        "county" : "San Mateo County",
        "area" : "Daly City",
        "phone" : "(415)123-1234"
      },{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 4),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 5),
        "location" : "665 W Olive Ave, Sunnyvale, CA 94086",
        "publicLocation" : "Sunnyvalue",
        "pickupInstruction" : "Sunnyvalue library",
        "method" : "pickup",
        "county" : "Santa Clara County",
        "area" : "Sunnyvale",
        "phone" : "(415)123-1234"
      }];
      agent
        .put('/meal/' + preorderMealId)
        .send({
          provideFromTime: now,
          provideTillTime: new Date(now.getTime() + 1000 * 3600),
          pickups : JSON.stringify(pickups),
          isDelivery : true,
          minimalTotal : 1,
          supportPartyOrder : true,
          partyRequirement : JSON.stringify({
            "minimal" : 50,
            "delivery_center" : "1974 Palou Ave, San Francisco, CA 94124"
          }),
          status : 'off'
        })
        .expect(200)
        .end(done)
    });

    it('should get meals page filter by county with no results', function(done){
      agent
        .get('/')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.meals.should.have.property("meals");
          res.body.meals.meals.should.not.have.property("orders");
          res.body.meals.summary.preOrderCount.should.be.equal(0);
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
          should(res.body.user).be.undefined();
          done();
        })
    });

    it('should search the meals in San Francisco and with a keyword of 菜式 but no records are found', function (done) {
      agent
          .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(res.body.meals.summary.orderCount !== 0 || res.body.meals.summary.preOrderCount !==0){
              return done(Error("error searching for meal"));
            }
            done();
          })
    })

    it('should login an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('host should not be passGuide', function(done){
      agent
        .get('/host/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.host.passGuide.should.be.false();
          done();
        })
    })

    it('should not turn one meal on because missing account verifications', function (done) {
      agent
        .post('/meal/' + mealId + "/on")
        .expect(302)
        .end(done)
    })

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
        .attach('image','/Users/shengrong/Documents/SFMeal/SFMealWeb/assets/images/dumplings.jpg')
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

    it('host should be passGuide', function(done){
      agent
        .get('/host/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.host.passGuide.should.be.true();
          done();
        })
    })

    it('should not turn meal on for invalid host because none dish is verified', function(done){
      agent
        .post('/meal/' + mealId + "/on")
        .expect(302)
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

    it('should verify dish1', function(done){
      agent
        .post('/dish/' + dish1 + '/verify')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('isVerified');
          res.body.isVerified.should.be.true();
          done();
        })
    });

    it('should login as host', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should not turn meal on because meal contains unverified dish', function(done){
      agent
        .post('/meal/' + mealId + "/on")
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('code');
          res.body.code.should.be.equal(-8);
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

    it('should unverify dish1', function(done){
      agent
        .post('/dish/' + dish1 + '/fail')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isVerified.should.not.be.true();
          done();
        })
    });

    it('should verify dish1', function(done){
      agent
        .post('/dish/' + dish1 + '/verify')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isVerified.should.be.true();
          done();
        })
    });

    it('should verify dish2', function(done){
      agent
        .post('/dish/' + dish2 + '/verify')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isVerified.should.be.true();
          done();
        })
    });

    it('should verify dish3', function(done){
      agent
        .post('/dish/' + dish3 + '/verify')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isVerified.should.be.true();
          done();
        })
    });

    it('should verify dish4', function(done){
      agent
        .post('/dish/' + dish4 + '/verify')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isVerified.should.be.true();
          done();
        })
    });

    it('should verify dish5', function(done){
      agent
        .post('/dish/' + dish5 + '/verify')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isVerified.should.be.true();
          done();
        })
    });

    it('should register as guest', function (done) {
      agent
        .post('/auth/register')
        .send({email : guestEmail, password : password})
        .expect(200)
        .end(done)
    })

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
          res.body.auth.email.should.be.equal(guestEmail, "login user email does not match");
          userId = res.body.id;
          done()
        })
    })

    it('should be able to collect the meal', function(done){
      agent
        .post("/user/" + userId + "/collects/" + mealId)
        .expect(200)
        .end(done)
    })

    it('should be able to like host', function(done){
      agent
        .post('/host/' + hostId + '/like')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property("likes");
          res.body.likes.should.have.length(1);
          done();
        });
    })

    it('should not be able to like host twice', function(done){
      agent
        .post('/host/' + hostId + '/like')
        .expect(400)
        .end(function(err, res){
          res.body.code.should.be.equal(-3);
          done();
        });
    })

    it('should be able to follow host', function(done){
      agent
        .post('/host/' + hostId + '/follow')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('follow');
          res.body.follow.should.be.equal(hostId);
          done();
        });
    })

    it('should be able to unfollow host', function(done){
      agent
        .post('/host/' + hostId + '/unfollow')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.not.exist(res.body.follow);
          done();
        });
    })

    it('should be able to follow host', function(done){
      agent
        .post('/host/' + hostId + '/follow')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('follow');
          res.body.follow.should.be.equal(hostId);
          done();
        });
    })

    it('should login as host', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should not be able to like host itself', function(done){
      agent
        .post('/host/' + hostId + '/like')
        .expect(400)
        .end(function(err, res){
          res.body.code.should.be.equal(-4);
          done();
        });
    })

    it('should not be able to follow host itself', function(done){
      agent
        .post('/host/' + hostId + '/follow')
        .expect(400)
        .end(function(err, res){
          res.body.code.should.be.equal(-4);
          done();
        });
    })

    it('should not be able to unfollow host itself', function(done){
      agent
        .post('/host/' + hostId + '/unfollow')
        .expect(400)
        .end(function(err, res){
          res.body.code.should.be.equal(-4);
          done();
        });
    })

    it('should turn one meal on', function (done) {
      agent
        .post('/meal/' + mealId + "/on")
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done)
    })

    it('should search the meals in San Francisco and with a keyword of 菜式 with no results', function (done) {
      agent
        .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          res.body.meals.summary.orderCount.should.be.equal(0);
          res.body.meals.summary.preOrderCount.should.be.equal(0);
          done();
        })
    })

    it('should not update dish on active meal', function(done){
      agent
        .put('/dish/' + dish1)
        .send({
          price : 5.0
        })
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-2);
          done();
        })
    });

    it('should update the meals provideFromTime to 5 minutes later', function(done){
      var fiveMinutesLater = moment().add('5','minutes')._d;
      var twoHourLater = moment().add('2','hours')._d;
      agent
        .put('/meal/' + mealId)
        .send({
          status : 'on',
          provideFromTime : fiveMinutesLater,
          provideTillTime : twoHourLater,
          minimalOrder : 1
        })
        .expect(200)
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

    it('should send menu of followed chef to guest and guest should receive an email of meals from "The Tea House"', function(done){
      agent
        .get('/job/FollowedChefPushingJob/run')
        .expect(200)
        .end(done);
    });

    it('should login as host', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should update the meals provideFromTime to now and appear in the search results', function(done){
      var now = moment()._d;
      var twoHourLater = moment().add('2','hours')._d;
      agent
        .put('/meal/' + mealId)
        .send({
          status : 'on',
          provideFromTime : now,
          provideTillTime : twoHourLater,
          minimalOrder : 1
        })
        .expect(200)
        .toPromise()
        .then(function(res){
          agent
            .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err,res){
              res.body.meals.summary.orderCount.should.be.equal(1);
              done();
            })
        })
        .catch(function(err){
          done(err);
        })
    })

    it('should update address info for host outside of San Francisco', function (done) {
      agent
        .put('/host/' + hostId)
        .send({
          address:[outOfSFAddress],
          phone : "(415)802-3853"
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.city !== "Daly City"){
            return done(Error("error geocoding or updating address"));
          }
          done();
        })
    });

    it('should update the meal and appear in the search results of San Mateo County', function(done){
      agent
        .put('/meal/' + mealId + '/on')
        .expect(200)
        .toPromise()
        .then(function(res){
          agent
            .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Mateo County'))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err,res){
              res.body.meals.summary.orderCount.should.be.equal(1);
              done();
            })
        })
        .catch(function(err){
          done(err);
        })
    })

    it('should update address back to San Francisco', function (done) {
      agent
        .put('/host/' + hostId)
        .send({
          address:[address],
          phone : "(415)802-3853"
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.city.should.be.equal("San Francisco");
          done();
        })
    });

    it('should update the meal', function(done) {
      agent
        .put('/meal/' + mealId + '/on')
        .expect(200)
        .end(done)
    });

    // it('should cancel the meal starting reminder and should not start a new one because start time less than 10 minutes', function(done){
    //   agent
    //     .get('/job?data.mealId=' + mealId)
    //     .expect(200)
    //     .then(function(res){
    //       if(res.body.length != 0){
    //         return done(Error('meal start reminding jobs count not right'));
    //       }
    //       done();
    //     })
    //     .catch(function(err){
    //       done(err)
    //     })
    // })

    it('should turn another meal on and schedule preorder schedule end job', function (done) {
      agent
        .post('/meal/' + preorderMealId + "/on")
        .expect(200)
        .end(done)
    })

    it('should search the meals in San Francisco and with a keyword of 菜式 again', function (done) {
      agent
          .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            res.body.meals.summary.orderCount.should.be.equal(1);
            res.body.meals.summary.preOrderCount.should.be.equal(1);
            res.body.meals.should.have.property("meals");
            res.body.meals.meals.should.have.property("orders");
            Object.keys(res.body.meals.meals).should.have.length(2);
            done();
          })
    })

    it('should search the meals in San Francisco with keyword,county and zipcode', function (done) {
      agent
        .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County&zipcode=94124'))
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          res.body.meals.summary.orderCount.should.be.equal(1);
          res.body.meals.summary.preOrderCount.should.be.equal(1);
          res.body.meals.should.have.property("meals");
          res.body.meals.meals.should.have.property("orders");
          Object.keys(res.body.meals.meals).should.have.length(2);
          done();
        })
    })

    it('should turn another meal off and cancel meal job', function (done) {
      agent
        .post('/meal/' + preorderMealId + "/off")
        .expect(302)
        .end(done)
    })

    it('should search the meals in San Francisco without just one result', function (done) {
      agent
        .get(encodeURI('/meal/search?county=San Francisco County&keyword='))
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          res.body.meals.summary.orderCount.should.be.equal(1);
          res.body.meals.summary.preOrderCount.should.be.equal(0);
          res.body.meals.should.have.property("meals");
          res.body.meals.meals.should.have.property("orders");
          res.body.meals.meals["orders"].meals.should.have.length(1);
          done();
        })
    })

    it('should turn another meal on and schedule preorder schedule end job', function (done) {
      agent
        .post('/meal/' + preorderMealId + "/on")
        .expect(200)
        .end(done)
    })

    it('should not delete a dish which is serving', function(done){
      agent
        .delete('/dish/' + dish1)
        .expect(400)
        .end(done)
    })

    var dishToTestDeleteId;
    it('should create more dishes', function (done) {
      agent
        .post('/dish')
        .send({
          title: '韭菜盒子',
          price: 4,
          photos: '[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]',
          type: 'appetizer',
          chef: hostId
        })
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          should.exist(res.body.id);
          dishToTestDeleteId = res.body.id;
          done();
        })
    });

    it('should create a order type meal ', function (done) {
      var now = new Date();
      var dishes = dishToTestDeleteId;
      var leftQty = {};
      leftQty[dishToTestDeleteId] = 1;
      var totalQty = leftQty;
      agent
        .post('/meal')
        .send({
          provideFromTime: new Date(now.getTime() + 1000 * 60 * 11),
          provideTillTime: new Date(now.getTime() + 1000 * 2 * 3600),
          leftQty: leftQty,
          totalQty: leftQty,
          county : 'San Mateo County',
          title : "私房面馆-即点2",
          type : "order",
          dishes : dishes,
          cover : dish1,
          minimalOrder : 5,
          status : 'off',
          isDelivery : false
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          if(res.body.chef !== hostId){
            return done(Error("error creating meal"));
          }
          res.body.county.should.be.equal('San Francisco County');
          done();
        })
    })

    it('should login as another host', function(done){
      agent
        .post('/auth/login?type=local')
        .send({email : user2Email, password: password2})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should not be able to delete a dish', function(done){
      agent
        .delete('/dish/' + dishToTestDeleteId)
        .expect(403)
        .end(done)
    });

    it('should login as host', function(done){
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should be able to delete a dish', function(done){
      agent
        .delete('/dish/' + dishToTestDeleteId)
        .expect(200)
        .end(done)
    });

    it('should get meal confirmation view', function(done){
      agent
        .get('/meal/' + mealId + "/confirm")
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.meal.id.should.be.equal(mealId);
          done();
        })
    })

    it('should not find a meal', function(done){
      agent
        .get('/meal/' + "123" + "/confirm")
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-3);
          done();
        })
    })
  });

});
