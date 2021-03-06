
var assert = require('assert'),
    sinon = require('sinon');
var config,stripe,request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('PaymentController', function() {

  this.timeout(25000);

  describe('create a payment profile', function() {

    var userId,cardId;
    var email = "enjoymyself1987@gmail.com";
    var adminEmail = "admin@sfmeal.com";
    var password = "12345678";

    it('should login a guest account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
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
          userId = res.body.id;
          done()
        })
    })

    it('logout user account', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    })

    it('should login admin account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should remove user email', function(done){
      agent
        .put('/user/' + userId)
        .send({
          email : null
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          done();
        })
    })

    it('logout user account', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    })

    it('should login a guest account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should create a new card', function (done) {
      config = require('../../../config/stripe.js');
      stripe = require('stripe')(config.StripeKeys.secretKey);
      var number = "4242424242424242";
      var street = "1974 palou ave";
      var city = "San Francisco";
      var state = "CA";
      var postal = "94124";
      var country = "US";
      var cardHolderName = "sheng rong";
      var expMonth = 2;
      var expYear = 2022;
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
        if(err){
          console.log(err)
          return done(err)
        }
        agent
            .post('/payment')
            .send({
              stripeToken : token.id,
              cardNumber : number,
              isDefaultPayment : false,
              wantsJSON : true
            })
            .expect(200)
            .end(function(err,res){
              if(err){
                return done(err);
              }
              res.body.should.have.property('user');
              res.body.isDefaultPayment.should.be.true();
              cardId = res.body.id;
              done();
            })
      });
    });

    it('should get user email', function(done){
      agent
        .get('/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.email.should.be.equal(email);
          done()
        })
    })

    it('should not create an existing card', function (done) {
      var number = "4242424242424242";
      var street = "1974 palou ave";
      var city = "San Francisco";
      var state = "CA";
      var postal = "94124";
      var country = "US";
      var cardHolderName = "sheng rong";
      var expMonth = 2;
      var expYear = 2022;
      var cvv = 123;
      stripe.tokens.create({
        card:{
          number: number,
          exp_month: expMonth,
          exp_year: expYear,
          name: cardHolderName,
          address_line1: street,
          address_city: city,
          address_zip: postal,
          address_state: state,
          address_country: country,
          cvv : cvv
        }
      }, function(err, token) {
        if (err) {
          return done();
        }
        done("Suppose not to create the same card");
      });
    });

    var anotherCardId;
    it('should create another card and set it defaultPayment', function (done) {
      var number = "378282246310005";
      var street = "1974 palou ave";
      var city = "San Francisco";
      var state = "CA";
      var postal = "94124";
      var country = "US";
      var cardHolderName = "sheng rong";
      var expMonth = 2;
      var expYear = 2022;
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
        if(err){
          console.log(err);
          return done(err);
        }
        agent
          .post('/payment')
          .send({
            stripeToken : token.id,
            cardNumber : number,
            isDefaultPayment : false
          })
          .expect(200)
          .end(function (err, res) {
            if(err){
              console.log(err);
            }
            res.body.should.have.property('user');
            res.body.isDefaultPayment.should.be.false();
            anotherCardId = res.body.id;
            done();
          })
      });
    });

    if('should update another card to default payment', function(done){
      agent
        .put('/payment/' + anotherCardId)
        .send({
          isDefaultPayment : true
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.isDefaultPayment.should.be.true();
          done();
        })
    })

    var newCountry = "CN";
    it('should update an existing card', function (done) {
      var number = "4242424242424242";
      var street = "1974 palou ave";
      var city = "San Francisco";
      var state = "CA";
      var postal = "94124";
      var cardHolderName = "sheng rong";
      var expMonth = 2;
      var expYear = 2022;
      var cvv = 123;
      agent
        .put('/payment/' + cardId)
        .send({
          address_line1 : street,
          address_city : city,
          address_state : state,
          address_zip : postal,
          address_country : newCountry,
          name : cardHolderName,
          exp_month : expMonth,
          exp_year : expYear,
          isDefaultPayment : false
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('isDefaultPayment');
          res.body.isDefaultPayment.should.be.false();
          done();
        })
    })

    var newCountry = "CN";
    it('should not update card number', function (done) {
      var number = "378282246310005";
      var street = "1974 palou ave";
      var city = "San Francisco";
      var state = "CA";
      var postal = "94124";
      var cardHolderName = "sheng rong";
      var expMonth = 2;
      var expYear = 2022;
      var cvv = 123;
      agent
        .put('/payment/' + cardId)
        .send({
          number : number,
          isDefaultPayment : true
        })
        .expect(400)
        .end(done)
    })

    it('should remove card', function (done) {
      agent
        .delete('/payment/' + cardId)
        .expect(200)
        .end(function(err, res){
          if(err){
            console.log(err);
            return done(err)
          }
          res.body.deleted.should.be.true();
          done()
        })
    })
  });
});
