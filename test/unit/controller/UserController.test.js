
var assert = require('assert'),
    should = require('should'),
    sinon = require('sinon');
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('UsersController', function() {

  this.timeout(30000);

  var newEmail = "shengrong1225" + new Date().getTime() + "@gmail.com";
  var password = "12345678";

  describe('register admin and create coupon', function(){
    var adminEmail = "admin@sfmeal.com";
    var now = new Date();
    var nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    it('should register admin account', function (done) {
      agent
        .post('/auth/register')
        .send({email : adminEmail, password: password, firstname : "admin", lastname : "account"})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          res.body.should.have.property('auth');
          res.body.auth.should.have.property('email',adminEmail);
          res.body.referralBonus.should.be.true();
          done();
        })
    })

    it('should have access to admin view', function(){
      agent
        .get('/auth/admin')
        .expect(200)
    })

    it('should create a coupon with $1 off', function(done){
      agent
        .post('/coupon')
        .send({
          type : "fix",
          amount : 1.00,
          description : "Happy Holiday",
          code : "XMAS",
          expire_at : nextHour
        })
        .expect(201)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.exist(res.body.id);
          res.body.amount.should.be.equal(1.00);
          done();
        })
    });

    it('should create a coupon with $5 off', function(done){
      agent
        .post('/coupon')
        .send({
          type : "fix",
          amount : 5.00,
          description : "Happy Holiday",
          code : "5Dollar",
          expire_at : nextHour
        })
        .expect(201)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.exist(res.body.id);
          res.body.amount.should.be.equal(5.00);
          done();
        })
    });

    it('should create a coupon with free shipping', function(done){
      agent
        .post('/coupon')
        .send({
          type : "freeShipping",
          description : "Happy Holiday",
          code : "SHIP",
          expire_at : nextHour
        })
        .expect(201)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.exist(res.body.id);
          res.body.code.should.be.equal("SHIP");
          done();
        })
    });
  })

  describe('user login', function() {

    var email = "aimbebe.r@gmail.com";
    var user2Email = "user2@sfmeal.com";
    var user3Email = "user3@sfmeal.com";
    var user4Email = "user4@sfmeal.com";
    var user5Email = "user5@sfmeal.com";
    var password2 = "123456789";
    var shortPassword = "1234567";
    var invalidPassword = "!1234567";
    var phone = "(415)123-1234";
    var birthday = new Date(1987, 10, 27);
    var invalidEmail = "auth@gmail.com123";
    var userId = "";
    var userFirstName = "Join";
    var userLastName = "Smith";

    it('should not register with short password', function (done) {
      agent
        .post('/auth/register')
        .send({email : email, password : shortPassword})
        .expect(500)
        .end(function(err,res){
          res.body.should.have.property('invalidAttributes');
          res.body.invalidAttributes.should.have.property('password').with.length(2,"password should fail at two restriction: one reg and one minLength");
          done();
        })
    })

    it('should not register with invalid password', function (done) {
      agent
        .post('/auth/register')
        .send({email : email, password : invalidPassword})
        .expect(500)
        .end(function(err,res){
          res.body.should.have.property('invalidAttributes');
          res.body.invalidAttributes.should.have.property('password').with.length(1,"password should fail at one restriction: reg");
          done();
        })
    })

    it('should not register, lack of password', function (done) {
      agent
        .post('/auth/register')
        .send({
          firstname: userFirstName,
          lastname: userLastName,
          email: email,
          phone: phone,
          birthday: birthday,
          receivedEmail: false
        })
        .expect(400)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        })
    })

    it('should not register, lack of email', function (done) {
      agent
        .post('/auth/register')
        .send({
          firstname: userFirstName,
          lastname: userLastName,
          password: password,
          phone: phone,
          birthday: birthday,
          receivedEmail: false
        })
        .expect(400)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        })
    })

    it('should not register, email does not valid', function (done) {
      agent
        .post('/auth/register')
        .send({
          firstname: userFirstName,
          lastname: userLastName,
          email: invalidEmail,
          password: password,
          phone: phone,
          birthday: birthday,
          receivedEmail: false
        })
        .expect(400)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          res.body.should.have.property('invalidAttributes');
          res.body.invalidAttributes.should.have.property('email').with.length(1,"email should fail at one restriction: reg");
          done();
        })
    })

    it('should register if account not exist', function (done) {
      agent
          .post('/auth/register')
          .send({email : email, password: password, firstname : "test", lastname : "account"})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err,res){
            res.body.should.have.property('auth');
            res.body.auth.should.have.property('email',email);
            res.body.referralCode.should.be.equal("test.account.2");
            userId = res.body.id;
            done();
          })
    })

    it('should not register if account exist', function (done) {
      agent
          .post('/auth/register')
          .send({email : email, password: password})
          .expect(400)
          .end(function(err,res){
            res.body.code.should.equal(-1, "should get account already exist error");
            done();
          })
    })

    it('should login if account exist', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })
  //
    it('should not login if password not correct', function (done) {
      agent
          .post('/auth/login?type=local')
          .send({email : email, password: shortPassword})
          .expect(400)
          .end(function(err,res){
            should.exist(res.body, "should get invalid email or password error");
            done();
          })
    })

    it('should not log in, lack of email', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({password : password})
        .expect(403)
        .end(done);
    })

    it('should not log in, lack of password', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email})
        .expect(403)
        .end(done);
    })

    it('should not login instead if account not exist', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : newEmail, password: password})
        .expect(403)
        .end(done)
    })

    it('should logged out a logged in user', function (done) {
      agent
          .post('/auth/logout')
          .expect(200)
          .end(function(err,res){
            should.not.exist(res.body.user, "should logout the user");
            done();
          })
    })

    it('should not able to upload url without login', function (done){
      agent
        .post('/user/getSignedUrl')
        .send({
          name : "test.jpg",
          type : "png",
          module : "thumbnail"
        })
        .expect(403, done)
    })

    it('should pop authenticated error trying to log out when no one is logged in', function (done) {
      agent
        .post('/auth/logout')
        .expect(403,done)
    })

    it('should register for No.2 user', function (done) {
      agent
        .post('/auth/register')
        .send({
          firstname: userFirstName,
          lastname: userLastName,
          email: user2Email,
          password: password2,
          phone: phone,
          birthday: birthday,
          receivedEmail: false
        })
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        })
    })

    it('should become a host if logged in', function (done) {
      agent
        .post('/user/becomeHost?phone=(415)802-3853')
        .expect(200)
        .end(function(err,res){
          res.body.should.have.property("user");
          should.exist(res.body.user.host);
          done();
        })
    })

    it('should register for No.3 user', function (done) {
      agent
        .post('/auth/register')
        .send({
          firstname: userFirstName,
          lastname: userLastName,
          email: user3Email,
          password: password2,
          phone: phone,
          birthday: birthday,
          receivedEmail: false
        })
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        })
    })

    it('should register for No.4 user', function (done) {
      agent
        .post('/auth/register')
        .send({
          firstname: userFirstName,
          lastname: userLastName,
          email: user4Email,
          password: password2,
          phone: phone,
          birthday: birthday,
          receivedEmail: false
        })
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        })
    })

    it('should register for No.5 user', function (done) {
      agent
        .post('/auth/register')
        .send({
          email: user5Email,
          password: password2,
          birthday: birthday,
          receivedEmail: false
        })
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        })
    })

    it('should not log in, email and password does not match', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : user2Email, password : password})
        .expect(403)
        .end(done);
    })
  });

  describe('user profile update', function() {

    var userId = '';
    it('should login if account exist', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
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
          res.body.auth.email.should.be.equal(email, "login user email does not match");
          userId = res.body.id;
          done()
        })
    })

    it('should not have county info by default', function(done){
      agent
        .get('/auth/done')
        .expect(200)
        .end(function(err, res){
          should.not.exist(res.body.county);
          done();
        })
    })

    var defaultPhone = "(415)218-6379";
    var newPhone = "(888)888-8888";
    var addresses = [
      {"street":"1974 palou ave","city" : "San Francisco", "zip" : '94124', "phone" : '(415)802-3853',"isDefault": false },
      {"street":"7116 Tiant Way","city" : "Elk Grove", "zip" : '95758', "phone" : '(415)802-3853', "isDefault" : false },
      {"street":"7118 Tiant Way","city" : "Elk Grove", "zip" : '95758', "phone" : defaultPhone, "isDefault" : true }
    ];
    var deletedAddresses;
    var updatingAddresses;
    var firstname = "sheng";
    var lastname = "rong";
    var addressId;

    it('should get image upload url', function (done){
      agent
        .post('/user/getSignedUrl')
        .send({
          name : "test.jpg",
          type : "png",
          module : "thumbnail"
        })
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.exist(res.body.url);
          should.exist(res.body.key);
          should.exist(res.body.policy);
          should.exist(res.body.signature);
          done();
        })
    })

    it('should get delete image url', function (done){
      agent
        .post('/user/me/deleteFile')
        .send({
          filename : "test.jpg",
          module : "thumbnail"
        })
        .expect(200, done)
    })

    it('should update the address info', function (done) {
      agent
          .put('/user/' + userId)
          .send({
            address : addresses,
            firstname : firstname,
            lastname : lastname
          })
          .expect(200)
          .end(function(err,res){
            res.body.should.have.property("address").with.length(3);
            should(res.body.address[0]).which.is.a.Object();
            (true).should.be.equalOneOf(res.body.address[0].isDefault, res.body.address[1].isDefault, res.body.address[2].isDefault);
            res.body.city.should.be.equal("Elk Grove");
            res.body.phone.should.be.equal(defaultPhone);
            res.body.referralCode.should.be.equal(firstname + "." + lastname + ".2");
            deletedAddresses = res.body.address;
            deletedAddresses = deletedAddresses.filter(function(address){
              if(address.isDefault){
                address.delete = true;
                return true;
              }
              return false;
            });
            updatingAddresses = res.body.address.filter(function(address){
              if(!address.isDefault){
                address.phone = newPhone;
                return true;
              }
              return false;
            })
            done();
          })
    })

    it('should not verify email without providing email', function(done){
        agent
          .put('/user/' + userId + '/sendEmailVerification')
          .send({})
          .expect(403)
          .end(function(err, res){
            res.body.code.should.be.equal(-5);
            done();
          })
    })

    it('should send verification email if email is verified', function(done){
      agent
        .put('/user/' + userId + '/sendEmailVerification')
        .send({
          email : email
        })
        .expect(200)
        .end(function(err, res){
          res.body.emailVerified.should.be.false();
          should.exist(res.body.verificationUrl);
          done();
        })
    })

    it('should update other user info', function (done) {
      agent
        .put('/user/' + userId)
        .send({
          firstname : firstname,
          lastname : lastname,
          phone : defaultPhone
        })
        .expect(200)
        .end(function(err,res){
          res.body.phone.should.be.equal(defaultPhone)
          done();
        })
    })

    it('should have county info now', function(done){
      agent
        .get('/auth/done')
        .expect('set-cookie','county=San Francisco; Path=/auth/done')
        .expect(200)
        .end(function(err, res){
          console.log(res.body.county);
          res.body.county.should.be.equal('Sacramento County');
          done();
        })
    })

    it('should update a non-default address', function (done) {
      agent
        .put('/user/' + userId)
        .send({
          address : updatingAddresses,
          phone : defaultPhone
        })
        .expect(200)
        .end(function(err,res){
          res.body.should.have.property("address").with.length(3);
          should(res.body.address[0]).which.is.a.Object();
          (newPhone).should.be.equalOneOf(res.body.address[0].phone, res.body.address[1].phone);
          res.body.phone.should.be.equal(defaultPhone);
          res.body.referralCode.should.be.equal(firstname + "." + lastname + ".2");
          done();
        })
    })

    it('should delete a default address', function (done) {
      agent
        .put('/user/' + userId)
        .send({
          address : deletedAddresses,
          firstname : firstname,
          lastname : lastname,
          phone : '(415)802-3853'
        })
        .expect(200)
        .end(function(err,res){
          res.body.should.have.property("address").with.length(2);
          should(res.body.address[0]).which.is.a.Object();
          (true).should.be.equalOneOf(res.body.address[0].isDefault, res.body.address[1].isDefault);
          res.body.referralCode.should.be.equal(firstname + "." + lastname + ".2");
          // res.body.city.should.be.equal("San Francisco");
          done();
        })
    })

    var email = "aimbebe.r@gmail.com";
    var password = "12345678";
    var anotherEmail = "notauth@gmail.com"
    var anotherUserId = "";

    it('should register instead if account not exist', function (done) {
      agent
          .post('/auth/register')
          .send({email : anotherEmail, password: password, firstname : "123", lastname : "la"})
          .expect(200)
          .end(function(err,res){
            res.body.should.have.property('auth');
            res.body.auth.email.should.equal(anotherEmail);
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
            should.not.exist(res.body.user);
            done();
          })
    })

    it('should not update the user thats not logged in', function (done) {
      agent
          .put('/user/' + anotherUserId)
          .send({address : "1974 palou ave, San Francisco"})
          .expect(403, done)
    })

    it('should have access to resetForm view', function(done){
      agent
        .get('/auth/resetForm')
        .expect(200, done)
    })

    it('should request and verify wechat api', function(done){
      agent
        .get('/auth/wechatSignature?url=http://sfmeal.com')
        .expect(200)
        .end(function(err, res){
          console.log(res.body);
          res.body.url.should.be.equal('http://sfmeal.com');
          should.exist(res.body.appid);
          should.exist(res.body.timestamp);
          should.exist(res.body.nonceStr);
          should.exist(res.body.signature);
          done();
        })
    })

    it('should test wechat platform API', function(done) {
      agent
        .get('/auth/wechat?signature=aerneQiK37rmpQgVuClSeOfXRxIbLycHSConuMHQTFA&nonce=wxfdb1d9c9775ec634&echostr=wxfdb1d9c9775ec634&timestamp=' + new Date().getTime())
        .expect(400, done)
    })
  });

  describe('user registration with referral code', function(){

    var email = "aimbebe.r@gmail.com";
    var password = "12345678";
    var referralCode = "";

    it('should login if account exist', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
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
          referralCode = res.body.referralCode;
          done();
        })
    })

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should get referrer code', function(done){
      agent
        .get('/join?code=' + referralCode)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.referrer.referralCode.should.be.equal(referralCode);
          done();
        })
    })

    it('use referers code to sign up should give 50 points to user', function(done){
      agent
        .post('/auth/register')
        .send({
          email: "referraltest@gmail.com",
          password: "12345678",
          birthday: null,
          receivedEmail: false
        })
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          res.body.points.should.be.equal(50);
          res.body.referralBonus.should.be.true();
          done();
        })
    })

    it('should login if account exist', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('referral should have 0 points', function(done){
      agent
        .get('/user/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.points.should.be.equal(0);
          done();
        })
    })

    it('should get referral data', function(done){
      agent
        .get('/join?code=' + referralCode)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('referrals').with.length(1);
          res.body.referrals[0].usedReferralBonus.should.be.false();
          done();
        })
    })

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should get referrer code', function(done){
      agent
        .get('/join?code=' + referralCode)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.referrer.referralCode.should.be.equal(referralCode);
          done();
        })
    })

    it('login again', function(done){
      agent
        .post('/auth/login?type=local')
        .send({email : "referraltest@gmail.com", password: "12345678"})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should not gain points for existing user', function (done) {
      agent
        .get('/user/me')
        .set('Accept','application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.points.should.be.equal(50);
          res.body.referralBonus.should.be.true();
          done();
        })
    })
  });

  describe("new user should be able to open reward window and take reward", function(){

    var email = "aimbebe.r@gmail.com";
    var adminEmail = "admin@sfmeal.com";
    var password = "12345678";
    var userId;

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should not get emailverification view if not login', function(done){
      agent
        .get('/user/emailVerification')
        .expect(403)
        .end(done)
    });

    it('should be able to get reward view', function(done){
      agent
        .get('/user/reward/newUser')
        .expect(200, done)
    });

    it('should not be able to redeem reward because not login', function(done){
      agent
        .get('/user/' + userId + "/redeemReward")
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-7);
          done();
        })
    })

    it('user login in', function(done){
      agent
        .post('/auth/login?type=local')
        .send({email : email, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should get user id', function(done){
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

    it('should get emailverification view', function(done){
      agent
        .get('/user/emailVerification')
        .expect(200, done)
    });

    it('should not be able to redeem reward because email not verified', function(done){
      agent
        .get('/user/' + userId + "/redeemReward")
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-8);
          done();
        })
    })

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('user login in', function(done){
      agent
        .post('/auth/login?type=local')
        .send({email : adminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should verify user email', function (done) {
      agent
        .put('/user/' + userId)
        .send({
          emailVerified : true
        })
        .expect(200,done)
    })

    it('should be able to redeem reward', function(done){
      agent
        .get('/user/' + userId + "/redeemReward")
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.newUserRewardIsRedeemed.should.be.true();
          res.body.points.should.be.equal(100);
          done();
        })
    })

    it('should not be able to redeem reward because reward already redeemed', function(done){
      agent
        .get('/user/' + userId + "/redeemReward")
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-9);
          done();
        })
    })
  })
});
