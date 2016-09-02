/**
 * Created by aimee on 8/31/16.
 */

var should = require('should'),
    request = require('supertest');
var agent;

before(function(done){
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('user register case', function() {

  this.timeout(5000);

  var userFirstName = "Join";
  var userLastName = "Smith";
  var user1Email = "aimeehuang@gmail.com";
  var user2Email = "user2@sfmeal.com";
  var user3Email = "user3@sfmeal.com";
  var user4Email = "user4@sfmeal.com";
  var user5Email = "user5@sfmeal.com";
  var password = "12345678";
  var phone = "(415)123-1234";
  var newEmail2 = "newmail2@gmail.com";
  var birthday = new Date(1987, 10, 27);

  //register

  it('should register successfully', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: user1Email,
        password: password,
        phone: phone,
        birthday: birthday,
        receivedEmail: true
      })
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.body.firstname.should.be.equal(userFirstName, "register user first name does not match user first name");
        res.body.lastname.should.be.equal(userLastName, "register user last name does not match user last name");
        res.body.should.have.property("auth");
        res.body.auth.email.should.be.equal(user1Email, "register user email does not match user email");
        res.body.phone.should.be.equal(phone, "register user phone does not match user phone");
        new Date(res.body.birthday).should.be.eql(birthday, "register user birthday does not match user birthday");
        res.body.receivedEmail.should.be.true();
        should.not.exist(res.body.auth.password);
        done();
      })
  })

  it('user2Email should register successfully', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: user2Email,
        password: password,
        phone: phone,
        birthday: birthday,
        receivedEmail: false
      })
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.body.receivedEmail.should.be.false("register user receivedEmail does not match");
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
      .expect(500)
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
        email: "newmailgmail.com",
        password: password,
        phone: phone,
        birthday: birthday,
        receivedEmail: false
      })
      .expect(500)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        done();
      })
  })
  it('should not register, lack of password', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: newEmail2,
        phone: phone,
        birthday: birthday,
        receivedEmail: false
      })
      .expect(500)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        done();
      })
  })
  it('should not register, password contains symbol', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: newEmail2,
        password: "!12345678",
        phone: phone,
        birthday: birthday,
        receivedEmail: false
      })
      .expect(500)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        done();
      })
  })
  it('should not register, password is too short', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: newEmail2,
        password: "123456",
        phone: phone,
        birthday: birthday,
        receivedEmail: false
      })
      .expect(500)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        done();
      })
  })
  it('should still register but get 400, phone does not valid', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: newEmail2,
        password: password,
        phone: "415aaa1234",
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
  it('should still register but get 400, phone is too short', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: newEmail2,
        password: password,
        phone: "415",
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
  // it('newEmail2 should register successfully', function (done) {
  //   agent
  //     .post('/auth/register')
  //     .send({
  //       firstname: userFirstName,
  //       lastname: userLastName,
  //       email: newEmail2,
  //       password: password,
  //       phone: phone,
  //       birthday: birthday,
  //       receivedEmail: false
  //     })
  //     .expect(200)
  //     .end(function (err, res) {
  //       if (err) {
  //         return done(err);
  //       }
  //       done();
  //     })
  // })
  // it('should not register, not old enough as 1', function (done) {
  //   agent
  //     .post('/auth/register')
  //     .send({
  //       firstname: userFirstName,
  //       lastname: userLastName,
  //       email: user3Email,
  //       password: password,
  //       phone: phone,
  //       birthday: new Date(2016, 10, 27),
  //       receivedEmail: false
  //     })
  //     .expect(500)
  //     .end(function (err, res) {
  //       if (err) {
  //         return done(err);
  //       }
  //       done();
  //     })
  // })
  it('should not register, email exists', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: newEmail2,
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
  it('user3Email should register successfully', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: user3Email,
        password: password,
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
  it('user4Email should register successfully', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: user4Email,
        password: password,
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
  it('user5Email should register successfully', function (done) {
    agent
      .post('/auth/register')
      .send({
        firstname: userFirstName,
        lastname: userLastName,
        email: user5Email,
        password: password,
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
  // it('should not register, email exists, should not login, password is not correct', function (done) {
  //   agent
  //     .post('/auth/register')
  //     .send({
  //       firstname: userFirstName,
  //       lastname: userLastName,
  //       email: user1Email,
  //       password: "123456789",
  //       phone: phone,
  //       birthday: birthday,
  //       receivedEmail: true
  //     })
  //     .expect(400)
  //     .end(function (err, res) {
  //       if (err) {
  //         return done(err);
  //       }
  //       done();
  //     })
  // })


// login/logout

it('user1Email should login', function (done) {
  agent
    .post('/auth/login?type=local')
    .send({email : user1Email, password : password})
    .expect(302)
    .expect('Location','/auth/done')
    .end(done);
})

it('user1Email should logout', function (done) {
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

it('user1Email should login', function (done) {
  agent
    .post('/auth/login?type=local')
    .send({email : user1Email, password : password})
    .expect(302)
    .expect('Location','/auth/done')
    .end(done);
})

it('should not log in, lack of email', function (done) {
  agent
    .post('/auth/login?type=local')
    .send({password : password})
    .expect(403)
    .end(done);
})

it('should not log in, email does bot exist', function (done) {
  agent
    .post('/auth/login?type=local')
    .send({email : 'emailnotexist@gmail.com', password : password})
    .expect(403)
    .end(done);
})

it('should not log in, email and password does not match', function (done) {
  agent
    .post('/auth/login?type=local')
    .send({email : user1Email, password : '123456789'})
    .expect(403)
    .end(done);
})

it('should not log in, lack of password', function (done) {
  agent
    .post('/auth/login?type=local')
    .send({email : user1Email})
    .expect(403)
    .end(done);
})

it('should log in', function (done) {
  agent
    .post('/auth/login?type=local')
    .send({email : user1Email, password : password})
    .expect(302)
    .expect('Location','/auth/done')
    .end(done);
    })


  it('login email should match', function (done) {
    agent
      .get('/user/me')
      .expect(200)
      .end(function (err, res) {
      if (err) {
        return done(err);
      }
      res.body.should.have.property("auth");
      res.body.auth.email.should.be.equal(user1Email, "login user email does not match");
      done();
    })

  })
})
