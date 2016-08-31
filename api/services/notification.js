/**
 * Created by shengrong on 12/3/15.
 */
var nodemailer = require('nodemailer');
var moment = require('moment');
var util = require('./util');
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
  notificationCenter : function(model, action, params, isSendToHost, isAdminAction, req){

    isSendToHost = isSendToHost || false;
    isAdminAction = isAdminAction || false;

    this.publishEvent(model, action, params, isSendToHost, isAdminAction);

    if(isAdminAction){
      //send emails to both chef and guest as it's modified by admin
      params.isSendToHost = true;
      notification.sendEmail(model, action, params, req);
      params.isSendToHost = false;
      notification.sendEmail(model, action, params, req);
    }
    else{
      params.isSendToHost = isSendToHost;
      notification.sendEmail(model, action, params, req);
    }
  },

  sendEmail : function(model, action, params, req){

    var basicInfo = this.inquireBasicInfo(params.isSendToHost, params);
    var template = this.inquireTemplate(model,action);
    var locale = req ? (params.isSendToHost ? params.host.locale : params.customer.locale) : '';

    this.mergeI18N(model, action, req, locale, params);

    this.transitLocaleTimeZone(params);
    util.getTaxRate(params);
    params.recipientName = basicInfo.recipientName;
    params.senderName = "SFMeal.com";

    //juice it using email-template
    sails.hooks.email.send(template,params,{
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
        case "reminder":
          template = "reminder";
          break;
      }
    }else if(model == "Meal"){
      switch(action){
        case "mealScheduleEnd":
          template = "guestlist";
          break;
        case "start":
          template = "start";
          break;
      }
    }
    return template;
  },

  mergeI18N : function(model, action, req, locale, params){
    var i18ns = ['enter-website','open-order','fen','order','order-number','dingdan','user','delivery-fee','total','footer-send-by','tax'];
    if(model == "Order"){
      switch(action){
        case "new":
          i18ns = i18ns.concat(['new-order-title','new-order-context','order-time','ready-time','order','preorder']);
          break;
        case "adjust":
          i18ns = i18ns.concat(['adjust-order-context','modify','de-order','order-time','adjust-time']);
          break;
        case "adjusting":
          i18ns = i18ns.concat(['apply-adjust','apply-adjust-order-context','confirm-or-reject','order-time','adjust-time','ready-time']);
          break;
        case "cancel":
          i18ns = i18ns.concat(['pity','cancel','de-order','cancel-order-context','order-time','preorder-end-time','cancel-time']);
          break;
        case "cancelling":
          i18ns = i18ns.concat(['apply-cancel','cancelling-order-title','cancelling-order-context','cancel-reason','order-time','apply-cancel-time','confirm-or-reject']);
          break;
        case "abort":
          i18ns = [];
          break;
        case "confirm":
          i18ns = i18ns.concat(['confirm-cancel','confirm-adjust','confirm-cancel-context','confirm-adjust-context','order-time','apply-cancel-time','apply-adjust-time','refund-method','default-card']);
          break;
        case "ready":
          i18ns = i18ns.concat(['order-ready-title','order-pickup-ready-context','order-delivery-ready-context','pickup-method','self-pickup','delivery','pickup-location','order-time','complete-time','contact-phone']);
          break;
        case "reject":
          i18ns = i18ns.concat(['cancel', 'adjust', 'get-reject','order-time','reject-reason',"order-cancel-reject-context","order-adjust-reject-context"]);
          break;
        case "review":
          i18ns = i18ns.concat(['review-order-title','review-order-context-1','review-order-context-2','review-dish','review-meal','scoreLabel','content','review-time','view-review']);
          break;
        case "reminder":
          i18ns = i18ns.concat(['order-pickup-reminder-title','order-pickup-reminder-hourly-context','order-pickup-reminder-daily-context','order-arrive-reminder-title','order-arrive-reminder-context','pickup-location','pickup-time','contact-phone','delivery-location']);
          break;
      }
    }else if(model == "Meal"){
      switch(action){
        case "mealScheduleEnd":
          i18ns = i18ns.concat(['guest-list-title','guest-list-context','guest-list-no-title','guest-list-no-context','guest-list-no-tips','delivery-location','delivery-time','pickup-time','pickup-location','print-list','content','contact','comment','open-meal']);
          break;
        case "start":
          i18ns = i18ns.concat(['meal-name','meal-number','meal-order-start-title','meal-order-start-context','step2','provide-time','ready-time','min']);
          break;
      }
    }

    i18ns.forEach(function(keyword){
      if(req){
        params[keyword.replace(/\-/g,'')] = req.__(keyword);
      }else{
        params[keyword.replace(/\-/g,'')] = sails.__({
          phrase : keyword,
          locale : locale
        });
      }
    });
  },

  transitLocaleTimeZone : function(params){
    moment.tz.add('America/Los_Angeles|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
    if(params.pickupInfo){
      params.pickupInfo.pickupFromTime = moment.tz(params.pickupInfo.pickupFromTime, "America/Los_Angeles");
      params.pickupInfo.pickupTillTime = moment.tz(params.pickupInfo.pickupTillTime, "America/Los_Angeles");
    }
    if(params.eta){
      params.eta = moment.tz(params.eta,"America/Los_Angeles");
    }
    if(params.meal){
      params.meal.provideFromTime = moment.tz(params.meal.provideFromTime, "America/Los_Angeles");
      params.meal.provideTillTime = moment.tz(params.meal.provideTillTime, "America/Los_Angeles");
    }
    if(params.pickups){
      params.pickups.forEach(function(pickup){
        pickup.pickupFromTime = moment.tz(pickup.pickupFromTime, "America/Los_Angeles");
        pickup.pickupTillTime = moment.tz(pickup.pickupTillTime, "America/Los_Angeles");
      });
    }
  }
}

module.exports = notification;


