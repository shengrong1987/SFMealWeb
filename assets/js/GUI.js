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
    };
  } else {
    return 'not iOS';
  };
}

function initAutoComplete(googleService){
  var componentForm = {
    "street_number" : ["#streetInput","input[name='street']"],
    "route" : ["#streetInput","input[name='street']"],
    "locality" : ["#cityInput","input[name='city']"],
    "postal_code" : ["#postalInput","input[name='zipcode']"],
    "administrative_area_level_2" : [],
    "administrative_area_level_1" : ["input[name='state']"]
  };
  $.getJSON("/files/zipcode.json", function(zipCodeToArea) {
    var options = {
      componentRestrictions: {country: 'us'},
      type: ['address']
    }

    var autocomplete;
    var autoCompleteEle = ["#streetInput", ".location input", ".delivery-center input", "#paymentInfoView input[name='street']","#contactInfoView input[name='street']"];

    autoCompleteEle.forEach(function (eles) {
      if ($(eles).length) {
        $(eles).toArray().forEach(function (ele) {
          autocomplete = new googleService["maps"]["places"].Autocomplete(ele, options);
          geolocate(autocomplete);
          autocomplete.addListener('place_changed', function () {
            var place = this["getPlace"]();
            if(!place["geometry"]) {
              window.alert("No details available for input: '" + place.name + "'");
              return;
            }
            for (var key in componentForm) {
              var formContainer = $(ele).closest('form');
              var components = componentForm[key];
              components.forEach(function (component) {
                formContainer.find(component).val("");
                formContainer.find(component).attr("disabled", false);
              });
            }
            // Get each component of the address from the place details
            // and fill the corresponding field on the form.
            for (var i = 0; i < place["address_components"].length; i++) {
              var addressType = place["address_components"][i].types[0];
              if (componentForm[addressType]) {
                var val = place["address_components"][i]["long_name"];
                if (addressType === "postal_code") {
                  Object.keys(zipCodeToArea).forEach(function (area) {
                    var zipcodes = zipCodeToArea[area];
                    if (zipcodes.indexOf(val) !== -1) {
                      $(ele).parent().parent().find(".area input").val(area);
                    }
                  })
                } else if (addressType === "administrative_area_level_2") {
                  $(ele).parent().parent().find(".area").data("county", val);
                }else if(addressType === "administrative_area_level_1"){
                  val = place["address_components"][i]["short_name"];
                }
                formContainer = $(ele).closest('form');
                componentForm[addressType].forEach(function (selector) {
                  var inputToFill = formContainer.find(selector);
                  if (inputToFill.length) {
                    var oldValue = inputToFill.val();
                    var newValue = oldValue ? oldValue + " " + val : val;
                    inputToFill.val(newValue);
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

function makeAToast(msg, type){
  type = type || 'warning';
  if(typeof toastr[type] === 'function'){
    toastr[type](msg);
  }
}

function showErrorMsg(err){
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

function getCountyInfo(){
  var county = readCookie("county");
  if(county){
    var $citySelector = $("#citySelector");
    var countyName = $citySelector.find("ul a[value='" + county  + "']").text();
    var $citySelectorText = $citySelector.find(">a");
    $citySelectorText.html(countyName + "&nbsp;<span class='caret'></span>");
    $citySelectorText.attr("value",county);
  }
  return county || "San Francisco County";
}

//UI Components setup
function stepContainer(){
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
/*
* Order GUI
*
*/
var localOrders = {};
var localCoupon = {};
var localPoints = false;
//load previous order from cookies
function loadOrder(fromCache){
  refreshOrderList(fromCache);
  loadCoupon(fromCache);
  loadPoints(fromCache);
  refreshMenu();
}

function refreshOrderList(fromCache, isTrigger){
  if(isTrigger){
    refreshCollapseBtn(false);
  }
  $("#order").find(".item").each(function(){
    var dishId = $(this).data("id");
    if(fromCache){
      var localDish = readCookie(dishId);
      if(localDish){
        localDish = JSON.parse(localDish);
      }else{
        localDish = {number : 0, preference : []};
      }
      localOrders[dishId] = localDish;
      $(this).data("left-amount",$(this).data("left-amount") - localOrders[dishId].number);
      refreshOrder(dishId, isTrigger);
    }else{
      localOrders[dishId] = {
        number : parseInt($(this).find(".amount").data("value")),
        preference : $(this).data("preference")
      };
    }
  });
}

function loadPreference(){
  $("#order").find(".item").each(function(){
    var dishId = $(this).data("id");
      refreshPreference(dishId);
  });
}

function refreshPreference(id){
  var number = localOrders[id].number;
  var preferences = localOrders[id].preference;
  var preferenceBtn = $('[data-submenu][data-dish="' + id + '"]');
  preferenceBtn.data('value', jQuery.i18n.prop('the') + number + jQuery.i18n.prop('fen'));
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
  var item = $order.find(".item[data-id=" + id + "]");
  var alertView = $($order.data("err-container"));
  alertView.removeClass("hide");
  alertView.hide();
  localOrders[id] = localOrders[id] ? localOrders[id] : { number : 0, preference : [{ property : '', extra : 0}]};
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
  var serviceFee = 1;
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

function refreshCollapseBtn(initialize){
  var expandMenuBtn = $("#order").find("#expandMenuBtn");
  var collapseMenuBtn = $("#order").find("#collapseMenuBtn");
  if(initialize){
    collapseMenuBtn.toggle();
  }else{
    collapseMenuBtn.toggle();
    expandMenuBtn.toggle();
  }
}

//render order view
function refreshOrder(id, triggerExpand){
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

function tapController(){
  var tapName = location.hash;
  if(tapName && tapName !== ""){
    $("a[href='" + tapName + "']").tab('show');
  }
}

function setupDishSelector(){
  $("#myinfo").find(".dishes a").each(function(){
    if($(this).data("toggle")==="dropdown"){
      $(this).next().find("li").click(function(){

        //get selected value
        var selectedDishId = $(this).find("a").data("value");
        var dropBtn = $(this).parent().prev();

        //set dropdown button's value by selected value
        dropBtn.data("value",selectedDishId);

        //reset other dropdown buttons if selected value is the same as their current value
        var index = 0;
        $("#myinfo").find(".dishes a[data-toggle='dropdown']").each(function(){
          if(this !== dropBtn[0]){
            var otherDropBtn = $(this);
            var curValue = otherDropBtn.data("value");
            if(curValue === selectedDishId){
              if(index===0){
                var key = "firstDish";
              }else if(index===1){
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
  var $myinfo = $("#myinfo");
  var dishes = $myinfo.find(".dishes .signatureDish li");
  if(dishes){
    var count = dishes.length;
    var height = count * 50 < 50 ? 50 : count * 50;
    $myinfo.find(".dishes").css("height",height);
  }
}

function setupTooltip(){
  $('[data-toggle="tooltip"]').tooltip({
    trigger : 'hover focus'
  });
}

function resetDropdownMenu(target){
  var resetLabel = target.next().find(".dropdown-submenu.variation > a");
  resetLabel.each(function(){
    $(this).text(jQuery.i18n.prop($(this).data('variation')));
    $(this).attr("value", $(this).data('variation'));
  });
}

function setupDropdownMenu(){
  var $dropdownMenu = $('[data-toggle="dropdown"][data-selected="true"]').next().find("li a");
  $dropdownMenu.off("click");
  $dropdownMenu.click(function(){
    if($(this).attr('disabled')){
      return;
    }
    var text = $(this).text();
    var value = $(this).attr("value") || $(this).data("value");
    var data = $(this).data();
    var parent = $(this).closest('.dropdown-menu').prev();
    if(!value){
      return;
    }
    if(data){
      Object.keys(data).forEach(function(key){
        parent.data(key, data[key]);
      });
    }
    parent.html(text);
    parent.attr("value",value);
    parent.trigger("change");
  });
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
  setupInputMask();
  refreshCollapseBtn(true);
  setupSwitchButton({
    onText : "Yes",
    offText : "No"
  });
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
  $('[data-submenu][data-selected="true"]').next().find("li a").on("click", function(){
    if($(this).attr('disabled')){
      return;
    }
    var text = $(this).text();
    var value = $(this).attr("value") || $(this).data("value");
    var parent = $(this).closest('.dropdown-menu').prev();
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
  $('#transaction_container').mixItUp({
    pagination: {
      limit: 20,
      pagerClass : 'btn btn-mixitup'
    },load: {
      sort: 'created:desc' /* default:asc */
    },layout : {
      display : 'block'
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
        if(requiredImg && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png' && ext !=='gif'&& ext !=='pdf'){
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
        if(requiredImg && ext !== 'jpeg' && ext !== 'png' && ext !== 'jpg'){
          return jQuery.i18n.prop('strictImageTypeRequire');
        }
      }
    }
  });
}

function setupInputMask(){
  $("input[type='tel']").mask("(000)000-0000");
}

function setupSwitchButton(){
  $("[data-toggle='switch-button']").bootstrapSwitch();
}

function setupCountrySelector(){
  $('.flagstrap').flagStrap({
    onSelect : function(value){
      $('.flagstrap').data('selected-country', value);
    },
    buttonType : 'btn-red'
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

      if(typeof userBarView !== 'undefined' && userBarView){
        userBarView.clearBadges();
        userBarView.getNotification();
      }

      loadPreference();

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
  if(typeof Stripe !== 'undefined'){
    // Stripe.setPublishableKey('pk_live_AUWn3rb2SLc92lXsocPCDUcw');
    Stripe.setPublishableKey('pk_test_ztZDHzxIInBmBRrkuEKBee8G');
  }
  setup();
});

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
});
