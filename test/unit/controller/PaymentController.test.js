
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

  this.timeout(5000);

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
              brand : token.card.brand,
              user : userId,
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
              if(res.body.user != userId){
                return done(Error("error create new payment card"))
              }
              cardId = res.body.id;
              stripe_token = token.id;
              done();
            })
      });
    });

    it('should not create an exist card', function (done) {
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
              user : userId,
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
            .expect(400,done);
      });
    });

    var newCountry = "CN";
    it('should update an exist card', function (done) {
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
            user : userId,
            street : street,
            city : city,
            state : state,
            postal : postal,
            country : newCountry,
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
            if(res.body.country != newCountry){
              return done(Error("error updating card"))
            }
            done();
          })
    })
    });
});
