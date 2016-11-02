/**
 * Created by shengrong on 12/15/15.
 */
module.exports.aws = {
  id : process.env.AWS_S3_ID,
  key : process.env.AWS_S3_KEY,
  bucket : 'sfmeal',
  maxSizes :{
    thumbnail : '5242880',
    story : '5242880',
    dish : '5242880',
    license : '5242880'
  },
  host : 'https://sfmeal.s3.amazonaws.com/',
  acl : "public-read",
  region : "us-east-1"
}
