/**#
 * Created by shengrong on 11/16/15.
 */

/*
  HelperMethods
  - geoLocate : "get user's location and set bound" @params: autocomplete obj
  - browserVersion : "get user's browser version"
  - makeAToast : "show right top side notification" @params: msg, type('success', 'info', 'warning', 'danger')
  - getMsgFromError : "get display message from error"
  - toggleModal : "open/close modal"
  - dismissModal : "close modal"
  - reloadUrl : "reload url and tag"
  - search : "on user search handler"
  - createCookie : "create new cookie by name"
  - readCookie : "get cookie by name"
  - eraseCookie : "remove a cookie by name"
  - loadStripeJS : "load Stripe js"
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

  if( ios ) {
    if ( !standalone && safari ) {
      return 'browser';
    } else if ( standalone && !safari ) {
      return 'standalone';
    } else if ( !standalone && !safari ) {
      return 'uiwebview';
    }
  } else {
    return 'not iOS';
  }
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
  var modal = $(modalId);
  if(modal.hasClass('in')){
    modal.modal('hide');
    modal.removeData('bs.modal');
    modal.on('hidden.bs.modal',function(){
      modal.off('hidden.bs.modal');
      modal.on('loaded.bs.modal',function(){
        modal.off('loaded.bs.modal');
        modal.modal('show');
        if(cb){cb(target);}
      });
      modal.modal({remote: url});
    });
  }else{
    modal.removeData('bs.modal');
    modal.on('loaded.bs.modal',function(){
      modal.off('loaded.bs.modal');
      modal.modal('show');
      if(cb){cb(target);}
    });
    modal.modal({remote: url});
    modal.modal('show');
  }
}

//Modal dismiss
function dismissModal(event, cb){
  var modal = $("#myModal");
  if(cb){
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
    location.reload();
  }else{
    location.reload();
  }
  return false;
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
  refreshMenu();
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
  if(isTrigger){
    updateCollapseBtn(false);
  }
  $("#order").find(".item").each(function(){
    var dishId = $(this).data("id");
    if(fromCache){
      var localDish = readCookie(dishId);
      if(localDish){
        localDish = JSON.parse(localDish);
      }else{
        localDish = {number : 0, preference : [], price : $(this).find(".price").attr("price")};
      }
      localOrders[dishId] = localDish;
      $(this).data("left-amount",$(this).data("left-amount") - localOrders[dishId].number);
      updateMenuView(dishId, isTrigger);
    }else{
      localOrders[dishId] = {
        number : parseInt($(this).find(".amount").data("value")),
        preference : $(this).data("preference"),
        price : $(this).find(".price").attr("price")
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
function updateMenuView(id, triggerExpand){
  var number = localOrders[id].number;
  var item = $("#order").find(".item[data-id=" + id + "]");
  var left = item.data("left-amount");
  item.find(".amount").html(number);
  var price = item.find(".price");
  var preference = localOrders[id].preference;
  if(preference && preference.length){
    var extra = preference.reduce(function(total, next){
      return total + next.extra;
    }, 0);
    price.data("extra", extra);
    if(extra > 0){
      price.html("$" + price.attr('value') + " ($" + extra + ")");
    }else{
      price.html("$" + price.attr('value'));
    }
  }else{
    price.data("extra", 0);
    price.html("$" + price.attr('value'));
  }
  var dishItem = $("#meal-detail-container").find(".dish[data-id='" + id + "']");
  if(number > 0){
    dishItem.find(".beforeOrder").hide();
    dishItem.find(".afterOrder").show();
    dishItem.find(".dish-number").val(number);
    item.addClass("success");
    item.show();
  }else{
    dishItem.find(".beforeOrder").show();
    dishItem.find(".afterOrder").hide();
    item.removeClass("success");
    if(triggerExpand){
      item.toggle();
    }else{
      item.hide();
    }
  }
  dishItem.find(".left-amount span").attr("value",left);
  dishItem.find(".left-amount span").html(left);
}

function refreshPreference(id){
  var number = localOrders[id].number;
  var preferences = localOrders[id].preference;
  var preferenceBtn = $('[data-submenu][data-dish="' + id + '"]');
  preferenceBtn.data("key", jQuery.i18n.prop('orderNo', number));
  preferenceBtn.data('value', number);
  if(number > 1){
    preferenceBtn.submenupicker('updateMenu', preferenceBtn);
  }
  if(preferences){
    preferences.forEach(function(preference, index){
      var props = preference.property;
      if(props){
        var propInArray = props.split(",");
        if(propInArray){
          propInArray.forEach(function(prop){
            console.log("index is: " + index, "prop: " + prop);
            var i = parseInt(index) + 1;
            var propertyLabel = preferenceBtn.next().find(".dropdown-submenu:nth-child(" + i + ") .variation a[value='" + prop + "']");
            var extra = propertyLabel.data("extra");
            var variationLabel = propertyLabel.closest(".dropdown-submenu.variation").find("a").first();
            if(variationLabel.length){
              variationLabel.attr("value", prop);
              variationLabel.text(prop + " + $" + extra);
            }
          })
        }
      }
    });
  }
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
    coupon = {};
    //set code and amount as key & value
  }
  localCoupon = coupon;
}

function loadPoints(fromCache){
  if(fromCache){
    var hasPoints = readCookie('points');
  }else{
    hasPoints = false;
    //set code and amount as key & value
  }
  localPoints = hasPoints;
}

//order food
function orderFood(id,number,initial){

  var dishItem = $("#meal-detail-container").find(".dish[data-id='" + id + "']");
  if(initial){
    if(number > 0){
      $(this).amountInput('add',dishItem.find("[data-toggle='amount-input']"));
    }else if(number < 0){
      $(this).amountInput('minus',dishItem.find("[data-toggle='amount-input']"));
    }
  }
  var $order = $("#order");
  var alertView = $($order.data("err-container"));
  alertView.removeClass("hide");
  alertView.hide();
  var item = $order.find(".item[data-id=" + id + "]");
  var price = parseInt(item.find(".price").attr("value"));
  localOrders[id] = localOrders[id] ? localOrders[id] : { number : 0, preference : [{ property : '', extra : 0}], price : price};
  localOrders[id].number += number;
  var preferenceBtn = $('[data-submenu][data-dish="' + id + '"]');
  preferenceBtn.data('value', jQuery.i18n.prop('the') + localOrders[id].number + jQuery.i18n.prop('fen'));
  var left = parseInt(item.data("left-amount"));
  if(number < 0){
    if(localOrders[id].number<0){
      localOrders[id].number = 0;
      return;
    }
    left++;
    localOrders[id].preference.pop();
    item.data("left-amount", left);
    if(localOrders[id].number >= 1){
      preferenceBtn.submenupicker('removeMenu', preferenceBtn);
    }else{
      resetDropdownMenu(preferenceBtn);
    }
  }else{
    if(left<=0 && number > 0){
      localOrders[id].number -= number;
      alertView.show();
      return;
    }
    left--;
    item.data("left-amount",left);
    var preferences = localOrders[id].preference;
    if(!preferences.length){
      preferences.push({ extra : 0, property : ""});
    }else{
      preferences.push(preferences[0]);
    }
    if(localOrders[id].number > 1){
      preferenceBtn.submenupicker('insertMenu', preferenceBtn);
    }
  }
  createCookie(id,JSON.stringify(localOrders[id]),1);
  updateMenuView(id);
  refreshMenu();
  setupDropdownMenu();
}

function applyCoupon(isApply, amount, code){
  //set localVar and cookie
  if(isApply){
    localCoupon = localCoupon || {};
    localCoupon[code] = amount;
    createCookie('coupon',JSON.stringify(localCoupon),5);
  }else{
    $(".coupon-code").val('');
    localCoupon = {};
    eraseCookie('coupon');
  }
  refreshMenu();
}

function applyPoints(isApply, amount){
  if(isApply){
    localPoints = amount;
    createCookie('points',localPoints,5);
  }else{
    localPoints = 0;
    eraseCookie('points');
  }
  refreshMenu();
}

//render menu view
var refreshMenu = function(){
  var numberOfItem = 0;
  for(var key in localOrders){
    var $meal = $("#meal-detail-container");
    if(localOrders[key].number===0){
      $meal.find(".dish[data-id=" + key + "]").find(".untake-order").hide('slow');
    }else{
      numberOfItem += localOrders[key].number;
      $meal.find(".dish[data-id=" + key + "]").find(".untake-order").show('slow');
    }
  }
  var subtotal = 0;
  var method = $("#method").find(".active").attr("value");
  var $order = $("#order");
  $order.find(".item").each(function(){
    var unitPrice = parseInt($(this).find(".price").attr("value"));
    subtotal += parseFloat($(this).find(".amount").text()) * unitPrice + parseInt($(this).find(".price").data("extra"));
  });
  $order.find(".subtotal").html("$" + subtotal.toFixed(2));
  $order.find(".subtotal").data("value", subtotal.toFixed(2));
  if(method === "delivery"){
    var delivery = $order.find(".delivery").data("value");
    $order.find(".deliveryOpt").show();
    $order.find(".pickupOpt").hide();
  }else{
    $order.find(".deliveryOpt").hide();
    $order.find(".pickupOpt").show();
    delivery = 0;
  }
  $(".delivery").text("$" + delivery.toFixed(2));
  var taxRate = $order.find(".tax").data("taxrate");
  var tax = parseFloat(subtotal * taxRate);
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
  var expandMenuBtn = $("#order").find("#expandMenuBtn");
  var collapseMenuBtn = $("#order").find("#collapseMenuBtn");
  if(initialize){
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
      $(steps[currentStep]).addClass('hide');
      $(steps[currentStep+1]).removeClass('hide');
    });
    $(steps[i]).find(".last-step").click(function(){
      var currentStep = parseInt($(this).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('hide');
      $(steps[currentStep-1]).removeClass('hide');
    });
  }
  return {
    nextStep : function(event){
      var steps = $(".step-container .step");
      var currentStep = parseInt($(event.target).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('hide');
      $(steps[currentStep+1]).removeClass('hide');
    },
    lastStep : function(event){
      var steps = $(".step-container .step");
      var currentStep = parseInt($(event.target).attr("data-step")) - 1;
      $(steps[currentStep]).addClass('hide');
      $(steps[currentStep-1]).removeClass('hide');
    }
  }
};

function resetDropdownMenu(target){
  var resetLabel = target.next().find(".dropdown-submenu.variation > a");
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
  var $footer = $('.footer');
  if($footer.length===0){
    return;
  }
  var headerHeight = $('.compact-banner').height() + $("#myUserBar").height() - 3;
  var footertotop = ($footer.position().top);
  var $floater = $('.floater');
  var fixedElementHeight = $floater.height();
  var scrollTop = $(document).scrollTop();

  if (scrollTop + fixedElementHeight > footertotop) {
  }else if (scrollTop > headerHeight){
    $floater.removeClass("static-floater");
    $floater.addClass("fix-floater");
    $floater.css('top', -20);
  }else{
    $floater.removeClass("fix-floater");
    $floater.addClass("static-floater");
  }
}
