/**
 * Created by shengrong on 12/3/15.
 */
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport("SMTP",{
  host : "smtp.office365.com",
  secureConnection : false,
  port : 587,
  auth : {
    user : "admin@sfmeal.com",
    pass : "Rs89030659!"
  },
  tls : {
    ciphers : 'SSLv3'
  }
});

var mailOptions = {
  from: '"SFMeal" <admin@sfmeal.com>', // sender address
  to: '', // list of receivers
  subject: 'Hello ✔', // Subject line
  text: 'Hello world 🐴', // plaintext body
  html: '<b>Hello world 🐴</b>' // html body
};

var notification = {
  notificationCenter : function(model, action, params, isHostAction){
    if(model === "Order"){
      switch(action){
        case "new":
          isHostAction = false;
          Order.publishCreate({id : params.id, host : params.host});
          break;
        case "adjust":
          isHostAction = !isHostAction;
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "adjusting":
          isHostAction = true;
          Order.publishUpdate( params.id, { id : params.id, action : "requested for adjust", host : params.host});
          break;
        case "cancel":
          isHostAction = !isHostAction;
          Order.publishDestroy( params.id, undefined, {host : params.host} );
          break;
        case "cancelling":
          isHostAction = true;
          Order.publishUpdate( params.id, { id : params.id, action : "requested for cancel", host : params.host});
          break;
        case "confirm":
          isHostAction = false;
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "ready":
          isHostAction = false;
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "receive":
          isHostAction = false;
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "reject":
          isHostAction = false;
          Order.publishUpdate( params.id, { id : params.id, action : "changes are rejected", host : params.host});
          break;
        case "review":
          isHostAction = true;
          Order.publishUpdate( params.id, { id : params.id, action : "has an new review!", host : params.host});
          break;
      }
      params.isHostAction = isHostAction;
    }
    notification.sendEmail(model, action, params);
  },
  sendEmail : function(model, action, params){
    if(model === "Order"){
      if(params.isHostAction === true){
        mailOptions.to = params.hostEmail;
      }else{
        mailOptions.to = params.guestEmail;
      }
      var content = notification.getEmailTemplate(model, action, params.id);
      mailOptions.text = content;
      mailOptions.html = content;
      transporter.sendMail(mailOptions,function(err, info){
        if(err){
          return console.log(err);
        }
        console.log('Message sent: ' + info.response);
      })
    }
  },

  getEmailTemplate : function(model, action, id){
    return model + ": " + id + " " + action;
  }
}

module.exports = notification;


