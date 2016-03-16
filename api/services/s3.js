/**
 * Created by shengrong on 12/3/15.
 */
var s3 = {
  generate : function(userId){
    var s3Policy = {
      'conditions': [
        {'bucket': sails.config.aws.bucket},
        ['starts-with', '$key', 'users/' + userId],
        {'acl': 'public-read'},
        ["content-length-range", 0, sails.config.aws.maxSize],
        ['starts-with', '$Content-Type', 'image/']
      ]
      //'expiration': moment().add('minutes', CONF.s3.uploadWindow).format("YYYY-MM-DDTHH:MM:ss\\Z")
    };
    return s3Policy;
  }
}

module.exports = s3;


