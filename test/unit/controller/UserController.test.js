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

describe('UsersController', function() {

  this.timeout(5000);

  describe('user login', function() {

    var email = "auth@gmail.com";
    var password = "12345678";
    var shortPassword = "1234567";
    var invalidEmail = "auth@gmail.com123";
    var userId = "";

    it('should not register with invalid password', function (done) {
      agent
          .post('/auth/register')
          .send({email : email, password : shortPassword})
          .expect(500)
          .end(function(err,res){
            if(res.body.invalidAttributes.password.length == 0){
              return done(Error("no password invalidation error was popped"));
            }
            done();
          })
    })

    //
    it('should register if account not exist', function (done) {
      agent
          .post('/auth/register')
          .send({email : email, password: password})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != email){
              return done(Error("registration not being processed with the same email"))
            }
            userId = res.body.id;
            done();
          })
    })
    //
    it('should not register if account exist', function (done) {
      agent
          .post('/auth/register')
          .send({email : email, password: password})
          .expect(400)
          .end(function(err,res){
            if(res.body.code != -1){
             return done(Error("the error code is not -1 which is trying to register the existed user error"))
            }
            done();
          })
    })

    it('should login if account exist', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : email, password: password})
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != email){
              return done(Error("not login with the same account(email not the same)"))
            }
            done();
          })
    })

    it('shouldnot login if password not correct', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : email, password: shortPassword})
          .expect(400)
          .end(function(err,res){
            if(res.body.error != "Invalid email or password"){
              return done(Error("it didn't pop the wrong credentials error"))
            }
            done();
          })
    })

    var newEmail = "auth2@gmail.com"
    it('should register instead if account not exist', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : newEmail, password: password})
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != newEmail){
              return done(Error("registration not being processed with the same email"))
            }
            done();
          })
    })

    it('should become a host if logged in', function (done) {
      agent
          .post('/user/becomeHost')
          .expect(200)
          .end(function(err,res){
            if(res.body.user.host == undefined){
              return done(Error("become host for a logged user doesn't work"));
            }
            done();
          })
    })

    it('should get forbidden error for a host trying to apply for host', function (done) {
      agent
          .post('/user/becomeHost')
          .expect(403,done)
    })

    it('should logged out a logged in user', function (done) {
      agent
          .post('/auth/logout')
          .expect(200)
          .end(function(err,res){
            if(res.body.user != undefined){
              return done(Error("logout not success"));
            }
            done();
          })
    })

    it('should pop authenticated error trying to log out when no one is logged in', function (done) {
      agent
          .post('/auth/logout')
          .expect(403,done)
          })



  });

  describe('user profile update', function() {

    var userId = '';
    it('should login if account exist', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : email, password: password})
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != email){
              return done(Error("not login with the same account(email not the same)"))
            }
            userId = res.body.id;
            done();
          })
    })

    var addresses = [{"street":"1974 palou ave","city" : "San Francisco", "zip" : 94124, "phone" : 14158023853,"isDefault": true},{"street":"1455 Market St","city" : "San Francisco", "zip" : 94124, "phone" : 14158023853, "isDefault" : false}];

    it('should update the address info', function (done) {
      agent
          .put('/user/' + userId)
          .send({address_list : addresses})
          .expect(200)
          .end(function(err,res){
            if(res.body.address_list[0].city != "San Francisco"){
              return done(Error('error geocoding the address'));
            }
            done();
          })
    })

    var email = "auth@gmail.com";
    var password = "12345678";
    var anotherEmail = "notauth@gmail.com"
    var anotherUserId = "";

    it('should register instead if account not exist', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : anotherEmail, password: password})
          .expect(200)
          .end(function(err,res){
            if(res.body.auth.email != anotherEmail){
              return done(Error("registration not being processed with the same email"))
            }
            anotherUserId = res.body.id;
            done();
          })
    })

    it('should not update the user whos not myself', function (done) {
      agent
          .put('/user/' + userId)
          .send({addresses : [{"v":"1974 palou ave, San Francisco"},{"v":"1455 market st, San Francisco"}]})
          .expect(403, done)
    })

    it('should logged out a logged in user', function (done) {
      agent
          .post('/auth/logout')
          .expect(200)
          .end(function(err,res){
            if(res.body.user != undefined){
              return done(Error("logout not success"));
            }
            done();
          })
    })

    it('should not update the user thats not logged in', function (done) {
      agent
          .put('/user/' + anotherUserId)
          .send({address : "1974 palou ave, San Francisco"})
          .expect(403, done)
    })


  });

    //need manual test for facebook and google login

});
