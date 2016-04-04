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
        if(err.status=="302"){
          return location.reload();
        }
        $this.errorView.html(err.responseText);
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
        location.reload();
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
    "click #applyToHostBtn" : "applyForHost"
  },
  initialize : function(){
  },
  applyForHost : function(e){
    e.preventDefault();
    this.model.url = "/user/becomeHost";
    this.model.fetch({
      success : function(){
        location.reload();
      },error : function(model,err){
        alert(err.responseText);
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
    "submit form" : "saveAddress"
  },
  initialize : function(){
    var userId = this.$el.data("id");
    this.model.set({ id : userId });
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
        alert(err.responseText);
      }
    })
  },
  enterAddressInfoFromOrder : function (event){
    var target = $(event.target);
    var id = target.data("id");
    var address_form = $("#address-form");
    address_form.attr("data-id",id);
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
    var street = target.data("street");
    var city = target.data("city");
    var zip = target.data("zip");
    var phone = target.data("phone");
    var address_form = $("#address-form");
    address_form.off("submit");
    address_form.on("submit",{ mt : event.data.mt}, event.data.mt.saveAddress);
    address_form.find("button[name='cancel']").off("click");
    address_form.find("button[name='cancel']").on("click",dismissModal);
    var isHost = target.data("host");
    if(isHost){
      address_form.attr("data-host",true);
    }
    address_form.attr("data-id",id);
    address_form.attr("data-address-id",address_id);
    if(street){
      address_form.find("#exist_title").removeClass("hide");
    }else{
      address_form.find("#new_title").removeClass("hide");
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

var MealView = Backbone.View.extend({
  isActivate : true,
  events : {
    "submit form" : "publishMeal",
    "click button[name='save']" : "saveMeal"
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
  saveMeal : function(e){
    e.preventDefault();
    this.isActivate = false;
    this.$el.find("form").validate({}).submit();
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

    var isOrderNow = form.find("#radio-order-now:checked").length > 0;
    var type = "order";
    if(!isOrderNow){
      var month = parseInt(form.find("#provideFrom-month").attr("value")) - 1;
      var year = form.find("#provideFrom-year").attr("value");
      var day = form.find("#provideFrom-day").attr("value");
      if((month || month == 0)&& year && day){
        var from = new Date(year,month,day);
      }
      month = parseInt(form.find("#provideTill-month").attr("value")) - 1;
      year = form.find("#provideTill-year").attr("value");
      day = form.find("#provideTill-day").attr("value");
      if((month || month == 0)&& year && day){
        var till = new Date(year,month,day);
      }
      month = parseInt(form.find("#pickup-month").attr("value")) - 1;
      year = form.find("#pickup-year").attr("value");
      day = form.find("#pickup-day").attr("value");
      var hour = form.find("#pickup-from-hour").attr("value");
      if((month || month == 0)&& year && day && (hour || hour == 0)){
        var pickupFrom = new Date(year,month,day,hour,0,0);
      }
      hour = form.find("#pickup-till-hour").attr("value");
      if((month || month == 0)&& year && day && (hour || hour == 0)){
        var pickupTill = new Date(year,month,day,hour,0,0);
      }
      type = "preorder";
      if(!from || !till || !pickupFrom || !pickupTill){
        this.scheduleAlert.show();
        this.scheduleAlert.html("接受/结束预定或提货时间必须填");
        return
      }
    }else{
      var from = new Date();
      var startHour = parseInt(form.find("#start-hour").attr("value"));
      var endHour = parseInt(form.find("#end-hour").attr("value"));
      var till = new Date();
      from.setHours(startHour,0,0);
      till.setHours(endHour,0,0);
      if((!startHour && startHour != 0) || (!endHour && endHour != 0)){
        this.scheduleAlert.show();
        this.scheduleAlert.html("营业时间必须填");
        return
      }else if(startHour == endHour){
        this.scheduleAlert.show();
        this.scheduleAlert.html("开始时间不能和结束时间一样");
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

    var status = this.isActivate? "ongoing" : "off";
    var title = form.find("#meal_title").val();
    if(mealId){
      this.model.set({id : mealId});
      dishes = undefined;
    }

    this.formAlert.show();
    this.formAlert.html("保存中...");
    this.model.set({
      dishes : dishes,
      provideFromTime : from,
      provideTillTime : till,
      pickupFromTime : pickupFrom,
      pickupTillTime : pickupTill,
      totalQty : totalQty,
      leftQty : totalQty,
      type : type,
      status : status,
      title : title,
      minimalOrder : min_order,
      minimalTotal : min_total,
      cover : cover,
      features : features
    });
    var $this = this;
    this.model.save({},{
      success : function(){
        if(mealId) {
          $this.formAlert.html("Meal更新完成");
        }else{
          alert("Meal新建完成!")
          reloadUrl("/host/me","#mymeal");
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
                alert("菜品新建完成");
                reloadUrl("/host/me","#mydish");
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
        $this.alertForm.html(response.error);
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
              alert("银行账号已更新！");
            }else{
              alert("银行账号已建立!");
            }
            reloadUrl("/user/pocket","#mypurse");
          },error : function(model, err){
            $this.alertForm.html(err.responseText);
            $this.alertForm.show();
          }
        });
      }
    });
  }
});

var UserProfileView = Backbone.View.extend({
  events : {
    "click .save" : "saveProfile"
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
    var color = this.$el.find("div[name='template_color']").data('color');
    var desc = this.$el.find("textarea[name='desc']").val();
    var picture = this.$el.find(".fileinput-preview").data("src");
    this.model.set({
      id : this.$el.data("id"),
      firstname : firstname,
      lastname : lastname,
      desc : desc,
      color : color,
      picture : picture
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
        alert(result.responseText);
        reloadUrl("/host/me", "#myorder");
      },error : function(model, err){
        alert(err.responseText);
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
        alert(result.responseText);
        reloadUrl("/host/me", "#myorder");
      },error : function(model, err){
        alert(err.responseText);
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
        alert(result.responseText);
        reloadUrl("/host/me", "#myorder");
      },error : function(model, err){
        alert(err.responseText);
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
        alert(result.responseText);
        reloadUrl("/host/me", "#myorder");
      },error : function(model, err){
        alert(err.responseText);
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
        alert(result.responseText);
        if(location.href.indexOf("host")==-1){
          reloadUrl("/user/me", "#myorder");
        }else{
          reloadUrl("/host/me","#myorder");
        }
      },error : function(model, err){
        alert(err.responseText);
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
    var contacts = this.$el.find("#contact .regular-radio:checked + label + span").text().split("+");
    if(method && contacts.length < 2){
      this.contactAlert.html("联系方式不能为空。");
      this.contactAlert.show();
      return;
    }
    var cards = this.$el.find("#payment-cards button");
    if(cards && cards.length == 1){
      this.paymentAlert.html("支付方式不能为空。");
      this.paymentAlert.show();
      return;
    }
    var address = contacts[0];
    var phone = contacts[1].replace(" ","");
    var currentOrder = localOrders;
    var mealId = form.data("meal");
    var delivery_fee = this.$el.find("#order .delivery").data("value");
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
        alert(result.responseText);
        reloadUrl("/user/me","#myorder");
      },error : function(model, err){
        alert(err.responseText);
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
        alert(result.responseText);
        if(location.href.indexOf("host")==-1){
          reloadUrl("/user/me", "#myorder");
        }else{
          reloadUrl("/host/me","#myorder");
        }
      },error : function(model, err){
        alert(err.responseText);
      }
    })
  }
});

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
  switch(modual){
    case "thumbnail":
      filename = "thumbnail"
      break;
    case "license":
      filename = "license";
      break;
    case "story":
      filename = "story";
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
  var alert = error_container.find(".alert");
  alert.hide();
  var files = $("#myinfo input[name='story-pic']")[0].files;
  var file = files[0];
  if(!files || files.length==0){
    alert.html("please upload a file first");
    alert.show();
    return;
  }
  uploadImage("story",file,function(url){
    $("#myinfo .story .fileinput-preview").data("src", url);
    alert.html("厨师照片更新完成");
    alert.show();
  },function(err){
    alert.html(err);
    alert.show();
  });
}

function uploadLicense(e){
  var $this = $(e.currentTarget);
  var error_container = $($this.data("error-container"));
  var alert = error_container.find(".alert");
  alert.hide();
  var files = $("#myinfo .license input[type='file']")[0].files;
  var file = files[0];
  if(!files || files.length==0){
    alert.html("please upload a file first");
    alert.show();
    return;
  }
  uploadImage("license",file,function(url){
    $("#myinfo .license .fileinput-preview").data("src",url);
    alert.html("执照更新完成");
    alert.show();
  },function(err){
    alert.html(err);
    alert.show();
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