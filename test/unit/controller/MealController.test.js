
var assert = require('assert'),
    should = require('should'),
    sinon = require('sinon'),
    config = require('../../../config/stripe.js'),
    stripe = require('stripe')(config.StripeKeys.secretKey),
    request = require("supertest-as-promised");
var agent;

before(function(done){
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('MealController', function() {

  this.timeout(12000);

  describe('build a meal with dishes', function() {

    var hostId;
    var email = 'aimbebe.r@gmail.com';
    var adminEmail = 'admin@sfmeal.com';
    var user2Email = "user2@sfmeal.com";
    var password2 = "123456789";
    var password = '12345678';
    var address = {"street":"1974 palou ave","city" : "San Francisco", "zip" : 94124, "phone" : "(415)802-3853"};
    var invalidAddress = {"street" : "1", "city" : '', "zip" : 0, "phone" : ""};

    it('should login or register an account', function (done) {
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
          .send({title : '韭菜盒子',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish1 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '猪肉馅饼',price: 4, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'appetizer', chef : hostId})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish2 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '五彩面',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'entree', chef : hostId})
          .expect(200)
          .end(function(err,res){
            if(res.body.id == undefined){
              return done(Error("error creating dish"))
            }
            dish3 = res.body.id;
          })

      agent
          .post('/dish')
          .send({title : '糖水',price: 8, photos:'[{"v":"/images/dumplings.jpg"},{"v":"/images/dumplings.jpg"}]', type: 'dessert', chef : hostId})
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


    it('should create a order type meal ', function (done) {
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
      var preference = {
        "spicy" : ["mild", "very-spicy"],
        "meat" : ["white", "brown"]
      }
      agent
          .post('/meal')
          .send({
            provideFromTime: new Date(now.getTime() + 1000 * 60 * 11),
            provideTillTime: new Date(now.getTime() + 1000 * 2 * 3600),
            leftQty: leftQty,
            totalQty: totalQty,
            county : 'San Francisco County',
            title : "私房面馆",
            type : "order",
            dishes : dishes,
            cover : dish1,
            minimalOrder : 5,
            status : 'off',
            isDelivery : false,
            preference : preference
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

    it('should create an preorder type meal ', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisoc, CA 94124",
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
            status : "off",
            cover : dish1,
            minimalOrder : 1
          })
          .expect(200)
          .end(function(err,res){
            if(res.body.chef != hostId){
              return done(Error("error creating meal"));
            }
            preorderMealId = res.body.id;
            done();
          })
    })

    it('should not create an active preorder type meal', function (done) {
      var dishes = dish1 + "," + dish2 + "," + dish3 + "," + dish4;
      var now = new Date();
      var pickups = [{
        "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 2),
        "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 3),
        "location" : "1455 Market St, San Francisoc, CA 94124",
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
          res.body.code.should.be.equal(-7);
          done();
        })
    })

    it('should search the meals in San Francisco and with a keyword of 菜式 but no records are found', function (done) {
      agent
          .get(encodeURI('/meal/search?keyword=猪肉馅饼&county=San Francisco County'))
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(res.body.meals.length != 0){
              return done(Error("error searching for meal"));
            }
            done();
          })
    })

    it('should not turn one meal on, because missing address info', function (done) {
      agent
        .post('/meal/' + mealId + "/on")
        .expect(302)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          done();
        })
    })

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
          if(res.body.city != "San Francisco"){
            return done(Error("error geocoding or updating address"));
          }
          done();
        })
    });

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

    it('should login as host', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

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
          res.body.should.have.property('meals').with.length(0);
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

    it('should update the meals provideFromTime to now and appear in the search results', function(done){
      var now = new Date()
      agent
        .put('/meal/' + mealId)
        .send({
          status : 'on',
          provideFromTime : now,
          provideTillTime : new Date(now.getTime() + 1000 * 2 * 3600),
          minimalOrder : 5
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
              if(res.body.meals.length != 1){
                return done(Error("meal should be not active yet"));
              }
              done();
            })
        })
        .catch(function(err){
          done(err);
        })
    })

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
            if(res.body.meals.length != 2){
              return done(Error("error searching for meal"));
            }
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
          res.body.meals.should.have.length(2);
          res.body.should.have.property('anchor');
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
          res.body.meals.should.have.length(1);
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
          totalQty: totalQty,
          county : 'San Francisco County',
          title : "私房面馆",
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
          if(res.body.chef != hostId){
            return done(Error("error creating meal"));
          }
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
  });

});
