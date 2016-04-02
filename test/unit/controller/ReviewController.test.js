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

describe('ReviewController', function() {

  describe('', function() {

    var hostId;
    var email = 'host@gmail.com';
    var password = '12345678';

    var guestEmail = 'guest@gmail.com'

    it('should login or register an account', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : email, password: password})
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != email){
              return done(Error("not login with the same account(email not the same)"))
            }
            hostId = res.body.host;
            done();
          })
    });

    var mealId;
    var dishId;
    it('should get a meal ', function (done) {
      agent
          .get('/meal')
          .expect(200)
          .end(function(err,res){
            if(res.body.length == 0){
              return done(Error("error getting any meal"));
            }
            mealId = res.body[0].id;
            dishId = res.body[0].dishes[0].id;
            done();
          })
    })

    var guestId = "";

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


    it('should leave a review for the dish of the meal', function (done) {
      agent
          .post('/review')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .send({mealId : mealId, dishId : dishId, score : 4.0, review : "Very delicious could be more",user: guestId})
          .expect(200)
          .end(function(err,res){
            if(res.body.mealId != mealId || res.body.dishId != dishId){
              return done(Error("error creating review"));
            }
            done();
          })
    })
  });

});
