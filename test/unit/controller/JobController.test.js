
var assert = require('assert'),
    should = require('should'),
    sinon = require('sinon');
request = require('supertest');
var agent;

before(function(done) {
  agent = request.agent(sails.hooks.http.app);
  done();
})

describe('JobController', function() {

  this.timeout(10000);

  var adminEmail = "admin@sfmeal.com";
  var password = "12345678";

  describe('login admin and check jobs', function() {

    it('should login admin account', function (done) {
      agent
        .post('/auth/login?type=local')
        .send({email: adminEmail, password: password})
        .expect(302)
        .expect('Location', '/auth/done')
        .end(done)
    })

    it('should check and get unique SchedulerJob', function (done) {
      agent
        .get('/job?name=SchedulerJob')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          should.exist(res.body);
          res.body.length.should.be.equal(1);
          done();
        })
    });

    it('should check and get unique ChefSelectionSchedulerJob', function(done){
      agent
        .get('/job?name=ChefSelectionSchedulerJob')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.exist(res.body);
          res.body.length.should.be.equal(1);
          done();
        })
    });

    it('should check and get unique MealJob', function(done){
      agent
        .get('/job?name=MealJob')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.exist(res.body);
          res.body.length.should.be.equal(1);
          done();
        })
    });

    it('should check and get unique OrderJob', function(done){
      agent
        .get('/job?name=OrderJob')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err);
          }
          should.exist(res.body);
          res.body.length.should.be.equal(1);
          done();
        })
    });
  });

  describe('check order related jobs', function(){

    // var partyModeOrderId;
    // it('should get party order', function (done) {
    //   agent
    //     .get('/order?isPartyMode=true&limit=1')
    //     .expect(200)
    //     .end(function(err, res){
    //       if(err){
    //         return done(err);
    //       }
    //       partyModeOrderId = res.body[0].id;
    //       done();
    //     })
    // })

    // it('should run party order reminder job', function(done){
    //   agent
    //     .post('/job/PartyOrderStartReminderJob/run')
    //     .send({
    //       orderId : partyModeOrderId
    //     })
    //     .expect(200)
    //     .end(function(err, res){
    //       if(err){
    //         return done(err);
    //       }
    //       setTimeout(function(){
    //         done();
    //       }, 1000)
    //     })
    // });
  })
});
