/**
 * Created by shengrong on 3/7/16.
 */
var Auth = Backbone.Model.extend({
  urlRoot : "/auth",
  url : function(){
    if(this.type === "login"){
      return this.urlRoot + "/login?type=" + this.method + '&originUrl=' + encodeURI(this.originUrl);
    }else{
      return this.urlRoot + "/" + this.type;
    }
  },
  validate : function(attrs, options){

  }
});

var LoginView = Backbone.View.extend({
  events : {
    "submit form" : "login",
    "click #FBBtn" : "FBLogin",
    "click #GoogleBtn" : "GoogleLogin",
    "click #sendEmailBtn" : "sendEmail",
    "click #resetPasswordBtn" : "resetPassword",
    "click #wechatBtn" : "gotoWechatLogin"
  },
  initialize : function(){
    var errorView = this.$el.find(".alert-danger");
    errorView.removeClass("d-none");
    errorView.hide();
    this.errorView = errorView;

    var successView = this.$el.find(".alert-success");
    successView.removeClass("d-none");
    successView.hide();
    this.successView = successView;

  },
  login : function(event){
    event.preventDefault();
    this.errorView.hide();
    this.model.type = "login";
    this.model.method = "local";
    if(this.$el.find("button[type='submit']").hasClass("disabled")){
      return;
    }
    var email = this.$el.find("#emailInput").length ? this.$el.find("#emailInput").val() : this.$el.find("#emailInput2").val();
    var password = this.$el.find("#passwordInput").length ? this.$el.find("#passwordInput").val() : this.$el.find("#passwordInput2").val();
    this.model.set({email : email, password : password});
    var $this = this;
    this.model.save({},{
      success : function(){
        if(location.href.indexOf('oauth2') !== -1){
          location.href = '/';
        }else{
          location.reload();
        }
      },error : function(model,err){
        $this.errorView.html(getMsgFromError(err));
        $this.errorView.show();
      }
    });
  },
  FBLogin : function(e){
    e.preventDefault();
    this.errorView.hide();
    this.model.type = "login";
    this.model.method = "facebook";
    this.model.originUrl = location.href.indexOf('oauth2') !== -1 ? 'https://sfmeal.com' : location.href;
    location.href = this.model.url();
  },
  GoogleLogin : function(e){
    e.preventDefault();
    this.errorView.hide();
    this.model.type = "login";
    this.model.method = "google";
    this.model.originUrl = location.href.indexOf('oauth2') !== -1 ? 'https://sfmeal.com' : location.href;
    var $this = this;
    location.href = this.model.url();
  },
  sendEmail : function(e){
    e.preventDefault();
    this.errorView.hide();
    this.successView.hide();
    var email = this.$el.find("#emailInput").val();
    this.model.type = "reset";
    this.model.set({email : email});
    var $this = this;
    this.model.save({},{
      success : function(model, result){
        $this.successView.show();
        $this.successView.html(jQuery.i18n.prop('emailSent'))
      },error : function(model, err){
        $this.errorView.show();
        $this.errorView.html(getMsgFromError(err));
      }
    })
  },
  resetPassword : function(e){
    e.preventDefault();
    this.errorView.hide();
    this.model.type = "reset";
    var password = this.$el.find("#passwordInput").val();
    var validator = new RegExp(/^[_A-z0-9]{8,}$/);
    if(!validator.test(password)){
      this.errorView.html(this.$el.find("#passwordInput").data('pattern-error'));
      this.errorView.show();
      return;
    }
    this.model.set({password : this.$el.find("#passwordInput").val()});
    var $this = this;
    this.model.save({},{
      success : function(model, result){
        if(result !== "404") {
          BootstrapDialog.alert(jQuery.i18n.prop('resetPasswordSuccess'), function(){
            location.href = "/";
          });
        }else{
          $this.errorView.show();
        }
      },error : function(model, err){
        $this.errorView.html(getMsgFromError(err));
        $this.errorView.show();
      }
    })
  },
  gotoWechatLogin : function(e){
    wechatLogin(true);
  }
});

var EmailVerificationView = Backbone.View.extend({
  events : {
    "submit form" : "sendEmail"
  },
  initialize : function(){
    var errorAlert = this.$el.find(".alert-danger");
    var successAlert = this.$el.find(".alert-success");
    errorAlert.removeClass("d-none").hide();
    successAlert.removeClass("d-none").hide();
    this.errorAlert = errorAlert;
    this.successAlert = successAlert;
    var userId = this.$el.data("user");
    this.model.set({ id : userId });
  },
  sendEmail : function(e){
    e.preventDefault();
    var _this = this;
    var email = this.$el.find("[type='email']").val();
    this.model.action = "sendEmailVerification";
    this.model.save({
      email : email
    }, {
      success : function(){
        _this.successAlert.html(jQuery.i18n.prop('emailVerificationSent'));
        _this.successAlert.show();
      },error : function(model, err){
        _this.errorAlert.html(getMsgFromError(err));
        _this.errorAlert.show();
      }
    })
  }
})

var RegisterView = Backbone.View.extend({
  events : {
    "submit form" : "register",
    "click #FBBtn" : "FBLogin",
    "click #GoogleBtn" : "GoogleLogin",
    "click #wechatBtn" : "gotoWechatLogin"
  },
  initialize : function(){
    var alertView = this.$el.find(".alert");
    alertView.removeClass("d-none");
    alertView.hide();
    this.alertView = alertView;
  },
  register : function(e){
    e.preventDefault();
    if(this.$el.find("button[type='submit']").hasClass("disabled")){
      return;
    }
    var alertView = this.alertView;
    alertView.hide();
    this.model.type = "register";
    var lastname = this.$el.find("#lastnameInput").val();
    var firstname = this.$el.find("#firstnameInput").val();
    var email = this.$el.find("#emailInput").val();
    var password = this.$el.find("#passwordInput").val();
    var phone = this.$el.find("#phoneInput").val();
    var bMonth = parseInt(this.$el.find("#bMonthInput").val());
    var bDay = parseInt(this.$el.find("#bDayInput").val());
    var bYear = parseInt(this.$el.find("#bYearInput").val());
    var birthDate = new Date(bYear,bMonth-1,bDay);
    var receivedEmail = this.$el.find("#receivedEmailInput")[0].checked;
    this.model.set({
      firstname : firstname,
      lastname : lastname,
      email : email,
      password : password,
      phone : phone,
      birthday : birthDate,
      receivedEmail : receivedEmail
    });
    this.model.save({},{
      success : function(){
        if(email.indexOf('@gmail.com')!==-1){
          var url = "https://mail.google.com";
        }else if(email.indexOf('hotmail.com')!==-1){
          url = "https://hotmail.com";
        }else if(email.indexOf('@aol.com')!==-1){
          url = "https://aol.com";
        }else if(email.indexOf('@yahoo.com')!==-1){
          url = "https://yahoo.com	";
        }else if(email.indexOf('@outlook.com')!==-1){
          url = "https://outlook.com";
        }else if(email.indexOf('@icloud.com')!==-1){
          url = "https://www.icloud.com/#mail";
        }else if(email.indexOf('@qq.com')!==-1){
          url = "https://mail.qq.com";
        }else{
          url = '';
        }
        var buttons = [];
        if(url){
          buttons = [{
            label: jQuery.i18n.prop('newUserCheckEmailButton'),
            action: function(dialog) {
              window.open(url);
            }
          }]
        }
        buttons.push({
          label: jQuery.i18n.prop('yes'),
          action: function(dialog) {
            if(location.href.indexOf('oauth2') !== -1){
              location.href = '/';
            }else{
              location.reload();
            }
          }
        });
        BootstrapDialog.show({
          title: jQuery.i18n.prop('newUserCheckEmailTitle'),
          message: jQuery.i18n.prop('newUserCheckEmailContent'),
          buttons: buttons
        });
      },error : function(model,err){
        alertView.html(getMsgFromError(err));
        alertView.show();
      }
    })
  },
  FBLogin : function(){
    this.alertView.hide();
    this.model.type = "login";
    this.model.method = "facebook";
    this.model.originUrl = location.href;
    location.href = this.model.url();
  },
  GoogleLogin : function(){
    this.alertView.hide();
    this.model.type = "login";
    this.model.method = "google";
    this.model.originUrl = location.href;
    location.href = this.model.url();
  },
  gotoWechatLogin : function () {
    wechatLogin(true);
  }
});

var UserBarView = Backbone.View.extend({
  events : {
    "click #applyToHostBtn" : "applyForHost",
    "mouseover #msgBtn" : "clearMsgBadges",
    "change #citySelector" : "switchCounty"
  },
  initialize : function(){
    var userId = this.$el.data("user");
    var hostId = this.$el.data("host");
    this.$el.find("#msgBtn .badge").hide();
    var hostBadgeView = this.$el.find("#hostActionBtn .badge");
    hostBadgeView.data("badge", 0);
    var userBadgeView = this.$el.find("#userActionBtn .badge");
    userBadgeView.data("badge", 0);
    var $this = this;
    if(hostId){
      io.socket.get("/host/" + hostId +  "/orders");
      io.socket.get("/user/" + userId + "/orders");
      io.socket.get("/user/" + userId + "/meals");
      io.socket.get("/host/" + hostId + "/meals");
      io.socket.on("order", function(result){
        if(result.data){
          $this.handleNotification(result.verb, result.data.action, result.id, "order");
          if(result.data.host && result.data.host.id === hostId){
            $this.handleBadge(true, "order");
          }else{
            $this.handleBadge(false, "order");
          }
        }
      });
      io.socket.on("meal", function(result){
        if(result.data){
          $this.handleNotification(result.verb, result.data.action, result.id, "meal");
          if(result.data.host && result.data.host.id === hostId){
            $this.handleBadge(true, "meal");
          }else{
            $this.handleBadge(false, "meal");
          }
        }
      });
    }else if(userId){
      io.socket.get("/user/" + userId + "/orders");
      io.socket.get("/user/" + userId + "/meals");
      io.socket.get("/user/" + userId);
      io.socket.on("order", function(result){
        // if(result.data){
        //   $this.handleNotification(result.verb, result.data.action, result.id, "order");
        // }
        $this.handleBadge(false, "order");
      });
      io.socket.on("meal", function(result){
        // if(result.data){
        //   $this.handleNotification(result.verb, result.data.action, result.id, "meal");
        // }
        $this.handleBadge(false, "meal");
      });
      io.socket.on("user", function(result){
        // if(result.data){
        //   $this.handleNotification(result.verb, result.data.action, result.data.id, "user");
        // }
        $this.handleBadge(false, "user");
      })
    }
    this.getNotification();
  },
  applyForHost : function(e){
    location.href = "/apply";
  },
  switchCounty : function(e){
    e.preventDefault();
    var currentCountyValue = readCookie('county');
    if(!$(e.currentTarget).attr("value") || currentCountyValue === $(e.currentTarget).attr("value")){
      return;
    }
    createCookie("county",$(e.currentTarget).attr("value"),30);
    if(location.href.indexOf('search') !== -1){
      search($(".search-container .searchBtn")[0], true);
    }else{
      location.href = location.href.split("?")[0];
      // location.reload();
    }
  },
  handleNotification : function(verb, action, id, model){
    model = model.toLowerCase();
    var msg = "unknown notification";
    switch(verb){
      case "updated":
        if(model === "order"){
          msg = jQuery.i18n.prop('orderUpdatedNotification',id, jQuery.i18n.prop(action));
        }else if(model === "meal"){
          msg = jQuery.i18n.prop('mealUpdatedNotification',id, jQuery.i18n.prop(action));
        }else if(model === "user"){
          msg = jQuery.i18n.prop('userUpdatedNotification',id, jQuery.i18n.prop(action));
        }
        break;
      case "destroyed":
        msg = jQuery.i18n.prop('orderCancelNotification',id);
            break;
      case "created":
        msg = jQuery.i18n.prop('newOrderNotification',id);
            break;
    }
    var msgBtn = this.$el.find("#msgBtn");
    msgBtn.find(".badge").show();
    if(msgBtn.attr("data-original-title") !== ""){
      var newMsg = msgBtn.attr('data-original-title') + "<br/><br/>" + msg;
      msgBtn.attr('data-original-title', newMsg)
        .tooltip('show');
    }else{
      msgBtn.attr('data-original-title', msg)
        .tooltip('show');
    }
  },

  getNotification : function(){
    var userId = this.$el.data("user");
    var hostId = this.$el.data("host") ? ( this.$el.data("host").id ? this.$el.data("host").id : this.$el.data("host")) : null;
    var $this = this;
    if(userId){
      $.ajax("/user/" + userId + "/notifications").done(function(data){
        data.forEach(function(notification){
          // $this.handleNotification(notification.verb, notification.action, notification.recordId, notification.model);
          $this.handleBadge(false, notification.model);
        });
      });
    }
    if(hostId){
      $.ajax("/host/" + hostId + "/notifications").done(function(data){
        data.forEach(function(notification){
          $this.handleNotification(notification.verb, notification.action, notification.recordId, notification.model);
          $this.handleBadge(true, notification.model);
        });
      });
    }
  },

  clearBadges : function(){
    var hostBadgeView = this.$el.find("#hostActionBtn .badge");
    var userBadgeView = this.$el.find("#userActionBtn .badge");
    hostBadgeView.data("badge",0);
    userBadgeView.data("badge",0);
    var orderBadgeView = this.$el.find("#userActionBtn").next().find("a").eq(0).find(".badge");
    orderBadgeView.text("");
    var msgBtn = this.$el.find("#msgBtn");
    msgBtn.attr('data-original-title', "")
      .tooltip('show');
  },

  clearMsgBadges : function(){
    this.$el.find("#msgBtn .badge").hide();
  },

  handleBadge : function(isHost, type){
    var hostBadgeView = this.$el.find("#hostActionBtn .badge");
    var userBadgeView = this.$el.find("#userActionBtn .badge");
    if(isHost){
      hostBadgeView.data("badge", hostBadgeView.data("badge") + 1);
    }else{
      userBadgeView.data("badge", userBadgeView.data("badge") + 1);
      switch(type.toLowerCase()){
        case "order":
          var orderBadgeView = this.$el.find("#userActionBtn").next().find("a").eq(0).find(".badge");
          var orderBadges =  parseInt(orderBadgeView.text() || 0);
          orderBadges++;
          orderBadgeView.text(orderBadges);
          break;
      }
    }
    var hostBadge = hostBadgeView.data("badge");
    if(hostBadge === 0){
      hostBadgeView.hide();
    }else{
      hostBadgeView.text(hostBadge);
      hostBadgeView.show();
    }
    var userBadge = userBadgeView.data("badge");
    if(userBadge === 0){
      userBadgeView.hide();
    }else{
      userBadgeView.text(userBadge);
      userBadgeView.show();
    }

    userBadgeView.next().find("a .badge").each(function(){
      var badgeCount = parseInt($(this).text());
      if(badgeCount == 0){
        $(this).hide();
      }else{
        $(this).show();
      }
    });
  }
});

var ApplyView = Backbone.View.extend({
  events : {
    "click #applyBtn" : "applyForHost",
    "click #addAddress" : "addAddress",
    "click #additionalBtn" : "handleAdditional"
  },
  initialize : function(){
    var alertView = this.$el.find("#additionalAlert");
    alertView.hide();
    this.alertView = alertView;
    var steps = this.$el.find(".navbar li a");
    var curStep = 1;
    var maxStep = 6;
    var stopHere = false;
    steps.each(function(index, value){
      if(stopHere){
        return;
      }
      if($(value).data("pass")){
        curStep++;
        if(curStep > maxStep){
          curStep = maxStep;
        }
      }else{
        stopHere = true;
      }
    });
    var birthMonth = this.$el.find("#bMonthInput").attr('value');
    var birthDay = this.$el.find("#bDayInput").attr('value');
    var birthYear = this.$el.find("#bYearInput").attr('value');
    this.$el.find("#bMonthInput option").each(function(){
      if(parseInt($(this).val()) === birthMonth){
        $(this).attr('selected', true);
      }
    });

    this.$el.find("#bDayInput option").each(function(){
      if(parseInt($(this).val()) === birthDay){
        $(this).attr('selected', true);
      }
    });

    this.$el.find("#bYearInput option").each(function(){
      if(parseInt($(this).val()) === birthYear){
        $(this).attr('selected', true);
      }
    });
    $('[href="#step'+curStep+'"]').tab('show');
    loadStripeJS(function(err){
      if(err){
        console.log("error loading stripe.js");
      }
    })

  },
  handleAdditional : function(e){
    e.preventDefault();
    var submit_btn = this.$el.find("[type='submit']");
    if (submit_btn.hasClass('disabled')) {
      return;
    }
    var alertView = this.alertView;
    alertView.hide();
    var $this = this;
    var idNumber = this.$el.find("#idNumberInput").val();
    if(idNumber){
      this.handleIDInfo(idNumber, function(){
        $this.saveAdditional();
      })
    }else{
      $this.saveAdditional();
    }
  },

  handleIDInfo : function(id, cb){
    Stripe.piiData.createToken({
      personal_id_number: id
    }, (function(ele, next){
      return function(status, res){
        if(res.error){
          console.log(res.error);
          return cb(res.error);
        }
        ele.find("#idNumberInput").val(res.id);
        next();
      }
    })(this.$el, cb));
  },

  handleDocument : function(file, cb){
    cb();
  },

  saveAdditional : function(){
    var lastname = this.$el.find("#lastnameInput").val();
    var firstname = this.$el.find("#firstnameInput").val();
    var bMonth = parseInt(this.$el.find("#bMonthInput").val());
    var bDay = parseInt(this.$el.find("#bDayInput").val());
    var bYear = parseInt(this.$el.find("#bYearInput").val());
    var ssnLast4 = this.$el.find("#socialInput").val();
    var idNumber = this.$el.find("#idNumberInput").val();
    var hostId = this.$el.data("host-id");
    var document = this.$el.find("#documentInput").length > 0 ? this.$el.find("#documentInput")[0].files : null;
    var formData = new FormData(this.$el.find("form")[0]);
    this.model.set('id',hostId);
    var legalObj;
    if(bDay && bMonth && bYear){
      legalObj = legalObj || {};
      legalObj.dob = {
        day : bDay,
        month : bMonth,
        year : bYear
      }
    }
    if(firstname && lastname){
      legalObj = legalObj || {};
      legalObj.first_name = firstname;
      legalObj.last_name = lastname;
    }
    if(ssnLast4){
      legalObj = legalObj || {};
      legalObj.ssn_last_4 = ssnLast4;
    }
    if(idNumber){
      legalObj = legalObj || {};
      legalObj.personal_id_number = idNumber;
    }
    if(legalObj){
      formData.append('legal_entity', JSON.stringify(legalObj));
    }
    if(document){
      formData.append('image',document[0]);
    }
    var $this = this;
    this.model.save({},{
      data : formData,
      processData: false,
      cache: false,
      contentType: false,
      success : function(){
        reloadUrl("/apply","#step6");
      },error : function(model,err){
        $this.alertView.html(getMsgFromError(err));
        $this.alertView.show();
      }
    })
  },
  addAddress : function(e){
    if($(e.currentTarget).attr('disabled')){
      return;
    }
    toggleModal(e, addressView.enterAddressInfo);
  },
  applyForHost : function(e){
    e.preventDefault();
    var shopName = this.$el.find("input[name='shopName']").val();
    if(!shopName){
      var alert1 = this.$el.find("#step1 .alert");
      alert1.text(jQuery.i18n.prop('shopnameEmptyError'));
      alert1.show();
      return;
    }
    var phone = this.$el.find("input[name='phone']").val();
    if(!phone){
      var alert1 = this.$el.find("#step1 .alert");
      alert1.text(jQuery.i18n.prop('phoneEmptyError'));
      alert1.show();
      return;
    }
    var btn = $(e.currentTarget);
    btn.addClass("running");
    this.model.url = "/user/becomeHost?shopName=" + shopName + '&phone=' + phone;
    this.model.fetch({
      success : function(){
        location.reload();
      },error : function(model,err){
        btn.removeClass("running");
        BootstrapDialog.alert(err.responseJSON ? (err.responseJSON.responseText || err.responseJSON.summary) : err.responseText);
      }
    });
  }
});

var Payment = Backbone.Model.extend({
  urlRoot : "/payment"
});

var PaymentView = Backbone.View.extend({
  events: {
    "click button[name='setToDefault']": "setToDefaultProfile",
    "submit form": "submitProfile",
    "click button[name='delete']" : "deleteProfile"
  },
  initialize: function () {
    var alertView = this.$el.find(".alert");
    alertView.removeClass("d-none");
    alertView.hide();
    this.alertView = alertView;

    var payment_form = this.$el.find("form");
    if(payment_form.data("id")){
      this.model.set({id: payment_form.data("id")});
    }
    loadStripeJS(function(err){
      if(err){
        console.log("error loading stripe.js");
      }
    })
  },
  submitProfile: function (e) {
    e.preventDefault();

    var btn = $(e.currentTarget).find('[type="submit"]');

    if (!Stripe.card.validateCVC(this.$el.find("#cvv").val())) {
      this.$el.find("#cvv").next().html($("#cvv").data("error"));
      return;
    }

    var $this = this;
    var paymentId = this.$el.find("form").data("id");
    if(paymentId){
      this.updatePaymentProfile(btn);
    }else{
      Stripe.card.createToken({
        number: this.$el.find("input[name='cardNumber']").val(),
        cvc: this.$el.find("#cvv").val(),
        exp_month: this.$el.find("select[name='month']").attr('value'),
        exp_year: this.$el.find("select[name='year']").attr('value'),
        name: this.$el.find("input[name='cardholdername']").val(),
        address_line1: this.$el.find("input[name='street']").val(),
        address_city: this.$el.find("input[name='city']").val(),
        address_zip: this.$el.find("input[name='zip']").val(),
        address_state: this.$el.find("input[name='state']").val(),
        address_country: this.$el.find(".flagstrap").data('selected-country')
      }, function(status, response){
        if (response.error) {
          btn.html(btn.data('original-text'));
          $this.alertView.html(jQuery.i18n.prop(response.error.code));
          $this.alertView.show();
        } else {
          var form = $this.$el.find("form");
          var token = response['id'];
          var brandInput = form.find("input[name='brand']");
          var brand = response['card']['brand'];
          if (brandInput.length === 0) {
            form.append("<input type='hidden' name='brand' value='" + brand + "' />");
          } else {
            brandInput.attr("value", brand);
          }
          var stripeTokenInput = form.find("input[name='stripeToken']");
          if (stripeTokenInput.length === 0) {
            form.append("<input type='hidden' name='stripeToken' value='" + token + "' />");
          }else {
            stripeTokenInput.attr("value", token);
          }
          $this.createPaymentProfile(btn);
        }
      });
    }
  },

  deleteProfile : function(e){
    e.preventDefault();
    var $this = this;
    this.model.destroy({
      success : function(model, response){
        location.reload();
        // reloadUrl('/pocket/me','#mypayment');
      },error : function(model,err){
        if(err.status === 200){
          location.reload();
        }else{
          $this.alertView.html(getMsgFromError(err));
          $this.alertView.show();
        }
      }
    });
  },

  setToDefaultProfile: function (e) {
    e.preventDefault();
    this.isSetToDefault = true;
    this.$el.find("form").validator({}).submit();
  },

  updatePaymentProfile : function(button){
    var $this = this;
    this.model.set({
      id : this.$el.find("form").data("id"),
      name: this.$el.find("input[name='cardholdername']").val(),
      exp_month: this.$el.find("select[name='month']").attr('value'),
      exp_year: this.$el.find("select[name='year']").attr('value'),
      cvc : this.$el.find("#cvc").val(),
      address_line1 : this.$el.find("input[name='street']").val(),
      address_city : this.$el.find("input[name='city']").val(),
      address_state : this.$el.find("input[name='state']").val(),
      address_zip : this.$el.find("input[name='zip']").val(),
      address_country: this.$el.find(".flagstrap").data('selected-country'),
      isDefaultPayment: this.isSetToDefault
    });
    this.model.save({}, {
      success: function () {
        if(location.href.indexOf('/pocket/me') !== -1){
          reloadUrl('/pocket/me','#mypayment');
        }else{
          location.reload();
        }
      }, error: function (model, err) {
        button.button('reset');
        $this.alertView.html(getMsgFromError(err));
        $this.alertView.show();
      }
    });
  },

  createPaymentProfile: function (button) {
    var $this = this;
    this.model.clear();
    this.model.set({
      stripeToken: this.$el.find("input[name='stripeToken']").val(),
      cardNumber: this.$el.find("input[name='cardNumber']").val(),
      isDefaultPayment: this.isSetToDefault,
      email : this.$el.find("#emailInput").val()
    });

    this.model.save({}, {
      success: function () {
        location.reload();
      }, error: function (model, err) {
        button.button('reset');
        $this.alertView.html(getMsgFromError(err));
        $this.alertView.show();
      }
    });
  }
});


var Host = Backbone.Model.extend({
  urlRoot : "/host",
  url : function(){
    if(this.action){
      return this.urlRoot + "/" + this.get("id") + "/" + this.action;
    }else{
      return this.urlRoot + "/" + this.get("id");
    }
  },
  validate : function(attrs, options){

  }
});

var NewUserRewardView = Backbone.View.extend({
  events : {
    "click #redeemRewardBtn" : "redeemReward"
  },
  redeemReward : function(){
    var userId = this.$el.find("#redeemRewardBtn").data("user");
    var _this = this;
    this.model.set({ id : userId});
    this.model.action = "redeemReward";
    this.model.save({}, {
      success : function(){
        BootstrapDialog.alert(jQuery.i18n.prop("emailVerifiedTip2"));
        _this.$el.find("#newUserRewardIcon").hide();
        _this.$el.find("#rewardRedeemedIcon").removeClass("d-none");
        _this.$el.find("#redeemRewardBtn").hide();
        _this.$el.find("#rewardRedeemedBtn").removeClass("d-none");
      },error : function(model, err){
        BootstrapDialog.alert(err.responseJSON.responseText);
      }
    })
  }
})

var User = Backbone.Model.extend({
  urlRoot : "/user",
  validate : function(attrs, options){

  },
  url : function(){
    if(this.get("id")){
      if(this.action){
        return this.urlRoot + "/" + this.get("id") + "/" + this.action;
      }else{
        return this.urlRoot + "/" + this.get("id");
      }
    }else{
      return this.urlRoot;
    }
  }
});

var AddressView = Backbone.View.extend({
  events : {
    "click .deleteBtn" : "deleteAddress",
    "submit form" : "saveAddress",
    "click #emailVerifyBtn" : "sendEmail"
  },
  initialize : function() {
    this.alertView = this.$el.find("#orderAlertView");
    this.alertView.removeClass("d-none");
    this.alertView.hide();
    var userId = this.$el.data("user");
    this.model.set({id: userId});
    this.isCoolDown = true;
  },
  deleteAddress : function(e){
    var _this = this;
    var target = $(event.target);
    var address_id = target.data("address-id");
    var userId = this.$el.data("user");
    this.model.clear();
    this.model.set({
      id : userId,
      address : [{
        id : address_id,
        delete : true
      }]
    });
    this.model.save({},{
      success : function(){
        _this.$el.find("[data-address-id='" + address_id + "']").parentsUntil(".addressItem").remove();
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
      }
    })
  },
  enterAddressInfoFromOrder : function (target){
    var target = $(target);
    var id = target.data("id");
    var address_form = $("#addressDetailView form");
    address_form.attr("data-id",id);
    address_form.find(".user").show();
    address_form.find(".host").hide();
    address_form.find("#new_title").removeClass("d-none");
    address_form.off("submit");
    address_form.on("submit", AddressView.prototype.saveAddress);
    address_form.find("button[name='cancel']").off("click");
    address_form.find("button[name='cancel']").on("click",dismissModal);
  },
  enterAddressInfo : function(target){
    var target = $(target);
    var address_id = target.data("address-id");
    var id = target.data("id");
    var street = target.data("street") || "";
    var city = target.data("city");
    var zip = target.data("zip");
    var phone = target.data("phone");
    var address_form = $("#addressDetailView form");
    address_form.off("submit");
    address_form.on("submit", AddressView.prototype.saveAddress);
    address_form.find("button[name='cancel']").off("click");
    address_form.find("button[name='cancel']").on("click",dismissModal);
    address_form.attr("data-id",id);
    address_form.attr("data-address-id",address_id);
    if(street){
      address_form.find("#exist_title").removeClass("d-none");
    }else{
      address_form.find("#new_title").removeClass("d-none");
    }
    var isHost = target.data("host");
    if(isHost){
      address_form.attr("data-host",true);
      address_form.find(".host").show();
      address_form.find(".user").hide();
    }else{
      address_form.find(".user").show();
      address_form.find(".host").hide();
    }
    address_form.find("#streetInput").val(street);
    address_form.find("#cityInput").val(city);
    address_form.find("#postalInput").val(zip);
    address_form.find("#phoneInput").val(phone);
  },
  saveAddress : function(e) {
    e.preventDefault();
    var address_form = $("#addressDetailView form");
    var phone = address_form.find("#phoneInput").val();
    var submit_btn = address_form.find("[type='submit']");
    if (submit_btn.hasClass('disabled') || !phone) {
      return;
    }
    var alert_block = address_form.find(".alert");
    alert_block.removeClass("d-none");
    alert_block.hide();
    var id = address_form.data("id");
    var address_id = address_form.data("address-id");
    var street = address_form.find("#streetInput").val();
    var city = address_form.find("#cityInput").val();
    var zip = address_form.find("#postalInput").val();
    var phone = address_form.find("#phoneInput").val();
    var isDefault = address_form.find("#isDefault").prop("checked");
    var url = "";
    if (address_form.data("host")) {
      addressView.model = new Host();
    }
    addressView.model.clear();
    addressView.model.set({id: id});
    addressView.model.set({
      address: [{
        id: address_id,
        street: street,
        city: city,
        zip: zip,
        phone: phone,
        isDefault: isDefault
      }]
    });
    addressView.model.save({}, {
      success: function () {
        location.reload();
      }, error: function (model, err) {
        if(err && err.responseJSON && err.responseJSON.invalidAttributes){
          if(err.responseJSON.invalidAttributes.county && err.responseJSON.invalidAttributes.county.length > 0){
            alert_block.html(jQuery.i18n.prop('countyNotInServiceError'));
          }else if(err.responseJSON.invalidAttributes.phone && err.responseJSON.invalidAttributes.phone.length > 0){
            alert_block.html(jQuery.i18n.prop('phoneNotValid'));
          }
        }else{
          alert_block.html(getMsgFromError(err));
        }
        alert_block.show();
        submit_btn.html(submit_btn.data('original-text'));
      }
    });
  },
  sendEmail : function(e){
    e.preventDefault();
    var email = this.$el.find("#emailVerificationView input[name='email']").val();
    if(!email){
      makeAToast(jQuery.i18n.prop('emailEmptyError'));
      return;
    }
    this.model.action = "sendEmailVerification";
    var $this = this;
    this.model.set({
      email : email
    })
    this.model.save({}, {
      success : function(){
        BootstrapDialog.show({
          title : jQuery.i18n.prop('tip'),
          message : jQuery.i18n.prop('emailVerificationSent'),
          buttons : [{
            label : jQuery.i18n.prop('emailVerificationCheck'),
            action : function(dialog){
              BootstrapDialog.alert(jQuery.i18n.prop('emailVerificationSent'), function(){
                var email = $this.model.get("email");
                if(!email){
                  return;
                }
                if(email.indexOf('@gmail.com')!==-1){
                  var url = "https://mail.google.com";
                }else if(email.indexOf('hotmail.com')!==-1){
                  url = "https://hotmail.com";
                }else if(email.indexOf('@aol.com')!==-1){
                  url = "https://aol.com";
                }else if(email.indexOf('@yahoo.com')!==-1){
                  url = "https://yahoo.com	";
                }else if(email.indexOf('@outlook.com')!==-1){
                  url = "https://outlook.com";
                }else if(email.indexOf('@icloud.com')!==-1){
                  url = "https://www.icloud.com/#mail";
                }else if(email.indexOf('@qq.com')!==-1){
                  url = "https://mail.qq.com";
                }else{
                  url = '';
                }
                window.open(url);
              });
            }
          }]
        });
      },error : function(err, model){
        $this.alertView.html(err.responseJSON ? err.responseJSON.responseText : err.responseText);
        $this.alertView.show();
      }
    })
  }
});

var Checklist = Backbone.Model.extend({
  urlRoot : '/checklist'
});

var CheckListView = Backbone.View.extend({
  events:{
    "change.bs.fileinput .fileinput" : "upload",
    "clear.bs.fileinput .fileinput" : "remove"
  },
  initialize : function(){
    var successView = this.$el.find(".alert-success");
    successView.removeClass("d-none");
    successView.hide();
    this.successView = successView;
    var errorView = this.$el.find(".alert-danger");
    errorView.removeClass("d-none");
    errorView.hide();
    this.errorView = errorView;
  },
  upload : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    var name = target.data("key");
    var id = this.$el.data("id");
    var file = target.find("input[type='file']")[0].files[0];
    var $this = this;
    imageHandler("checklist",file,this.successView,function(url){
      if(id){
        $this.model.set({ id : id});
      }
      var checkObj = {url : url};
      var modelObj = {};
      modelObj[name] = JSON.stringify(checkObj);
      $this.model.set(modelObj);
      $this.model.save({},{
        success : function (model) {
          location.reload();
        }, error: function (model, err) {
          $this.errorView.html(getMsgFromError(err));
          $this.errorView.show();
        }
      });
    }, function(err){
      $this.errorView.html(err);
      $this.errorView.show();
      return;
    },0,name);
  },
  remove : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    var name = target.data("key");
    var id = this.$el.data("id");
    var $this = this;
    imageHandler("checklist",null,this.successView,function(url){
      if(id){
        $this.model.set({ id : id});
      }
      var checkObj = {url : url};
      var modelObj = {};
      modelObj[name] = JSON.stringify(checkObj);
      $this.model.set(modelObj);
      $this.model.save({},{
        success : function (model) {
          location.reload();
        }, error: function (model, err) {
          $this.errorView.html(getMsgFromError(err));
          $this.errorView.show();
        }
      });
    }, function(err){
      $this.errorView.html(getMsgFromError(err));
      $this.errorView.show();
      return;
    },0,name,true);
  }
})


var Meal = Backbone.Model.extend({
  urlRoot : "/meal",
  url : function(){
    if(this.type === "coupon"){
      return this.urlRoot + "/" + this.get("id") + "/coupon/" + this.get("code");
    }else if(this.get("id")){
      if(this.action){
        return this.urlRoot + "/" + this.get("id") + "/" + this.action;
      }else{
        return this.urlRoot + "/" + this.get("id");
      }
    }else{
      if(this.action){
        return this.urlRoot + "/" + this.action;
      }
      return this.urlRoot;
    }
  }
});

var HostSectionInMealView = Backbone.View.extend({
  events : {
    "click [data-action]" : "go"
  },
  go : function(e){
    var btn = $(e.currentTarget);
    var $this = this;
    this.model.set({ id : btn.data("host")});
    this.model.action = btn.data("action");
    if(this.model.action === "like"){
      var countView = btn.find("[data-count]");
      var likeCount = countView.data('count');
      this.model.save({}, {
        success : function(){
          likeCount++;
          countView.data("count", likeCount);
          countView.text(likeCount);
        },
        error : function(model, err){
          makeAToast(getMsgFromError(err));
        }
      })
    }else if(this.model.action === "follow"){
      var isFollowed = btn.data("followed");
      if(isFollowed){
        this.model.action = "unfollow";
      }else{
        this.model.action = "follow";
      }
      $this.model.save({}, {
        success : function(){
          if(isFollowed){
            btn.data("followed", false);
            btn.find("i").removeClass("fas fa-star").addClass("far fa-star");
            btn.find('.text').text(jQuery.i18n.prop('follow'));
          }else{
            btn.data("followed", true);
            btn.find("i").removeClass("far fa-star").addClass("fas fa-star");
            btn.find('.text').text(jQuery.i18n.prop('followed'));
          }
        },
        error : function(model, err){
          makeAToast(getMsgFromError(err));
        }
      })
    }
  }
});

var DayOfMealView = Backbone.View.extend({
  events : {
    "click #gotoCheckoutBtn" : "gotoCheckout",
    "mixClick #dishContentView" : "selectDate",
    "mixEnd #dishContentView" : "renderImage",
  },
  initialize : function() {
    var dateDesc = decodeURI(readCookie("date"));
    var currentDateControl = this.$el.find("#dishDatesBar [data-filter='." + dateDesc + "']");
    if(currentDateControl.length){
      filter = "." + dateDesc;
      this.$el.find("#dishDatesBar li").removeClass("active");
      currentDateControl.parent().addClass("active");
    }else{
      var activeFilters = this.$el.find("#dishDatesBar .mixitup-control-active");
      var filter = "";
      if(activeFilters.length){
        filter = activeFilters.data("filter");
      }else{
        filter = this.$el.find("#dishDatesBar nav-link").data("filter");
      }
    }
    dateMixer.filter(filter);
  },
  selectDate : function(e){
    var originalEvent = e.originalEvent.detail.originalEvent;
    var currentTarget = $(originalEvent.currentTarget);
    var dateDesc = currentTarget.data("filter").replace(".","");
    createCookie("date", encodeURI(dateDesc));
  },
  renderImage : function(){
    echo.render();
  },
  gotoCheckout : function(e){
    var orderedDishes = []
    Object.keys(localOrders).forEach(function(dishId){
      if(localOrders[dishId].number>0){
        orderedDishes.push(dishId);
      }
    });
    if(!orderedDishes.length){
      makeAToast(jQuery.i18n.prop('noOrderTaken'));
      return;
    }
    var pickupNickname = this.$el.data("pickup-nickname");
    if(pickupNickname){
      location.href = "/meal/" + pickupNickname + "/checkout?dishes=" + orderedDishes.join(",");
    }else{
      location.href = "/meal/checkout?dishes=" + orderedDishes.join(",");
    }

  }
})

var MealSelectionView = Backbone.View.extend({
  events : {
    "click .calculateBtn" : "calculateDelivery",
    "change .variation a" : "changePreference",
    "click #applyCouponBtn" : "applyCouponCode",
    "click #applyPointsBtn" : "addPointsToOrder",
    "switchChange.bootstrapSwitch #cateringModeBtn" : "toggleCatering"
  },
  initialize : function(){
    this.alertView = this.$el.find("#orderAlertView");
    this.alertView.removeClass("d-none");
    this.alertView.hide();
    utility.initGoogleMapService();
  },
  initDelivery : function(){
    var $this = this;
    if(!this.$el.find(".deliveryOption").length){
      return;
    }
    var map;
    this.$el.find(".deliveryOption").each(function () {
      var location = $(this).data("location");
      var color = $(this).data("color");
      var area = $(this).data("area");
      var time = $(this).data("time");
      var range = $(this).data("range");
      utility.geocoding(location, function(err, center){
        if(err){
          makeAToast(err, 'error');
          return;
        }
        utility.initMap($this.$el.find("#googlemap")[0], center, function(err, map){
          if(err){
            makeAToast(err, 'error');
            return;
          }
          var colors = { red : '#ff4001', blue : '#3fa9f5', green : '#22b571', pink : '#ff7bac', yellow : '#ffd65a', orange : '#ff931e', 'dark-blue' : '#3f80f5'};
          var deliveryCircle = new google.maps.Circle({
            strokeColor: "#000000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: colors[color],
            fillOpacity: 0.35,
            map: map,
            center: center,
            radius: range * 1600
          });
          var image = {
            url : '/images/car-icon-' + color + '.png',
            size : new google.maps.Size(36, 36),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(18, 18)
          }
          var deliveryMarker = new google.maps.Marker({
            position: center,
            map: map,
            icon: image
          });
          var deliveryInfo = new google.maps.InfoWindow({
            content : "<h4><small><span data-toggle='i18n' data-key='deliveryRange'></span>:" + area + "<br/><span data-toggle='i18n' data-key='deliveryTime'></span>:" + time + "</small></h4>"
          })
          deliveryMarker.addListener('click', function(){
            deliveryInfo.open(map, deliveryMarker);
            setupLanguage();
          })
        });
      })
    });
  },
  initPickups : function(){
    var mapCenter = '';
    var $this = this;
    if(this.$el.find(".pickupOption").length === 0){
      mapCenter = "25 Washington St, Daly City";
    }else{
      mapCenter = $(this.$el.find(".pickupOption")[0]).data('location');
    }
    utility.geocoding(mapCenter, function(err, center){
      if(err){
        makeAToast(err);
        return;
      }
      $this.$el.find(".pickupOption").each(function () {
        var location = $(this).data("location");
        var title = '<div><h4><small><span data-toggle="i18n" data-key="pickup"></span>:' + location + '</small></h4></div>';
        var infowindow = new google.maps.InfoWindow({
          content: title
        });
        utility.initMap($this.$el.find("#googlemap")[0], center, function(err, map) {
          if (err) {
            makeAToast(err, 'error');
            return;
          }
          utility.geocoding(location, function(err, center){
            if(err){
              makeAToast(err);
              return;
            }
            var marker = new google.maps.Marker({
              position: center,
              title: title
            });
            marker.addListener('click', function () {
              infowindow.open(map, marker);
              setupLanguage();
            })
            marker.setMap(map);
          });
        });
      })
    })
  },
  changePreference : function(e){
    var target = $(e.currentTarget);
    var mySubmenu = target.closest('.dropdown-submenu[data-layer=0]');
    var orderIndex = mySubmenu.parent().children().index(mySubmenu);
    var preference = '';
    var extra = 0;
    var allVariations = target.closest('.variation').parent().children();
    allVariations.each(function(){
      var value = $(this).find("a").attr("value");
      var itemExtra = $(this).find("a").data("extra") || 0;
      if(preference && value){ preference += ",";}
      if(value){ preference += value;}
      extra += itemExtra;
    });
    var option = {
      property : preference,
      extra : extra
    };
    var dishId = $(e.currentTarget).data("dish");
    this.saveOption(orderIndex, option, dishId);
    updateMenuView(dishId);
    refreshCheckoutMenu();
  },
  saveOption : function(index, option, dishId){
    var localDish = readCookie(dishId);
    if(localDish){
      var localDishObj = JSON.parse(localDish);
      var options = localDishObj.preference;
    }else{
      options = [];
    }
    options[index] = option;
    localOrders[dishId] = localDishObj;
    createCookie(dishId, JSON.stringify(localDishObj), 1);
  },
  calculateDelivery : function(e){
    var $this = this;
    var target = $(e.currentTarget);
    this.$el.find("#addressAlertView").removeClass('hide');
    this.$el.find("#addressAlertView").hide();
    var originAddress = target.data("location");
    var uLat = $this.$el.data("user-lat");
    var uLong = $this.$el.data("user-long");
    if(!uLat || uLat === 'undefined' || !uLong || uLong === 'undefined'){
      return;
    }
    var method = target.data("method");
    var range = $this.$el.data("range");
    var readyIn = $this.$el.data("meal-prepareTime");
    var destination = {lat : uLat, lng: uLong};
    $this.googlemapService.route({
      origin : destination,
      destination : originAddress,
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(Date.now() + readyIn * 60 * 1000),  // for the time N milliseconds from now.
        trafficModel: "optimistic"
      }
    }, function(response, status){
      if (status === google.maps.DirectionsStatus.OK) {
        $this.googlemapDisplay.setDirections(response);
        var travelTime = response.routes[0].legs[0].duration.text;
        var distance = response.routes[0].legs[0].distance.value * 0.0006;
        $(e.currentTarget).find("+ label").text(travelTime + " " + response.routes[0].legs[0].distance.text);
        if(method && method === 'pickup'){
          return;
        }
        if(distance > range){
          $this.$el.find("#addressAlertView").show();
          $this.$el.find("#addressAlertView").html(jQuery.i18n.prop('deliveryOutOfRangeError'));
        }
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    })
  },
  toggleCatering : function(e){
    e.preventDefault();
    var button = $(e.currentTarget);
    var isCatering = button.prop("checked");
    var mealId = button.data("meal");
    setTimeout(function(){
      if(isCatering){
        location.href = "/meal/" + mealId + "?party=true";
      }else{
        location.href = "/meal/" + mealId;
      }
    },500);
  },
  applyCouponCode : function(e){
    e.preventDefault();
    this.alertView.hide();
    var code = this.$el.find(".coupon-code").val();
    if(!code){
      this.alertView.show();
      this.alertView.html(jQuery.i18n.prop('couponCodeEmpty'));
      return;
    }
    var mealId = this.$el.data("meal");
    this.model.set("id", mealId);
    this.model.set("code", code);
    this.model.type = "coupon";
    var $this = this;
    this.model.save({},{
    success : function( model, res){
      var discount = res.amount;
      var code = res.code;
      applyCoupon(true, discount, code);
    },
    error : function(model, err){
      if(err['responseJSON'].code === -48){
        jumpTo("emailVerificationView");
      }
      $this.alertView.show();
      $this.alertView.html(getMsgFromError(err));
    }});
  },
  addPointsToOrder : function(e){
    e.preventDefault();
    this.alertView.hide();
    var subtotal = this.$el.find(".subtotal").data("value");
    var tax = this.$el.find(".tax").data("value");
    var subtotalAfterTax = parseFloat(subtotal + tax);
    if(subtotalAfterTax === 0){
      this.alertView.show();
      this.alertView.html(jQuery.i18n.prop('orderEmptyError'));
      return;
    }
    var point = parseFloat(this.$el.find(".points").val());
    if(point===-1){
      this.alertView.show();
      this.alertView.html(jQuery.i18n.prop('notAuthorize'));
      return;
    }
    var pointRedeem;
    if(point >= subtotalAfterTax * 10){
      pointRedeem = Math.ceil(subtotalAfterTax * 10);
    }else{
      pointRedeem = point;
    }
    if(pointRedeem < 10){
      this.alertView.show();
      this.alertView.html(jQuery.i18n.prop('pointsTooLittle'));
      return;
    }
    applyPoints(true, pointRedeem);
  }
});

var MealView = Backbone.View.extend({
  isActivate : true,
  events : {
    "submit form" : "on",
    "click button[name='save']" : "off",
    "click #addNewPickupBtn" : "addNewPickup",
    "click .close" : "removePickup",
    "switchChange.bootstrapSwitch #isShipping" : "toggleShipping",
    "switchChange.bootstrapSwitch #isDelivery" : "toggleDelivery",
    "switchChange.bootstrapSwitch #isDeliveryBySystem" : "toggleDelivery",
    "switchChange.bootstrapSwitch #supportParty" : "togglePartyOrder",
    "click #freeShippingOption" : "toggleFreeShippingOpt",
    "change #shippingTypeOpt" : "changeTypeOfShippingFee",
    "change .method select" : "changeMethod",
    "click #orderTypeBtn" : "switchMealType",
    "click #preorderTypeBtn" : 'switchMealType',
    "change #dishSelected [data-toggle='manipulate-item']" : "dishOperationHandler",
    "change #storeHoursBtn" : "selectStoreHour"
  },
  initialize : function(){
    var form = this.$el.find("form");
    var formAlert = form.find(form.data("err-container") + " .alert.alert-danger");
    formAlert.hide();
    this.formAlert = formAlert;
    var successAlert = form.find(form.data("err-container") + " .alert.alert-success");
    successAlert.hide();
    this.successAlert = successAlert;
    var scheduleAlert = form.find("#scheduleAlert");
    scheduleAlert.hide();
    this.scheduleAlert = scheduleAlert;
    var dishesAlert = form.find("#dish-selector .alert");
    dishesAlert.hide();
    this.dishAlert = dishesAlert;
    var pickup_container = this.$el.find(".pickup_container");
    pickup_container.removeClass("d-none").hide();
    pickup_container.find(".pickup").each(function(){
      var method = $(this).find(".method select").attr("value");
      if(method === "delivery"){
        $(this).find(".pickup-item").hide();
        $(this).find(".delivery-item").show();
      }else{
        $(this).find(".pickup-item").show();
        $(this).find(".delivery-item").hide();
      }
    })
  },
  selectStoreHour : function(e){
    var btn = $(e.currentTarget);
    var value = btn.attr("value");
    if(value==="custom"){
      this.$el.find(".pickup_container").show();
    }else{
      this.$el.find(".pickup_container").hide();
    }
  },
  dishOperationHandler : function(e){
    var dishItem = $(e.currentTarget);
    var isFireOn = dishItem.data("fire");
    if(isFireOn){
      this.$el.find("#isSupportDynamicPrice").bootstrapSwitch('state',true);
    }
  },
  switchMealType : function(e){
    var targetHref = $(e.currentTarget).data('href');
    $(targetHref).parent().find('.tab-pane').hide();
    $(targetHref).show();
    if(targetHref === "#order"){
      this.$el.find(".order-require input").prop('disabled', true);
      this.$el.find(".order-require input").val('1');
    }else{
      this.$el.find(".order-require input").prop('disabled', false);
    }
  },
  changeTypeOfShippingFee : function(e){
    var select = $(e.target);
    var method = select.val();
    var shippingFeeInput = this.$el.find("#shippingFee");
    if(method === "custom"){
      shippingFeeInput.val("");
      shippingFeeInput.prop('disabled', true);
    }else{
      shippingFeeInput.prop('disabled', false);
    }
  },
  changeMethod : function(e){
    var select = $(e.target);
    var container = select.closest('.pickup');
    var method = select.val();
    container.find(".delivery-item").removeClass("d-none");
    if(method === "pickup"){
      container.find(".pickup-item").show();
      container.find(".delivery-item").hide();
    }else{
      container.find(".pickup-item").hide();
      container.find(".delivery-item").show();
    }
  },
  toggleShipping : function(e){
    var checkbox = $(e.target);
    var shippingTypeOptSelect = this.$el.find("#shippingTypeOpt");
    var shippingFeeInput = this.$el.find("#shippingFee");
    var freeAmountInput = this.$el.find("#freeAmount");
    if(checkbox.prop("checked")){
      freeAmountInput.prop('disabled', false);
    }else{
      freeAmountInput.prop('disabled', true);
    }
  },
  toggleFreeShippingOpt : function(e){
    var checkbox = $(e.target);
    var freeAmountInput = this.$el.find("#freeAmount");
    if(checkbox.prop("checked")){
      freeAmountInput.prop('disabled', false);
    }else{
      freeAmountInput.val("");
      freeAmountInput.prop('disabled', true);
    }
  },
  togglePartyOrder : function(e){
    var isSupportPartyOrder = this.$el.find("#supportParty").prop("checked");
    var partyRequirementView = this.$el.find("#partyRequirementView");
    partyRequirementView.removeClass("d-none");
    if(isSupportPartyOrder){
      partyRequirementView.show('1000');
    }else{
      partyRequirementView.hide();
    }
  },
  toggleDelivery : function(e){
    var isDelivery = this.$el.find("#isDelivery").prop("checked");
    var isDeliveryBySystem = this.$el.find("#isDeliveryBySystem").prop("checked");
    var deliveryFeeInput = this.$el.find("#deliveryFeeInput");
    var deliveryRangeInput = this.$el.find("#deliveryRangeInput");

    var deliverySettingView = this.$el.find("#deliverySettingView");
    deliverySettingView.removeClass("d-none");
    var settingButton = deliverySettingView.find(".setting");
    settingButton.removeClass("d-none");
    if(isDelivery){
      deliverySettingView.show("1000");
      if(isDeliveryBySystem){
        settingButton.hide();
      }else{
        settingButton.show("1000");
      }
    }else{
      deliverySettingView.hide();
    }
  },
  addNewPickup : function(e){
    e.preventDefault();
    var county = this.$el.find(".pickup_container").data("county");
    var pickups = this.$el.find(".pickup_container .pickup");
    var firstPickup = pickups.first();
    var driversOption = firstPickup.find(".phone .dropdown-menu").children();
    var phone = firstPickup.find(".phone button").attr('value');
    this.$el.find("#pickupAlert").hide();
    var pickupView = '<div class="pickup autoCompleteTarget py-2"> ' +
      '<div class="card"><div class="card-body"><h5 class="card-title text-right"><button type="button" class="close" aria-label="Close"> <span aria-hidden="true">&times;</span> </button></h5> ' +
      '<label><span data-toggle="i18n" data-key="pickupTime"></span><i class="fa fa-question-circle text-lightgrey cursor-pointer"></i></label> ' +
      '<div class="row">' +
      '<div class="col-12 col-sm-6"> <div class="form-group start-pickup"> <div class="input-group date" data-toggle="dateTimePicker"> <div class="input-group-prepend"><span class="input-group-text" data-toggle="i18n" data-key="from"></span></div> <input type="text" class="form-control" readonly="true"/> <div class="input-group-append"><span class="input-group-text datepickerbutton"> <i class="far fa-clock"></i> </span></span> </div></div></div> </div>' +
      '<div class="col-12 col-sm-6"> <div class="form-group end-pickup"> <div class="input-group date" data-toggle="dateTimePicker"> <div class="input-group-prepend"><span class="input-group-text" data-toggle="i18n" data-key="end"></span></div> <input type="text" class="form-control" readonly="true"/> <div class="input-group-append"><span class="input-group-text datepickerbutton"><i class="far fa-clock"></i></span> </div> </div></div></div>' +
      '</div>' +
      '<div class="form-group location pickup-item"> <label data-toggle="i18n" data-key="pickupAddress"></label> <input type="text" class="form-control"> </div>' +
      '<div class="form-group delivery-center delivery-item" style="display: none;"> <label data-toggle="i18n" data-key="deliveryCenter"></label> <input type="text" class="form-control"></div>' +
      '<div class="form-group public-location pickup-item"> <label data-toggle="i18n" data-key="publicLocation"></label> <input type="text" class="form-control"> </div>' +
      '<div class="form-group instruction pickup-item"><label data-toggle="i18n" data-key="pickupInstruction"></label> <input type="text" class="form-control"> </div>' +
      '<div class="row">' +
      '<div class="col-12 col-sm-6"><div class="form-group area" data-county="' + county + '"> <label data-toggle="i18n" data-key="area"></label> <input class="form-control" type="text" readonly="readonly" value=""> </div></div>' +
      '<div class="col-12 col-sm-6"><div class="form-group method"> <label data-toggle="i18n" data-key="pickupMethod"></label> <select class="form-control" style="height: 38px;"> <option value="delivery" data-toggle="i18n" data-key="delivery"></option> <option value="pickup" selected="true" data-toggle="i18n" data-key="pickup"></option> </select> </div></div>' +
      '</div>' +
      '<div class="row">' +
      '<div class="col-12 col-sm-6"><div class="form-group deliveryRange"><label data-toggle="i18n" data-key="deliveryRange"></label><input class="form-control" type="text" placeholder="5" value=""></div></div>'+
      '<div class="col-12 col-sm-6"><div class="dropdown phone"><label data-toggle="i18n" data-key="driver"></label><button class="btn btn-secondary dropdown-toggle form-control" type="button" data-toggle="dropdown" data-selected="true" aria-haspopup="true" aria-expanded="false" value="' + phone + '">' + phone + '<span class="caret"></span></button><div class="dropdown-menu"></div></div>'
      '</div>' +
      '</div></div> </div> </div>';
    this.$el.find(".pickup_container").append(pickupView);
    var phoneMenu = this.$el.find(".pickup_container .pickup").last().find(".phone .dropdown-menu").append(driversOption);
    this.$el.find("[data-toggle='dateTimePicker']").datetimepicker({
      icons:{
        time: "fal fa-clock",
        date: "fal fa-calendar",
        up: "fas fa-arrow-up",
        down: "fas fa-arrow-down",
        previous : "fas fa-arrow-left",
        next : "fas fa-arrow-right",
        today : "far fa-calendar-alt"
      },
      stepping : 30,
      showTodayButton : true,
      date : new Date()
    });
    setupLanguage();
    setupInputMask();
    utility.initAutoComplete();
  },
  removePickup : function(e){
    e.preventDefault();
    this.$el.find("#pickupAlert").hide();
    var pickupContainers = this.$el.find(".pickup_container .pickup");
    if(pickupContainers.length === 1){
      this.$el.find("#pickupAlert").show();
      return;
    }
    var targetPickup = $(e.currentTarget).parents(".pickup");
    targetPickup.remove();
  },
  on : function(e){
    e.preventDefault();
    this.model.clear();
    this.model.set({ status : "on"});
    this.saveMeal(e);
  },
  off : function(e){
    e.preventDefault();
    this.model.clear();
    this.model.set({ status : "off"});
    this.saveMeal(e);
  },
  saveMeal : function(e){
    e.preventDefault();
    var form = this.$el.find("form");
    var mealId = form.data("meal-id");
    var hostId = form.data("host-id");
    this.successAlert.hide();
    this.formAlert.hide();
    this.scheduleAlert.hide();
    this.dishAlert.hide();

    var dishesItems = form.find("#dishSelected li");
    if(dishesItems.length === 0){
      this.dishAlert.html(form.find("#dishSelected").data("error"));
      this.dishAlert.show();
      jumpTo("dishList");
      return;
    }

    var dishes = "";
    var totalQty = {};
    var cover,features,dynamicDishes = "";
    var index = 0;
    dishesItems.each(function(){
      var dishItem = $(this);
      var id = dishItem.data("id");
      var hasCover = !!dishItem.data().cover;
      var hasFeature = !!dishItem.data().feature;
      var isFire = !!dishItem.data().fire;
      if(hasCover){
        cover = id;
      }
      if(hasFeature){
        if(features!==""){features += ",";}
        features += id;
      }
      if(isFire){
        if(dynamicDishes!==""){dynamicDishes += ",";}
        dynamicDishes += id;
      }
      totalQty[id] = dishItem.find(".amount-input input").val();
      if(dishes!==""){
        dishes += ",";
      }
      dishes += dishItem.data("id");
      index ++;
    });

    if(cover === ""){
      cover = $(dishesItems[0]).data("id");
    }

    var isDelivery = form.find("#isDelivery").prop("checked");
    if(isDelivery){
      var deliveryFee = form.find("#deliveryFeeInput").val();
      var areaInput = form.find("#areaInput").val();
      var isDeliveryBySystem = this.$el.find("#isDeliveryBySystem").prop("checked");
      if(!deliveryFee || !deliveryRange){
        this.formAlert.show();
        this.formAlert.html(jQuery.i18n.prop("deliveryOptionError"));
        jumpTo("deliverySettingView");
        return;
      }
    }

    var isShipping = form.find("#isShipping").prop("checked");
    var hasFreeShipping = form.find("#freeShippingOption").prop("checked");
    if(isShipping){
      // var shippingFeeType = form.find("#shippingTypeOpt").val();
      // var shippingFee = form.find("#shippingFee").val();
      var freeShippingAmount = form.find("#freeAmount").val();
      var shippingPolicy = {
        // type : shippingFeeType,
        // price : shippingFee,
        // hasFreePolicy : hasFreeShipping,
        freeAmount : freeShippingAmount
      }
    }

    var isOrderNow = form.find("#radio-order-now:checked").length > 0;
    var type = "order";
    if(!isOrderNow){
      var startBookingDatePicker = form.find("#preorder .start-booking [data-toggle='dateTimePicker']");
      var startBookingDate = startBookingDatePicker.data("DateTimePicker").date();

      var endBookingDatePicker = form.find("#preorder .end-booking [data-toggle='dateTimePicker']");
      var endBookingDate = endBookingDatePicker.data("DateTimePicker").date();

      var storeHourNickname = form.find("#storeHoursBtn").attr("value");
      if(storeHourNickname!=="custom"){

      }else{
        var pickupViews = form.find("#preorder .pickup_container .pickup");
        var pickups = [];
        var pickupValid = true;

        var $this = this;

        pickupViews.each(function(){
          var pickupObj = {};
          var pickupFromTime = $(this).find(".start-pickup [data-toggle='dateTimePicker']").data("DateTimePicker").date();
          var pickupTillTime = $(this).find(".end-pickup [data-toggle='dateTimePicker']").data("DateTimePicker").date();
          var location = $(this).find(".location input").val();
          var publicLocation = $(this).find(".public-location input").val();
          var pickupInstruction = $(this).find(".instruction input").val();
          var deliveryCenter = $(this).find(".delivery-center input").val();
          var deliveryRange = $(this).find(".deliveryRange input").val();
          var area = $(this).find(".area input").val();
          var county = $(this).find(".area").data("county");
          if(!publicLocation){
            publicLocation = location;
          }
          var method = $(this).find('.method select').val();
          var phone = $(this).find('.phone button').prop('value');
          if(method === "pickup" && !location){
            pickupValid = false;
            $this.scheduleAlert.show();
            $this.scheduleAlert.html(jQuery.i18n.prop('pickupLocationEmptyError'));
            jumpTo("preorder");
            return;
          }
          if(!pickupFromTime || !pickupTillTime){
            pickupValid = false;
            $this.scheduleAlert.show();
            $this.scheduleAlert.html(jQuery.i18n.prop('pickupTimeEmptyError'));
            jumpTo("preorder");
            return;
          }else if(pickupFromTime.isSame(pickupTillTime)){
            pickupValid = false;
            $this.scheduleAlert.show();
            $this.scheduleAlert.html(jQuery.i18n.prop('provideTimeError'));
            jumpTo("preorder");
            return;
          }else if(pickupFromTime.isAfter(pickupTillTime)){
            pickupValid = false;
            $this.scheduleAlert.show();
            $this.scheduleAlert.html(jQuery.i18n.prop('bookingTimeInvalidError'));
            jumpTo("preorder");
            return;
          }else if(moment.duration(pickupTillTime.diff(pickupFromTime)).asMinutes() < 30){
            pickupValid = false;
            $this.scheduleAlert.show();
            $this.scheduleAlert.html(jQuery.i18n.prop('pickupTimeError'));
            jumpTo("preorder");
            return;
          }
          pickupObj.pickupFromTime = pickupFromTime._d;
          pickupObj.pickupTillTime = pickupTillTime._d;
          pickupObj.location = location;
          pickupObj.method = method;
          pickupObj.phone = phone;
          pickupObj.publicLocation = publicLocation || '';
          pickupObj.comment = pickupInstruction || '';
          pickupObj.deliveryCenter = deliveryCenter || '';
          pickupObj.deliveryRange = deliveryRange || 5;
          pickupObj.area = area;
          pickupObj.county = county;
          pickups.push(pickupObj);
        });
        if(!pickupValid){
          jumpTo("preorder");
          return;
        }
      }

      if(!startBookingDate || !endBookingDate){
        this.scheduleAlert.show();
        this.scheduleAlert.html(jQuery.i18n.prop('bookingTimeError'));
        jumpTo("preorder");
        return;
      }else if(startBookingDate.isSame(endBookingDate)){
        this.scheduleAlert.show();
        this.scheduleAlert.html(jQuery.i18n.prop('bookingTimeSameError'));
        jumpTo("preorder");
        return;
      }else if(moment.duration(endBookingDate.diff(startBookingDate)).asMinutes() < 60){
        this.scheduleAlert.show();
        this.scheduleAlert.html(jQuery.i18n.prop('bookingTimeTooShortError'));
        jumpTo("preorder");
        return;
      }

      type = "preorder";

    }else{
      startBookingDatePicker = form.find("#order .start-booking [data-toggle='dateTimePicker']");
      startBookingDate = startBookingDatePicker.data("DateTimePicker").date();
      endBookingDatePicker = form.find("#order .end-booking [data-toggle='dateTimePicker']");
      endBookingDate = endBookingDatePicker.data("DateTimePicker").date();

      if(!startBookingDate || !endBookingDate){
        this.scheduleAlert.show();
        this.scheduleAlert.html(jQuery.i18n.prop('provideTimeNotError'));
        jumpTo("order");
        return
      }else if(startBookingDate.isSame(endBookingDate)){
        this.scheduleAlert.show();
        this.scheduleAlert.html(jQuery.i18n.prop('bookingTimeSameError'));
        jumpTo("order");
        return;
      }else if(startBookingDate.isAfter(endBookingDate)){
        this.scheduleAlert.show();
        this.scheduleAlert.html(jQuery.i18n.prop('bookingTimeInvalidError'));
        jumpTo("order");
        return;
      }else if(moment.duration(endBookingDate.diff(startBookingDate)).asMinutes() < 60){
        this.scheduleAlert.show();
        this.scheduleAlert.html(jQuery.i18n.prop('bookingTimeTooShortError'));
        jumpTo("order");
        return;
      }
    }

    var singleOrderMinimal = form.find("#singleOrderInput").val() || 0;
    var min_total = form.find("#min-total").val() || 0;

    if(!singleOrderMinimal && !min_total){
      form.find(".order-require .alert").show();
      form.find(".order-require .alert").html(form.find("#min-order").data("error"));
      jumpTo("min-order");
      return;
    }

    var isSupportDynamicPrice = form.find("#isSupportDynamicPrice").prop("checked");
    var supportPartyOrder = form.find("#supportParty").prop("checked");
    if(supportPartyOrder){
      var minimal = form.find("#cateringMinimal").val();
      if(!minimal){
        form.find(".order-require .alert").show();
        form.find(".order-require .alert").html(form.find("#min-order").data("error"));
        jumpTo("cateringMinimal");
        return;
      }
      var partyRequirement = {
        minimal : minimal
      }
    }

    var flag = form.find("#flagInput").val();
    var status = this.isActivate? "on" : "off";
    var title = form.find("#meal_title").val();
    var title_en = form.find("#meal_title_en").val();

    if(!title && !title_en){
      jumpTo("meal_title");
      return;
    }

    if(mealId){
      this.model.set({id : mealId});
      dishes = undefined;
      dynamicDishes = undefined;
    }

    this.successAlert.show();
    this.successAlert.html(jQuery.i18n.prop('saving'));

    this.model.unset("chef");
    this.model.set({
      dishes : dishes,
      provideFromTime : startBookingDate ? startBookingDate._d : undefined,
      provideTillTime : endBookingDate ? endBookingDate._d : undefined,
      pickups : JSON.stringify(pickups),
      totalQty : totalQty,
      leftQty : totalQty,
      type : type,
      title : title,
      title_en : title_en,
      minimalOrder : singleOrderMinimal,
      minimalTotal : min_total,
      cover : cover,
      features : features,
      dynamicDishes : dynamicDishes,
      isDelivery : isDelivery,
      isDeliveryBySystem : isDeliveryBySystem,
      delivery_fee : deliveryFee,
      isShipping : isShipping,
      shippingPolicy : shippingPolicy,
      supportPartyOrder : supportPartyOrder,
      partyRequirement : partyRequirement,
      isSupportDynamicPrice : isSupportDynamicPrice,
      flag : flag,
      nickname : storeHourNickname

    });
    $this = this;
    this.model.save({},{
      success : function(){
        if(mealId) {
          $this.successAlert.html("Meal" + jQuery.i18n.prop('updatedComplete'));
        }else{
          BootstrapDialog.alert("Meal" + jQuery.i18n.prop('createdComplete'), function(){
            reloadUrl("/host/me#","mymeal");
          })
        }
      },error : function(model, err){
        $this.successAlert.hide();
        $this.formAlert.show();
        $this.formAlert.html(getMsgFromError(err));
      }
    });
  }
});

var Dish = Backbone.Model.extend({
  urlRoot : "/dish"
});

var DishView = Backbone.View.extend({
  events : {
    "submit form" : "saveDish",
    "change #dishVariationInput" : "addVariation",
    "change .variation .property" : "addProperty",
    "click .variation .currentVar .deleteBtn" : "removeVariation",
    "click .variation .currentVar .reset" : "removeProperty",
    "click .customVar .continue" : "addCustomVariation",
    "click .customProperty .continue" : "addCustomerProperty",
    "click .customVar .reset" : "resetCustomVariation",
    "click .customProperty .reset" : "resetCustomProperty",
    "switchChange.bootstrapSwitch #isDynamicPriceOn" : "switchDynamicDish"
  },
  initialize : function(){
    var form = this.$el.find("form");
    var formAlert = form.find(form.data("err-container") + " .alert.alert-danger");
    formAlert.hide();
    this.formAlert = formAlert;
    var progressAlert = form.find(form.data("err-container") + " .alert.alert-success");
    progressAlert.hide();
    this.progressAlert = progressAlert;
    var dynamicPriceAlert = form.find("#dynamicDishSettingView").parent().find(".alert.alert-danger");
    dynamicPriceAlert.hide();
    this.dynamicPriceAlert = dynamicPriceAlert;
  },
  switchDynamicDish : function(e){
    var target = $(e.currentTarget);
    this.$el.find("#dynamicDishSettingView").removeClass("d-none");
    var isDynamicPriceOn = target.prop("checked");
    if(isDynamicPriceOn){
      this.$el.find("#dynamicDishSettingView").show();
    }else{
      this.$el.find("#dynamicDishSettingView").hide();
    }
  },
  addCustomerProperty : function(e){
    e.preventDefault();
    var btn = $(e.currentTarget);
    var property = btn.closest(".customProperty").find("input[name='property']").val();
    var variation = btn.closest(".option").data("value");
    var extra = btn.closest(".customProperty").find("[name='extra']").val();
    if(!property){
      btn.addClass("disabled");
      return;
    }else{
      btn.removeClass('disabled');
    }
    this.addPropertyView(property,variation,extra);
    setupLanguage();
  },
  addCustomVariation : function(e){
    e.preventDefault();
    var btn = $(e.currentTarget);
    var variation = this.$el.find(".customVar input[name='variation']").val();
    if(!variation){
      btn.addClass("disabled");
      return;
    }else{
      btn.removeClass('disabled');
    }
    this.addOptionView(variation,variation);
    setupLanguage();
    setupDropdownMenu();
  },
  resetCustomProperty : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    target.closest('.option').find(".property").next().find("li").each(function(){
      if($(this).find("a").attr('value') === "custom"){
        $(this).removeClass('disabled');
      }
    });
    target.closest('.customProperty').remove();
  },
  resetCustomVariation : function(e){
    e.preventDefault();
    this.$el.find(".customVar").empty();
    $("#dishVariationInput").next().find("li").each(function(){
      if($(this).find("a").attr('value') === "custom"){
        $(this).removeClass('disabled');
      }
    });
  },
  addVariation : function(e){
    e.preventDefault();
    var variation = $(e.currentTarget).attr("value");
    var variationText = $(e.currentTarget).text();
    console.log("add new variation : " + variation);
    $(e.currentTarget).next().find("li").each(function(){
      if($(this).find("a").attr('value') === variation){
        $(this).addClass('disabled');
      }
    });
    if(variation === "custom"){
      var $this = this;
      this.addCustomInput();
    }else{
      this.addOptionView(variation, variationText);
    }
    setupDropdownMenu();
    setupLanguage();
  },
  addProperty : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    var property = target.attr("value");
    var propertyText = target.text();
    var variation = target.closest(".option").data("value");
    var extra = target.closest(".option").find("[name='extra']").val();
    console.log("add new property : " + property + "within variation :" + variation);
    $(e.currentTarget).next().find("li").each(function(){
      if($(this).find("a").attr('value') === property){
        $(this).addClass('disabled');
      }
    });
    if(property === "custom"){
      var $this = this;
      this.addCustomPropertyInput(variation);
    }else{
      this.addPropertyView(propertyText, variation, extra);
    }
    setupLanguage();
  },
  addCustomInput : function(){
    var container = this.$el.find(".variation .customVar");
    var section = '<div class="row vertical-align"><div class="col-sm-3 col-5">'
    +  '<input name="variation" class="form-control" type="text" placeholder="Property name" required></div> <div class="col-sm-2 col-5">'
    +  '<button class="btn btn-default btn-outline continue" data-toggle="i18n" data-key="continueBtn"></button> </div> <div class="col-sm-1 col-2">'
    +  '<a class="reset" href="javascript:void(0)" data-toggle="i18n" data-key="resetBtn"></a> </div> </div>';
    container.append(section);
  },
  addCustomPropertyInput : function(variation){
    var container = this.$el.find(".currentVar .option[data-value='" + variation + "'] table tbody");
    var section = '<tr class="customProperty"><td>'
      + '<input name="property" class="form-control" type="text" placeholder="Property name" required></td> '
      + '<td><input name="extra" class="form-control" type="number" value="0"></td>'
      + '<td><button class="btn btn-default btn-outline continue" data-toggle="i18n" data-key="continueBtn"></button>'
      + '<a class="reset" style="margin-left:10px;" href="javascript:void(0)" data-toggle="i18n" data-key="resetBtn"></a></td></tr>';
    container.append(section);
  },
  addPropertyView : function(property, variation, extra){
    var container = this.$el.find(".currentVar .option[data-value='" + variation + "'] table tbody");
    property = property.toString().trim();
    var section = '<tr class="customProperty">'
      + '<td>' + property + '<i class="fa fa-close reset cursor-pointer" data-value="' + property + '" style="float: right;" href="javascript:void(0)"></i></td> '
        + '<td class="extra" data-value="' + extra + '"> $' + extra + '</td><td></td> </tr>';
    container.append(section);
  },
  addOptionView : function(variation, text){
    var varSets = {
      "spicy" : ['mild', 'littleSpicy','regularSpicy','verySpicy','insaneSpicy'],
      "sweetness" : ['noSugar','halfSugar','regularSugar','extraSugar'],
      "icy" : ['noIce', 'halfIce', 'regularIce', 'extraIce'],
      "ingredient" : [],
      "wellness" : ['rare','mediumRare','medium','mediumWell', 'wellDone']
    };
    var container = this.$el.find(".variation .currentVar");
    var section = '<div class="row option" data-value="' + variation + '"> <div class="col-3">'
      + '<h3>' + text + '</h3>'
      + '<a class="deleteBtn" href="javascript:void(0);" data-value="' + variation + '" data-toggle="i18n" data-key="deleteBtn"></a>'
      + '</div> <div class="col-9"><table class="table table-bordered"> <thead>'
      + '<tr class="active"> <td data-toggle="i18n" data-key="property"></td> <td data-toggle="i18n" data-key="extra"></td> <td data-toggle="i18n" data-key="action"></td> </tr> </thead>'
      + '<tbody> <tr> <td> <div class="dropdown">'
      + '<a class="btn btn-default btn-outline dropdown-toggle property" type="button" data-toggle="dropdown" data-selected="true" aria-haspopup="true" aria-expanded="true" value="">'
      + '<span data-toggle="i18n" data-key="addVariation"></span> <span class="caret"></span> </a>'
      + '<div class="dropdown-menu" aria-labelledby="dLabel">'
      + '</div> </div> </td> <td><input name="extra" class="form-control" type="number" value="0"></td><td></td> </tr> </tbody> </table> </div> </div>';
    container.append(section);
    var dropDownMenu = container.find(".option[data-value='" + variation + "'] .dropdown-menu");
    if(varSets[variation] && varSets[variation].length > 0 ){
      varSets[variation].forEach(function(option){
        dropDownMenu.append('<a class="dropdown-item" href="javascript:void(0);" data-toggle="i18n" data-key="' + option + '" value="' + option + '"></a>');
      });
      dropDownMenu.append('<a class="dropdown-item disabled" href="javascript:void(0);" data-toggle="i18n" data-key="noOption"></a>');
    }
    dropDownMenu.append('<a class="dropdown-item" href="javascript:void(0);" data-toggle="i18n" data-key="customizedOption" value="custom"></a>');
  },
  removeProperty : function(e){
    var target = $(e.currentTarget).closest(".option");
    var property = $(e.currentTarget).data("value") || "custom";
    property = property.toString();
    console.log("removing property : " + property);
    target.find(".property").next().find("li").each(function(){
      if((property==="custom" && $(this).find("a").attr('value') === property) || $(this).find("a").text() === property.trim()){
        $(this).removeClass('disabled');
      }
    });
    $(e.currentTarget).closest(".customProperty").remove();
  },
  removeVariation : function(e){
    var variation = $(e.currentTarget).data("value");
    console.log("remove new variation : " + variation);
    $("#dishVariationInput").next().find("li").each(function(){
      if($(this).find("a").attr('value') === variation){
        $(this).removeClass('disabled');
      }
    });
    //remove option section
    var container = this.$el.find(".variation .currentVar");
    container.find(".option[data-value='" + variation + "']").remove();
  },
  saveDish : function(e) {
    e.preventDefault();
    var form = this.$el.find("form");
    var submit_btn = form.find("[type='submit']");
    if (submit_btn.hasClass('disabled')) {
      return;
    }
    form.find("#photoError").html("");
    this.formAlert.hide();
    this.progressAlert.hide();

    var dishTitle = form.find("#mealTitleInput").val();
    var now = Date.now();
    var filename1, filename2, filename3;
    var file1, file2, file3;
    var oldname1, oldname2, oldname3;
    var delete1, delete2, delete3;
    var exist;

    var p1Input = form.find("#photoInput-1");
    if (p1Input[0].files) {
      exist = form.find(".fileinput-preview:eq(" + 0 + ")").data("src");
      file1 = form.find("#photoInput-1")[0].files[0];
      if (!file1) {
        if (form.find("#photoInput-1").data('isDelete')) {
          delete1 = true;
        }
        if (exist) {
          if (delete1) {
            filename1 = exist;
            form.find("#photoError").html(jQuery.i18n.prop('needPhoto'));
            return;
          } else {
            oldname1 = exist;
          }
        }
      } else {
        if (exist) {
          var pathSection = exist.split("/");
          oldname1 = pathSection[pathSection.length - 1];
          filename1 = oldname1;
        } else {
          filename1 = "dish-" + now + "-1";
        }
      }
    }else{
      form.find("#photoError").html(jQuery.i18n.prop('needPhoto'));
      return;
    }

    if (form.find("#photoInput-2")[0].files) {
      exist = form.find(".fileinput-preview:eq(" + 1 + ")").data("src");
      file2 = form.find("#photoInput-2")[0].files[0];
      if (!file2) {
        if (form.find("#photoInput-2").data('isDelete')) {
          delete2 = true;
        }
        if (exist) {
          if (delete2) {
            filename2 = exist;
          } else {
            oldname2 = exist;
          }
        }
      } else {
        if (exist) {
          var pathSection = exist.split("/");
          oldname2 = pathSection[pathSection.length - 1];
          filename2 = oldname2;
        } else {
          filename2 = "dish-" + now + "-2";
        }
      }
    }

    if (form.find("#photoInput-3")[0].files) {
      exist = form.find(".fileinput-preview:eq(" + 2 + ")").data("src");
      file3 = form.find("#photoInput-3")[0].files[0];
      if (!file3) {
        if (form.find("#photoInput-3").data('isDelete')) {
          delete3 = true;
        }
        if (delete3) {
          filename3 = exist;
        } else {
          oldname3 = exist;
        }
      } else {
        if (exist) {
          var pathSection = exist.split("/");
          oldname3 = pathSection[pathSection.length - 1];
          filename3 = oldname3;
        } else {
          filename3 = "dish-" + now + "-3";
        }
      }
    }
    var dishId = form.data("dish-id");
    var title = $("#mealTitleInput").val();
    var titleEn = $("#mealTitleInput-en").val();
    var price = $("#priceInput").val();
    var peopleServe = form.find("#peopleServeInput").val();
    var category = $("#categoryInput").val();
    var quantity = form.find("#quantityInput").val();
    var cateringMinimalOrder = form.find("#cateringMinimalOrderInput").val();
    var desc = form.find("#descriptionInput").val();
    var descEn = form.find("#descriptionInput-en").val();
    var instagram = form.find("#instagramInput").val();
    var isDynamicPriceOn = form.find("#isDynamicPriceOn").prop("checked");
    var priceRate = form.find("#priceRateInput").val();
    var qtyRate = form.find("#qtyRateInput").val();
    var minimalPrice = form.find("#minimalPriceInput").val();
    var dishTags = form.find("#tagInput").val();
    var discount = form.find("#discountInput").val();
    if(isDynamicPriceOn && (!priceRate || !qtyRate || !minimalPrice)){
      this.dynamicPriceAlert.show();
      this.dynamicPriceAlert.html(jQuery.i18n.prop("dynamic-price-incomplete"));
      return;
    }
    var preference = {};
    form.find(".variation .currentVar .option").each(function(){
      var properties = [];
      var variationValue = $(this).data("value");
      $(this).find(".customProperty").each(function(){
        var property = $(this).find(".reset").data("value");
        if(property){
          var extra = $(this).find(".extra").data("value");
          var propertyObj = { property : property.toString().trim(), extra : extra };
          properties.push(propertyObj);
        }
      });
      preference[variationValue] = properties;
    });
    var $this = this;
    if (dishId) {
      this.model.set({id: dishId});
    }
    //update dish
    imageHandler('dish',file1,$this.progressAlert,function(filename1){
      imageHandler('dish',file2,$this.progressAlert,function(filename2){
        imageHandler('dish',file3,$this.progressAlert,function(filename3){
          var photos = [];
          if(file1){
            photos[0] = {v:filename1};
          }else if(oldname1){
            photos[0] = {v:oldname1}
          }else{
            photos[0] = {v:""};
          }
          if(file2){
            photos[1] = {v:filename2};
          }else if(oldname2){
            photos[1] = {v:oldname2};
          }else{
            photos[1] = {v:""};
          }
          if(file3){
            photos[2] = {v:filename3};
          }else if(oldname3){
            photos[2] = {v:oldname3};
          }else{
            photos[2] = {v:""};
          }

          $this.model.set({
            title : title,
            "title-en" : titleEn,
            price : price,
            photos : photos,
            type : category,
            quantity : quantity,
            description : desc,
            "description-en" : descEn,
            video : instagram,
            preference : preference,
            isDynamicPriceOn : isDynamicPriceOn,
            priceRate : priceRate,
            qtyRate : qtyRate,
            minimalPrice : minimalPrice,
            tags : dishTags,
            peopleServe : peopleServe,
            discount : discount,
            cateringMinimalOrder : cateringMinimalOrder
          });

          $this.model.save({},{
            success : function(model, response){
              if(dishId){
                $this.progressAlert.html("Dish" + jQuery.i18n.prop('updatedComplete'));
                $this.progressAlert.show();
              }else{
                if(!response.host.passGuide){
                  BootstrapDialog.show({
                    title: jQuery.i18n.prop('tip'),
                    message : jQuery.i18n.prop('createdComplete'),
                    buttons: [{
                      label: jQuery.i18n.prop('backToGuide'),
                      action: function(dialog) {
                        reloadUrl("/apply",'');
                      }
                    }, {
                      label: jQuery.i18n.prop('backToList'),
                      action: function(dialog) {
                        reloadUrl("/host/me#","mydish");
                      }
                    }, {
                      label: jQuery.i18n.prop('continueCreateDish'),
                      action: function(dialog) {
                        reloadUrl("/host/me/createDish","");
                      }
                    }]
                  });
                }else{
                  BootstrapDialog.alert("Dish" + jQuery.i18n.prop('createdComplete'), function(){
                    reloadUrl("/host/me#","mydish");
                  });
                }
              }
            },error : function(model, err){
              $this.progressAlert.hide();
              $this.formAlert.html(getMsgFromError(err));
              $this.formAlert.show();
            }
          });
        },function(error){
          $this.progressAlert.hide();
          $this.formAlert.show();
          $this.formAlert.html(error)
        },3,filename3,delete3)
      },function(error){
        $this.progressAlert.hide();
        $this.formAlert.show();
        $this.formAlert.html(error)
      },2,filename2,delete2);
    },function(error){
      $this.progressAlert.hide();
      $this.formAlert.show();
      $this.formAlert.html(error)
    },1,filename1,delete1);
  }
});

var Bank = Backbone.Model.extend({
  urlRoot : "/bank"
});

var BankView = Backbone.View.extend({
  events : {
    "submit form" : "saveBank",
    "click button[name='cancel']" : dismissModal
  },
  initialize : function(){
    var form = this.$el.find("form");
    var alertForm = form.find(".alert");
    alertForm.removeClass("d-none");
    alertForm.hide();
    this.alertForm = alertForm;
    loadStripeJS(function(err){
      if(err){
        console.log("error loading stripe.js");
      }
    })
  },
  saveBank : function(e){
    e.preventDefault();
    this.alertForm.hide();
    var form = this.$el.find("form");
    var accountNumber = form.find("#bankAccountNumber").val();
    var routingNumber = form.find("#bankRoutingNumber").val();
    var $this = this;
    Stripe.bankAccount.createToken({
      country: "US",
      currency: "USD",
      routing_number: routingNumber,
      account_number: accountNumber
    }, function(status, response){
      var hostId = form.data("host");
      if (response.error) {
        $this.alertForm.html(response.error.message);
        $this.alertForm.show();
      } else {
        var token = response.id;
        var bankName = response.bank_account.bank_name;
        if(form.data("updating")){
          $this.model.set({
            id : hostId
          });
        }
        $this.model.set({
          token : token
        });
        $this.model.save({},{
          success : function(model, response){
            dismissModal();
            if(form.data("updating")){
              BootstrapDialog.alert(jQuery.i18n.prop('bankUpdated'), function(){
                reloadUrl("/pocket/user/me","#mypurse");
              });
            }else{
              if(response.passGuide){
                BootstrapDialog.alert(jQuery.i18n.prop('bankCreated'), function(){
                  reloadUrl("/pocket/user/,e","#mypurse");
                });
              }else{
                BootstrapDialog.show({
                  title: jQuery.i18n.prop('tip'),
                  message : jQuery.i18n.prop('createdComplete'),
                  buttons: [{
                    label: jQuery.i18n.prop('backToGuide'),
                    action: function(dialog) {
                      reloadUrl("/apply",'');
                    }
                  }]
                });
              }

            }
          },error : function(model, err){
            $this.alertForm.html(getMsgFromError(err));
            $this.alertForm.show();
          }
        });
      }
    });
  }
});

var UserProfileView = Backbone.View.extend({
  events : {
    "submit form" : "saveProfile",
    "click .color-block" : "chooseColor",
    "click #sendEmailVerificationBtn" : "sendEmail"
  },
  initialize : function(){
    var alertView = this.$el.find(".form-alert");
    alertView.removeClass("d-none");
    alertView.hide();
    this.alertView = alertView;

    var successView = this.$el.find(".alert.alert-success");
    successView.removeClass("d-none");
    successView.hide();
    this.sucessView = successView;

    var colorSelector = this.$el.find("div[name='template_color']");
    colorSelector.find(".color-block[data-color='" + colorSelector.data('color') + "']").addClass("active");

    var birthMonth = this.$el.find("#bMonthInput").attr('value');
    var birthDay = this.$el.find("#bDayInput").attr('value');
    var birthYear = this.$el.find("#bYearInput").attr('value');
    this.$el.find("#bMonthInput option").each(function(){
      if(parseInt($(this).val()) === birthMonth){
        $(this).attr('selected', true);
      }
    });

    this.$el.find("#bDayInput option").each(function(){
      if(parseInt($(this).val()) === birthDay){
        $(this).attr('selected', true);
      }
    });

    this.$el.find("#bYearInput option").each(function(){
      if(parseInt($(this).val()) === birthYear){
        $(this).attr('selected', true);
      }
    });
    this.model.set("id", this.$el.data("id"))
  },
  chooseColor : function(e){
    var target = $(e.currentTarget);
    target.parent().find(".color-block").removeClass("active");
    target.addClass("active");
    var color = target.data("color");
    target.parent().data("color",color);
  },
  sendEmail : function(e){
    e.preventDefault();
    this.model.action = "sendEmailVerification";
    var email = this.$el.find("#emailInput").val();
    if(!email){return;}
    this.model.set({
      email : email
    });
    var $this = this;
    this.model.save({}, {
      success : function(){
        BootstrapDialog.alert(jQuery.i18n.prop('emailVerificationSent'), function(){
          var email = $this.model.get("email");
          if(!email){
            return;
          }
          if(email.indexOf('@gmail.com')!==-1){
            var url = "https://mail.google.com";
          }else if(email.indexOf('hotmail.com')!==-1){
            url = "https://hotmail.com";
          }else if(email.indexOf('@aol.com')!==-1){
            url = "https://aol.com";
          }else if(email.indexOf('@yahoo.com')!==-1){
            url = "https://yahoo.com	";
          }else if(email.indexOf('@outlook.com')!==-1){
            url = "https://outlook.com";
          }else if(email.indexOf('@icloud.com')!==-1){
            url = "https://www.icloud.com/#mail";
          }else if(email.indexOf('@qq.com')!==-1){
            url = "https://mail.qq.com";
          }else{
            url = '';
          }
          window.open(url);
        });
      },error : function(err, model){
        $this.sucessView.hide();
        $this.alertView.html(err.responseJSON ? err.responseJSON.responseText : err.responseText);
        $this.alertView.show();
      }
    })
  },
  saveProfile : function(e){
    e.preventDefault();
    if(this.$el.find("button[type='submit']").hasClass("disabled")){
      return;
    }
    this.alertView.hide();
    this.sucessView.html(jQuery.i18n.prop('saving'));
    this.sucessView.show();
    var lastname = this.$el.find("input[name='lastname']").val();
    var firstname = this.$el.find("input[name='firstname']").val();
    var color = this.$el.find("div[name='template_color'] .active").data('color');
    var desc = this.$el.find("textarea[name='desc']").val().trim();
    var picture = this.$el.find(".fileinput-preview").data("src");
    var phone = this.$el.find("#phoneInput").val();
    var zipcode = this.$el.find("#zipcodeInput").val();
    var bMonth = parseInt(this.$el.find("#bMonthInput").val());
    var bDay = parseInt(this.$el.find("#bDayInput").val());
    var bYear = parseInt(this.$el.find("#bYearInput").val());
    var birthDate = new Date(bYear,bMonth-1,bDay);
    var isReceiveEmail = this.$el.find("#receivedEmailCheckbox").is(":visible") && this.$el.find("#receivedEmailCheckbox")[0].checked;
    var email = this.$el.find("#emailInput").val();
    this.model.clear();
    this.model.set({
      id : this.$el.data("id"),
      firstname : firstname,
      lastname : lastname,
      desc : desc,
      color : color,
      picture : picture,
      phone : phone,
      zipcode : zipcode,
      birthday : birthDate,
      isReceivedEmail : isReceiveEmail
    });
    if(email){
      this.model.set({
        email : email
      })
    }
    var $this = this;
    this.model.save({},{
      success : function(){
        if(e.data && e.data.update){
          BootstrapDialog.alert(jQuery.i18n.prop('profileUpdated'), function(){
            reloadUrl("/user/me","myinfo");
          });
        }else{
          $this.sucessView.html(jQuery.i18n.prop('profileUpdated'));
        }
      },error : function(model, err){
        $this.sucessView.hide();
        $this.alertView.html(jQuery.i18n.prop('saveError'))
        $this.alertView.show();
      }
    });
  }
});

var MyMealView = Backbone.View.extend({
  events : {
    "click button[name='action']" : "go"
  },
  go : function(e){
    e.preventDefault();
    var _this = this;
    var target = $(e.currentTarget);
    target.addClass("running");
    var mealId = target.data("id");
    var action = target.data("action");
    this.model.set("id",mealId);
    this.model.action = action;
    this.model.fetch({
      success : function(){
        target.removeClass("running").addClass("d-none");
        if(action === "on"){
          target.parent().find("[data-action='off']").removeClass("d-none");
        }else if(action === "off"){
          target.parent().find("[data-action='on']").removeClass("d-none");
        }else{
          reloadUrl('/host/me','#mymeal');
        }
      },
      error : function(model, err){
        target.removeClass("running");
        BootstrapDialog.alert(err.responseJSON ? err.responseJSON.responseText : err.responseText, function(){
          var code = err.responseJSON.code;
          if(code === "-7"){
            location.href = "/apply";
          }
        });
      }
    })
  }
});

var HostProfileView = Backbone.View.extend({
  events : {
    "submit form" : "saveHostProfile"
  },
  initialize : function(){
    var form = this.$el.find("form");
    var alertView = form.find(form.data("err-container")).find(".alert-danger");
    alertView.removeClass("d-none");
    alertView.hide();
    this.alertView = alertView;
    var successView = form.find(form.data("err-container")).find(".alert-success");
    successView.removeClass("d-none");
    successView.hide();
    this.successView = successView;
  },
  saveHostProfile : function(e){
    e.preventDefault();
    if(this.$el.find("button[type='submit']").hasClass("disabled")){
      return;
    }
    var form = this.$el.find("form");
    var title = this.$el.find("input[name='story-title']").val();
    var title_en = this.$el.find("input[name='story-title-en']").val();
    var intro = this.$el.find("textarea[name='story-intro']").val();
    var intro_en = this.$el.find("textarea[name='story-intro-en']").val();
    var license = this.$el.find(".license .fileinput-preview").data("src");
    var shopPhoto = this.$el.find(".story .fileinput-preview").data("src");
    var feature_dishes = [];
    this.$el.find(".dishes a[data-toggle='dropdown']").each(function(index){
      var feature_dish_obj = {};
      var index = parseInt(index) + 1;
      feature_dish_obj["dish" + index] = {"id": $(this).data("value"), "title" : $(this).text()};
      feature_dishes.push(feature_dish_obj);
    });
    this.successView.html(jQuery.i18n.prop('saving'));
    this.successView.show();
    this.alertView.hide();
    this.model.set({
      id : form.data("id"),
      shopName : title,
      shopName_en : title_en,
      intro : intro,
      intro_en : intro_en,
      feature_dishes : feature_dishes,
      picture : shopPhoto
    });
    if(license){
      this.model.set("license", JSON.stringify({url : license}));
    }
    var $this = this;
    this.model.save({},{
      success : function(){
        $this.alertView.hide();
        $this.successView.html(jQuery.i18n.prop('profileUpdated'));
      },error : function(model, err){
        $this.alertView.show();
        $this.successView.hide();
        $this.alertView.html(jQuery.i18n.prop('saveError'));
      }
    });
  }
});

var HostPageView = Backbone.View.extend({
  events : {
    "click #likeBtn" : "like",
    "click #followBtn" : "follow"
  },
  initialize : function(){
    var alertView = this.$el.find("#actionAlertView");
    alertView.removeClass("d-none");
    alertView.hide();
    this.alertView = alertView;

    var hostId = this.$el.data("host");
    this.model.set("id", hostId);
  },
  like : function(e){
    e.preventDefault();
    this.model.action = "like";
    this.alertView.hide();
    var countView = $(e.currentTarget).find("[data-count]");
    var likeCount = countView.data('count');
    var $this = this;
    this.model.save({}, {
      success : function(){
        likeCount++;
        countView.data("count", likeCount);
        countView.text(likeCount);
      },
      error : function(model, err){
        $this.alertView.show();
        $this.alertView.html(getMsgFromError(err));
      }
    })
  },
  follow : function(e){
    e.preventDefault();
    var isFollowed = $(e.currentTarget).data("followed");
    if(isFollowed){
      this.model.action = "unfollow";
    }else{
      this.model.action = "follow";
    }
    this.model.save({}, {
      success : function(){
        location.reload();
      },
      error : function(model, err){
        $this.alertView.show();
        $this.alertView.html(getMsgFromError(err));
      }
    })
  }
});

/*
 * Review Module
 *
 */

var Review = Backbone.Model.extend({
  urlRoot : "/review"
});

var ReviewView = Backbone.View.extend({
  events : {
    "click .leaveReview" : "leaveReview"
  },
  initialize : function(){
    this.$el.find('[data-toggle="star-set"]').starSet();
  },
  leaveReview : function(e){
    e.preventDefault();
    var ele = $(e.target);
    var rating_container = $(ele.data("target"));
    var alertView = rating_container.find($(ele).data("err-container"));
    alertView.removeClass("d-none");
    alertView.hide();
    var dishId = ele.data("dish");
    var mealId = ele.data("meal");
    var hostId = ele.data("host");
    var orderId = this.$el.data("order");
    var score,reviews = [];
    var hasNegativeReivew = false;
    if(dishId){
      //single dish review
      rating_container.find(".dish-item").each(function () {
        var score = $(this).find(".rating .text-yellow").length;
        if(!score){
          return;
        }
        if(score === 1){
          hasNegativeReivew = true;
        }
          var content = $(this).find(".review").val();
        var reviewObj = {
          dish : dishId,
          score : score,
          content : content
        }
        reviews.push(reviewObj);
      })
    }else if(mealId){
      //meal review
      var scoreNotRated = false;
      rating_container.find(".dish-item").each(function(){
        var reviewObj = {};
        reviewObj.dish = $(this).data("dish");
        reviewObj.score = $(this).find(".rating .text-yellow").length;
        reviewObj.content = $(this).find(".review").val();
        if(reviewObj.score === 0){
          scoreNotRated = true;
        }
        if(reviewObj.score === 1){
          hasNegativeReivew = true;
        }
        reviews.push(reviewObj);
      });
    }
    if(orderId){
      this.model.set({ id : orderId });
      this.model.action = "review";
    }
    var $this = this;
    if((!score || score === 0) && scoreNotRated){
      makeAToast(jQuery.i18n.prop('reviewScoreEmpty'));
      return;
    }
    if(hasNegativeReivew){
      BootstrapDialog.show({
        title: jQuery.i18n.prop('tip'),
        message : jQuery.i18n.prop('reviewPrivate'),
        buttons: [{
          label: jQuery.i18n.prop('submitReview'),
          action: function() {
            $this.model.set({
              meal : mealId,
              dish : dishId,
              score : score,
              host : hostId,
              reviews : reviews
            });
            $this.model.save({},{
              success : function(model, result){
                BootstrapDialog.alert(jQuery.i18n.prop("privateReviewSent"), function(){
                  reloadUrl('/user/me','#myreview');
                  $this.$el.find(".item[data-id='" + ele.data("order") +"']").remove();
                  BootstrapDialog.closeAll();
                });
              },error : function(model, err){
                alertView.html(getMsgFromError(err));
                alertView.show();
              }
            })
          }
        }, {
          label: jQuery.i18n.prop('cancel'),
          action: function(dialog) {
            dialog.close();
          }
        }]
      });
      return;
    }
    this.model.set({
      meal : mealId,
      dish : dishId,
      score : score,
      host : hostId,
      reviews : reviews
    });
    this.model.save({},{
      success : function(model, result){
        BootstrapDialog.alert(jQuery.i18n.prop("reviewSuccessTip"), function(){
          location.href = "/host/public/" + result.host;
        })
      },error : function(model, err){
        alertView.html(getMsgFromError(err));
        alertView.show();
      }
    })
  }
});

var Order = Backbone.Model.extend({
  urlRoot: "/order",
  action : "",
  url: function () {
    if(this.get("id")){
      return this.urlRoot + "/" + this.get("id") + "/" + this.action;
    }else{
      return this.urlRoot;
    }
  }
})

var Transaction = Backbone.Model.extend({

});

var TransactionView = Backbone.View.extend({
  events : {
    "click #searchBtn" : 'advanced',
    "click #durationBtn" : 'filter'
  },
  advanced : function(e){
    var btn = $(e.currentTarget);
    var container = $(btn.data('target'));
    var searchText = btn.prev().val().trim().toLowerCase();
    this.model.title = searchText;
    this.search(container);
  },
  filter : function(e){
    var btn = $(e.currentTarget);
    var container = $(btn.data('target'));
    var from = this.$el.find(".from").data("DateTimePicker").date();
    var to = this.$el.find(".to").data("DateTimePicker").date();
    if(from){
      from = from.unix();
    }
    this.model.from = from;
    if(to){
      to = to.unix();
    }
    this.model.to = to;
    this.search(container);
  },
  search : function(container){

    var searchTitle = this.model.title;
    var from = this.model.from;
    var to = this.model.to;

    container.find(".mix").each(function() {
      var title = $(this).data("title").toLowerCase();
      var date = $(this).data("created");
      if ((searchTitle && title.search(searchTitle) == -1) || (from && date < from) || (to && date > to)) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  }
});

var DishPreferenceView = Backbone.View.extend({
  events : {
    "change .btn-set[data-prefType]" : "updatePreferences",
    "submit form" : 'savePreference'
  },
  updatePreferences : function(e){
    var dishId = this.$el.data("id");
    var prefList = localOrders[dishId].preference;
    var btnsets = this.$el.find("[data-preftype]");
    var amount = parseInt(this.$el.find(".amount").text());
    var properties = [], extra = 0;
    btnsets.each(function(){
      var btnSet = $(this);
      var property = btnSet.find("button.active").data("property");
      var e = btnSet.find("button.active").data("extra");
      var index = btnSet.find("button.active").data("index");
      var prefType = btnSet.data('preftype');
      if(index){
        properties.push({ preftype : prefType, property : property});
        extra += e;
      }
    })
    prefList[amount-1] = { property : properties, extra : extra };
    refreshPreference(dishId);
    updateMenuView(dishId);
    updateOrderPreview();
    createCookie(dishId,JSON.stringify(localOrders[dishId]),1);
  },
  savePreference : function(e){
    e.preventDefault();
    dismissModal();
  }
});

var ContactInfoView = Backbone.View.extend({
  events : {
    // "blur input" : "saveInfo"
  },
  saveInfo : function(e){
    e.preventDefault();
    var userId = this.$el.data("user");
    var isLogin = !!userId;
    var form = $(e.currentTarget).closest('form');
    if(!isLogin){
      return;
    }
    if(form.find("has-error").length){
      makeAToast(jQuery.prop.i18n('phoneNotValid'));
      return;
    }
    var phone = this.$el.find("input[name='phone']").val();
    var firstname = this.$el.find("input[name='name']").val();
    if(!firstname && !phone){
      return;
    }
    this.model.clear();
    this.model.set({
      id : userId,
      firstname : firstname,
      phone : phone
    });
    var $this = this;
    this.model.save({},{
      success : function(){
        makeAToast(jQuery.i18n.prop('saveSuccess'))
      },error : function(model, err){
        makeAToast(jQuery.i18n.prop('saveError'))
      }
    });
  }
});

var MapView = Backbone.View.extend({
  initialize : function(){
    this.$target = $(this.attributes.target);
    if(!utility.googleMapLoaded){
      utility.initGoogleMapService();
    }else{
      this.initDelivery();
      this.initPickups();
    }
  },
  initDelivery : function(){
    var $this = this;
    if(!this.$target.find(".deliveryOption").length){
      return;
    }
    var map,spots=[];
    this.$target.find(".deliveryOption:visible").each(function () {
      var location = $(this).data("center");
      var color = $(this).data("color");
      var area = $(this).data("area");
      var time = $(this).data("time");
      var range = $(this).data("range");
      if(spots.some(function(spot){
          return spot.location === location && spot.time === time;
        })){
        return;
      }
      spots.push({location: location, time: time});
      utility.geocoding(location, function(err, center){
        if(err){
          makeAToast(err);
          return;
        }
        utility.initMap($this.$el.find("#googlemap")[0], center, function(err, map){
          if(err){
            makeAToast(err);
            return;
          }
          var colors = { red : '#ff4001', blue : '#3fa9f5', green : '#22b571', pink : '#ff7bac', yellow : '#ffd65a', orange : '#ff931e', 'dark-blue' : '#3f80f5'};
          var deliveryCircle = new google.maps.Circle({
            strokeColor: '#000000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: colors[color],
            fillOpacity: 0.35,
            map: map,
            center: center,
            radius: range * 1600
          });
          var image = {
            url : '/images/car-icon-' + color + '.png',
            size : new google.maps.Size(36, 36),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(18, 18)
          }
          var deliveryMarker = new google.maps.Marker({
            position: center,
            map: map,
            icon: image
          });
          var deliveryInfo = new google.maps.InfoWindow({
            content : "<h4><small><span data-toggle='i18n' data-key='deliveryRange'></span>:" + area + "<br/><span data-toggle='i18n' data-key='deliveryTime'></span>:" + time + "</small></h4>"
          })
          deliveryMarker.addListener('click', function(){
            deliveryInfo.open(map, deliveryMarker);
            setupLanguage();
          })
        })
      })
    });
  },
  initPickups : function(){
    var mapCenter = '';
    var $this = this;
    if(this.$target.find(".pickupOption").length === 0){
      mapCenter = "25 Washington St, Daly City";
    }else{
      mapCenter = this.$target.find(".pickupOption").data('location');
    }
    utility.geocoding(mapCenter, function(err, center, map){
      if(err){
        makeAToast(err);
        return;
      }
      var spots = [];
      $this.$target.find(".pickupOption:visible").each(function () {
        var location = $(this).data("location");
        if(spots.some(function(spot){
            return spot.location === location;
          })){
          return;
        }
        spots.push({location: location});
        var title = '<div><h4><small><span data-toggle="i18n" data-key="pickup"></span>:' + location + '</small></h4></div>';
        var infowindow = new google.maps.InfoWindow({
          content: title
        });
        utility.initMap($this.$el.find("#googlemap")[0], center, function(err, map) {
          if (err) {
            makeAToast(err, 'error');
            return;
          }
          utility.geocoding(location, function(err, center){
            if(err){
              makeAToast(err);
              return;
            }
            var marker = new google.maps.Marker({
              position: center,
              title: title
            });
            marker.addListener('click', function () {
              infowindow.open(map, marker);
              setupLanguage();
            })
            marker.setMap(map);
          });
        });
      })
    });
  }
})

var MealConfirmView = Backbone.View.extend({
  events : {
    "click #applyCouponBtn" : "applyCouponCode",
    "click #applyPointsBtn" : "addPointsToOrder",
    "change #deliveryTab .regular-radio" : "switchAddress",
    "change #method" : "switchMethod",
    "click #createNewContactBtn" : "createNewContact",
    "click #createNewContactBtn2" : "createNewContact",
    "keydown" : "onKeyDown",
    "click #verifyAddressBtn" : "verifyAddress",
    "click input[name='billingAddress']" : "enterBillingAddress",
    "mixEnd #deliveryTab" : "switchDate",
    "click [data-action]" : "go"
  },
  initialize : function(){
    this.alertView = this.$el.find("#orderAlertView");
    this.alertView.removeClass("d-none").hide();
    this.isCoolDown = true;
    var hasDelivery = this.$el.find("#pickupInfoView").data("hasdelivery");
    if(hasDelivery){
      this.$el.find(".pickupInput").removeClass('d-none').hide();
    }else{
      this.$el.find(".pickupInput").removeClass('d-none');
      this.$el.find(".deliveryInput").hide();
    }
    utility.initGoogleMapService();
    var dateDesc = decodeURI(readCookie("date"));
    if(dateDesc && dateDesc !== "undefined" && dateDesc !== "null"){
      this.$el.find("#dishDatesBar li").removeClass("active");
      this.$el.find("#dishDatesBar [data-filter='." + dateDesc + "']").parent().addClass("active");
      deliveryMixer.filter("." + dateDesc);
      pickupMixer.filter("." + dateDesc);
    }else{
      dateDesc = this.$el.find("#dishDatesBar [data-mixitup-control]").data("filter").replace(".","");
      createCookie("date", dateDesc);
    }
    var method = $("#pickupMethodView #method .active").attr("value");
    if(method === "delivery"){
      $("#pickupOptionsView .step-2").hide();
    }
  },
  go : function(e){
    var action = $(e.currentTarget).data("action");
    if(action === "showMenu"){
      this.$el.find("#order .dish:not(.table-success)").toggle();
    }
  },
  enterBillingAddress : function(e){
    var isChecked = $(e.currentTarget).prop("checked");
    if(isChecked){
      var contactInfoView = this.$el.find("#contactInfoView");
      var paymentInfoView = this.$el.find("#cardPayment");
      var fieldsToCopy = ['input[name="street"]','input[name="city"]','input[name="state"]','input[name="zipcode"]'];
      fieldsToCopy.forEach(function(field){
        paymentInfoView.find(field).val(contactInfoView.find(field).val());
      });
    }
  },
  onKeyDown : function(e){
    if(e.which === 13) e.preventDefault();
  },
  createNewContact : function(e){
    e.preventDefault();
    var value = this.$el.find("#method button.active").attr("value");
    if(value === "pickup"){
      $('#contactInfoView').removeClass('d-none').show();
    }else{
      toggleModal(e, addressView.enterAddressInfoFromOrder);
    }
  },
  switchMethod : function(e){
    var isLogin = !!this.$el.data("user");
    var value = $(e.currentTarget).find(".active").attr("value");
    this.$el.find(".deliveryInput").removeClass('d-none');
    this.$el.find(".pickupInput").removeClass('d-none');
    this.$el.find(".shippingInput").removeClass('d-none');
    if(value === "delivery"){
      this.$el.find(".pickupInput").hide();
      this.$el.find(".shippingInput").hide();
      this.$el.find(".deliveryInput").show();
      if(this.addressVerified){
        $("#pickupOptionsView .step-2").show();
      }else{
        $("#pickupOptionsView .step-2").hide();
      }
      if(isLogin){
        // $('#contactInfoView').hide();
        this.switchAddress(e);
      }else{
        this.verifyAddress(e);
      }
    }else if(value === "shipping"){
      this.$el.find(".pickupInput").hide();
      this.$el.find(".deliveryInput").hide();
      this.$el.find(".shippingInput").show();
      if(isLogin){
        // $('#contactInfoView').hide();
        this.switchAddress(e);
      }else{
        this.verifyAddress(e);
      }
    }else{
      this.$el.find(".deliveryInput").hide();
      this.$el.find(".shippingInput").hide();
      this.$el.find(".pickupInput").show();
      $("#pickupOptionsView .step-2").show();
      if(isLogin){
        // $('#contactInfoView').hide();
      }else{
        // $('#contactInfoView').show();
      }
    }
    refreshCheckoutMenu();
  },
  verifyAddress : function(e, checkOnly){
    var value = this.$el.find("#method button.active").attr("value");
    if(value === "pickup"){
      return;
    }
    var isLogin = !!this.$el.data("user");
    var btn = e ? $(e.currentTarget) : null;
    var dateDesc = decodeURI(readCookie('date'));
    if(dateDesc === "undefined" || dateDesc === "null"){
      dateDesc = this.$el.find("#dishDateBar [data-mixitup-control]").data("filter").replace(".","");
    }
    if(this.$el.find("#contactInfoView").length){
      var street = this.$el.find("input[name='street']").val();
      var city = this.$el.find("input[name='city']").val();
      var state = this.$el.find("input[name='state']").val();
      var zipcode = this.$el.find("input[name='zipcode']").val();
      var form = this.$el.find("#order");
      var isPartyMode = form.data("party");
      if(!street || !city || !state || !zipcode){
        if(btn) {btn.trigger('reset')};
        makeAToast(jQuery.i18n.prop('addressIncomplete'));
        return false;
      }
      var range = 5;
      var yourAddress = street + ", " + city + ", " + state + " " + zipcode;
    }else{
      var contactOption = this.$el.find("#pickupInfoView .contactOption:visible .regular-radio:checked");
      var contactText = contactOption.next().next().text();
      if(!contactText.split("+").length){
        if(btn) {btn.trigger('reset')}
        makeAToast(jQuery.i18n.prop('addressIncomplete'));
        return false;
      }
      yourAddress = contactText.split("+")[0];
    }

    if(checkOnly){
      if(btn) {btn.trigger('reset')}
      return yourAddress;
    }

    var deliveryOption = this.$el.find("#deliveryTab .deliveryOption[data-date='" + dateDesc + "'] .regular-radio:checked");
    var firstOpt = this.$el.find("#deliveryTab .deliveryOption[data-date='" + dateDesc + "'] .regular-radio").first();
    if(!deliveryOption.length){
      firstOpt.prop('checked',true);
      deliveryOption = firstOpt;
    }

    var lat = deliveryOption.parent().data('lat');
    var long = deliveryOption.parent().data('long');
    if(!long || !lat){
      if(btn){
        btn.trigger("reset");
      }
      makeAToast("error reading delivery central location","error");
      console.log("error reading delivery central location");
      return;
    }
    var location = { lat : lat, long : long};
    var range = deliveryOption.parent().data("range");
    utility.geocoding(yourAddress, function(err, customerLoc) {
      if (err) {
        if(btn) {btn.trigger('reset')}
        makeAToast(err, 'error');
        return;
      }
      if(btn){btn.trigger('reset');}
      var cusLocation = {
        lat : customerLoc.lat(),
        long : customerLoc.lng()
      }
      var distance = utility.getDistance(cusLocation, location, "N");
      console.log("distance: " + distance, " range:" + range);
      if(distance > range){
        if(!isPartyMode){
          // makeAToast(jQuery.i18n.prop('addressOutOfRangeError'));
          // return;
        }else{
          var delivery_fee = (distance - range) * MILEAGE_FEE;
          form.find(".delivery").data("value", delivery_fee);
          refreshCheckoutMenu();
        }
      }else if(isPartyMode){
        form.find(".delivery").data("value", 0);
        refreshCheckoutMenu();
      }else{
        makeAToast(jQuery.i18n.prop('addressValid'),'success');
      }
    });
    this.checkOptions(yourAddress, dateDesc);
  },
  checkOptions : function(address, dateDesc){
    var _this = this;
    var deliveryOptions = this.$el.find("#deliveryTab .deliveryOption .regular-radio");
    $("#pickupOptionsView .step-2").show();

    utility.geocoding(address, function(err, cusLocation) {
      if (err) {
        makeAToast(err, "err");
        return;
      }
      var newCusLocation = {
        lat: cusLocation.lat(),
        long: cusLocation.lng()
      }
      deliveryOptions.each(function(index){
        var deliveryOption = $(this);
        var lat = deliveryOption.parent().data('lat');
        var long = deliveryOption.parent().data('long');
        var location = { lat : lat, long : long};
        var range = deliveryOption.parent().data("range");
        var distance = utility.getDistance(newCusLocation, location, "N");
        if(dateDesc === deliveryOption.parent().data("date")){
          if(distance > range){
            deliveryOption.parent().hide();
          }else{
            deliveryOption.parent().show();
          }
        }
      });
      var visibleOptions = _this.$el.find("#deliveryTab .deliveryOption:visible");
      var emptyView = $("#pickupOptionsView #deliveryTab .empty");
      if(visibleOptions.length){
        emptyView.hide();
      }else{
        emptyView.removeClass("d-none").show();
      }
      jumpTo("pickupOptionsView");
    });
  },
  switchAddress : function(e, cb, yourAddress){
    var method = this.$el.find("#method .active").attr("value");
    if(method !== "delivery"){
      return cb(true);
    }
    var deliveryOption = this.$el.find("#deliveryTab .deliveryOption:visible .regular-radio:checked");
    if(!deliveryOption.length){
      makeAToast(jQuery.i18n.prop('deliveryOptionNotSelected'));
      if(cb){
        return cb(false);
      }
      return;
    }
    var btn = e ? $(e.currentTarget) : null;
    deliveryOption.parent().addClass("spinning").addClass("is-disabled");
    var $this = this;
    var isLogin = !!this.$el.data("user");
    var isFirstAddress = !this.$el.find("#contactInfoView").length;
    var form = this.$el.find("#order");
    var isPartyMode = form.data("party");
    if(!yourAddress) {
      if (isFirstAddress) {
        var deliveryLocationOption = this.$el.find(".deliveryInput .contactOption .regular-radio:checked");
        if (!deliveryLocationOption.length) {
          makeAToast(jQuery.i18n.prop('deliveryOptionNotSelected'));
          if (cb) {
            return cb(false);
          }
          return;
        }
        yourAddress = deliveryLocationOption.next().next().text().split("+")[0];
      } else {
        yourAddress = $this.verifyAddress(e, true);
      }
    }

    if (!yourAddress) {return;}

    if(e && $(e.currentTarget).parent().hasClass('contactOption')){
      this.checkOptions(yourAddress, deliveryOption.data("desc"));
    }

    var deliveryOption = this.$el.find("#deliveryTab .deliveryOption .regular-radio:checked");
    var long = deliveryOption.parent().data('long');
    var lat = deliveryOption.parent().data("lat");
    if(!long || !lat){
      if(btn) {
        btn.trigger("reset");
      }
      makeAToast("error reading delivery central location", "error");
      console.log("error reading delivery central location");
      return;
    }
    var location = {
      long : long,
      lat : lat
    }

    utility.geocoding(yourAddress, function(err, cusLoc){
      if(err){
        makeAToast(err, "err");
        return;
      }
      cusLoc = {
        lat : cusLoc.lat(),
        long : cusLoc.lng()
      }
      var range = deliveryOption.parent().data("range") || 5;
      var distance = utility.getDistance(cusLoc, location, "N");
      if(distance > range){
        makeAToast(jQuery.i18n.prop('addressOutOfRangeError'));
        if(cb){
          return cb(false);
        }
        return;
      }
      deliveryOption.parent().removeClass("spinning").removeClass("is-disabled");
      makeAToast(jQuery.i18n.prop('addressValid'),'success');
      if(cb){return cb( true );}
    })
  },
  applyCouponCode : function(e) {
    e.preventDefault();
    this.alertView.hide();
    var code = this.$el.find(".coupon-code").val();
    if (!code) {
      makeAToast(jQuery.i18n.prop('couponCodeEmpty'));
      return;
    }
    var mealId = this.$el.find("[data-meal]").data("meal");
    this.model.set("id", mealId);
    this.model.set("code", code);
    this.model.type = "coupon";
    var $this = this;
    this.model.save({}, {
      success: function (model, res) {
        var discount = res.amount;
        var code = res.code;
        applyCoupon(true, discount, code);
      },
      error: function (model, err) {
        if(err['responseJSON'].code === -48){
          jumpTo("emailVerificationView");
        }
        $this.alertView.show();
        $this.alertView.html(getMsgFromError(err));
      }
    });
  },
  addPointsToOrder : function(e){
    e.preventDefault();
    this.alertView.hide();
    var subtotal = this.$el.find(".subtotal").data("value");
    var tax = this.$el.find(".tax").data("value");
    var subtotalAfterTax = parseFloat(subtotal + tax);
    if(subtotalAfterTax === 0){
      makeAToast(jQuery.i18n.prop('orderEmptyError'));
      return;
    }
    var point = parseFloat(this.$el.find(".points").val());
    if(point===-1){
      makeAToast(jQuery.i18n.prop('notAuthorize'));
      return;
    }
    var pointRedeem;
    if(point >= subtotalAfterTax * 10){
      pointRedeem = Math.ceil(subtotalAfterTax * 10);
    }else{
      pointRedeem = point;
    }
    if(pointRedeem < 10){
      makeAToast(jQuery.i18n.prop('pointsTooLittle'));
      return;
    }
    applyPoints(true, pointRedeem);
  },
  switchDate : function(e){
    var activeDate = $("#dishDatesBar .mixitup-control-active");
    if(activeDate.length){
      var dateDesc = activeDate.data("filter").replace(".","");
    }else{
      dateDesc = this.$el.find("#dishDatesBar [data-mixitup-control]").data("filter").replace(".","");
    }
    createCookie("date", dateDesc);
    this.verifyAddress();
  }
})

var receiptView = Backbone.View.extend({
  events : {
    "click [data-action='review']" : "review"
  },
  review : function(e){
    e.preventDefault();
    var orderId = $(e.currentTarget).data("id");
    var mealId = $(e.currentTarget).data("meal");
    this.model.set({ id : orderId, reviews : [{content : "testing review", score : 5, dish : "5b3b0154c087f5789ee64f65"}]});
    this.model.action = "review";
    this.model.save({}, {
      success : function(model, result){
        var hostId = result.host;
        BootstrapDialog.alert(jQuery.i18n.prop('reviewSuccessTip'), function(){
          location.href = "/host/public/" + hostId;
        });
      },
      error : function(model, err){
        BootstrapDialog.alert(getMsgFromError(err));
      }
    })
  }
});

var OrderView = Backbone.View.extend({
  events : {
    "click [data-action='receive']" : "receive",
    "click [data-action='ready']" : "ready",
    "click [data-action='reject']" : "reject",
    "click [data-action='confirm']" : "confirm",
    "click [data-action='cancel']" : "cancel",
    "click [data-action='adjust']" : "adjust",
    "click [data-action='deleteOrder']" : "deleteOrder",
    "click [data-action='pay']" : "pay",
    "click [data-action='takeOrder']" : "takeOrder"
  },
  initialize : function(){
    loadStripeJS(function(err){
      if(err){
        console.log("error loading stripe.js");
      }
    })
  },
  receive : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    var orderId = $(e.target).data("order");
    this.model.set({ id : orderId});
    this.model.action = "receive";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          target.html(target.data('success-text'));
          target.addClass("not-active");
        });
      },error : function(model, err){
        BootstrapDialog.alert(getMsgFromError(err));
      }
    })
  },
  ready : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    var orderId = target.data("order");
    this.model.set({ id : orderId});
    this.model.action = "ready";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          target.html(target.data('success-text'));
          target.addClass("not-active");
        });
      },error : function(model, err){
        BootstrapDialog.alert(getMsgFromError(err));
      }
    })
  },
  reject : function(e){
    e.preventDefault();
    var orderId = $(e.target).data("order");
    this.model.set({ id : orderId, msg : $("#popover_msg").val()});
    this.model.action = "reject";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          if(location.href.indexOf("host/me")===-1){
            reloadUrl("/user/me", "#myorder");
          }else{
            reloadUrl("/host/me","#myorder");
          }
        });
      },error : function(model, err){
        BootstrapDialog.alert(getMsgFromError(err));
      }
    })
  },
  confirm : function(e){
    e.preventDefault();
    var orderId = $(e.target).data("order");
    this.model.set({ id : orderId});
    this.model.action = "confirm";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          if(location.href.indexOf("host/me")===-1){
            reloadUrl("/user/me", "#myorder");
          }else{
            reloadUrl("/host/me","#myorder");
          }
        });
      },error : function(model, err){
        BootstrapDialog.alert(getMsgFromError(err));
      }
    })
  },
  cancel : function(e){
    e.preventDefault();
    var orderId = $(e.target).data("order");
    this.model.set({ id : orderId});
    this.model.action = "cancel";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          location.reload();
        });
      },error : function(model, err){
        BootstrapDialog.alert(getMsgFromError(err));
      }
    })
  },
  getContactInfo : function(method, isLogin, cb){
    var contactObj = {};
    var contactView = this.$el.find("#pickupInfoView");
    switch(method) {
      case "pickup":
        if(contactView.find("#contactInfoView").length){
          var name = contactView.find("input[name='name']").val();
          var phone = contactView.find("input[name='phone']").val();
          if (!name || !phone) {
            makeAToast(jQuery.i18n.prop('nameAndPhoneEmptyError'));
            return cb(false);
          }
          contactObj.name = name;
          contactObj.phone = phone;
        }else {
          var t = contactView.find(".pickupInput .contactOption .regular-radio:checked").next().next().text();
          if (t) {
            name = t.split("+")[0];
            phone = t.split("+")[1];
            if (!name || !phone) {
              makeAToast(jQuery.i18n.prop('nameAndPhoneEmptyError'));
              return cb(false);
            }
            contactObj.name = name;
            contactObj.phone = phone;
          }
        }
        // if (!isLogin) {
        //
        // } else {

          // } else {
          //   contactView = this.$el.find("#contactInfoView");
          //   name = contactView.find("input[name='name']").val();
          //   phone = contactView.find("input[name='phone']").val();
          //   if (!name || !phone) {
          //     makeAToast(jQuery.i18n.prop('nameAndPhoneEmptyError'));
          //     return cb(false);
          //   }
          //   contactObj.name = name;
          //   contactObj.phone = phone;
          // }
        // }
        cb(contactObj);
        break;
      case "delivery":
        if (contactView.find("#contactInfoView").length) {
          name = contactView.find("input[name='name']").val();
          phone = contactView.find("input[name='phone']").val();
          var street = contactView.find("input[name='street']").val();
          var city = contactView.find("input[name='city']").val();
          var state = contactView.find("input[name='state']").val();
          var zipcode = contactView.find("input[name='zipcode']").val();
          if (!street || !city || !state || !zipcode) {
            makeAToast(jQuery.i18n.prop('addressIncomplete'));
            return cb(false);
          }
          if (!name || !phone) {
            makeAToast(jQuery.i18n.prop('nameAndPhoneEmptyError'));
            return cb(false);
          }
          contactObj.address = street + ", " + city + ", " + state + " " + zipcode;
          contactObj.name = name;
          contactObj.phone = phone;
        } else {
          var optionView = contactView.find(".deliveryInput .contactOption .regular-radio:checked");
          var t = optionView.next().next().text();
          if (t) {
            var address = t.split("+")[0];
            phone = t.split("+")[1];
            if (!address || !phone) {
              makeAToast(jQuery.i18n.prop('contactAndAddressEmptyError'));
              return cb(false);
            }
            contactObj.address = address;
            contactObj.phone = phone;
            contactObj.name = optionView.data("username");
          } else {
            makeAToast(jQuery.i18n.prop('contactAndAddressEmptyError'));
            return cb(false);
          }
        }
        return cb(contactObj);
        break;
      case "shipping":
        if(!isLogin){
          name = contactView.find("input[name='name']").val();
          phone = contactView.find("input[name='phone']").val();
          street = contactView.find("input[name='street']").val();
          city = contactView.find("input[name='city']").val();
          state = contactView.find("input[name='state']").val();
          zipcode = contactView.find("input[name='zipcode']").val();
          if(!street || !city || !state || !zipcode){
            makeAToast(jQuery.i18n.prop('addressIncomplete'));
            return cb(false);
          }
          if(!name || !phone){
            makeAToast(jQuery.i18n.prop('nameAndPhoneEmptyError'));
            return cb(false);
          }
          contactObj.address = street + ", " + city + ", " + state + " " + zipcode;
          contactObj.name = name;
          contactObj.phone = phone;
        }else{
          t = contactView.next().next().text();
          if(t){
            address = t.split("+")[0];
            phone = t.split("+")[1];
            if(!address || !phone){
              makeAToast(jQuery.i18n.prop('contactAndAddressEmptyError'));
              return cb(false);
            }
            contactObj.address = address;
            contactObj.phone = phone;
          }else{
            makeAToast(jQuery.i18n.prop('contactAndAddressEmptyError'));
            return cb(false);
          }
        }
        return cb(contactObj);
        break;
      }
  },
  getPickupOption : function(method){
    var optionItem = this.$el.find("#" + method + "Tab" + " .option." + method +  "Option .regular-radio:checked");
    var index = optionItem.data("index");
    var date = optionItem.parent().data("date");
    var meal = optionItem.parent().data("meal");
    return { index : index, date: date, meal: meal};
  },
  getCustomizedInfo : function(partyMode, cb){
    if(!partyMode){
      return cb({ comment : this.$el.find("#pickupInfoView [name='comment']:visible").val()});
    }
    var customerInfo = {};
    var customDate = this.$el.find(".customDeliveryDate").data("DateTimePicker");
    if(customDate){
      customDate = customDate.date();
    }
    if(!customDate){
      makeAToast(jQuery.i18n.prop('deliveryAddressEmptyError'));
      return cb(false);
    }
    // var comment = this.$el.find("#commentView [name='comment']").val();
    customerInfo.time = customDate;
    customerInfo.comment = this.$el.find("#pickupInfoView [name='comment']:visible").val();
    return cb(customerInfo);
  },
  getPaymentInfo : function(isLogin, cb){
    var $this = this;
    var cards = this.$el.find("#payment-cards button.active");
    var paymentMethod = cards.data("method");
    var paymentInfo = {};
    if(isLogin){
      if(!cards.length){
        makeAToast(jQuery.i18n.prop('paymentEmptyError'));
        return cb(false);
      }
      paymentInfo.method = paymentMethod;
      cb(paymentInfo);
    }else{
      if(paymentMethod === "online"){
        var paymentInfoView = this.$el.find("#cardPayment");
        var cardholder = paymentInfoView.find("input[name='card-holder']").val();
        var cardnumber = paymentInfoView.find("input[name='card-number']").val();
        var expMonth = paymentInfoView.find("select[name='month']").attr('value');
        var expYear = paymentInfoView.find("select[name='year']").attr('value');
        var cvv = paymentInfoView.find("input[name='cvv']").val();
        var street = paymentInfoView.find("input[name='street']").val();
        var city = paymentInfoView.find("input[name='city']").val();
        var state = paymentInfoView.find("input[name='state']").val();
        var zipcode = paymentInfoView.find("input[name='zipcode']").val();
        var country = paymentInfoView.find(".flagstrap").data('selected-country');
        if(!cardholder || !cardnumber || !expMonth || !expMonth || !cvv){
          makeAToast(jQuery.i18n.prop('cardInfoIncomplete'));
          return cb(false);
        }
        if(!street || !city || !state || !zipcode || !country){
          makeAToast(jQuery.i18n.prop('billingAddressIncomplete'));
          return cb(false);
        }
        if (!Stripe.card.validateCVC(cvv)) {
          makeAToast(jQuery.i18n.prop('invalid_cvc'));
          return cb(false);
        }
        Stripe.card.createToken({
          number: cardnumber,
          cvc: cvv,
          exp_month: expMonth,
          exp_year: expYear,
          name: cardholder,
          address_line1: street,
          address_city: city,
          address_zip: zipcode,
          address_state: state,
          address_country: country
        }, function(status, response){
          if (response.error) {
            BootstrapDialog.alert(jQuery.i18n.prop(response.error.code));
            return cb(false);
          }
          paymentInfo.token = response['id'];
          paymentInfo.method = "online";
          return cb(paymentInfo);
        });
      }else{
        paymentInfo.method = paymentMethod;
        return cb(paymentInfo);
      }
    }
  },
  clear : function(){
    Object.keys(localOrders).forEach(function (dishId) {
      eraseCookie(dishId);
    });
    eraseCookie('points');
    localOrders = {};
    localPoints = 0;
  },
  takeOrder : function(e){
    e.preventDefault();
    var $this = this;
    var button = $(e.currentTarget);
    var userId = this.$el.data("user");
    var isLogin = !!userId;
    var params = {};
    var method = this.$el.find("#method .active").attr("value");

    this.getContactInfo(method, isLogin, function(contactInfo){
      if(!contactInfo){
        jumpTo("pickupInfoView");
        return;
      }
      mealConfirmView.switchAddress(null, function (valid) {
        if (!valid) {
          jumpTo("pickupOptionsView");
          return;
        }
        $this.getPaymentInfo(isLogin, function(paymentInfo) {
          if (!paymentInfo) {
            jumpTo("payment-cards");
            button.trigger("reset");
            return;
          }
          var form = $this.$el.find("#order");
          var partyMode = form.data("party");

          //pickup option
          var pickupObj = $this.getPickupOption(method);
          var pickupOption = pickupObj.index;
          var pickupDate = pickupObj.date;
          var pickupMeal = pickupObj.meal;
          $this.getCustomizedInfo(partyMode, function(customInfo){
            if(!customInfo){
              jumpTo("pickupInfoView");
              button.trigger("reset");
              return;
            }
            var currentOrder = localOrders;

            //subtotal
            var subtotal = parseFloat(form.find(".subtotal").data("value"));
            if (subtotal === 0) {
              button.trigger("reset");
              makeAToast(jQuery.i18n.prop('orderEmptyError'));
              return;
            }

            if(partyMode){
              var minimal = form.data("minimal");
              if(subtotal < minimal){
                button.trigger("reset");
                makeAToast(jQuery.i18n.prop('orderAmountInsufficient', minimal));
                return;
              }
            }

            //coupon & points
            var points = localPoints;
            var couponValue = localCoupon;
            if (couponValue) {
              var code = Object.keys(couponValue)[0];
            }

            BootstrapDialog.show({
              title : jQuery.i18n.prop("tipTitle"),
              message : "<h5>" + jQuery.i18n.prop('selectTip') + "</h5>" +
              "<form id='customTip' class='d-none'>" +
              "<div class='input-group'>" +
              "<div class='input-group-prepend'><span class='input-group-text'>$</span></div>" +
              "<input name='tip' type='number' class='form-control' require>" + "</div>" +
              "</div>" +
              "<button class='form-control btn btn-info' type='submit'>Confirm</button>" +
              "</form>",
              buttons : [{
                label : "15%",
                title : subtotal * 0.15,
                cssClass: 'btn-primary',
                action : function(dialog){
                  $this.submitOrder(currentOrder, subtotal, customInfo, contactInfo, paymentInfo, pickupOption,pickupDate,pickupMeal, method, code, points, isLogin, partyMode, subtotal * 0.15, $this, button);
                }
              },{
                label : jQuery.i18n.prop('customTip'),
                title : jQuery.i18n.prop('customTip'),
                cssClass: 'btn-primary',
                action : function(dialog){
                  $("#customTip").removeClass("d-none").show();
                  $("#customTip").submit(function(e){
                    e.preventDefault();
                    var tip = $(e.currentTarget).find("[name='tip']").val();
                    $this.submitOrder(currentOrder, subtotal, customInfo, contactInfo, paymentInfo, pickupOption,pickupDate,pickupMeal, method, code, points, isLogin, partyMode, tip, $this, button);
                  });
                }
              }, {
                label : jQuery.i18n.prop('noTip'),
                title : jQuery.i18n.prop('noTip'),
                cssClass: 'btn-light',
                action : function(dialog){
                  $this.submitOrder(currentOrder, subtotal, customInfo, contactInfo, paymentInfo, pickupOption,pickupDate,pickupMeal, method, code, points, isLogin, partyMode, 0, $this, button);
                }
              }
              ]
            });
          });
        });
      }, contactInfo.address);
    });
  },
  adjust : function(e){
    var form = this.$el.find("#order");
    var orderId = form.data("order");
    var delivery_fee = this.$el.find("#order .delivery").data("value");
    var subtotal = form.find(".subtotal").data("value");
    if(subtotal===0){
      makeAToast(jQuery.i18n.prop('orderAdjustZeroError'));
      return;
    }
    this.model.set({
      id : orderId,
      orders : localOrders,
      subtotal : subtotal,
      delivery_fee : delivery_fee
    });
    this.model.action = "adjust";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          location.reload();
        });
      },error : function(model, err){
        BootstrapDialog.alert(err.responseJSON ? err.responseJSON.responseText : err.responseText);
      }
    })
  },
  deleteOrder : function(e){
    var orderId = $(e.currentTarget).data("order");
    this.model.set({
      id : orderId
    });
    this.model.action = "deleteOrder";
    this.model.save({},{
      success : function(model,result){
        if(location.href.indexOf("host/me")===-1){
          reloadUrl("/user/me", "#myorder");
        }else{
          reloadUrl("/host/me","#myorder");
        }
      },error : function(model, err){
        BootstrapDialog.alert(err.responseJSON ? err.responseJSON.responseText : err.responseText);
      }
    })
  },
  pay : function(e){
    var target = $(e.currentTarget);
    var orderId = target.data("order");
    this.model.set({
      id : orderId
    });
    this.model.action = "pay";
    this.model.save({},{
      success : function(model,result){
        var source = result.source;
        location.href = source.redirect.url;
      },error : function(model, err){
        BootstrapDialog.alert(err.responseJSON ? err.responseJSON.responseText : err.responseText);
      }
    })
  },

  submitOrder : function(currentOrder, subtotal, customInfo, contactInfo, paymentInfo, pickupOption, pickupDate, pickupMeal, method, code, points, isLogin, partyMode, tip, $this, button){
    $('body').addClass("loading");
    $this.model.clear();
    $this.model.set({
      orders: currentOrder,
      subtotal: subtotal,
      contactInfo: contactInfo,
      paymentInfo : paymentInfo,
      customInfo : customInfo,
      pickupOption: pickupOption,
      pickupDate : pickupDate,
      pickupMeal : pickupMeal,
      method: method,
      couponCode: code,
      points: points,
      isLogin : isLogin,
      isPartyMode : partyMode,
      tip : tip
    });

    $this.model.save({}, {
      success: function (model, result) {
        $('body').removeClass("loading");
        button.trigger("reset");
        var orderIds = result.orders.map(function(order){
          return order.id;
        }).join("+");
        if(paymentInfo.method === "alipay" || paymentInfo.method === "wechatpay"){
          var order = result[0];
          var source = order.source;
          var redirectUrl = source.redirect.url;
          var orderId = source.metadata.orderId;
          var mealId = source.metadata.mealId;
          BootstrapDialog.show({
            title: jQuery.i18n.prop('pendingPaymentTitle'),
            message : jQuery.i18n.prop('pendingPaymentContent'),
            buttons: [
              {
                label: jQuery.i18n.prop('confirmPayment'),
                action: function(dialog) {
                  $.get(
                    '/order/' + orderIds + '/verifyOrder'
                  ).done(function(){
                    $this.clear();
                    if(isLogin){
                      reloadUrl("/user/me", "#myorder");
                    }else{
                      location.href = "/order/" + orderIds + '/receipt';
                    }
                  }).fail(function(err){
                    dialog.setMessage(err.responseJSON.responseText);
                    dialog.setType(BootstrapDialog.TYPE_DANGER);
                  })
                }
              },
              {
                label: jQuery.i18n.prop('cancelPayment'),
                action: function(dialog) {
                  dialog.close();
                }
              }
            ]
          });
          location.href = redirectUrl;
        }else{
          $this.clear();
          BootstrapDialog.alert(jQuery.i18n.prop('newOrderTakenSuccessfully',orderIds), function () {
            if(isLogin){
              reloadUrl("/user/me", "#myorder");
            }else{
              location.href = "/order/" + orderIds + '/receipt';
            }
          });
        }
      }, error: function (model, err) {
        $('body').removeClass("loading");
        button.trigger("reset");
        BootstrapDialog.show({
          title: jQuery.i18n.prop('error'),
          message: err.responseJSON ? (err.responseJSON.responseText || err.responseJSON.summary) : err.responseText
        });
      }
    })
  }
});

function deleteMeal(event){
  var options = $(event.target).data();
  deleteHandler(options["order"], "meal", $(options["errorContainer"]));
}

function deleteDish(event){
  var options = $(event.target).data();
  deleteHandler(options["order"], "dish", $(options["errorContainer"]));
}

function deleteHandler(id, module, alertView){
  alertView.hide();
  var url = "/" + module + "/destroy/" + id;
  $.ajax({
    url : url,
    success : function(){
      location.reload();
    },error : function(err){
      alertView.show();
      alertView.html(getMsgFromError(err));
    }
  })
}

function imageHandler(modual,file,progressBar,cb,error,index,name,isDelete){
  if(isDelete){
    deleteImage(name,modual,function(){
      return cb();
    },function(){
      return error();
    });
  }else{
    uploadImage(modual,file,progressBar,function(url){
      cb(url);
    },function(err){
      error(err);
    },index,name);
  }
}

function deleteImage(filename,modual,cb,error){
  $.ajax({
    url : '/user/me/deleteFile',
    data : {
      name : filename,
      modual : modual
    },
    type : 'POST',
    success : function(result){
      cb();
    },
    error : function(err){
      console.log("some thing went wrong:" + err.responseText);
      error();
    }
  });
}

function uploadImage(modual,file,progressBar,cb,error,index,name){
  if(!file){
    return cb();
  }
  var filename = "";
  var fileType = file.name.split('.').pop();
  switch(modual){
    case "thumbnail":
      filename = "thumbnail." + fileType
      break;
    case "license":
      filename = "license." + fileType;
      break;
    case "story":
      filename = "story." + fileType;
      break;
    case "dish":
      if(name && name!==""){
        filename = name;
      }
      break;
    case "checklist":
      filename = name + "." + fileType;
      break;
    default :
      break;
  }
  $.ajax({
    url : '/user/getSignedUrl',
    data : {
      name : filename,
      type : file.type,
      module : modual
    },
    type : 'POST',
    success : function(result){
      var opts = result.opts;
      var fd = new FormData();
      fd.append('key', result.key);
      fd.append('acl', 'public-read');
      fd.append('content-type', file.type);
      fd.append('policy', result.policy);
      fd.append('AWSAccessKeyId',result.AWSAccessKeyId);
      fd.append('success_action_status','201');
      fd.append('signature', result.signature);
      fd.append("file", file);
      $.ajax({
        xhr: function() {
          var xhr = new window.XMLHttpRequest();

          // Upload progress
          progressBar.show();
          xhr.upload.addEventListener("progress", function(evt){
            if (evt.lengthComputable) {
              var percentComplete = ((evt.loaded / evt.total) * 100).toFixed(2);
              //Do something with upload progress
              progressBar.html(jQuery.i18n.prop('fileUploading') + percentComplete + "%");
            }
          }, false);

          return xhr;
        },
        type : 'POST',
        url : result.url,
        data : fd,
        processData: false,
        contentType: false,
        success : function(){
          cb(result.url + result.key);
        },
        error : function(err){
          var xmlResult = $($.parseXML(err.responseText));
          var message = xmlResult.find('Message');
          error(message);
        }
      })
    },
    error : function(err){
      console.log("some thing went wrong:" + err.responseText);
    }
  });
}

function uploadHostPhoto(e){
  var $this = $(e.currentTarget);
  var error_container = $($this.data("error-container"));
  var alertView = error_container.find(".alert.alert-danger");
  var progressView = error_container.find(".alert.alert-info");
  alertView.hide();
  progressView.hide();
  var files = $("#myinfo input[name='story-pic']")[0].files;
  var file = files[0];
  if(!files || files.length==0){
    alertView.html(jQuery.i18n.prop('fileNotExistedError'));
    alertView.show();
    return;
  }
  uploadImage("story",file,progressView,function(url){
    $("#myinfo .story .fileinput-preview").data("src", url);
    progressView.html(jQuery.i18n.prop('imageUploadComplete'));
    progressView.show();
    hostProfileView.saveHostProfile(new Event("click"));
  },function(err){
    progressView.hide();
    alertView.html(err);
    alertView.show();
  });
}

function uploadLicense(e){
  var $this = $(e.currentTarget);
  var error_container = $($this.data("error-container"));
  var progressView = error_container.find(".alert.alert-info");
  var alertView = error_container.find(".alert.alert-danger");
  alertView.hide();
  progressView.hide();
  var files = $("#myinfo .license input[type='file']")[0].files;
  var file = files[0];
  if(!files || files.length==0){
    alertView.html(jQuery.i18n.prop('fileNotExistedError'));
    alertView.show();
    return;
  }
  uploadImage("license",file,progressView,function(url){
    $("#myinfo .license .fileinput-preview").data("src",url);
    hostProfileView.saveHostProfile(new Event("click"));
    progressView.html(jQuery.i18n.prop('imageUploadComplete'));
    progressView.show();
  },function(err){
    progressView.hide();
    alertView.html(err);
    alertView.show();
  });
}

function uploadThumbnail(){
  $("#myinfo .alert").hide();
  var files = $("#myinfo input[type='file']")[0].files;
  var errorAlert = $("#myinfo .thumbnail .alert.alert-danger");
  errorAlert.removeClass('hide').hide();
  var progressView = $("#myinfo .thumbnail .alert.alert-info");
  var file = files[0];
  if(!files || files.length==0){
    errorAlert.html(jQuery.i18n.prop('fileNotExistedError'));
    errorAlert.show();
    return;
  }
  var isDelete = $("#myinfo input[type='file']").data("isDelete");
  imageHandler("thumbnail",file,progressView,function(url){
    if(!isDelete){
      $("#myinfo .fileinput-preview").data("src", url);
      var e = jQuery.Event("click");
      e.data = {update : true};
      userProfileView.saveProfile(e);
      progressView.html(jQuery.i18n.prop('imageUploadComplete'));
      progressView.show();
    }else{
      $("#myinfo .fileinput-preview").data("src", '');
      progressView.html(jQuery.i18n.prop('imageRemoveComplete'));
      progressView.show();
    }
  },function(err){
    progressView.hide();
    errorAlert.html(err);
    errorAlert.show();
  },0,"thumbnail",isDelete);
}

function wechatLogin(userInit){
  var gm_ua = navigator.userAgent.toLowerCase();
  if(gm_ua.match(/MicroMessenger/i) && gm_ua.match(/MicroMessenger/i)[0]==="micromessenger"){
    var redirectUrl = BASE_URL + '/auth/wechatCode';
    var scope = "snsapi_userinfo";
    var appId = WECHAT_APPID;
    var state = location.href;
    var wechatUrl = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=$APPID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$SCOPE&state=$STATE#wechat_redirect";
    wechatUrl = wechatUrl.replace('$APPID', appId);
    wechatUrl = wechatUrl.replace('$REDIRECT_URI',redirectUrl);
    wechatUrl = wechatUrl.replace('$SCOPE',scope);
    wechatUrl = wechatUrl.replace('$STATE',state);
    location.href = wechatUrl;
  }else if(userInit){
    if(IsPC()){
      redirectUrl = encodeURIComponent(BASE_URL + '/auth/wechatCodeWeb');
      scope = "snsapi_login";
      appId = WECHAT_APPID2;
      state = encodeURIComponent(location.href);
      wechatUrl = "https://open.weixin.qq.com/connect/qrconnect?appid=$APPID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$SCOPE&state=$STATE#wechat_redirect";
      wechatUrl = wechatUrl.replace('$APPID', appId);
      wechatUrl = wechatUrl.replace('$REDIRECT_URI',redirectUrl);
      wechatUrl = wechatUrl.replace('$SCOPE',scope);
      wechatUrl = wechatUrl.replace('$STATE',state);
      location.href = wechatUrl;
    }else{
      var redirectUrl = BASE_URL + '/auth/wechatCode';
      var scope = "snsapi_userinfo";
      var appId = WECHAT_APPID;
      var state = location.href;
      var wechatUrl = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=$APPID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$SCOPE&state=$STATE#wechat_redirect";
      wechatUrl = wechatUrl.replace('$APPID', appId);
      wechatUrl = wechatUrl.replace('$REDIRECT_URI',redirectUrl);
      wechatUrl = wechatUrl.replace('$SCOPE',scope);
      wechatUrl = wechatUrl.replace('$STATE',state);
      location.href = wechatUrl;
    }
  }
}

function IsPC(){
  var userAgentInfo = navigator.userAgent;
  var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
  var flag = true;
  for (var v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }
  }
  return flag;
}

