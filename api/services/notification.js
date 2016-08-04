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
  /*
    publish event method
    @params
    model : the event model
    action : the action of the event
    params : model data
    isSendToHost : if the event is sent to host
    isAdminAction : if the event is post by admin
   */
  notificationCenter : function(model, action, params, isSendToHost, isAdminAction){

    isSendToHost = isSendToHost || false;
    isAdminAction = isAdminAction || false;

    this.publishEvent(model, action, params, isSendToHost, isAdminAction);

    if(isAdminAction){
      //send emails to both chef and guest as it's modified by admin
      params.isSendToHost = true;
      notification.sendEmail(model, action, params);
      params.isSendToHost = false;
      notification.sendEmail(model, action, params);
    }
    else{
      params.isSendToHost = isSendToHost;
      notification.sendEmail(model, action, params);
    }
  },

  sendEmail : function(model, action, params){

    var basicInfo = this.inquireBasicInfo(params.isSendToHost, params);
    var template = this.inquireTemplate(model,action);

    //juice it using email-template
    sails.hooks.email.send(template,{
      recipientName : basicInfo.recipientName,
      senderName : "SFMeal.com",
      id : params.id,
      lastStatus : params.lastStatus,
      layout : '../email_layout',
      filename : '/emailTemplate'
    },{
      to : basicInfo.recipientEmail,
      subject : "SFMeal.com"
    },function(err){

      console.log(basicInfo.recipientEmail, err || "It worked!");
    })
  },

  publishEvent : function(model, action, params, isSendToHost, isAdminAction){
    var verb = "updated";
    if(model === "Order"){
      switch(action){
        case "new":
          Order.publishCreate({id : params.id, host : params.host});
          verb = "created";
          break;
        case "adjust":
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "adjusting":
          Order.publishUpdate( params.id, { id : params.id, action : "requested for adjust", host : params.host});
          break;
        case "cancel":
          verb = "destroyed";
          Order.publishDestroy( params.id, undefined, {host : params.host} );
          break;
        case "abort":
          verb = "destroyed";
          Order.publishDestroy( params.id, undefined, {host : params.host} );
          break;
        case "cancelling":
          Order.publishUpdate( params.id, { id : params.id, action : "requested for cancel", host : params.host});
          break;
        case "confirm":
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "ready":
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "receive":
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "reject":
          Order.publishUpdate( params.id, { id : params.id, action : "changes are rejected", host : params.host});
          break;
        case "reminder":
          Order.publishUpdate( params.id, { id : params.id, action : action, host : params.host});
          break;
        case "review":
          Order.publishUpdate( params.id, { id : params.id, action : "has an new review!", host : params.host});
          break;
      }
    }else if(model == "Meal"){
      switch(action){
        case "scheduleEnd":
          Meal.publishUpdate( params.id, { id : params.id, action: "Your meal book time is over", host: params.host });
          break;
        case "start":
          Meal.publishUpdate( params.id, { id : params.id, action: "Your meal will start in 10 minutes.", host: params.host });
          break;
      }
    }

    if(isAdminAction){
      Notification.create({ recordId : params.id, host : params.host, action : action, model : model, verb : verb }).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
      });
      Notification.create({ recordId : params.id, user : params.customer, action : action, model : model, verb : verb}).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
      });
    }else if(isSendToHost){
      Notification.create({ recordId : params.id, host : params.host, action : action, model : model, verb : verb }).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
      });
    }else{
      Notification.create({ recordId : params.id, user : params.customer, action : action, model : model, verb : verb}).exec(function(err, noti){
        if(err){
          console.log(err);
          return;
        }
      });
    }
  },

  inquireBasicInfo : function(isSendToHost, params){
    var info = {};
    if(isSendToHost){
      info.recipientEmail = params.hostEmail;
      info.recipientName = (params.host || params.chef).shopName;
    }else{
      info.recipientEmail = params.guestEmail;
      info.recipientName = params.customer.firstname;
    }
    return info;
  },

  inquireTemplate : function(model,action){
    var template = "";
    if(model == "Order"){
      switch(action){
        case "new":
          template = "new";
          break;
        case "adjust":
          template = "adjust";
          break;
        case "adjusting":
          template = "adjusting";
          break;
        case "cancel":
          template = "cancel";
          break;
        case "cancelling":
          template = "cancelling";
          break;
        case "abort":
          template = "cancel";
          break;
        case "confirm":
          template = "confirm";
          break;
        case "ready":
          template = "ready";
          break;
        case "reject":
          template = "reject";
          break;
        case "review":
          template = "review";
          break;
      }
    }else if(model == "Meal"){
      switch(action){
        case "scheduleEnd":
          template = "scheduleEnd";
          break;
        case "start":
          template = "start";
          break;
      }
    }
    return template;
  }
}

module.exports = notification;


