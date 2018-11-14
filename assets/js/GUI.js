/**#
 * Created by shengrong on 11/16/15.
 */
(function($, viewport, global){
})(jQuery, ResponsiveBootstrapToolkit, window);
/*
  HelperMethods
  - geoLocate : "get user's location and set bound" @params: autocomplete obj
  - browserVersion : "get user's browser version"
  - makeAToast : "show right top side notification" @params: msg, type('success', 'info', 'warning', 'danger')
  - getMsgFromError : "get display message from error"
  - toggleModal : "open/close modal"
  - dismissModal : "close modal"
  - reloadUrl : "reload url and tag"
  - jumpTo : "scroll page to element with specific id"
  - search : "on user search handler"
  - createCookie : "create new cookie by name"
  - readCookie : "get cookie by name"
  - eraseCookie : "remove a cookie by name"
  - loadStripeJS : "load Stripe js"
  - isViewport : "xs,sm,md,lg,xl"

 */

var googleAPILoaded;
function geolocate(autocomplete) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google["maps"]["Circle"]({
        center: geolocation,
        radius: position.coords.accuracy
      });
      if(autocomplete){
        autocomplete["setBounds"](circle["getBounds"]());
      }
    });
  }
}

function browserVersion(){
  var standalone = window.navigator.standalone,
    userAgent = window.navigator.userAgent.toLowerCase(),
    safari = /safari/.test( userAgent ),
    ios = /iphone|ipod|ipad/.test( userAgent );

  if(userAgent.match(/MicroMessenger/i) && userAgent.match(/MicroMessenger/i)[0]==="micromessenger") {
    return 'uiwebview';
  }else{
    return '';
  }

  // if( ios ) {
  //   if ( !standalone && safari ) {
  //     return 'browser';
  //   } else if ( standalone && !safari ) {
  //     return 'standalone';
  //   } else if ( !standalone && !safari ) {
  //     return 'uiwebview';
  //   }
  // } else {
  //   return 'not iOS';
  // }
}

function makeAToast(msg, type){
  type = type || 'warning';
  if(typeof toastr[type] === 'function'){
    toastr[type](msg);
  }
}

function getMsgFromError(err){
  var responseJSON = err['responseJSON'];
  return responseJSON ? (responseJSON.responseText || responseJSON.summary) : err.responseText
}

//Modal open/switch
function toggleModal(event,cb){
  var target = event.currentTarget ? event.currentTarget : event;
  var url = $(target).data('href');
  var modalId = $(target).data('target');
  toggleModalUrl(url, modalId, target, cb);
}

function toggleModalUrl(url, modalId, target, cb){
  var modal = $(modalId);
  if(modal.hasClass('show')){
    modal.modal('hide');
    modal.removeData('bs.modal');
    modal.on('hidden.bs.modal',function(){
      utility.map = null;
      modal.off('hidden.bs.modal');
      modal.on('shown.bs.modal',function(){
        modal.off('shown.bs.modal');
        modal.modal('show');
        if(cb){cb(target);}
      });
      $(modalId+' .modal-content').load(url);
      modal.modal();
    });
  }else{
    modal.removeData('bs.modal');
    modal.on('shown.bs.modal',function(){
      modal.off('shown.bs.modal');
      modal.on('hidden.bs.modal',function(){
        utility.map = null;
        modal.off('hidden.bs.modal');
      });
      modal.modal('show');
      if(cb){cb(target);}
    });
    $(modalId +' .modal-content').load(url);
    modal.modal();
    modal.modal('show');
  }
}

//Modal dismiss
function dismissModal(event, cb){
  var modal = $("#myModal");
  if(_.isFunction(cb)){
    modal.on('hidden.bs.modal',cb);
  }
  modal.modal('hide');
  modal.removeData('bs.modal');
}

function reloadUrl(url, tag){
  var hash = location.hash;
  if(location.href.indexOf(url)===-1){
    location.href = url + tag;
  }else if(tag !== hash){
    location.href = url + tag;
  }else{
    location.reload();
  }
  return false;
}

function getPosition(element){
  var e = document.getElementById(element);
  var left = 0;
  var top = 0;

  do{
    left += e.offsetLeft;
    top += e.offsetTop;
  }while(e = e.offsetParent);

  return [left, top];
}

function jumpTo(id){
  // var coordinate = getPosition(id);
  if(!$("#" + id).length){
    return;
  }
  $("html,body").animate({
    scrollTop : $("#" + id).offset().top
  },1000)
  // window.scrollTo(coordinate[0],coordinate[1]);
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
        if (response.results.length === 0) {
          alert(jQuery.i18n.prop('zipcodeGeoError'));
          return;
        }
        var result = response.results[0];
        var county = result["address_components"][2]["long_name"];
        query += "&county=" + county;
        location.href = "/meal/search?" + query;
      }, error: function () {
        alert(jQuery.i18n.prop('notAvailable'));
      }
    });
  }else{
    query += "&county=" + county;
    location.href = "/meal/search?" + query;
  }
}

function createCookie(name, value, days) {
  var expires;

  if (_.isNumber(days)) {
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

var isStripeLoaded = false;
function loadStripeJS(cb){
  if(!isStripeLoaded){
    $('body').addClass("loading");
    isStripeLoaded = true;
    $.ajax({
      url: "https://js.stripe.com/v2/",
      dataType: 'script',
      async : true,
      defer : true,
      success : function(){
        $('body').removeClass("loading");
        Stripe.setPublishableKey('pk_live_AUWn3rb2SLc92lXsocPCDUcw');
        // Stripe.setPublishableKey('pk_test_ztZDHzxIInBmBRrkuEKBee8G');
        cb();
      },error : function(err){
        $('body').removeClass("loading");
        cb(err);
      }
    });
  }
}

function setCountyInfo(county){
  var $citySelector = $("#citySelector");
  var countyName = $citySelector.find("ul a[value='" + county  + "']").text();
  var $citySelectorText = $citySelector.find(">a");
  $citySelectorText.html(countyName + "&nbsp;<span class='caret'></span>");
  $citySelectorText.attr("value",county);
  createCookie("county", county, 1);
  location.hash = "";
  location.reload();
}


/*
* Order GUI
*
*/
var localOrders = {};
var localCoupon = {};
var localPoints = false;
//load previous order from cookies
function loadOrder(fromCache){
  updateOrderWindow(fromCache);
  loadCoupon(fromCache);
  loadPoints(fromCache);
  refreshCheckoutMenu();
  updateOrderPreview();
}

function loadPreference(){
  $("#order").find(".item").each(function(){
    var dishId = $(this).data("id");
    refreshPreference(dishId);
  });
}

/*
  update order window
  - collapseButton
  -
 */
function updateOrderWindow(fromCache, isTrigger){
  if(!!isTrigger){
    updateCollapseBtn(false);
  }
  $("#order").find(".item").each(function(){
    var _this = $(this);
    var dishId = $(this).data("id");
    if(fromCache){
      var localDish = readCookie(dishId);
      if(localDish){
        localDish = JSON.parse(localDish);
      }else{
        localDish = {number : 0, preference : [], price : $(this).find(".price").attr("value")};
      }
      localOrders[dishId] = localDish;
      var left = parseInt($(this).attr("data-left-amount") - parseInt(localOrders[dishId].number));
      var dishItems = $("#order").find(".dish[data-id='" + dishId + "']");
      dishItems.each(function(){
        $(this).find(".amount").val(localOrders[dishId].number);
        $(this).find(".amount").text(localOrders[dishId].number);
        _this.amountInput('update',$(this).find("[data-toggle='amount-input']"));
      })
      $(this).data("left-amount", left);
      updateMenuView(dishId);
    }else{
      localOrders[dishId] = {
        number : parseInt($(this).find(".amount").val()),
        preference : $(this).data("preference"),
        price : $(this).find(".price").attr("value")
      };
    }
  });
}

/*
 update menu view
 - quantity selection button
 - price update
 - quantity update
 */
function updateMenuView(id){
  var number = localOrders[id].number;
  var dishItems = $("#order").find(".item[data-id=" + id + "]:visible");
  dishItems.each(function(){
    var dishItem = $(this);
    var left = dishItem.data("left-amount");
    dishItem.find(".amount").val(number);
    // dishItem.find(".amount").text(number);
    if($("#myModal").hasClass('show')){
      dishItem.amountInput('update',dishItem.find("[data-toggle='amount-input']"));
    }
    if(number>0){
      dishItem.addClass("table-success");
    }else{
      dishItem.removeClass("table-success");
    }
    dishItem.find(".left-amount span").attr("value",left);
    dishItem.find(".left-amount span").html(left);
    var priceItem = dishItem.find(".price");
    var preference = localOrders[id].preference;
    var oldPrice = priceItem.attr("old-value");
    var price = priceItem.attr("value");
    if(preference && preference.length){
      var extra = preference.reduce(function(total, next){
        return total + next.extra;
      }, 0);
      priceItem.data("extra", extra);
      if(extra > 0){
        if(oldPrice){
          priceItem.html("$" + price + " <s>$" + oldPrice + "</s>" + " ($" + extra + ")");
        }else{
          priceItem.html("$" + price + " ($" + extra + ")");
        }
      }else{
        if(oldPrice){
          priceItem.html("$" + price + " <s>$" + oldPrice + "</s>");
        }else{
          priceItem.html("$" + price);
        }
      }
    }else{
      priceItem.data("extra", 0);
      if(oldPrice){
        priceItem.html("$" + price + " <s>$" + oldPrice + "</s>");
      }else{
        priceItem.html("$" + price);
      }
    }
  })
}

function refreshPreference(id){
  var preferenceView = $("#dishPreferenceView[data-id='" + id +  "']");
  if(!preferenceView.length){
    return;
  }
  var propertiesLabel = preferenceView.find(".properties");
  var numberInput = preferenceView.find(".amount");
  var amountInput = preferenceView.find(".amount-input");
  var priceLabel = preferenceView.find(".price");
  var price = priceLabel.data("price");
  var number = localOrders[id].number || 1;
  var preferences = localOrders[id].preference;
  var propertiesText = "";
  var item = $("#order").find(".item[data-id=" + id + "]");
  var max = item.find(".amount-input").data("max");
  if(_.isArray(preferences)){
    preferences.forEach(function(preference, index){
      var props = preference.property;
      var extra = preference.extra;
      if(props && props.length){
        var propInArray = props;
        if(_.isArray(propInArray)){
          propInArray.forEach(function(prop){
            var button = preferenceView.find("[data-property='" + prop.property + "'] button.active");
            if(button.length){
              button.parent().children().removeClass("active");
              button.addClass("active");
            }
            if(button.data("index")){
              if(propertiesText){
                propertiesText += " | ";
              }
              propertiesText += prop.property;
            }
          })
        }
      }
    });
  }
  amountInput.data("max",max);
  numberInput.val(number);
  numberInput.text(number);
  item.amountInput('update',item.find("[data-toggle='amount-input']"));
  propertiesLabel.text(propertiesText);
  priceLabel.text("$" + (price*number).toFixed(2));
}

function loadCoupon(fromCache){
  if(!!fromCache){
    var coupon = readCookie('coupon');
    if(coupon){
      coupon = JSON.parse(coupon);
    }else{
      coupon = {};
    }
  }else{
    coupon = {};
    //set code and amount as key & value
  }
  localCoupon = coupon;
}

function loadPoints(fromCache){
  if(!!fromCache){
    var hasPoints = readCookie('points');
  }else{
    hasPoints = false;
    //set code and amount as key & value
  }
  localPoints = hasPoints;
}

//order food
function orderFood(id,number,initial){
  var $order = $("#order");
  var item = $order.find(".item[data-id=" + id + "]");
  var prefs = item.data('prefs');
  orderFoodLogic(id, number, initial);
  if(prefs>0 && number>0){
    if(!$("#myModal").hasClass('show')) {
      var url = "/dish/" + id + "/preference";
      toggleModalUrl(url, "#myModal");
    }
  }
}

function orderFoodLogic(id, number, initial){

  var $order = $("#order");
  var item = $order.find(".item[data-id=" + id + "]:visible");
  if(!initial){
    if(number > 0){
      $(this).amountInput('add',item.find("[data-toggle='amount-input']"));
    }else if(number < 0){
      $(this).amountInput('minus',item.find("[data-toggle='amount-input']"));
    }
  }
  var price = parseFloat(item.find(".price").attr("price"));
  localOrders[id] = localOrders[id] ? localOrders[id] : { number : 0, preference : [{ property : '', extra : 0}], price : price};
  localOrders[id].number += number;
  var left = parseInt(item.data("left-amount"));
  var amount = parseInt(item.find(".amount").val());
  if(number < 0){
    if(amount > 0){
      left++;
      localOrders[id].preference.pop();
      item.data("left-amount", left);
    }else{
      localOrders[id].number -= number;
    }
  }else{
    if(left<=0 && number > 0){
      localOrders[id].number -= number;
      makeAToast(jQuery.i18n.prop("dishSold"));
    }else{
      left--;
      item.data("left-amount",left);
      var preferences = localOrders[id].preference;
      var preferenceView = $("#dishPreferenceView[data-id='" + id +  "']");
      var prefObj = {};
      if(preferenceView && preferenceView.length){
        var properties = [];
        var extra = 0;
        var optionBtns = preferenceView.find("[data-prefType]");
        optionBtns.each(function(){
          var activeBtn = $(this).find("button.active");
          var prefType = $(this).data("preftype");
          var index = activeBtn.data("index");
          if(index){
            var p = activeBtn.data("property");
            var e = parseFloat(activeBtn.data("extra"));
            var t = prefType;
            properties.push({ property : p, preftype : t});
            extra += e;
          }
        })
        prefObj.property = properties;
        prefObj.extra = extra;
      }else{
        if(!preferences.length){
          prefObj.extra = 0;
          prefObj.property = [];
        }else{
          prefObj = preferences[preferences.length-1];
        }
      }
      preferences.push(prefObj);
    }
  }
  createCookie(id,JSON.stringify(localOrders[id]),1);
  updateMenuView(id);
  refreshCheckoutMenu();
  refreshPreference(id);
  setupDropdownMenu();
  updateOrderPreview();
}

function updateOrderPreview(){
  var orderPreviewListText = "";
  if(localOrders){
    Object.keys(localOrders).forEach(function(dishId){
      var dishTitle = $("#order .dishItem[data-id='" + dishId +"']").find("[data-title]").data("title");
      var order = localOrders[dishId];
      if(!order.number){
        return;
      }
      if(orderPreviewListText){
        orderPreviewListText += "\n";
      }
      orderPreviewListText += dishTitle + "x" + order.number;
      if(order.preference){
        var preferenceText = "";
        order.preference.forEach(function(p,index){
          preferenceText += "(";
          if(p.property){
            p.property.forEach(function(pro){
              if(preferenceText.charAt(preferenceText.length-1)!=="("){
                preferenceText += ",";
              }
              preferenceText+= pro.property;
            })
          }
          if(p.extra){
            preferenceText += "+$" + p.extra;
          }
          preferenceText += ")";
        })
      }
      orderPreviewListText += preferenceText;
    })
  }
  $("#orderPreviewBtn").attr('title', orderPreviewListText)
    .tooltip('_fixTitle')
    .tooltip('show');
}

function applyCoupon(isApply, amount, code){
  //set localVar and cookie
  if(!!isApply){
    localCoupon = localCoupon || {};
    localCoupon[code] = amount;
    createCookie('coupon',JSON.stringify(localCoupon),5);
  }else{
    $(".coupon-code").val('');
    localCoupon = {};
    eraseCookie('coupon');
  }
  refreshCheckoutMenu();
}

function applyPoints(isApply, amount){
  if(!!isApply){
    localPoints = amount;
    createCookie('points',localPoints,5);
  }else{
    localPoints = 0;
    eraseCookie('points');
  }
  refreshCheckoutMenu();
}

//render menu view
var refreshCheckoutMenu = function(){
  var numberOfItem = 0;
  var subtotal = 0;
  var method = $("#method").find(".active").attr("value");
  var $order = $("#order");
  var _dishes = [];
  $order.find(".item:visible").each(function(){
    var dishId = $(this).data("id");
    if(_dishes.includes(dishId)){
      return;
    }else{
      _dishes.push(dishId);
    }
    var unitPrice = parseFloat($(this).find(".price").attr("value"));
    var amount = parseInt($(this).find(".amount").val());
    var _subtotal = amount * unitPrice + parseFloat($(this).find(".price").data("extra"))
    if(_subtotal > 0){
      numberOfItem+=amount;
    }
    subtotal += _subtotal;
  });
  $order.find(".subtotal").html("$" + subtotal.toFixed(2));
  $order.find(".subtotal").data("value", subtotal.toFixed(2));
  if(method === "delivery"){
    var delivery = parseFloat($order.find(".delivery").data("value"));
    $order.find(".deliveryOpt").show();
    $order.find(".pickupOpt").hide();
  }else{
    $order.find(".deliveryOpt").hide();
    $order.find(".pickupOpt").show();
    delivery = 0;
  }
  $(".delivery").text("$" + delivery);
  var taxRate = $order.find("[data-taxrate]").data("taxrate");
  // var tax = parseFloat(subtotal * taxRate);
  var tax = 0;
  var serviceFee = 0;
  $order.find(".tax").text(" $" + tax.toFixed(2));
  var coupons = Object.keys(localCoupon);
  var $orderTotal = $order.find(".total");
  if(coupons.length > 0){
    $("#applyCouponBtn").hide();
    $("#disApplyCouponBtn").show();
    $order.find(".coupon-code").val(coupons[0]);
    var discount = localCoupon[coupons[0]];
    var total = subtotal+delivery+tax-discount;
    if(total < 0){total = 0;}
    total = (total + serviceFee).toFixed(2);
    $orderTotal.data("value",total);
    $orderTotal.html(" $" + total + "( -$" + discount.toFixed(2) + " )");
    $("#meal-confirm-container").find(".total").text(" $" + total + "( -$" + discount.toFixed(2) + " )");
  }else{
    $("#applyCouponBtn").show();
    $("#disApplyCouponBtn").hide();
    total = (subtotal+delivery+tax+serviceFee).toFixed(2);
    $orderTotal.data("value",(subtotal+delivery+tax+serviceFee).toFixed(2));
    $orderTotal.html(" $" + (subtotal+delivery+tax+serviceFee).toFixed(2));
    $("#meal-confirm-container").find(".total").text(total);
  }
  if(localPoints){
    discount = localPoints/10;
    $("#applyPointsBtn").hide();
    $("#disApplyPointsBtn").show();
    total = subtotal+delivery+tax-discount;
    if(total < 0){total = 0;}
    total = (total + serviceFee).toFixed(2);
    $orderTotal.data("value",total);
    $orderTotal.html(" $" + total + "( -$" + discount.toFixed(2) + " )");
    $("#meal-confirm-container").find(".total").text(" $" + total + "( -$" + discount.toFixed(2) + " )");
  }else{
    $("#applyPointsBtn").show();
    $("#disApplyPointsBtn").hide();
  }
  refreshCart(total, numberOfItem);
};

function refreshCart(subtotal, numberOfItem){
  var shoppingCart = $("#shoppingCartView");
  shoppingCart.find(".total-preview").text(subtotal);
  shoppingCart.find(".total-preview").data('subtotal', subtotal);
  shoppingCart.find(".order-preview").text(numberOfItem);
  shoppingCart.find(".order-preview").data('item',numberOfItem);
}

function updateCollapseBtn(initialize){
  var orderEle = $("#order");
  var expandMenuBtn = orderEle.find("#expandMenuBtn");
  var collapseMenuBtn = orderEle.find("#collapseMenuBtn");
  if(!!initialize){
    collapseMenuBtn.toggle();
  }else{
    collapseMenuBtn.toggle();
    expandMenuBtn.toggle();
  }
}

//UI Components setup
var setupStepContainer = function(){
  var steps = $(".step-container .step");
  var count = steps.length;
  for( var i=0; i < count ; i++){
    $(steps[i]).find(".next-step").click(function(){
      var currentStep = parseInt($(this).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('d-none');
      $(steps[currentStep+1]).removeClass('d-none');
    });
    $(steps[i]).find(".last-step").click(function(){
      var currentStep = parseInt($(this).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('d-none');
      $(steps[currentStep-1]).removeClass('d-none');
    });
  }
  return {
    nextStep : function(event){
      var steps = $(".step-container .step");
      var currentStep = parseInt($(event.target).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('d-none');
      $(steps[currentStep+1]).removeClass('d-none');
    },
    lastStep : function(event){
      var steps = $(".step-container .step");
      var currentStep = parseInt($(event.target).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('d-none');
      $(steps[currentStep-1]).removeClass('d-none');
    }
  }
};

function resetDropdownMenu(target){
  var resetLabel = target.next().find("[data-layer='1'].variation > a");
  resetLabel.each(function(){
    $(this).text(jQuery.i18n.prop($(this).data('variation')));
    $(this).attr("value", $(this).data('variation'));
  });
}

function setupWechat(imgSrc, title, desc){
  var gm_ua = navigator.userAgent.toLowerCase();
  if(gm_ua.match(/MicroMessenger/i) && gm_ua.match(/MicroMessenger/i)[0]==="micromessenger") {
    if(imgSrc){
      $('body').prepend('<div style="overflow:hidden;width:0px;height:0px;margin:0 auto;position:absolute;top:-800px;"><img src="' + imgSrc + '"></div>');
    }
    if(title){
      document.title = title;
    }
    var domain = location.href.split('#')[0];
    var res = encodeURIComponent(domain);
    $.ajax({
      url: "/auth/wechatSignature?url=" + res,//  此处url请求地址需要替换成你自己实际项目中服务器数字签名服务地址
      type: 'get'
    }).done(function(r) {
      // 返回了数字签名对象
      console.log(r);
      // 开始配置微信JS-SDK
      wx.config({
        debug: false,
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
      wx.error(function(){
        console.log("error");
        // The callback function of error API will be executed if config authentication fails. If authentication failure is due to an expired signature, the detailed error information can be viewed by enabling the debugging mode within config API, or via the returned res parameter. The signature can be updated here for the SPA.

      });
    //
    });
  } else {
    // not wechat browser
  }
}

function enterDishPreference(target){
  var preference = $(target).data("preference");
  var container = $("#preferenceTable").find("tbody");
  container.empty();
  preference.forEach(function(pre, index){
    var element = "<tr><th>$index</th><td>$extra</td><td>$preference</td></tr>";
    element = element.replace("$index", index+1).replace("$extra", "$" + pre.extra.toFixed(2)).replace("$preference",pre.property);
    container.append(element);
  })
}

function enterHostInfo(target){
  var hostId = $(target).data("host");
  var isUpdating = $(target).data("updating");
  var bank_form = $("#bankView").find("form");
  bank_form.data("host",hostId);
  bank_form.data("updating",isUpdating);
}

function updateScroll(){
  if($(document).scrollTop() > 150) {
    $(".nav-sticky").addClass("nav-stick-top");
  }else{
    $(".nav-sticky").removeClass("nav-stick-top");
  }
  var $footer = $('.footer');
  if($footer.length===0){
    return;
  }
  // var headerHeight = $('.compact-banner').height() + $("#myUserBar").height() - 3;
  var headerHeight = 56 - 3;
  var footertotop = ($footer.position().top);
  var $floater = $('.floater');
  var fixedElementHeight = $floater.height();
  var scrollTop = $(document).scrollTop();

  if(location.pathname === "/"){
    if(!isViewport('xs') && !isViewport('sm')){
      if (scrollTop + fixedElementHeight > footertotop) {
      }else if (scrollTop > headerHeight){
        $floater.removeClass("static-floater");
        $floater.addClass("fix-floater");
        $floater.removeClass('navbar-transparent').removeClass('bg-faded').addClass('navbar-light').removeClass('navbar-dark').addClass('bg-light');
        // $floater.css('top', -20);
      }else{
        $floater.removeClass("fix-floater");
        $floater.addClass('navbar-transparent').addClass('bg-faded').removeClass('navbar-light').addClass('navbar-dark').removeClass('bg-light');
        $floater.addClass("static-floater");
      }
    }
  }else{
    if(isViewport('lg') || isViewport('xl')){
      if (scrollTop + fixedElementHeight > footertotop) {
      }else if (scrollTop > (headerHeight+150)){
        $floater.removeClass("static-floater");
        $floater.addClass("fix-floater");
        $floater.removeClass('navbar-transparent').removeClass('bg-faded').addClass('navbar-light').removeClass('navbar-dark').addClass('bg-light');
        // $floater.css('top', -20);
      }else{
        $floater.removeClass("fix-floater");
        $floater.addClass('navbar-transparent').addClass('bg-faded').removeClass('navbar-light').addClass('navbar-dark').removeClass('bg-light');
        $floater.addClass("static-floater");
      }
    }
  }
}

function isViewport( alias ) {
  return $('.device-' + alias).css('display') !== 'none';
}

function removeHash () {
  history.pushState("", document.title, window.location.pathname
    + window.location.search);
}
