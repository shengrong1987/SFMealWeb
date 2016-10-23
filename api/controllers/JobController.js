/**
 * JobController
 *
 * @module      :: Controller
 * @description	:: Agenda Jobs mongodb API
 *
 * @docs        :
 */
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
    var jobname = req.params.name;
    Jobs.now(jobname, {}, function(err, job){
      if(err){
        return res.badRequest(err);
      }
      return res.ok(job);
    });
  }
};
