/**
 * Dependencies
 */

var crypto = require('../');

require('mocha-generators')();
require('chai').should();


/**
 * Tests
 */

describe ('co-crypto', function () {
  it ('should generate random bytes', function *() {
    var bytes = yield crypto.randomBytes(20);
    bytes.length.should.equal(20);
  });
  
  it ('should generate pseudo-random bytes', function *() {
    var bytes = yield crypto.pseudoRandomBytes(20);
    bytes.length.should.equal(20);
  });
  
  it ('should generate md5 hash', function () {
    var hash = crypto.createHash('md5').update('hello world').digest('hex');
    hash.length.should.equal(32);
  });
});