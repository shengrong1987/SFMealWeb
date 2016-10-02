/**
 * NotificationController
 *
 * @description :: Server-side logic for managing notifications
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var message = require('../services/message.js');
module.exports = {
	sendMessage : function(req, res){
	  var context = req.body.content;
    var phone = req.body.phone;
    if(!context || !phone){
      return res.badRequest('need context or phone number');
    }
    message.sendMessage('4158023853', 'helloworld', function(err, msg){
      if(err){
        return res.badRequest(err);
      }
      res.ok(msg);
    });
  }
};

