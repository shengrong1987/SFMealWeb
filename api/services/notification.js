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
  notificationCenter : function(model, action, params, isSendToHost, isAdminAction, req, isSendToAdmin){

    isSendToHost = isSendToHost || false;
    isAdminAction = isAdminAction || false;
    params.isAdminAction = isAdminAction;

    this.transitLocaleTimeZone(params);

    this.publishEvent(model, action, params, isSendToHost, isAdminAction, isSendToAdmin);

    if(isAdminAction){
      //send emails to both chef and guest as it's modified by admin
      params.isSendToHost = true;
      notification.sendEmail(model, action, params, req);
      params.isSendToHost = false;
      notification.sendEmail(model, action, params, req);
    }else if(isSendToAdmin){
      params.isSendToAdmin = true;
      notification.sendEmail(model, action, params, req);
    }else{
      params.isSendToHost = isSendToHost;
      notification.sendEmail(model, action, params, req);
      notification.sendMsg(model, action, params, req);
    }
  },

  sendMsg : function(model, action, params, req){
    sails.log.info("start to send msg with action:" + action);
    var locale = req ? (params.isSendToHost ? params.host.locale : ( params.customer ? params.customer.locale : params.locale)) : '';
    var phone = params.isSendToHost ? (params.host ? params.host.phone : params.chef.phone) : params.customerPhone;
    var content = "";
    if(model === "Order"){
      var userOrderUrl = params.isExpressCheckout ? process.env.BASE_URL + "/order/" + params.id + "/receipt" : process.env.BASE_URL + "/user/me#myorder";
      var userReviewUrl = process.env.BASE_URL + "/user/me#myreview";
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
          }, params.id, userOrderUrl);
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
          }, params.id, userOrderUrl);
          message.sendMessage(phone, content);
          break;
        case "confirm":
          content = params.isSendToHost ? sails.__({
            phrase : 'orderConfirmMessageToHost',
            locale : locale
          }, params.id) : sails.__({
            phrase : 'orderConfirmMessageToGuest',
            locale : locale
          }, params.id, userOrderUrl);
          message.sendMessage(phone, content);
          break;
        case "ready":
          content = params.method === 'pickup' ? sails.__({
            phrase : 'orderReadyPickupReminderMessageToGuest',
            locale : locale
          }, params.id, params.pickupInfo.location, params.pickupInfo.phone, params.pickupInfo.pickupFromTime + ' - ' + params.pickupInfo.pickupTillTime, userOrderUrl) : sails.__({
            phrase : 'orderArriveReminderMessageToGuest',
            locale : locale
          }, params.phone, userOrderUrl);
          message.sendMessage(phone, content);
          break;
        case "reject":
          content = params.isSendToHost ? sails.__({
            phrase : 'orderRejectMessageToHost',
            locale : locale
          }, params.id, params.msg) : sails.__({
            phrase : 'orderRejectMessageToGuest',
            locale : locale
          }, params.id, params.msg, userOrderUrl);
          message.sendMessage(phone, content);
          break;
        case "reminder":
          if(params.method === 'pickup' && params.period === 'hour'){
            content = sails.__({
              phrase : 'orderPickupReminderMessageToGuestInHour',
              locale : locale
            }, params.id, params.pickupInfo.location, params.pickupInfo.phone, params.pickupInfo.pickupFromTime + ' - ' + params.pickupInfo.pickupTillTime, userOrderUrl);
            message.sendMessage(phone, content);
          }
          break;
        case "receive":
          if(!params.isExpressCheckout){
            content = sails.__({
              phrase : 'orderReceiveMessageToGuest',
              locale : locale
            },userReviewUrl);
            message.sendMessage(phone, content);
          }
          break;
        case "startReminder":
          content = sails.__({
            phrase : 'partyOrderStartReminder',
            locale : locale
          },params.id, params.pickupInfo.pickupFromTime);
          message.sendMessage(phone, content);
          break;
      }
    }else if(model === "Meal"){
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

  generateToken : function(){
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var token = '';
    for (var i = 16; i > 0; --i) {
      token += chars[Math.round(Math.random() * (chars.length - 1))];
    }

    // create expiration date
    var expires = new Date();
    expires.setHours(expires.getHours() + 2);

    return {
      token : token,
      expires : expires
    }
  },

  sendEmail : function(model, action, params, req){

    var basicInfo = this.inquireBasicInfo(params.isSendToHost, params.isSendToAdmin, params);
    var template = this.inquireTemplate(model,action);

    if(params.isSendToAdmin){
      var locale = params.locale;
    }else{
      var host = params.host || params.chef;
      locale = req ? (params.isSendToHost ? host.locale : ( params.customer ? params.customer.locale : params.locale)) : '';
    }

    this.mergeI18N(model, action, req, locale, params);

    var chef = params.chef || params.host;
    var county = chef ? chef.county : params.county;
    var isTaxIncluded = params.hasOwnProperty("isTaxIncluded") ? params.isTaxIncluded : ( params.meal ? params.meal.isTaxIncluded : false);
    params.taxRate = isTaxIncluded ? 0 : util.getTaxRate(county);
    params.recipientName = basicInfo.recipientName;
    params.senderName = "SFMeal.com";

    // juice it using email-template
    if(process.env.NODE_ENV==="development"){
      sails.log.info("sending email to: " + basicInfo.recipientEmail + " with email template: " + template);
      return;
    }

    sails.hooks.email.send(template, params,{
      to : basicInfo.recipientEmail,
      subject : "SFMeal support"
    },function(err){
      console.log(basicInfo.recipientEmail, err || "It worked!");
    })
  },

  publishEvent : function(model, action, params, isSendToHost, isAdminAction, isSendToAdmin){
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
    }else if(model === "Meal"){
      switch(action){
        case "mealScheduleEnd":
          Meal.publishUpdate( params.id, { id : params.id, action: "mealScheduleEnd", host: params.host || params.chef });
          break;
        case "start":
          Meal.publishUpdate( params.id, { id : params.id, action: "mealStart", host: params.host || params.chef });
          break;
      }
    }else if(model === "User"){
      switch(action){
        case "licenseUpdated":
          User.publishUpdate( params.admin, { id : params.id, action: "licenseUpdated"});
          break;
      }
    }

    if(isAdminAction){
      Notification.create({ recordId : params.id, host : params.host, action : action, model : model, verb : verb }).exec(function(err, noti){
        if(err){
          console.log(err);
        }
      });
      Notification.create({ recordId : params.id, user : params.customer, action : action, model : model, verb : verb}).exec(function(err, noti){
        if(err){
          console.log(err);
        }
      });
    }else if(isSendToHost){
      Notification.create({ recordId : params.id, host : params.host, action : action, model : model, verb : verb }).exec(function(err, noti){
        if(err){
          console.log(err);
        }
      });
    }else if(isSendToAdmin){
      if(model === "User"){
        Notification.create({ recordId : params.id, user : params.admin, action : action, model : model, verb : verb}).exec(function(err, noti){
          if(err){
            console.log(err);
          }
        });
      }
    }else{
      if(model === "Order"){
        Notification.create({ recordId : params.id, user : params.customer, action : action, model : model, verb : verb}).exec(function(err, noti){
          if(err){
            console.log(err);
          }
        });
      }
    }
  },

  inquireBasicInfo : function(isSendToHost, isSendToAdmin, params){
    var info = {};
    if(isSendToHost){
      info.recipientEmail = params.hostEmail;
      info.recipientName = (params.host || params.chef).shopName || '';
    }else if(isSendToAdmin){
      info.recipientEmail = "admin@sfmeal.com";
      info.recipientName = "SFMeal.com";
    }else{
      info.recipientEmail = params.guestEmail || params.email || (params.auth ? params.auth.email : null);
      info.recipientName = params.customerName || ( params.customer ? params.customer.firstname : '') || params.firstname || '';
    }
    return info;
  },

  inquireTemplate : function(model,action){
    var template = "";
    if(model === "Order"){
      switch(action){
        case "abort":
          template = "cancel";
          break;
        default:
          template = action;
      }
    }else if(model === "Meal"){
      switch(action){
        case "mealScheduleEnd":
          template = "guestlist";
          break;
        case "cancel":
          template = "cancel" + model;
          break;
        default:
          template = action;
      }
    }else if(model === "Host"){
      template = action;
    }else if(model === "User"){
      template = action;
    }
    return template;
  },

  mergeI18N : function(model, action, req, locale, params){
    var i18ns = ['enter-website','open-order','fen','order','order-number','dingdan','user','delivery-fee','total','footer-send-by','our-mailing-address','tax','service-fee','question-email','click-enter-info','click-upload-info','click-apply','comment','about-us','contact-us','privacy','step1','footer-bar-info'];
    if(model === "Order"){
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
          i18ns = i18ns.concat(['order-ready-title','order-pickup-ready-context','order-delivery-ready-context','pickup-method','self-pickup','delivery','pickup-location','order-time','complete-time','contact-phone','pickup-time']);
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
    }else if(model === "Meal"){
      switch(action){
        case "mealScheduleEnd":
          i18ns = i18ns.concat(['guest-list-title','guest-list-context','guest-list-no-title','guest-list-no-context','guest-list-no-tips','delivery-location','delivery-time','pickup-time','pickup-location','print-list','content','contact','amount-owe','open-meal','price','quantity']);
          break;
        case "start":
          i18ns = i18ns.concat(['meal-name','meal-number','meal-order-start-title','meal-order-start-context','step2','provide-time','ready-time','min']);
          break;
        case "cancel":
          i18ns = i18ns.concat(['pity','cancel','de-order','cancel-meal-title','meal-create-time','preorder-start-time','preorder-end-time','cancel-meal-context','meal-fail-requirement','open-meal','preorder-end-time','cancel-time','meal-number',"qty","left","cancel-reason"]);
          break;
        case "chefSelect":
          i18ns = i18ns.concat(['search','searching-tips','delivery-time','yourfollowedchef','menuoftheweek','hometaste1','see-more']);
          break;
      }
    }else if(model === "Host"){
      switch(action){
        case "summary":
          i18ns = i18ns.concat([]);
          break;
        case "welcome":
          i18ns = i18ns.concat(['welcome-title','welcome-context','before-start','chef-identity-verification','chef-identity-verification-context','kitchen-verification','kitchen-verification-context','food-handler-license-verification','food-handler-license-verification-context']);
          break;
        case "congrat":
          i18ns = i18ns.concat(['congrat-context','congrat-good-luck','view-dish','publish-meal','view-dish-context','publish-meal-context','manage-dish','manage-meal']);
          break;
      }
    }else if(model === "User"){
      switch (action){
        case "licenseUpdated":
          i18ns = i18ns.concat(['open-admin']);
          break;
        case "verification":
          i18ns = i18ns.concat(['email-verification','email-verification-instruction','email-verification-unknown','email-verification-link-expire','verify-email']);
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
    // moment.tz.add('America/Los_Angeles|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
    if(params.pickupInfo){
      // params.pickupInfo.pickupFromTime = moment.tz(params.pickupInfo.pickupFromTime, "America/Los_Angeles").format('ddd, L, LT');
      // params.pickupInfo.pickupTillTime = moment.tz(params.pickupInfo.pickupTillTime, "America/Los_Angeles").format('ddd, L, LT');
      params.pickupInfo.pickupFromTime = moment(params.pickupInfo.pickupFromTime).local().format('ddd, L, LT');
      params.pickupInfo.pickupTillTime = moment(params.pickupInfo.pickupTillTime).local().format('ddd, L, LT');
    }
    if(params.eta){
      params.eta = moment(params.eta).local().format('ddd, L, LT');
    }
    if(params.meal){
      params.meal.provideFromTime = moment(params.meal.provideFromTime).local().format('ddd, L, LT');
      params.meal.provideTillTime = moment(params.meal.provideTillTime).local().format('ddd, L, LT');
    }
    if(params.pickups){
      params.pickups.forEach(function(pickup){
        pickup.pickupFromTime = moment(pickup.pickupFromTime).local().format('ddd, L, LT');
        pickup.pickupTillTime = moment(pickup.pickupTillTime).local().format('ddd, L, LT');
      });
    }
    if(params.createdAt && moment(params.createdAt).isValid()){
      params.createdAt = moment(params.createdAt).local().format('L, LT');
    }
    if(params.updatedAt && moment(params.updatedAt).isValid()){
      params.updatedAt = moment(params.updatedAt).local().format('L, LT');
    }
    if(params.orders && params.orders.length){
      params.orders.forEach(function(order){
        order.pickupInfo.pickupFromTime = moment(order.pickupInfo.pickupFromTime).local().format('ddd, L, LT');
        order.pickupInfo.pickupTillTime = moment(order.pickupInfo.pickupTillTime).local().format('ddd, L, LT');
      });
    }
  }
}

module.exports = notification;


