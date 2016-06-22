/**
 * Created by shengrong on 3/7/16.
 */

var Auth = Backbone.Model.extend({
  urlRoot : "/auth",
  url : function(){
    if(this.type == "login"){
      return this.urlRoot + "/login?type=" + this.method;
    }else{
      return this.urlRoot + "/" + this.type;
    }
  },
  validate : function(attrs, options){

  }
});

var LoginView = Backbone.View.extend({
  events : {
    "submit #loginForm" : "login",
    "click #FBBtn" : "FBLogin",
    "click #GoogleBtn" : "GoogleLogin",
    "submit #sendEmailForm" : "sendEmail",
    "submit #resetPasswordForm" : "resetPassword"
  },
  initialize : function(){
    var errorView = this.$el.find(".alert-danger");
    errorView.removeClass("hide");
    errorView.hide();
    this.errorView = errorView;

    var successView = this.$el.find(".alert-success");
    successView.removeClass("hide");
    successView.hide();
    this.successView = successView;

  },
  login : function(event){
    event.preventDefault();
    this.errorView.hide();
    this.model.type = "login";
    this.model.method = "local";
    var email = this.$el.find("#emailInput").val();
    var password = this.$el.find("#passwordInput").val();
    this.model.set({email : email, password : password});
    var $this = this;
    this.model.save({},{
      success : function(){
        location.reload();
      },error : function(model,err){
        $this.errorView.html(err.responseText || "用户名或密码不正确，请重试。");
        $this.errorView.show();
      }
    });
  },
  FBLogin : function(e){
    e.preventDefault();
    this.errorView.hide();
    this.model.type = "login";
    this.model.method = "facebook";
    location.href = this.model.url();
  },
  GoogleLogin : function(e){
    e.preventDefault();
    this.errorView.hide();
    this.model.type = "login";
    this.model.method = "google";
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
        $this.successView.html("邮件已发送，查阅重置密码邮件。")
      },error : function(model, err){
        $this.errorView.show();
        $this.errorView.html(err.responseText);
      }
    })
  },
  resetPassword : function(e){
    e.preventDefault();
    this.model.type = "reset";
    this.model.set({password : this.$el.find("#passwordInput").val()});
    $this = this;
    this.model.save({},{
      success : function(model, result){
        if(result=="200"){
          $this.successView.html("密码重置成功，请点击链接使用新密码登陆<a href='/'>www.sfmeal.com</a>");
          $this.successView.show();
        }else{
          $this.errorView.html(result.responseText);
          $this.errorView.show();
        }
      },error : function(model, err){

      }
    })
  }
});

var RegisterView = Backbone.View.extend({
  events : {
    "submit form" : "register",
    "click #FBBtn" : "FBLogin",
    "click #GoogleBtn" : "GoogleLogin"
  },
  initialize : function(){
    var alertView = this.$el.find(".alert");
    alertView.removeClass("hide");
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
      birthDate : birthDate,
      receivedEmail : receivedEmail
    });
    this.model.save({},{
      success : function(){
        location.href='/meal';
      },error : function(model,err){
        alertView.html(err.responseText);
        alertView.show();
      }
    })
  },
  FBLogin : function(){
    this.alertView.hide();
    this.model.type = "login";
    this.model.method = "facebook";
    location.href = this.model.url();
  },
  GoogleLogin : function(){
    this.alertView.hide();
    this.model.type = "login";
    this.model.method = "google";
    location.href = this.model.url();
  }
});

var Host = Backbone.Model.extend({
  urlRoot : "/host"
});

var UserBarView = Backbone.View.extend({
  events : {
    "click #applyToHostBtn" : "applyForHost",
    "mouseover #msgBtn" : "clearMsgBadges"
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
      io.socket.on("order", function(result){
        console.log(result);
        $this.handleNotification(result.verb, result.data.action, result.id);
        if(result.data.host && result.data.host.id == hostId){
          $this.handleBadge(true, "order");
        }else{
          $this.handleBadge(false, "order");
        }
      });
    }else if(userId){
      io.socket.get("/user/" + userId + "/orders");
      io.socket.on("order", function(result){
        console.log(result);
        $this.handleNotification(result.verb, result.data.action, result.id);
        $this.handleBadge(false, "order");
      });
    }
    this.getNotification();
  },
  applyForHost : function(e){
    location.href = "/apply";
  },
  handleNotification : function(verb, action, id){
    var msg = "unknown notification";
    switch(verb){
      case "updated":
        msg = "order: " + id + " " + action;
            break;
      case "destroyed":
        msg = "order: " + id + " is cancelled";
            break;
      case "created":
        msg = "you have an new order: " + id;
            break;
    }
    var msgBtn = this.$el.find("#msgBtn");
    msgBtn.find(".badge").show();
    if(msgBtn.attr("title") != ""){
      msgBtn.attr("title",msgBtn.attr('title') + "<br/><br/>" + msg);
      msgBtn.tooltip("fixTitle");
    }else{
      msgBtn.attr("title", msg);
      msgBtn.tooltip({
        title : msg
      });
      msgBtn.tooltip("fixTitle");
    }
  },

  getNotification : function(){
    var userId = this.$el.data("user");
    var hostId = this.$el.data("host");
    var $this = this;
    if(userId){
      $.ajax("/user/" + userId + "/notifications").done(function(data){
        data.forEach(function(notification){
          $this.handleNotification(notification.verb, notification.action, notification.recordId);
          $this.handleBadge(false, notification.model);
        });
      });
    }
    if(hostId){
      $.ajax("/host/" + hostId + "/notifications").done(function(data){
        data.forEach(function(notification){
          $this.handleNotification(notification.verb, notification.action, notification.recordId);
          $this.handleBadge(true, notification.model);
        });
      });
    }
  },

  clearBadges : function(isHost, type){
    switch(type){
      case "msg":
        break;
    }
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
    if(hostBadge == 0){
      hostBadgeView.hide();
    }else{
      hostBadgeView.text(hostBadge);
      hostBadgeView.show();
    }
    var userBadge = userBadgeView.data("badge");
    if(userBadge == 0){
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
    "click #applyBtn" : "applyForHost"
  },
  initialize : function(){
    var steps = this.$el.find(".navbar li a");
    var curStep = 1;
    var maxStep = 5;
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
    // var percent = (parseInt(curStep) / 5) * 100;
    // this.$el.find('.progress-bar').css({width: percent + '%'});
    // this.$el.find('.progress-bar').text("Step " + curStep + " of 5");
    $('[href="#step'+curStep+'"]').tab('show');

  },
  applyForHost : function(e){
    e.preventDefault();
    this.model.url = "/user/becomeHost";
    this.model.fetch({
      success : function(){
        location.reload();
      },error : function(model,err){
        BootstrapDialog.alert(err.responseText);
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
    alertView.removeClass("hide");
    alertView.hide();
    this.alertView = alertView;

    var payment_form = this.$el.find("form");
    if(payment_form.data("id")){
      this.model.set({id: payment_form.data("id")});
    }
  },
  submitProfile: function (e) {
    e.preventDefault();

    if (!Stripe.card.validateCVC(this.$el.find("#cvv").val())) {
      this.$el.find("#cvv").find(".help-block.with-errors").html($("#cvv").data("error"));
      return;
    }
    var $this = this;
    Stripe.card.createToken({
      number: this.$el.find("input[name='cardNumber']").val(),
      cvc: this.$el.find("#cvv").val(),
      exp_month: this.$el.find("select[name='month']").val(),
      exp_year: this.$el.find("select[name='year']").val(),
      name: this.$el.find("input[name='cardholdername']").val(),
      address_line1: this.$el.find("input[name='street']").val(),
      address_city: this.$el.find("input[name='city']").val(),
      address_zip: this.$el.find("input[name='postal']").val(),
      address_state: this.$el.find("input[name='state']").val(),
      address_country: this.$el.find("input[name='country']").val()
    }, function(status, response){
      if (response.error) {
        $this.alertView.html(response.error.message);
        $this.alertView.show();
      } else {
        var form = $this.$el.find("form");
        var token = response['id'];
        var brandInput = form.find("input[name='brand']");
        var brand = response['card']['brand'];
        switch (brand) {
          case "MasterCard":
            brand = "master";
            break;
          case "American Express":
            brand = "AE";
            break;
          case "Diners Club":
            brand = "DC"
            break;
        }
        if (brandInput.length == 0) {
          form.append("<input type='hidden' name='brand' value='" + brand + "' />");
        } else {
          brandInput.attr("value", brand);
        }
        var stripeTokenInput = form.find("input[name='stripeToken']");
        if (stripeTokenInput.length == 0) {
          form.append("<input type='hidden' name='stripeToken' value='" + token + "' />");
        } else {
          stripeTokenInput.attr("value", token);
        }
        $this.createOrUpdatePaymentProfile();
      }
    });
  },

  deleteProfile : function(e){
    e.preventDefault();
    var $this = this;
    this.model.destroy({
      success : function(model, response){
        location.reload();
      },error : function(model,err){
        if(err.status == 200){
          location.reload();
        }else{
          $this.alertView.html(err.responseText);
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

  createOrUpdatePaymentProfile: function () {
    var $this = this;
    this.model.set({
      stripeToken: this.$el.find("input[name='stripeToken']").val(),
      brand: this.$el.find("input[name='brand']").val(),
      street: this.$el.find("input[name='street']").val(),
      city: this.$el.find("input[name='city']").val(),
      state: this.$el.find("input[name='state']").val(),
      postal: this.$el.find("input[name='zip']").val(),
      country: this.$el.find("input[name='country']").val(),
      cardholder: this.$el.find("input[name='cardholdername']").val(),
      cardNumber: this.$el.find("input[name='cardNumber']").val(),
      expMonth: this.$el.find("select[name='month']").val(),
      expYear: this.$el.find("select[name='year']").val(),
      isDefaultPayment: this.isSetToDefault
    });
    this.model.save({}, {
      success: function () {
        location.reload();
      }, error: function (err) {
        $this.alertView.html(err.responseText);
        $this.alertView.show();
      }
    });
  }
});


var Host = Backbone.Model.extend({
  urlRoot : "/host"
});

var User = Backbone.Model.extend({
  urlRoot : "/user"
});

var AddressView = Backbone.View.extend({
  events : {
    "click .deleteBtn" : "deleteAddress",
    "click .edit" : "updateAddress",
    "click [data-action='updateFromOrder']" : "updateAddressFromOrder",
    "click .newAddress" : "newAddress",
    "submit form" : "saveAddress",
    "click #contact input[type='radio']" : "switchAddress",
    "click #method button" : "switchDelivery"
  },
  initialize : function() {
    var userId = this.$el.data("id");
    this.model.set({id: userId});
    var range = this.$el.data("range");
    var hostLoc = {lat: this.$el.data("lat"), long: this.$el.data("long")};
    var contactView = this.$el.find("#contact");
    var distance = utility.getDistance({lat: contactView.data("user-lat"), long: contactView.data("user-long")}, hostLoc);
    if (distance > range) {
      this.$el.find("#contact-error").html("地址超出送餐范围, 请选择自取.");
      this.$el.find("#contact-error").show();
      contactView.data("has-error", true);
    }
  },
  switchDelivery : function(e){
    var curMethod = $(e.target).attr("value");
    refreshMenu();
  },
  switchAddress : function(e){
    this.$el.find("#contact-error").hide();
    var hostLoc = {lat : this.$el.data("lat"), long: this.$el.data("long")};
    var range = this.$el.data("range");
    var address = $(e.target).next().next().text();
    var $this = this;
    var contactView = this.$el.find("#contact");
    utility.distance(address, hostLoc, function(err, distance){
      if(err){
        $this.$el.find("#contact-error").html(err);
        $this.$el.find("#contact-error").show();
        return;
      }
      if(distance > range){
        $this.$el.find("#contact-error").html("地址超出送餐范围, 请选择自取.");
        $this.$el.find("#contact-error").show();
        contactView.data("has-error", true);
      }else{
        contactView.data("has-error", false);
      }
    });
  },
  updateAddress : function(e){
    e.data = {mt :this};
    toggleModal(e,this.enterAddressInfo);
  },
  newAddress : function(e){
    e.data = {mt : this};
    toggleModal(e,this.enterAddressInfo);
  },
  updateAddressFromOrder : function(e){
    e.data = {mt : this};
    toggleModal(e,this.enterAddressInfoFromOrder);
  },
  deleteAddress : function(e){
    var target = $(event.target).parent();
    var address_id = target.data("address-id");
    this.model.set({
      address : {
        id : address_id,
        delete : true
      }
    });
    this.model.save({},{
      success : function(){
        reloadUrl("/user/me","#myaddress");
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
      }
    })
  },
  enterAddressInfoFromOrder : function (event){
    var target = $(event.target);
    var id = target.data("id");
    var address_form = $("#address-form");
    address_form.attr("data-id",id);
    address_form.find(".user").show();
    address_form.find(".host").hide();
    address_form.find("#new_title").removeClass("hide");
    address_form.off("submit");
    address_form.on("submit",{ mt : event.data.mt}, event.data.mt.saveAddress);
    address_form.find("button[name='cancel']").off("click");
    address_form.find("button[name='cancel']").on("click",dismissModal);
  },
  enterAddressInfo : function(event){
    var target = $(event.target).parent();
    var address_id = target.data("address-id");
    var id = target.data("id");
    var street = target.data("street") || "";
    var city = target.data("city");
    var zip = target.data("zip");
    var phone = target.data("phone");
    var address_form = $("#address-form");
    address_form.off("submit");
    address_form.on("submit",{ mt : event.data.mt}, event.data.mt.saveAddress);
    address_form.find("button[name='cancel']").off("click");
    address_form.find("button[name='cancel']").on("click",dismissModal);
    address_form.attr("data-id",id);
    address_form.attr("data-address-id",address_id);
    if(street){
      address_form.find("#exist_title").removeClass("hide");
    }else{
      address_form.find("#new_title").removeClass("hide");
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
    address_form.find("#zipcodeInput").val(zip);
    address_form.find("#phoneInput").val(phone);
  },
  saveAddress : function(e) {
    e.preventDefault();
    var address_form = $("#address-form");
    var alert_block = address_form.find(".alert");
    var $this = e.data.mt;
    alert_block.removeClass("hide");
    alert_block.hide();
    var id = address_form.data("id");
    var address_id = address_form.data("address-id");
    var street = address_form.find("#streetInput").val();
    var city = address_form.find("#cityInput").val();
    var zip = address_form.find("#zipcodeInput").val();
    var phone = address_form.find("#phoneInput").val();
    var isDefault = address_form.find("#isDefault").prop("checked");
    var url = "";
    if (address_form.data("host")) {
      $this.model = new Host();
    }
    $this.model.set({id: id});
    $this.model.set({
      address: {
        id: address_id,
        street: street,
        city: city,
        zip: zip,
        phone: phone,
        isDefault: isDefault
      }
    });
    $this.model.save({}, {
      success: function () {
        location.reload();
        //reloadUrl("/user/me","#myaddress");
      }, error: function (model, err) {
        alert_block.html(err.responseText);
        alert_block.show();
      }
    });
  }
});


var Meal = Backbone.Model.extend({
  urlRoot : "/meal"
});

var MealSelectionView = Backbone.View.extend({
  events : {

  },
  initialize : function(){

  },
  initMap : function(){
    var range = this.$el.data("range") * 1609.34;
    var center = {lat: this.$el.data("lat"), lng: this.$el.data("long")}
    var map = new google.maps.Map(this.$el.find("#googlemap")[0], {
      center: center,
      scrollwheel: false,
      zoom: 11
    });
    var deliveryCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: map,
      center: center,
      radius: range
    });
  }
});

var MealView = Backbone.View.extend({
  isActivate : true,
  events : {
    "submit form" : "publishMeal",
    "click button[name='save']" : "saveMeal",
    "click #addNewPickupBtn" : "addNewPickup",
    "click #removeNewPickupBtn" : "removeNewPickup",
    "click #isDelivery" : "toggleDelivery"
  },
  initialize : function(){
    var form = this.$el.find("form");
    var formAlert = form.find(form.data("err-container") + " .alert");
    formAlert.hide();
    this.formAlert = formAlert;
    var scheduleAlert = form.find("#scheduleAlert");
    scheduleAlert.hide();
    this.scheduleAlert = scheduleAlert;
    var dishesAlert = form.find("#dish-selector .alert");
    dishesAlert.hide();
    this.dishAlert = dishesAlert;
  },
  toggleDelivery : function(e){
    var checkbox = $(e.target);
    var deliveryFeeInput = this.$el.find("#deliveryFeeInput");
    var deliveryRangeInput = this.$el.find("#deliveryRangeInput");
    if(checkbox.prop("checked")){
      deliveryFeeInput.prop('disabled', false);
      deliveryRangeInput.prop('disabled', false);
    }else{
      deliveryFeeInput.prop('disabled', true);
      deliveryRangeInput.prop('disabled', true);
    }
  },
  addNewPickup : function(e){
    e.preventDefault();
    this.$el.find("#pickupAlert").hide();
    var pickupView = '<div class="well form-group pickup"> <div class="col-xs-4"> <label>取餐时间 <i class="fa fa-question-circle text-lightgrey cursor-pointer"></i></label> </div> <div class="col-xs-8 start-pickup"> <div class="form-group"> <div class="input-group date" data-toggle="dateTimePicker"> <span class="input-group-addon">From</span> <input type="text" class="form-control" /> <span class="input-group-addon"> <span class="fa fa-calendar"></span> </span> </div> </div> <div class="form-group end-pickup"> <div class="input-group date" data-toggle="dateTimePicker"> <span class="input-group-addon">&nbsp;&nbsp;To&nbsp;&nbsp;</span> <input type="text" class="form-control"/> <span class="input-group-addon"> <span class="fa fa-calendar"></span> </span> </div></div> <div class="form-group location"> <label>取餐地点</label> <input type="text" class="form-control"> </div> </div> </div>';
    this.$el.find(".pickup_container").append(pickupView);
    this.$el.find("[data-toggle='dateTimePicker']").datetimepicker({
      icons:{
        time: "fa fa-clock-o",
        date: "fa fa-calendar",
        up: "fa fa-arrow-up",
        down: "fa fa-arrow-down",
        previous : "fa fa-arrow-left",
        next : "fa fa-arrow-right",
        today : "fa fa-calendar-times-o"
      },
      stepping : 30,
      showTodayButton : true,
    });
  },
  removeNewPickup : function(e){
    e.preventDefault();
    this.$el.find("#pickupAlert").hide();
    var pickupContainers = this.$el.find(".pickup_container .well");
    if(pickupContainers.length == 1){
      this.$el.find("#pickupAlert").show();
      return;
    }
    pickupContainers.last().remove();
  },
  saveMeal : function(e){
    e.preventDefault();
    this.isActivate = false;
    this.$el.find("form").validator({}).submit();
  },
  publishMeal : function(e){
    e.preventDefault();
    var form = this.$el.find("form");
    var mealId = form.data("meal-id");
    var hostId = form.data("host-id");
    this.formAlert.hide();
    this.scheduleAlert.hide();
    this.dishAlert.hide();

    var dishesItems = form.find("#dishSelected li");
    if(dishesItems.length == 0){
      this.dishAlert.html(form.find("#dishSelected").data("error"));
      this.dishAlert.show();
      return;
    }

    var dishes = "";
    var totalQty = {};
    var cover = "";
    var index = 0;
    var features = "";
    dishesItems.each(function(){
      var dishItem = $(this);
      var id = dishItem.data("id");
      var hasCover = dishItem.data().cover == true;
      var hasFeature = dishItem.data().feature == true;
      if(hasCover){
        cover = id;
      }if(hasFeature){
        if(features!=""){
          features += ",";
        }
        features += id;
      }
      var number = dishItem.find(".amount-input input").val();
      totalQty[id] = number;
      if(dishes!=""){
        dishes += ",";
      }
      dishes += dishItem.data("id");
      index ++;
    });

    if(cover == ""){
      cover = $(dishesItems[0]).data("id");
    }

    var isDelivery = form.find("#isDelivery").prop("checked");
    if(isDelivery){
      var deliveryFee = form.find("#deliveryFeeInput").val();
      var deliveryRange = form.find("#deliveryRangeInput").val();
    }

    var isOrderNow = form.find("#radio-order-now:checked").length > 0;
    var type = "order";
    if(!isOrderNow){
      var startBookingDatePicker = form.find("#preorder .start-booking [data-toggle='dateTimePicker']");
      var startBookingDate = startBookingDatePicker.data("DateTimePicker").date();

      var endBookingDatePicker = form.find("#preorder .end-booking [data-toggle='dateTimePicker']");
      var endBookingDate = endBookingDatePicker.data("DateTimePicker").date();

      var pickupViews = form.find("#preorder .pickup_container .pickup");
      var pickups = [];
      var pickupValid = true;

      var $this = this;

      pickupViews.each(function(){
        var pickupObj = {};
        var pickupFromTime = $(this).find(".start-pickup [data-toggle='dateTimePicker']").data("DateTimePicker").date();
        var pickupTillTime = $(this).find(".end-pickup [data-toggle='dateTimePicker']").data("DateTimePicker").date();
        var location = $(this).find(".location input").val();
        if(!pickupFromTime || !pickupTillTime || !location){
          pickupValid = false;
          $this.scheduleAlert.show();
          $this.scheduleAlert.html("提货时间/地点必须填");
          return;
        }else if(pickupFromTime.isSame(pickupTillTime)){
          pickupValid = false;
          $this.scheduleAlert.show();
          $this.scheduleAlert.html("开始/结束取货时间不能一样");
          return;
        }else if(moment.duration(pickupTillTime.diff(pickupFromTime)).asMinutes() < 30){
          pickupValid = false;
          $this.scheduleAlert.show();
          $this.scheduleAlert.html("开始到结束取货时间不能短于30分钟");
          return;
        }
        pickupObj.pickupFromTime = pickupFromTime._d;
        pickupObj.pickupTillTime = pickupTillTime._d;
        pickupObj.location = location;
        pickups.push(pickupObj);
      });

      if(!pickupValid){
        return;
      }

      if(!startBookingDate || !endBookingDate){
        this.scheduleAlert.show();
        this.scheduleAlert.html("接受/结束预定或提货时间必须填");
        return;
      }else if(startBookingDate.isSame(endBookingDate)){
        this.scheduleAlert.show();
        this.scheduleAlert.html("接受/结束预定时间不能一样");
        return;
      }else if(moment.duration(endBookingDate.diff(startBookingDate)).asMinutes() < 60){
        this.scheduleAlert.show();
        this.scheduleAlert.html("开始到结束预定时间不能短于1小时");
        return;
      }

      type = "preorder";

    }else{
      var startBookingDatePicker = form.find("#order .start-booking [data-toggle='dateTimePicker']");
      var startBookingDate = startBookingDatePicker.data("DateTimePicker").date();

      var endBookingDatePicker = form.find("#order .end-booking [data-toggle='dateTimePicker']");
      var endBookingDate = endBookingDatePicker.data("DateTimePicker").date();

      if(!startBookingDate._d || !endBookingDate._d){
        this.scheduleAlert.show();
        this.scheduleAlert.html("营业时间必须填");
        return
      }else if(startBookingDate.isSame(endBookingDate)){
        this.scheduleAlert.show();
        this.scheduleAlert.html("开始时间不能和结束时间一样");
        return;
      }else if(startBookingDate.isAfter(endBookingDate)){
        this.scheduleAlert.show();
        this.scheduleAlert.html("开始时间不能晚于结束时间");
        return;
      }else if(moment.duration(endBookingDate.diff(startBookingDate)).asMinutes() < 60){
        this.scheduleAlert.show();
        this.scheduleAlert.html("开始时间到结束时间不能短于1小时");
        return;
      }
    }

    var min_order = form.find("#min-order").val();
    var min_total;
    if(!min_order || min_order == ""){
      min_total = form.find("#min-total").val();
      if(!min_total || min_total==""){
        form.find(".order-require .alert").show();
        form.find(".order-require .alert").html(form.find("#min-order").data("error"));
        return;
      }
    }

    var status = this.isActivate? "on" : "off";
    var title = form.find("#meal_title").val();
    if(mealId){
      this.model.set({id : mealId});
      dishes = undefined;
    }

    this.formAlert.show();
    this.formAlert.html("保存中...");
    this.model.unset("chef");
    this.model.set({
      dishes : dishes,
      provideFromTime : startBookingDate ? startBookingDate._d : undefined,
      provideTillTime : endBookingDate ? endBookingDate._d : undefined,
      pickups : JSON.stringify(pickups),
      totalQty : totalQty,
      leftQty : totalQty,
      type : type,
      status : status,
      title : title,
      minimalOrder : min_order,
      minimalTotal : min_total,
      cover : cover,
      features : features,
      isDelivery : isDelivery,
      delivery_fee : deliveryFee,
      delivery_range : deliveryRange
    });
    var $this = this;
    this.model.save({},{
      success : function(){
        if(mealId) {
          $this.formAlert.html("Meal更新完成");
        }else{
          BootstrapDialog.alert("Meal新建完成!", function(){
            reloadUrl("/host/me#","mymeal");
          })
        }
      },error : function(model, err){
        $this.formAlert.html(err.responseText);
      }
    });
  }
});

var Dish = Backbone.Model.extend({
  urlRoot : "/dish"
});

var DishView = Backbone.View.extend({
  events : {
    "submit form" : "saveDish"
  },
  initialize : function(){
    var form = this.$el.find("form");
    var formAlert = form.find(form.data("err-container") + " .alert");
    formAlert.hide();
    this.formAlert = formAlert;
  },
  saveDish : function(e) {
    e.preventDefault();
    var form = this.$el.find("form");
    var submit_btn = form.find("[type='submit']");
    if (submit_btn.hasClass('disabled')) {
      return;
    }
    form.find("#photoError").html("");

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
            form.find("#photoError").html(p1Input.data("error"));
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
      form.find("#photoError").html(p1Input.data("error"));
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

    this.formAlert.show();
    this.formAlert.html("保存中...");

    var root = "https://sfmeal.s3.amazonaws.com/users/" + form.data("id") + "/";
    var dishId = form.data("dish-id");
    var title = $("#mealTitleInput").val();
    var price = $("#priceInput").val();
    var category = $("#categoryInput").val();
    var $this = this;
    if (dishId) {
      this.model.set({id: dishId});
    }
    //update dish
    imageHandler('dish',file1,function(){
      imageHandler('dish',file2,function(){
        imageHandler('dish',file3,function(){
          var photos = [];
          if(file1){
            photos[0] = {v:root + filename1};
          }else if(oldname1){
            photos[0] = {v:oldname1}
          }else{
            photos[0] = {v:""};
          }
          if(file2){
            photos[1] = {v:root + filename2};
          }else if(oldname2){
            photos[1] = {v:oldname2};
          }else{
            photos[1] = {v:""};
          }
          if(file3){
            photos[2] = {v:root + filename3};
          }else if(oldname3){
            photos[2] = {v:oldname3};
          }else{
            photos[2] = {v:""};
          }

          $this.model.set({
            title : title,
            price : price,
            photos : photos,
            type : category
          });

          $this.model.save({},{
            success : function(){
              if(dishId){
                $this.formAlert.html("菜品更新完成");
                $this.formAlert.show();
              }else{
                BootstrapDialog.alert("菜品新建完成", function(){
                  reloadUrl("/host/me#","mydish");
                });
              }
            },error : function(model, err){
              $this.formAlert.html(err.responseText);
              $this.formAlert.show();
            }
          });
        },function(){
          $this.formAlert.show();
          $this.formAlert.html("菜品更新错误，请稍后再试。")
        },3,filename3,delete3)
      },function(){
        $this.formAlert.show();
        $this.formAlert.html("菜品更新错误，请稍后再试。")
      },2,filename2,delete2);
    },function(){
      $this.formAlert.show();
      $this.formAlert.html("菜品更新错误，请稍后再试。")
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
    alertForm.removeClass("hide");
    alertForm.hide();
    this.alertForm = alertForm;
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
          success : function(){
            dismissModal();
            if(form.data("updating")){
              BootstrapDialog.alert("银行账号已更新！", function(){
                reloadUrl("/user/pocket","#mypurse");
              });
            }else{
              BootstrapDialog.alert("银行账号已建立!", function(){
                reloadUrl("/user/pocket","#mypurse");
              });
            }
          },error : function(model, err){
            $this.alertForm.html(err.responseJSON);
            $this.alertForm.show();
          }
        });
      }
    });
  }
});

var UserProfileView = Backbone.View.extend({
  events : {
    "submit form" : "saveProfile"
  },
  initialize : function(){
    var alertView = this.$el.find(".form-alert");
    alertView.removeClass("hide");
    alertView.hide();
    this.alertView = alertView;
  },
  saveProfile : function(e){
    e.preventDefault();
    this.alertView.html("保存中...");
    this.alertView.show();
    var lastname = this.$el.find("input[name='lastname']").val();
    var firstname = this.$el.find("input[name='firstname']").val();
    var color = this.$el.find("div[name='template_color'] .active").data('color');
    var desc = this.$el.find("textarea[name='desc']").val();
    var picture = this.$el.find(".fileinput-preview").data("src");
    var phone = this.$el.find("#phoneInput").val();
    var zipcode = this.$el.find("#zipcodeInput").val();
    this.model.set({
      id : this.$el.data("id"),
      firstname : firstname,
      lastname : lastname,
      desc : desc,
      color : color,
      picture : picture,
      phone : phone,
      zipcode : zipcode
    });
    var $this = this;
    this.model.save({},{
      success : function(){
        $this.alertView.html("保存完毕。")
      },error : function(model, err){
        $this.alertView.html("更改未保存，请刷新页面再重试。")
      }
    });
  }
});

var HostProfileView = Backbone.View.extend({
  events : {
    "submit form" : "saveHostProfile"
  },
  initialize : function(){
    var form = this.$el.find("form");
    var alertView = form.find(form.data("err-container"));
    alertView.removeClass("hide");
    alertView.hide();
    this.alertView = alertView;
  },
  saveHostProfile : function(e){
    e.preventDefault();
    var form = this.$el.find("form");
    var title = this.$el.find("input[name='story-title']").val();
    var intro = this.$el.find("textarea[name='story-intro']").val();
    var license = this.$el.find(".license .fileinput-preview").data("src");
    var shopPhoto = this.$el.find(".story .fileinput-preview").data("src");
    var feature_dishes = [];
    this.$el.find(".dishes a[data-toggle='dropdown']").each(function(index){
      var feature_dish_obj = {};
      var index = parseInt(index) + 1;
      feature_dish_obj["dish" + index] = {"id": $(this).data("value"), "title" : $(this).text()};
      feature_dishes.push(feature_dish_obj);
    });
    this.alertView.html("保存中...");
    this.alertView.show();
    this.model.set({
      id : form.data("id"),
      shopName : title,
      intro : intro,
      feature_dishes : feature_dishes,
      license : license,
      picture : shopPhoto
    });
    var $this = this;
    this.model.save({},{
      success : function(){
        $this.alertView.html("修改已保存。");
      },error : function(model, err){
        $this.alertView.html("修改未保存,请稍后再试。");
      }
    });
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

  },
  leaveReview : function(e){
    e.preventDefault();
    var ele = $(e.target);
    var rating_container = $(ele.data("target"));
    var alertView = rating_container.find($(ele).data("err-container"));
    alertView.removeClass("hide");
    alertView.hide();
    var dishId = ele.data("dish");
    var mealId = ele.data("meal");
    var hostId = ele.data("host");
    if(dishId){
      //single dish review
      var score = rating_container.find(".rating .text-yellow").length;
      var content = rating_container.find(".review").val();
    }else if(mealId){
      //meal review
      var reviews = [];
      var scoreNotRated = false;
      rating_container.find(".dish-item").each(function(){
        var reviewObj = {};
        reviewObj.dish = $(this).data("dish");
        reviewObj.score = $(this).find(".rating .text-yellow").length;
        reviewObj.content = $(this).find(".review").val();
        if(reviewObj.score == 0){
          scoreNotRated = true;
        }
        reviews.push(reviewObj);
      });
    }
    if(score == 0 || scoreNotRated){
      alertView.show();
      return;
    }
    this.model.set({
      meal : mealId,
      dish : dishId,
      score : score,
      host : hostId,
      reviews : reviews,
      review : content
    });
    this.model.save({},{
      success : function(){
        reloadUrl("/user/me","#myreview");
      },error : function(model, err){
        alertView.html(err.responseText);
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

var OrderView = Backbone.View.extend({
  events : {
    "click [data-action='receive']" : "receive",
    "click [data-action='ready']" : "ready",
    "click [data-action='reject']" : "reject",
    "click [data-action='confirm']" : "confirm",
    "click [data-action='cancel']" : "cancel",
    "click [data-action='adjust']" : "adjust",
    "click [data-action='takeOrder']" : "takeOrder"
  },
  initialize : function(){
    var contactAlert = this.$el.find("#contact-error");
    contactAlert.removeClass("hide");
    contactAlert.hide();
    this.contactAlert = contactAlert;
    var paymentAlert = this.$el.find("#payment-error");
    paymentAlert.removeClass("hide");
    paymentAlert.hide();
    this.paymentAlert = paymentAlert;
    var formAlert = this.$el.find(".form.alert");
    formAlert.removeClass("hide");
    formAlert.hide();
    this.formAlert = formAlert;
  },
  receive : function(e){
    e.preventDefault();
    var orderId = $(e.target).data("order");
    this.model.set({ id : orderId});
    this.model.action = "receive";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          reloadUrl("/host/me", "#myorder");
        });
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
      }
    })
  },
  ready : function(e){
    e.preventDefault();
    var orderId = $(e.target).data("order");
    this.model.set({ id : orderId});
    this.model.action = "ready";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          reloadUrl("/host/me", "#myorder");
        });
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
      }
    })
  },
  reject : function(e){
    e.preventDefault();
    var orderId = $(e.target).data("order");
    this.model.set({ id : orderId});
    this.model.action = "reject";
    this.model.save({},{
      success : function(model,result){
        BootstrapDialog.alert(result.responseText, function(){
          reloadUrl("/host/me", "#myorder");
        });
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
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
          reloadUrl("/host/me", "#myorder");
        });
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
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
          if(location.href.indexOf("host/me")==-1){
            reloadUrl("/user/me", "#myorder");
          }else{
            reloadUrl("/host/me","#myorder");
          }
        });
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
      }
    })
  },
  takeOrder : function(e){
    e.preventDefault();
    var form = this.$el.find("#order");
    var orderId = form.data("order");

    this.contactAlert.hide();
    this.paymentAlert.hide();

    if(orderId){
      this.model.set({id : orderId});
    }
    var params = {};
    var method = this.$el.find("#method .active").attr("value");
    if(method == "delivery"){
      var contacts = this.$el.find("#contact .regular-radio:checked + label + span").text().split("+");
      if(method && contacts.length < 2){
        this.contactAlert.html("地址和联系方式不能为空。");
        this.contactAlert.show();
        return;
      }
      var address = contacts[0];
      var phone = contacts[1].replace(" ","");
    }else{
      var methodContainer = this.$el.find("#pickupMethod .regular-radio:checked").parent();
      var from = methodContainer.find(".time").data("from");
      var to = methodContainer.find(".time").data("to");
      var address = methodContainer.find(".address").data("value");
      var pickupInfo = {
        from : from,
        to : to,
        address : address
      };
    }

    var contactView = this.$el.find("#contact");
    if(contactView.data("has-error")){
      this.contactAlert.show();
      return;
    }


    var cards = this.$el.find("#payment-cards button");
    if(cards && cards.length == 1){
      this.paymentAlert.html("支付方式不能为空。");
      this.paymentAlert.show();
      return;
    }
    var currentOrder = localOrders;
    var mealId = form.data("meal");
    var pickupMethod = this.$el.find("method .active").attr("value");
    if(pickupMethod == "delivery"){
      var delivery_fee = this.$el.find("#order .delivery").data("value");
    }else{
      var delivery_fee = 0;
    }
    var subtotal = form.find(".subtotal").data("value");
    if(subtotal == 0){
      this.paymentAlert.html("您未点取任何菜式，请先下单。");
      this.paymentAlert.show();
      return;
    }

    this.model.set({
      orders : currentOrder,
      subtotal : subtotal,
      address : address,
      pickupInfo : pickupInfo,
      method : method,
      mealId : mealId,
      phone : phone,
      delivery_fee : delivery_fee
    });

    this.model.save({},{
      success : function(model, result){
        Object.keys(localOrders).forEach(function(dishId){
          eraseCookie(dishId);
        });
        localOrders = {};
        BootstrapDialog.alert(result.responseText);
        reloadUrl("/user/me","#myorder");
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
      }
    })
  },
  adjust : function(e){
    var form = this.$el.find("#order");
    var orderId = form.data("order");
    var delivery_fee = this.$el.find("#order .delivery").data("value");
    var subtotal = form.find(".subtotal").data("value");
    if(subtotal == 0){
      this.formAlert.html("调整订单金额不能为零，您想取消订单吗？请在订单页选取消");
      this.formAlert.show();
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
          if(location.href.indexOf("host/me")==-1){
            reloadUrl("/user/me", "#myorder");
          }else{
            reloadUrl("/host/me","#myorder");
          }
        });
      },error : function(model, err){
        BootstrapDialog.alert(err.responseText);
      }
    })
  }
});

function deleteMeal(event){
  deleteHandler($(event.target).data("order"), "meal");
}

function deleteDish(event){
  deleteHandler($(event.target).data("order"), "dish");
}

function deleteHandler(id, module){
  location.href = "/" + module + "/destroy/" + id;
}

function imageHandler(modual,file,cb,error,index,name,isDelete){
  if(isDelete){
    deleteImage(name,modual,function(){
      return cb();
    },function(){
      return error();
    });
  }else{
    uploadImage(modual,file,function(url){
      cb(url);
    },function(err){
      error(err);
    },index,name);
  }
}

function deleteImage(filename,modual,cb,error){
  $.ajax({
    url : '/user/delete',
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

function uploadImage(modual,file,cb,error,index,name){
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
      if(name && name!=""){
        filename = name;
      }
      break;
    default :
      break;
  }
  $.ajax({
    url : '/user/getSignedUrl',
    data : {
      name : filename,
      type : file.type,
      modual : modual
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
      //fd.append('x-amz-signature', result.signature);
      //fd.append('x-amz-date',result.date);
      //fd.append('x-amz-algorithm', 'AWS4-HMAC-SHA256');
      //fd.append('x-amz-credential', result.credential);
      //fd.append('x-amz-meta-uuid', '14365123651274');
      fd.append("file", file);
      $.ajax({
        type : 'POST',
        url : result.url,
        data : fd,
        processData: false,
        contentType: false,
        beforeSend: function (request)
        {
          //request.setRequestHeader('Authorization', result.opts.headers.Authorization);
          //request.setRequestHeader('Host', result.opts.headers.Host);
          //request.setRequestHeader('X-Amz-Date', result.opts.headers["X-Amz-Date"]);
          //request.setRequestHeader('Content-Type', result.opts.headers["Content-Type"]);
          //request.setRequestHeader('Content-Length', result.opts.headers["Content-Length"]);
          //request.setRequestHeader('X-Amz-Content-Sha256', result.opts.headers["X-Amz-Content-Sha256"]);
          //request.setRequestHeader('Content-Type', file.type);
          //request.setRequestHeader('x-amz-acl', 'public-read');
          ////request.setRequestHeader('x-amz-meta-uuid','14365123651274');
          //request.setRequestHeader('X-Amz-Credential',result.credential);
          //request.setRequestHeader('X-Amz-Algorithm','AWS4-HMAC-SHA256');
          //request.setRequestHeader('X-Amz-Date',result.date);
          ////request.setRequestHeader('Policy',result.policy);
          //request.setRequestHeader('X-Amz-Signature',result.signature);
        },
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
  var alertView = error_container.find(".alert");
  alertView.hide();
  var files = $("#myinfo input[name='story-pic']")[0].files;
  var file = files[0];
  if(!files || files.length==0){
    alertView.html("文件不存在或没有改变");
    alertView.show();
    return;
  }
  uploadImage("story",file,function(url){
    $("#myinfo .story .fileinput-preview").data("src", url);
    alertView.html("厨师照片更新完成");
    alertView.show();
    hostProfileView.saveHostProfile(new Event("click"));
  },function(err){
    alertView.html(err);
    alertView.show();
  });
}

function uploadLicense(e){
  var $this = $(e.currentTarget);
  var error_container = $($this.data("error-container"));
  var alertView = error_container.find(".alert");
  alertView.hide();
  var files = $("#myinfo .license input[type='file']")[0].files;
  var file = files[0];
  if(!files || files.length==0){
    alertView.html("文件不存在或没有改变");
    alertView.show();
    return;
  }
  uploadImage("license",file,function(url){
    $("#myinfo .license .fileinput-preview").data("src",url);
    hostProfileView.saveHostProfile(new Event("click"));
    alertView.html("执照更新完成");
    alertView.show();
  },function(err){
    alertView.html(err);
    alertView.show();
  });
}

function uploadThumbnail(){
  $("#myinfo .alert").hide();
  var files = $("#myinfo input[type='file']")[0].files;
  var alert_block = $("#myinfo .alert:eq(0)");
  var file = files[0];
  if(!files || files.length==0){
    alert_block.html("please upload a thumbnail first");
    alert_block.show();
    return;
  }
  var isDelete = $("#myinfo input[type='file']").data("isDelete");
  imageHandler("thumbnail",file,function(url){
    if(!isDelete){
      $("#myinfo .fileinput-preview").data("src", url);
      userProfileView.saveProfile(new Event("click"));
      alert_block.removeClass('hide');
      alert_block.html("upload complete!");
      alert_block.show();
    }else{
      $("#myinfo .fileinput-preview").data("src", '');
      alert_block.removeClass('hide');
      alert_block.html("profile clear!");
      alert_block.show();
    }
  },function(err){
    alert_block.removeClass('hide');
    alert_block.html(err);
    alert_block.show();
  },0,"thumbnail",isDelete);
}
