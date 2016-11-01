
var assert = require('assert'),
    sinon = require('sinon');
var config = require('../../../config/stripe.js'),
    stripe = require('stripe')(config.StripeKeys.secretKey);
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('PaymentController', function() {

  this.timeout(12000);

  describe('create a payment profile', function() {

    var userId;
    var email = "enjoymyself1987@gmail.com";
    var password = "12345678";

    it('should register a guest account', function (done) {
      agent
        .post('/auth/register')
        .send({email : email, password: password})
        .expect(200)
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

    var cardId;
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

    it('should not create an existing card', function (done) {
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
      var expYear = 2020;
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
      var expYear = 2020;
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
