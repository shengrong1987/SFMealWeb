/**
 * Created by shengrong on 12/3/15.
 */
var nodemailer = require('nodemailer');
var message = require('./message');
var moment = require('moment');
var util = require('./util');

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
      @isSendToHost : if the event is sent to host
      @isAdminAction : if the event is post by admin
      @hostEmail : email to send to host
      @guestEmail : email to send to guest
   */
  notificationCenter : function(model, action, params, isSendToHost, isAdminAction, req){

    isSendToHost = isSendToHost || false;
    isAdminAction = isAdminAction || false;
    params.isAdminAction = isAdminAction;

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
      notification.sendMsg(model, action, params, req);
    }
  },

  sendMsg : function(model, action, params, req){
    this.transitLocaleTimeZone(params);
    var locale = req ? (params.isSendToHost ? params.host.locale : params.customer.locale) : '';
    var phone = params.isSendToHost ? (params.host ? params.host.phone : params.chef.phone) : params.customer.phone;
    var content = "";
    if(model === "Order"){
      switch(action){
        case "new":
          content = sails.__({
            phrase : 'newOrderMessage',
            locale : locale
          }, params.meal.title);
          message.sendMessage(phone, content);
          break;
        case "adjust":
          content = sails.__({
            phrase : 'orderAdjustMessageToHost',
            locale : locale
          }, params.id);
          message.sendMessage(phone, content);
          break;
        case "adjusting":
          content = params.isSendToHost ? sails.__({
            phrase : 'orderAdjustRequestMessageToHost',
            locale : locale
          }, params.id) : sails.__({
            phrase : 'orderAdjustRequestMessageToGuest',
            locale : locale
          }, params.id);
          message.sendMessage(phone, content);
          break;
        case "cancel":
          content = sails.__({
            phrase : 'orderCancelMessageToHost',
            locale : locale
          }, params.id);
          message.sendMessage(phone, content);
          break;
        case "cancelling":
          content = params.isSendToHost ? sails.__({
            phrase : 'orderCancelRequestMessageToHost',
            locale : locale
          }, params.id) : sails.__({
            phrase : 'orderCancelRequestMessageToGuest',
            locale : locale
          }, params.id);
          message.sendMessage(phone, content);
          break;
        case "confirm":
          content = params.isSendToHost ? sails.__({
            phrase : 'orderConfirmMessageToHost',
            locale : locale
          }, params.id) : sails.__({
            phrase : 'orderConfirmMessageToGuest',
            locale : locale
          }, params.id);
          message.sendMessage(phone, content);
          break;
        case "ready":
          content = params.method == 'pickup' ? sails.__({
            phrase : 'orderReadyPickupReminderMessageToGuest',
            locale : locale
          }, params.id, params.pickupInfo.location, params.pickupInfo.phone, new Date(params.pickupInfo.pickupFromTime) + ' - ' + new Date(params.pickupInfo.pickupTillTime)) : sails.__({
            phrase : 'orderArriveReminderMessageToGuest',
            locale : locale
          }, params.phone);
          message.sendMessage(phone, content);
          break;
        case "reject":
          content = params.isSendToHost ? sails.__({
            phrase : 'orderRejectMessageToHost',
            locale : locale
          }, params.id, params.msg) : sails.__({
            phrase : 'orderRejectMessageToGuest',
            locale : locale
          }, params.id, params.msg);
          message.sendMessage(phone, content);
          break;
        case "reminder":
          if(params.method == 'pickup' && params.period == 'hour'){
            content = sails.__({
              phrase : 'orderPickupReminderMessageToGuestInHour',
              locale : locale
            }, params.id, params.pickupInfo.location, params.pickupInfo.phone);
            message.sendMessage(phone, content);
          }
          break;
      }
    }else if(model == "Meal"){
      switch(action){
        case "mealScheduleEnd":
          content = sails.__({
            phrase : 'mealScheduleEndToHost',
            locale : locale
          }, params.id);
          message.sendMessage(phone, content);
          break;
        case "start":
          content = sails.__({
            phrase : 'mealStartToHost',
            locale : locale
          }, params.id);
          message.sendMessage(phone, content);
          break;
      }
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
        case "mealScheduleEnd":
          Meal.publishUpdate( params.id, { id : params.id, action: "mealScheduleEnd", host: params.host || params.chef });
          break;
        case "start":
          Meal.publishUpdate( params.id, { id : params.id, action: "mealStart", host: params.host || params.chef });
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
      info.recipientName = (params.host || params.chef).shopName || '';
    }else{
      info.recipientEmail = params.guestEmail;
      info.recipientName = params.customer.firstname || '';
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
        case "cancel":
          template = "cancel" + model;
          break;
      }
    }else if(model == "Host"){
      switch(action){
        case "summary":
          template = "summary";
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
          i18ns = i18ns.concat(['adjust-order-context','adjust-order-from-host-context','modify','de-order','order-time','adjust-time','chef']);
          break;
        case "adjusting":
          i18ns = i18ns.concat(['apply-adjust','apply-adjust-order-context','apply-adjust-order-from-host-context','confirm-or-reject','order-time','adjust-time','ready-time','chef']);
          break;
        case "cancel":
          i18ns = i18ns.concat(['pity','cancel','de-order','cancel-order-context','order-time','preorder-end-time','cancel-time','cancel-order-admin-context','cancel-order-admin-title','cancel-reason']);
          break;
        case "cancelling":
          i18ns = i18ns.concat(['apply-cancel','cancelling-order-title','cancelling-order-context','cancel-reason','order-time','apply-cancel-time','confirm-or-reject']);
          break;
        case "abort":
          i18ns = [];
          break;
        case "confirm":
          i18ns = i18ns.concat(['confirm-cancel','confirm-adjust','confirm-cancel-context-by-user','confirm-cancel-context-by-host','confirm-adjust-context-by-user','confirm-adjust-context-by-host','order-time','apply-cancel-time','apply-adjust-time','refund-method','default-card']);
          break;
        case "ready":
          i18ns = i18ns.concat(['order-ready-title','order-pickup-ready-context','order-delivery-ready-context','pickup-method','self-pickup','delivery','pickup-location','order-time','complete-time','contact-phone']);
          break;
        case "reject":
          i18ns = i18ns.concat(['cancel', 'adjust', 'get-reject','order-time','reject-reason',"order-cancel-reject-context-by-host","order-cancel-reject-context-by-user","order-adjust-reject-context-by-host", "order-adjust-reject-context-by-user"]);
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
        case "cancel":
          i18ns = i18ns.concat(['pity','cancel','de-order','cancel-meal-title','meal-create-time','preorder-start-time','preorder-end-time','cancel-meal-context','meal-fail-requirement','open-meal','preorder-end-time','cancel-time','meal-number',"qty","left","cancel-reason"]);
          break;
      }
    }else if(model == "Host"){
      switch(action){
        case "summary":
          i18ns = i18ns.concat([]);
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
    if(params.createdAt && params.updatedAt){
      params.createdAt = moment.tz(params.createdAt, "America/Los_Angeles");
      params.updatedAt = moment.tz(params.updatedAt, "America/Los_Angeles");
    }
  }
}

module.exports = notification;


