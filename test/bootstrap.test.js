
var Sails = require('sails'),
    rc = require('rc'),
    sails;

before(function(done) {
  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(12000);

  //fs.unlinkSync('/.tmp/myTestConnection.db');

  Sails.lift({
    // configuration for testing purposes
    log: { level: 'debug' },
    connections: {
      someMongodbServer : {
        database : 'test'
      }
    },
    models : { migrate : 'drop' }
  }, function(err, server) {

    sails = server;
    console.log("server lifted!");
    if (err) return done(err);
    // here you can load fixtures, etc.
    done(err, sails);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  Sails.lower(done);
});
