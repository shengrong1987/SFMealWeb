
var assert = require('assert'),
    sinon = require('sinon');
var config = require('../../../config/stripe.js'),
    should = require('should'),
    stripe = require('stripe')(config.StripeKeys.secretKey);
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('PocketController', function() {

  this.timeout(10000);

  describe('get user balance info', function() {

    var userId;
    var guestEmail = "enjoymyself1987@gmail.com";
    var hostEmail = "aimbebe.r@gmail.com";
    var password = "12345678";

    it('should login a host account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email: hostEmail, password: password})
        .expect(302)
        .end(done)
    });

    it('should get host balance', function (done) {
      agent
        .get('/pocket/host/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          should.exist(res.body.pocket.totalBalance);
          should.exist(res.body.pocket.pending_balances);
          should.exist(res.body.pocket.transactions);
          res.body.pocket.transactions.should.have.length(17, 'transactions number not match');
          done()
        })
    })

    it('should get user balance', function (done) {
      agent
        .get('/pocket/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          should.exist(res.body.pocket.transactions);
          res.body.pocket.transactions.should.have.length(0);
          done()
        })
    })

    it('should get all balance', function (done) {
      agent
        .get('/pocket/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          should.exist(res.body.pocket.transactions);
          res.body.pocket.transactions.should.have.length(17, 'all transactions number not match');
          done()
        })
    })

    it('should login a guest account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email: guestEmail, password: password})
        .expect(302)
        .end(done)
    });

    it('should get user balance', function (done) {
      agent
        .get('/pocket/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          should.exist(res.body.pocket.transactions);
          res.body.pocket.transactions.should.have.length(9, 'user transactions number not match');
          done()
        })
    })


  })
});
