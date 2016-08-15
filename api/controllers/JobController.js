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
  }
};
