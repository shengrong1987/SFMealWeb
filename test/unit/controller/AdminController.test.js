
var assert = require('assert'),
    should = require('should'),
    sinon = require('sinon');
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('AdminController', function() {

  this.timeout(20000);

  var admin = "admin@sfmeal.com";
  var noneAdminEmail = "aimbebe.r@gmail.com";
  var password = "12345678";

  describe('only admin account has access to admin api', function(){

    it('should login if account exist', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : noneAdminEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should be denied accessing to admin api', function (done) {
      agent
        .get('/user/search?email=aimbebe.r@gmail.com')
        .expect(403)
        .end(done)
    })

    it('should login admin account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : admin, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should be able to access admin api', function (done) {
      agent
        .get('/user/search?email=aimbebe.r@gmail.com')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(1);
          done();
        })
    })
  })

  describe('admin api test', function() {
    var hostId;
    it('should be able to search host', function (done) {
      agent
        .get('/host/search?shopName=The Tea House')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(1);
          hostId = res.body[0].id;
          done();
        })
    })

    it('should be able to find host by id', function (done) {
      agent
        .get('/host/' + hostId)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('reviews');
          done();
        })
    })

    var mealId;
    var offlineMealId;

    it('should be able to search all meals', function (done) {
      agent
        .get('/meal/searchAll')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(5);
          mealId = res.body[0].id;
          res.body[2].status.should.be.equal("on");
          offlineMealId = res.body[2].id;
          done();
        })
    })

    it('should be able to search meals with keyword', function (done) {
      agent
        .get(encodeURI('/meal/searchAll?keyword=私房面馆-即点2'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(1);
          done();
        })
    })

    it('should be able to search dishes', function (done) {
      agent
        .get(encodeURI('/dish/search'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(7);
          done();
        })
    })

    it('should be able to search dishes with keyword', function (done) {
      agent
        .get(encodeURI('/dish/search?title=韭菜盒子'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(1);
          done();
        })
    })

    it('should NOT be able to turn a meal off', function (done) {
      agent
        .get(encodeURI('/meal/' + mealId + '/off'))
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-4);
          done();
        })
    })

    it('should not be able to turn a meal off', function (done) {
      agent
        .get(encodeURI('/meal/' + offlineMealId + '/off'))
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.code.should.be.equal(-4);
          done();
        })
    })

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    var hostId;
    var hostEmail = "aimbebe.r@gmail.com";

    it('should login an account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : hostEmail, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    });

    it('should get host id', function (done) {
      agent
        .get('/host/me')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err);
          }
          res.body.should.have.property('host');
          hostId = res.body.host.id;
          done();
        })
    });

    it('should log out user', function(done){
      agent
        .get('/auth/logout')
        .expect(302)
        .end(done)
    });

    it('should login admin account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email : admin, password: password})
        .expect(302)
        .expect('Location','/auth/done')
        .end(done)
    })

    it('should be able to turn a meal on', function (done) {
      agent
        .get(encodeURI('/meal/' + mealId + '/on'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.id.should.be.equal(mealId);
          done();
        })
    })

    var scheduledOrderId;
    var redeemPoints;
    it('should be able to search orders that is scheduled', function (done) {
      agent
        .get(encodeURI('/order/search?status=schedule'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(11);
          scheduledOrderId = res.body.filter(function(order){
            return Object.keys(order.transfer).length;
          })[0].id;
          redeemPoints = res.body[0].redeemPoints;
          done();
        })
    })

    it('should be able to abort order that is not canceled or completed', function (done) {
      agent
        .get('/order/' + scheduledOrderId + '/abort')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.status.should.be.equal('cancel');
          done();
        })
    })

    it('should be able to refund an discount order and reverse the transfer to host', function (done) {
      agent
        .get('/order/' + scheduledOrderId + '/refund')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.transfer[Object.keys(res.body.transfer)[0]].should.be.equal(0);
          done();
        })
    })

    it('should not be able to refund a refunded order', function (done) {
      agent
        .get('/order/' + scheduledOrderId + '/refund')
        .expect(200)
        .end(done)
    })

    var cancelOrderId;
    it('should be able to search orders that is cancelled', function (done) {
      agent
        .get(encodeURI('/order/search?status=cancel'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(4);
          cancelOrderId = res.body[0].id;
          done();
        })
    })

    it('should not be able to abort order that is cancelled', function (done) {
      agent
        .get('/order/' + cancelOrderId + '/abort')
        .expect(400)
        .end(done)
    })

  });
});
