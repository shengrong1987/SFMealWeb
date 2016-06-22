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
  notificationCenter : function(model, action, params, isHostAction, isAdminAction){
    var verb = "updated";
    if(model === "Order"){
      switch(action){
        case "new":
          isHostAction = true;
          Order.publishCreate({id : params.id, host : params.host});
          verb = "created";
          break;
        case "adjust":
          isHostAction = !isHostAction;
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "adjusting":
          isHostAction = true;
          action = "requested for adjust";
          Order.publishUpdate( params.id, { id : params.id, action : "requested for adjust", host : params.host});
          break;
        case "cancel":
          isHostAction = !isHostAction;
          verb = "destroyed";
          Order.publishDestroy( params.id, undefined, {host : params.host} );
          break;
        case "abort":
          isHostAction = false;
          verb = "destroyed";
          Order.publishDestroy( params.id, undefined, {host : params.host} );
          break;
        case "cancelling":
          isHostAction = true;
          action = "requested for cancel";
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
          action = "changes are rejected";
          Order.publishUpdate( params.id, { id : params.id, action : "changes are rejected", host : params.host});
          break;
        case "review":
          isHostAction = true;
          action = "has an new review!";
          Order.publishUpdate( params.id, { id : params.id, action : "has an new review!", host : params.host});
          break;
      }
      params.isHostAction = isHostAction;
    }
    if(isAdminAction){
      Notification.create({ recordId : params.id, host : params.host, action : action, model : model, verb : verb }).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
        params.isHostAction = true;
        notification.sendEmail(model, action, params);
      });
      Notification.create({ recordId : params.id, user : params.customer, action : action, model : model, verb : verb}).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
        params.isHostAction = false;
        notification.sendEmail(model, action, params);
      });

    }
    else if(isHostAction){
      Notification.create({ recordId : params.id, host : params.host, action : action, model : model, verb : verb }).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
        notification.sendEmail(model, action, params);
      });
    }else{
      Notification.create({ recordId : params.id, user : params.customer, action : action, model : model, verb : verb}).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
        notification.sendEmail(model, action, params);
      });
    }

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


