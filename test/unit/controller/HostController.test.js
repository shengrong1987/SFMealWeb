
var assert = require('assert'),
    should = require('should'),
    sinon = require('sinon'),
    config = require('../../../config/stripe.js'),
    stripe = require('stripe')(config.StripeKeys.secretKey),
    request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('UsersController', function() {

  this.timeout(10000);

  var email = 'aimbebe.r@gmail.com';
  var adminEmail = 'admin@sfmeal.com';
  var password = "12345678";
  var hostId;
  var firstname = "sheng";
  var lastname = "rong";

  describe('user login and apply to be host', function() {

    it('should login an user account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .end(done)
    })

    it('should become a host', function (done) {
      agent
        .post('/user/becomeHost')
        .expect(200)
        .end(function(err,res){
          res.body.should.have.property("user");
          should.exist(res.body.user.host);
          hostId = res.body.user.host;
          done();
        })
    })

    var bankAccountId;

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
            res.body.bank_name.should.be.equal('STRIPE TEST BANK');
            bankAccountId = res.body.id;
            done();
          })
      });
    });

    it('should update bank info for host', function (done) {
      stripe.tokens.create({
        bank_account: {
          country: 'US',
          currency: 'usd',
          routing_number: '110000000',
          account_number: '000123456789'
        }
      }, function(err, token) {
        agent
          .put("/bank/" + hostId)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({
            token : token.id
          })
          .expect(200)
          .end(function(err, res){
            res.body.bank_name.should.be.equal('STRIPE TEST BANK');
            bankAccountId = res.body.id;
            done();
          })
      });
    });

    it('should get forbidden error for a host trying to apply for host', function (done) {
      agent
        .post('/user/becomeHost')
        .expect(403,done)
    })
  });

  describe('update host info', function(){
    it('should update host license', function(done){
      agent
        .put('/host/' + hostId)
        .send({
          license : JSON.stringify({
            url : "/images/license.jpeg"
          })
        })
        .expect(200)
        .end(done)
    })

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
          res.body.host.should.have.property('license');
          res.body.host.license.valid.should.be.false();
          res.body.host.license.issuedTo.should.be.equal(firstname + " " + lastname);
          done();
        })
    });

    it('should login an admin account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .end(done)
    })

    it('should verify host food handler license', function (done) {
      agent
        .post('/host/' + hostId + '/verifyLicense')
        .send({
          year : 2017,
          month : 12,
          day : 25
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }
          res.body.should.have.property('license');
          res.body.license.should.have.property('valid');
          res.body.license.issuedTo.should.be.equal(firstname + " " + lastname);
          res.body.license.valid.should.be.true();
          res.body.license.should.have.property('exp');
          done();
        })
    })

    it('should unverify host food handler license', function (done) {
      agent
        .post('/host/' + hostId + '/unverifyLicense')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('license');
          res.body.license.should.have.property('valid');
          res.body.license.valid.should.be.false();
          res.body.license.should.have.property('exp');
          done();
        })
    })

    it('should get host public profile', function(done){
      agent
        .get('/host/' + hostId)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.not.exist(res.body.accountId);
          done();
        })
    })

  })

  describe('host managed account verification', function() {

    var password = "12345678";
    var fields_need = [];
    var hostId;
    var firstname = "sheng";
    var lastname = "rong";
    it('should login a host account', function(done){
      agent
        .post('/auth/login?type=local')
        .send({email : email, password : password})
        .expect(302)
        .expect("Location","/auth/done")
        .end(done)
    });

    it('should be an unverified account', function(done){
      agent
        .get('/apply')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.passGuide.should.be.false("should be an unverified account");
          hostId = res.body.id;
          done();
        })
    });

    it('should update name and save to manged account', function(done){
        agent
          .put('/host/' + hostId)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({legal_entity : JSON.stringify({
            first_name : "sheng",
            last_name : "rong",
            dob : {
              month : 12,
              day : 25,
              year : 1987
            }
          })})
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            res.body.firstname.should.equal('sheng',"error updating firstname from host to user");
            res.body.lastname.should.equal('rong',"error updating lastname from host to user");
            new Date(res.body.birthday).should.which.is.a.Date();
            done();
          })

      it('should get the updated managed account', function(done){
        agent
          .get("/apply")
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err);
            }
            res.body.should.have.property('verification');
            should('legal_entity.first_name').be.equalOneOf(res.body.verification);
            should('legal_entity.last_name').be.equalOneOf(res.body.verification);
            should('legal_entity.dob.month').be.equalOneOf(res.body.verification);
            done();
          });
      });
    });
  });
    //need manual test for facebook and google login

});
