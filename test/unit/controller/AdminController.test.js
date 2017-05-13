
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
          done();s
        })
    })

    var mealId;

    it('should be able to search all meals', function (done) {
      agent
        .get('/meal/searchAll')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(4);
          mealId = res.body[0].id;
          done();
        })
    })

    it('should be able to search meals with keyword', function (done) {
      agent
        .get(encodeURI('/meal/searchAll?keyword=私房面馆'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(3);
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
          res.body.should.have.length(4);
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
    it('should be able to search orders that is scheduled', function (done) {
      agent
        .get(encodeURI('/order/search?status=schedule'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(3);
          scheduledOrderId = res.body[0].id;
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

    it('should be able to refund order', function (done) {
      agent
        .get('/order/' + scheduledOrderId + '/refund')
        .expect(200)
        .end(done)
    })

    it('should not be able to refund a refunded order', function (done) {
      agent
        .get('/order/' + scheduledOrderId + '/refund')
        .expect(400)
        .end(done)
    })

    var cancelOrderId;
    it('should be able to search orders that is completed', function (done) {
      agent
        .get(encodeURI('/order/search?status=cancel'))
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          res.body.should.have.length(3);
          cancelOrderId = res.body[0].id;
          done();
        })
    })

    it('should not be able to abort order that is completed', function (done) {
      agent
        .get('/order/' + cancelOrderId + '/abort')
        .expect(400)
        .end(done)
    })

    it('should not be able to abort order that is completed', function (done) {
      agent
        .get('/order/' + cancelOrderId + '/abort')
        .expect(400)
        .end(done)
    })

  });
});
