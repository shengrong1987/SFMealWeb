
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

describe('PickupOptionController', function() {

  this.timeout(35000);

  describe('create pickup options', function() {

    var adminEmail = 'admin@sfmeal.com';
    var password = '12345678';
    var now = new Date();

    it('should login an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should create pickup options', function(done) {
      agent
        .post('/pickupOption')
        .send({
          "pickupFromTime" : moment().add(2, 'hours')._d,
          "pickupTillTime" : moment().add(3, 'hours')._d,
          "location" : "1455 Market St, San Francisco, CA 94124",
          "publicLocation" : "Uber HQ",
          "pickupInstruction" : "11th st and Market st",
          "method" : "pickup",
          "area" : "Market & Downtown",
          "county" : "San Francisco County",
          "nickname" : "pickupSet1",
          "index" : 1
        })
        .expect(201)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          console.log(res.body);
          res.body.county.should.be.equal("San Francisco County");
          res.body.nickname.should.be.equal("pickupSet1");
          done();
        })
    })

    it('should create pickup options', function(done) {
      agent
        .post('/pickupOption')
        .send({
          "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 3),
          "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 4),
          "method" : "delivery",
          "location" : "1974 Palou Ave, San Francisco, CA 94124, USA",
          "deliveryCenter" : "1974 Palou Ave, San Francisco, CA 94124, USA",
          "area" : "Bay View",
          "county" : "San Francisco County",
          "phone" : "(415)802-3854",
          "deliveryRange" : 10,
          "index" : 2,
          "nickname" : "pickupSet1",
          "lat" : "37.738140",
          "long" : "-122.397720"
        })
        .expect(201)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.county.should.be.equal("San Francisco County");
          res.body.nickname.should.be.equal("pickupSet1");
          done();
        })
    })

    it('should create pickup options', function(done) {
      agent
        .post('/pickupOption')
        .send({
          "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 4),
          "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 5),
          "location" : "25 Washington St, Daly City",
          "publicLocation" : "John Daly Blvd",
          "pickupInstruction" : "John Daly Blvd",
          "method" : "pickup",
          "county" : "San Mateo County",
          "area" : "Daly City",
          "phone" : "(415)802-3853",
          "nickname" : "pickupSet1",
          "index" : 3
        })
        .expect(201)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.county.should.be.equal("San Mateo County");
          res.body.nickname.should.be.equal("pickupSet1");
          done();
        })
    })

    it('should create pickup options', function(done) {
      agent
        .post('/pickupOption')
        .send({
          "pickupFromTime" : new Date(now.getTime() + 1000 * 3600 * 4),
          "pickupTillTime" : new Date(now.getTime() + 1000 * 3600 * 5),
          "location" : "665 W Olive Ave, Sunnyvale, CA 94086",
          "publicLocation" : "Sunnyvale",
          "pickupInstruction" : "Sunnyvale library",
          "method" : "pickup",
          "county" : "Santa Clara County",
          "area" : "Sunnyvale",
          "phone" : "(415)444-4444",
          "nickname" : "pickupSet1",
          "index" : 4
        })
        .expect(201)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.county.should.be.equal("Santa Clara County");
          res.body.nickname.should.be.equal("pickupSet1");
          done();
        })
    })
  });
});
