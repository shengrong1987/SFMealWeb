/**
 * Created by shengrong on 7/27/16.
 */
/**
 * Default jobs configuration
 * (sails.config.jobs)
 *
 * For more information using jobs in your app, check out:
 * https://github.com/vbuzzano/sails-hook-jobs
 */

module.exports.jobs = {

  // Where are jobs files
  "jobsDirectory": "api/jobs",

  // agenda configuration.
  // for more details about configuration,
  // check https://github.com/rschmukler/agenda
  "db": {
    "address"    : process.env.NODE_ENV === 'production' ?
      (process.env.MONGODB_JOB_USER + ":" + process.env.MONGODB_JOB_PWD + "@" + process.env.PUBLIC_IP + ":27017/jobs")
      : "localhost:27017/jobs",
    "collection" : "agendaJobs"
  },
  "name": "process name",
  "processEvery": "10 seconds",
  "maxConcurrency": 20,
  "defaultConcurrency": 5,
  "defaultLockLifetime": 100
};
