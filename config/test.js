/**
 * Created by shengrong on 11/18/15.
 */
var bcrypt = require('bcrypt');

module.exports.hashTest = function(){
  var password = "abc";
  var hash = bcrypt.hashSync( password, 12345) // the salt of mentioned length(4-31) is self-generated which is random and fairly unique
//compareSYnc to compare hash
  var testString="abc";
  return bcrypt.compareSync(testString, hash);
}
