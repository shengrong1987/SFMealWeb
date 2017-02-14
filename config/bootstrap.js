/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */



module.exports.bootstrap = function(cb) {

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

  require('async').auto({
    'scheduler' : function(next){
      Jobs.jobs({ name : 'SchedulerJob'}, function(err, jobs){
        if(err){
          return next(err);
        }
        if(jobs.length != 0){
          return next();
        }
        Jobs.schedule('next tuesday at noon', 'SchedulerJob', function(err, job) {
          if (err) {
            return next(err);
          }
          next();
        });
      })
    },
    'selectionScheduler' : function(next){
      Jobs.jobs({ name : 'ChefSelectionSchedulerJob'}, function(err, jobs){
        if(err){
          return next(err);
        }
        if(jobs.length != 0){
          return next();
        }
        Jobs.schedule('next monday at 10am', 'ChefSelectionSchedulerJob', function(err, job) {
          if (err) {
            return next(err);
          }
          next();
        });
      })
    }
  },function(err) {
    if (err) {
      return cb(err);
    }
    cb();
  });
};
