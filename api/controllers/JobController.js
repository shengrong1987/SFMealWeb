/**
 * JobController
 *
 * @module      :: Controller
 * @description	:: Agenda Jobs API
 *
 * @docs        :
 */
var ObjectID = require('mongodb').ObjectID;
module.exports = {
  find : function(req, res){
    Jobs.jobs(req.query,function(err, jobs){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(jobs);
    });
  },

  findOne : function(req, res){
    var id = req.params.id;
    var ObjectId = require('mongodb').ObjectId;
    Jobs.jobs({ _id : new ObjectId(id) }, function(err, job){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(job);
    })
  },

  run : function(req, res){
    var id = req.params.id;
    var ObjectId = require('mongodb').ObjectId;
    Jobs.jobs({ _id : new ObjectId(id) }, function(err, jobs){
      if(err){
        return res.badRequest(err);
      }
      var job = jobs[0];
      Jobs.now(job.attrs.name, req.body, function(err, job){
        if(err){
          return res.badRequest(err);
        }
        return res.ok(job);
      });
    })
  },

  deleteJob : function(req, res){
    var jobId = req.params.id;
    Jobs.cancel({ _id : ObjectID(jobId)}, function(err, numberRemoved){
      if(err){
        return res.badRequest(err);
      }
      Jobs.jobs({}, function(err, jobs){
        if(err){
          return res.badRequest(err);
        }
        return res.ok(jobs);
      });
    })
  },

  cleanJobs : function(req, res){
    Jobs.cancel(req.body, function(err, numberRemoved){
      if(err){
        return res.badRequest(err);
      }
      Jobs.jobs({}, function(err, jobs){
        if(err){
          return res.badRequest(err);
        }
        sails.log.info("execute jobs cleaning, " + numberRemoved + " jobs cleaned");
        return res.ok(jobs);
      });
    })
  }
};
