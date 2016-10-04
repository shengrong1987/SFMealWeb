/**
 * Created by shengrong on 12/3/15.
 */

// Twilio Credentials
var accountSid = sails.config.TwilioKeys.sid;
var authToken = sails.config.TwilioKeys.token;
var client = require('twilio')(accountSid, authToken);

module.exports = {
//require the Twilio module and create a REST client
  sendMessage : function(phone, content, cb){
    if(!phone){
      console.log("phone is empty");
      return;
    }
    phone = "+1" + phone.replace('(','').replace(')','').replace('-','').replace(' ','').trim();
    client.messages.create({
      to: phone,
      from: "+14159936325",
      body : content
    }, function (err, message) {
      console.log(message);
      // cb(err,message);
    });
  }
}

