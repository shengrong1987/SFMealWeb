/**#
 * Created by shengrong on 11/16/15.
 */

//utility

var googleAPILoaded;
function geolocate(autocomplete) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      if(autocomplete){
        autocomplete.setBounds(circle.getBounds());
      }
    });
  }
}
function initAutoComplete(){
  var componentForm = {
    "street_number" : ["#streetInput"],
    "route" : ["#streetInput"],
    "locality" : ["#cityInput"],
    "postal_code" : ["#postalInput"],
    "administrative_area_level_2" : []
  };
  $.getJSON("/files/zipcode.json", function(zipCodeToArea) {
    var options = {
      componentRestrictions: {country: 'us'},
      type: ['address']
    }

    var autocomplete;
    var autoCompleteEle = ["#streetInput", ".location input", ".delivery-center input"];

    autoCompleteEle.forEach(function (eles) {
      if ($(eles).length) {
        $(eles).toArray().forEach(function (ele) {
          autocomplete = new google.maps.places.Autocomplete(ele, options);
          geolocate(autocomplete);
          autocomplete.addListener('place_changed', function () {
            var place = this.getPlace();
            if (!place.geometry) {
              window.alert("No details available for input: '" + place.name + "'");
              return;
            }
            for (var key in componentForm) {
              var components = componentForm[key];
              components.forEach(function (component) {
                $(component).val("");
                $(component).attr("disabled", false);
              });
            }
            // Get each component of the address from the place details
            // and fill the corresponding field on the form.
            for (var i = 0; i < place.address_components.length; i++) {
              var addressType = place.address_components[i].types[0];
              if (componentForm[addressType]) {
                var val = place.address_components[i].long_name;
                if (addressType == "postal_code") {
                  Object.keys(zipCodeToArea).forEach(function (area) {
                    var zipcodes = zipCodeToArea[area];
                    if (zipcodes.indexOf(val) != -1) {
                      $(ele).parent().parent().find(".area input").val(area);
                    }
                  })
                } else if (addressType == "administrative_area_level_2") {
                  $(ele).parent().parent().find(".area").data("county", val);
                }
                componentForm[addressType].forEach(function (selector) {
                  if ($(selector).length > 0) {
                    $(selector).val($(selector).val() + " " + val);
                  }
                });
              }
            }
          });
        });
      }
    });
  });
}

//Modal open/switch
function toggleModal(event,cb){
  var target = event.currentTarget?event.currentTarget:event;
  var url = $(target).data('href');
  var modalId = $(target).data('target');
  var modal = $(modalId);
  if(modal.hasClass('in')){
    modal.modal('hide');
    modal.removeData('bs.modal');
    modal.on('hidden.bs.modal',function(){
      modal.off('hidden.bs.modal');
      modal.on('loaded.bs.modal',function(){
        modal.off('loaded.bs.modal');
        modal.modal('show');
        if(cb){
          cb(event);
        }
      });
      modal.modal({remote: url});
    });
  }else{
    modal.removeData('bs.modal');
    modal.on('loaded.bs.modal',function(){
      modal.off('loaded.bs.modal');
      modal.modal('show');
      if(cb){
        cb(event);
      }
    });
    modal.modal({remote: url});
    modal.modal('show');
  }
}

//Modal dismiss
function dismissModal(cb){
  var modal = $("#myModal");
  if(cb){
    modal.on('hidden.bs.modal',cb);
  }
  modal.modal('hide');
  modal.removeData('bs.modal');
}

function reloadUrl(url, tag){
  var hash = location.hash;
  if(location.href.indexOf(url)==-1){
    location.href = url + tag;
  }else if(tag != hash){
    location.href = url + tag;
    location.reload();
  }else{
    location.reload();
  }
  return false;
}

function getZipCode(){
  var zip = $(".zipCode").val();
  var isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zip);
  if(isValidZip){
    zip = zip.match(/(^\d{5}$)|(^\d{5}-\d{4}$)/)[0];
  }else{
    zip = undefined;
  }
  return zip;
}

function getCountyInfo(){
  var county = readCookie("county");
  if(county){
    var countyName = $("#citySelector ul a[value='" + county  + "']").text();
    $("#citySelector>a").html(countyName + "&nbsp;<span class='caret'></span>");
    $("#citySelector>a").attr("value",county);
  }
  return county || "San Francisco County";
}

//UI Components setup
function stepContainer(){
  var stepsContainer = $(".step-container");
  var steps = $(".step-container .step");
  var count = steps.length;
  for( var i=0; i < count ; i++){
    $(steps[i]).find(".next-step").click(function(){
      var currentStep = parseInt($(this).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('hide');
      $(steps[currentStep+1]).removeClass('hide');
    });
    $(steps[i]).find(".last-step").click(function(){
      var currentStep = parseInt($(this).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('hide');
      $(steps[currentStep-1]).removeClass('hide');
    });
  }
}

function nextStep(event){
  var steps = $(".step-container .step");
  var currentStep = parseInt($(event.target).attr("data-step")) - 1;
  $(steps[currentStep]).addClass('hide');
  $(steps[currentStep+1]).removeClass('hide');
}

function lastStep(event){
  var steps = $(".step-container .step");
  var currentStep = parseInt($(event.target).attr("data-step")) - 1;
  $(steps[currentStep]).addClass('hide');
  $(steps[currentStep-1]).removeClass('hide');
}

function enterHostInfo(event){
  var hostId = $(event.target).data("host");
  var isUpdating = $(event.target).data("updating");
  var bank_form = $("#bankView form");
  bank_form.data("host",hostId);
  bank_form.data("updating",isUpdating);
}


function enterAddressInfoFromOrder(event){
  var target = $(event.target);
  var id = target.data("id");
  var address_form = $("#address-form");
  address_form.attr("data-id",id);
  address_form.find("#new_title").removeClass("hide");
}

function enterAddressInfo(event){
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
}


//on user search action - redirect
function search(target, isRegular){
  var searchContainer = $(target).parent();
  var keyword = searchContainer.find("input[name='keyword']").val() || '';
  var zip = searchContainer.find("input[name='zipcode']").val() || '';
  var county = getCountyInfo();
  var query = "keyword=" + keyword;
  //check zip's county
  if(zip && !isRegular) {
    query += "&zip=" + zip;
    $.ajax({
      url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURI(zip)
      + "&sensor=false&language=en",
      success: function (response) {
        if (response.results.length == 0) {
          alert(jQuery.i18n.prop('zipcodeGeoError'));
          return;
        }
        var county = response.results[0].address_components[2]["long_name"];
        query += "&county=" + county;
        location.href = "/meal/search?" + query;
      }, error: function (err) {
        alert(jQuery.i18n.prop('notAvailable'));
      }
    });
  }else{
    query += "&county=" + county;
    location.href = "/meal/search?" + query;
  }
}
/*
* Order GUI
*
*/
var localOrders = {};
var localCoupon = {};
//load previous order from cookies
function loadOrder(fromCahce){
  $("#order .item").each(function(){
    var dishId = $(this).data("id");
    if(fromCahce){
      var localDish = readCookie(dishId);
      if(localDish){
        localDish = JSON.parse(localDish);
      }else{
        localDish = {number : 0, preference : { property : '', extra : 0}};
      }
      localOrders[dishId] = localDish;
      $(this).data("left-amount",$(this).data("left-amount") - localOrders[dishId].number);
      refreshOrder(dishId);
    }else{
      localOrders[dishId] = { number : $(this).find(".amount").data("value")};
    }
  });
  loadCoupon(fromCahce);
  refreshMenu();
}

function loadCoupon(fromCache){
  if(fromCache){
    var coupon = readCookie('coupon');
    if(coupon){
      coupon = JSON.parse(coupon);
    }else{
      coupon = {};
    }
  }else{
    var coupon = {};
    //set code and amount as key & value
  }
  localCoupon = coupon;
}

//order food
function orderFood(id,number){
  var item = $("#order .item[data-id=" + id + "]");
  var alertView = $($("#order").data("err-container"));
  alertView.removeClass("hide");
  alertView.hide();
  localOrders[id] = localOrders[id] ? localOrders[id] : { number : 0, preference : { property : '', extra : 0}};
  localOrders[id].number += number;
  if(number < 0){
    if(localOrders[id].number<0){
      localOrders[id].number = 0;
      return;
    }
    item.data("left-amount", item.data("left-amount") + 1);
  }else{
    var left = item.data("left-amount");
    if(left<=0 && number > 0){
      localOrders[id].number -= number;
      alertView.show();
      return;
    }
    left -= number;
    item.data("left-amount",left);
  }
  createCookie(id,JSON.stringify(localOrders[id]),1);
  refreshOrder(id);
  refreshMenu();
}

function applyCoupon(isApply, amount, code){
  //set localVar and cookie
  if(isApply){
    localCoupon = localCoupon || {};
    localCoupon[code] = amount;
    createCookie('coupon',JSON.stringify(localCoupon),5);
  }else{
    localCoupon = {};
    eraseCookie('coupon');
  }
  refreshMenu();
}

//render menu view
var refreshMenu = function(){
  for(var key in localOrders){
    if(localOrders[key].number==0){
      $("#meal-detail-container .dish[data-id=" + key + "]").find(".untake-order").hide('slow');
    }else{
      $("#meal-detail-container .dish[data-id=" + key + "]").find(".untake-order").show('slow');
    }
  }
  var subtotal = 0;
  var method = $("#meal-confirm-container #method .active").attr("value");
  $("#order .item").each(function(){
    var unitPrice = parseInt($(this).find(".price").attr("value")) + parseInt($(this).find(".price").data("extra"));
    subtotal += parseFloat($(this).find(".amount").text()) * unitPrice;
  });
  $("#order .subtotal").html("$" + subtotal.toFixed(2));
  $("#order .subtotal").data("value", subtotal.toFixed(2));
  if(method == "delivery"){
    var delivery = $("#order .delivery").data("value");
    $("#order .deliveryOpt").show();
    $("#order .pickupOpt").hide();
  }else{
    $("#order .deliveryOpt").hide();
    $("#order .pickupOpt").show();
    delivery = 0;
  }
  $(".delivery").text("$" + delivery.toFixed(2));
  // var tax = parseFloat(subtotal * 0.0875);
  var tax = 0;
  var serviceFee = 1;
  $("#order .tax").text(" $" + tax.toFixed(2));
  var coupons = Object.keys(localCoupon);
  if(coupons.length > 0){
    $("#applyCouponBtn").hide();
    $("#disApplyCouponBtn").show();
    $("#order .coupon-code").val(coupons[0]);
    var discount = localCoupon[coupons[0]];
    var total = subtotal+delivery+tax-discount;
    if(total < 0){total = 0;}
    total = (total + serviceFee).toFixed(2);
    $("#order .total").data("value",total);
    $("#order .total").html(" $" + total + "( -$" + discount.toFixed(2) + " )");
    $("#meal-confirm-container .total").text(" $" + total + "( -$" + discount.toFixed(2) + " )");
  }else{
    $("#applyCouponBtn").show();
    $("#disApplyCouponBtn").hide();
    var total = (subtotal+delivery+tax+serviceFee).toFixed(2);
    $("#order .total").data("value",(subtotal+delivery+tax+serviceFee).toFixed(2));
    $("#order .total").html(" $" + (subtotal+delivery+tax+serviceFee).toFixed(2));
    $("#meal-confirm-container .total").text(total);
  }


}

//render order view
function refreshOrder(id){
  var item = $("#order .item[data-id=" + id + "]");
  var left = item.data("left-amount");
  item.find(".amount").html(localOrders[id].number);
  item.find(".preference").html("(" + localOrders[id].preference.property + ")");
  var extra = localOrders[id].preference.extra;
  var price = item.find(".price");
  if(extra > 0){
    price.data("extra", extra);
    price.html("$" + price.attr('value') + " + $" + extra);
  }
  $("#meal-detail-container .dish[data-id=" + id + "]").find(".left-amount span").attr("value",left);
  $("#meal-detail-container .dish[data-id=" + id + "]").find(".left-amount span").html(left);
}

function tapController(){
  var tapName = location.hash;
  if(tapName && tapName != ""){
    $("a[href='" + tapName + "']").tab('show');
  }
}

function setupDishSelector(){
  $("#myinfo .dishes a").each(function(){
    if($(this).data("toggle")=="dropdown"){
      $(this).next().find("li").click(function(){

        //get selected value
        var selectedDishId = $(this).find("a").data("value");
        var dropBtn = $(this).parent().prev();

        //set dropdown button's value by selected value
        dropBtn.data("value",selectedDishId);

        //reset other dropdown buttons if selected value is the same as their current value
        var index = 0;
        $("#myinfo .dishes a[data-toggle='dropdown']").each(function(){
          if(this!= dropBtn[0]){
            var otherDropBtn = $(this);
            var curValue = otherDropBtn.data("value");
            if(curValue == selectedDishId){
              var indexChar = "";
              if(index==0){
                key = "firstDish";
              }else if(index==1){
                key = "secondDish";
              }else{
                key = "thirdDish";
              }
              otherDropBtn.data("value","");
              otherDropBtn.html("<div style='width: 100px;display: inline-block;' data-toggle='i18n' data-key='" + key + "'></div><span class='caret'></span>");
            }
          }
          index++;
        });

      });
    }
  });
}

function adjustLayout(){
  var dishes = $("#myinfo .dishes .signatureDish li");
  if(dishes){
    var count = dishes.length;
    var height = count * 50 < 50 ? 50 : count * 50;
    $("#myinfo .dishes").css("height",height);
  }
}

function setupTooltip(){
  $('[data-toggle="tooltip"]').tooltip({
    trigger : 'hover focus'
  });
}

function setupDropdownMenu(){
  $('[data-toggle="dropdown"][data-selected="true"]').next().find("li a").off("click");
  $('[data-toggle="dropdown"][data-selected="true"]').next().find("li a").click(function(e){
    //e.preventDefault();
    if($(this).attr('disabled')){
      return;
    }
    var text = $(this).text();
    var value = $(this).attr("value") || $(this).data("value");
    var data = $(this).data();
    var parent = $(this).closest('.dropdown-menu').prev();
    var previousValue = parent.attr('value');
    if(!value){
      return;
    }
    if(data){
      Object.keys(data).forEach(function(key){
        parent.data(key, data[key]);
      });
    }
    parent.html(text + "&nbsp;<span class='caret'></span>");
    parent.attr("value",value);
    parent.trigger("change");
  });
}

function setupAutoComplete(){
  if(!googleAPILoaded){
    jQuery.ajax({
      url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyBwSdr10kQ9xkogbE34AyzwspjaifpaFzA&libraries=places&callback=initAutoComplete",
      dataType: 'script',
      async: true,
      defer : true,
      success : function(){
        googleAPILoaded = true;
      }
    });
  }else{
    initAutoComplete();
  }
}
function setup(){
  setupLanguage();
  tapController();
  stepContainer();
  getCountyInfo();
  loadOrder(true);
  setupTooltip();
  setupMixin();
  setupDishSelector();
  adjustLayout();
  setupDropdownMenu();
  setupSubmenu();
  setupLightBox();
  setupPopover();
  setupValidator();
  setupCountrySelector();
  setupSelector();
  // $(function(){
  //   var keyStop = {
  //     // 8: ":not(input:text, textarea, input:file, input:password)", // stop backspace = back
  //     13: "input:text, input:password", // stop enter = submit
  //
  //     end: null
  //   };
  //   $(document).bind("keydown", function(event){
  //     var selector = keyStop[event.which];
  //
  //     if(selector !== undefined && $(event.target).is(selector)) {
  //       event.preventDefault(); //stop event
  //     }
  //     return true;
  //   });
  // });
  $('.lazyload').each(function(){
    $(this).attr('src', $(this).data('src'));
  });
  $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });
}

function setupSelector(){
  $('[data-toggle="select"]').on('change', function(e){
    e.preventDefault();
    var val = $(this).find("option:selected").attr('value');
    $(this).attr('value', val);
  });
}

function setupSubmenu(){
  $('[data-submenu]').submenupicker();
  $('[data-submenu][data-selected="true"]').next().find("li a").on("click", function(e){
    if($(this).attr('disabled')){
      return;
    }
    var text = $(this).text();
    var value = $(this).attr("value") || $(this).data("value");
    var parent = $(this).closest('.dropdown-menu').prev();
    var previousValue = parent.attr('value');
    if(value){
      parent.attr("value",value);
      parent.html(text);
    }
    parent.trigger("change");
  })
}

function setupPopover(){
  $('[data-toggle="popover"]').popover();
}

function setupMixin() {
  $('#meal-container').mixItUp({
    pagination: {
      limit: 8,
      pagerClass : 'btn btn-mixitup'
    }
  });
}

function setupLightBox(){
  $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox({
      left_arrow_class : ".glyphicon-chevron-left .fa .fa-arrow-left",
      right_arrow_class : ".glyphicon-chevron-right .fa .fa-arrow-right"
    });
  });
}

function setupValidator(){
  $('[data-toggle="validator"]').validator({
    feedback : {
      success: "fa fa-check",
      error : "fa fa-remove"
    },
    custom : {
      wantsimage : function($el){
        var requiredImg = $el.data("wantsimage");
        var ext = $el[0].value.match(/\.(.+)$/)[1].toLowerCase();
        if(requiredImg && ext != 'jpg' && ext != 'jpeg' && ext != 'png' && ext !='gif'&& ext !='pdf'){
          return jQuery.i18n.prop('imageTypeRequire');
        }
      },strictimage : function($el){
        var requiredImg = $el.data("strictimage");
        var exts = $el[0].value.match(/\.(.+)$/);
        if(!exts){
          return "";
        }
        if(exts.length < 1){
          return jQuery.i18n.prop('strictImageTypeRequire');
        }
        var ext = exts[1].toLowerCase();
        if(requiredImg && ext != 'jpeg' && ext != 'png' && ext != 'jpg'){
          return jQuery.i18n.prop('strictImageTypeRequire');
        }
      }
    }
  });
  $("input[type='tel']").inputmask({"mask": "(999) 999-9999"});
}

function setupCountrySelector(){
  $('.flagstrap').flagStrap({
    onSelect : function(value, ele){
      $('.flagstrap').data('selected-country', value);
    },
    buttonType : 'btn-info'
  });
}

function setupLanguage(){
  var language = navigator.languages ? navigator.languages[0] : (window.navigator.userLanguage || window.navigator.language);
  jQuery.i18n.properties({
    name:'Message',
    path:'/locale/',
    mode:'both',
    language:language,
    checkAvailableLanguages: true,
    async: true,
    cache : true,
    callback: function() {

      $("[data-toggle='i18n']").each(function(){
        $(this).text(jQuery.i18n.prop($(this).data("key")));
        if($(this).data("error")){
          $(this).data("error", jQuery.i18n.prop($(this).data("key")));
        }
        if($(this).data("pattern-error") && $(this).data("pattern-key")){
          $(this).data("pattern-error", jQuery.i18n.prop($(this).data("pattern-key")));
        }
        if($(this).data("match-error") && $(this).data("match-key")){
          $(this).data("match-error", jQuery.i18n.prop($(this).data("match-key")));
        }
      });

      if(typeof userBarView != 'undefined' && userBarView){
        userBarView.clearBadges();
        userBarView.getNotification();
      }

      // We specified mode: 'both' so translated values will be
      // available as JS vars/functions and as a map

      // Accessing a simple value through the map
      // jQuery.i18n.prop('msg_hello');
      // // Accessing a value with placeholders through the map
      // jQuery.i18n.prop('msg_complex', 'John');
      //
      // // Accessing a simple value through a JS variable
      // alert(msg_hello +' '+ msg_world);
      // // Accessing a value with placeholders through a JS function
      // alert(msg_complex('John'));
    }
  });
}

$("document").ready(function(){
  if(typeof Stripe != 'undefined'){
    Stripe.setPublishableKey('pk_live_AUWn3rb2SLc92lXsocPCDUcw');
    // Stripe.setPublishableKey('pk_test_ztZDHzxIInBmBRrkuEKBee8G');
  }
  setup();
});

function setupWechat(imgSrc, title, desc){
  var gm_ua = navigator.userAgent.toLowerCase();
  if(gm_ua.match(/MicroMessenger/i)=="micromessenger") {
    if(imgSrc){
      $('body').prepend('<div style="overflow:hidden;width:0px;height:0px;margin:0 auto;position:absolute;top:-800px;"><img src="' + imgSrc + '"></div>');
    }
    if(title){
      document.title = title;
    }
    var domain = location.href.split('#')[0];
    var res = encodeURIComponent(domain);
    // res = 'api/wechat/signature?url='+ res;
    $.ajax({
      url: "/auth/wechatSignature?url=" + res,//  此处url请求地址需要替换成你自己实际项目中服务器数字签名服务地址
      type: 'get'
    }).done(function(r) {
      // 返回了数字签名对象
      console.log(r);
      // 开始配置微信JS-SDK
      wx.config({
        debug: true,
        appId: r.appid,
        timestamp: r.timestamp,
        nonceStr: r.nonceStr,
        signature: r.signature,
        jsApiList: [
          'onMenuShareTimeline',
          'onMenuShareAppMessage',
          'onMenuShareQQ',
          'onMenuShareWeibo',
          'hideMenuItems',
          'chooseImage'
        ]
      });
      wx.ready(function(){
        console.log("success");
        // The callback function of ready API will be executed after a successful config authentication, and each API calling must be done after the config API obtains a result. As config is an asynchronous operation, all relevant API calling must be put in the callback function if it needs to be called while the page loads. A user-initiated API call can be called directly without needing to be put in the callback function.
        wx.onMenuShareTimeline({
          title: title, // Sharing title
          link: location.href, // Sharing link
          imgUrl: imgSrc, // Sharing image URL
          success: function () {
            // Callback function executed after a user confirms sharing
          },
          cancel: function () {
            // Callback function executed after a user cancels sharing
          }
        });
        wx.onMenuShareAppMessage({
          title: title, // Sharing title
          desc: desc, // Sharing description
          link: location.href, // Sharing link
          imgUrl: imgSrc, // Sharing image URL
          type: '', // Sharing type, such as “music”, “video “ or “link”. It is “link” by default.
          dataUrl: '', // The data URL should be provided for items of type “music” or “video”. It is null by default.
          success: function () {
            // Callback function executed after a user confirms sharing
          },
          cancel: function () {
            // Callback function executed after a user cancels sharing
          }
        });
      });
      wx.error(function(res){
        console.log("error");
        // The callback function of error API will be executed if config authentication fails. If authentication failure is due to an expired signature, the detailed error information can be viewed by enabling the debugging mode within config API, or via the returned res parameter. The signature can be updated here for the SPA.

      });
    //
    });
  } else {
    // not wechat browser
  }
}

function createCookie(name, value, days) {
  var expires;

  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toGMTString();
  } else {
    expires = "";
  }
  document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
  var nameEQ = encodeURIComponent(name) + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name, "", -1);
}

$(window).on('hashchange', function() {
  tapController();
});

$(window).scroll(function () {
  if($('.footer').length==0){
    return;
  }
  var headerHeight = $('.compact-banner').height() + $("#myUserBar").height() - 3;
  var footertotop = ($('.footer').position().top);
  var footerHeight = $('.footer').height();
  var fixedElementHeight = $('.floater').height();
  var scrolltop = $(document).scrollTop();
  var difference = scrolltop-footertotop;

  // console.log("scrolling height: " + scrolltop);
  // console.log("header height: " + headerHeight);

  if (scrolltop + fixedElementHeight > footertotop) {
    // $('.floater').css('top', '');
    // $('.floater').css('top', 0);
    // $('.floater').css('bottom',  25);
    // $('.floater').removeClass("fix-floater");
    // $('.floater').addClass("static-floater");
  }else if (scrolltop > headerHeight){
    $('.floater').removeClass("static-floater");
    $('.floater').addClass("fix-floater");
    $('.floater').css('top', 25);
  }else{
    $('.floater').removeClass("fix-floater");
    $('.floater').addClass("static-floater");
  }
});
