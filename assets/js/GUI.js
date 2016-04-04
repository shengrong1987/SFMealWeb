/**#
 * Created by shengrong on 11/16/15.
 */

//utility

//Modal open/switch
function toggleModal(event,cb){
  var target = event.target?event.target:event;
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

function getCurrentCounty(){
  return $("#citySelector a").attr("value");
}

function reloadUrl(url, tag){
  if(location.href.indexOf(url)==-1){
    location.href = url + tag;
  }else{
    location.reload();
  }
  return false;
}

function getCountyInfo(){
  var county = readCookie("county");
  var county_value = readCookie("county-value");
  if(county){
    $("#citySelector>a").text(county);
    $("#citySelector>a").attr("value",county_value);
  }
  $('#citySelector [data-toggle="dropdown"]').on("click.after",function(){
    createCookie("county",$(this).text(),30);
    createCookie("county-value",$(this).attr("value"),30);
    //var search = location.search;
  });
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
function search(target){
  var keyword = $(target).prev().val();
  var county = getCurrentCounty();
  location.href = "/meal/search?keyword=" + keyword + "&county=" + county;
}
/*
* Order GUI
*
*/
var localOrders = {};
//load previous order from cookies
function loadOrder(fromCahce){
  $("#order .item").each(function(){
    var dishId = $(this).data("id");
    if(fromCahce){
      localOrders[dishId] = parseInt(readCookie(dishId)) || 0;
      $(this).data("left-amount",$(this).data("left-amount") - localOrders[dishId]);
      refreshOrder(dishId);
    }else{
      localOrders[dishId] = $(this).find(".amount").data("value");
    }
  });
  refreshMenu();
}

//order food
function orderFood(id,number){
  var item = $("#order .item[data-id=" + id + "]");
  var alertView = $($("#order").data("err-container"));
  alertView.removeClass("hide");
  alertView.hide();
  localOrders[id] = localOrders[id]?localOrders[id]:0;
  localOrders[id] += number;
  if(number < 0){
    if(localOrders[id]<0){
      localOrders[id]=0;
      return;
    }
    item.data("left-amount", item.data("left-amount") + 1);
  }else{
    var left = item.data("left-amount");
    if(left<=0 && number > 0){
      localOrders[id] -= number;
      alertView.show();
      return;
    }
    left -= number;
    item.data("left-amount",left);
  }
  createCookie(id,localOrders[id],1);
  refreshOrder(id);
  refreshMenu();
}

//render menu view
var refreshMenu = function(){
  for(var key in localOrders){
    if(localOrders[key]==0){
      $("#meal-detail-container .dish[data-id=" + key + "]").find(".take-order").html('点一份');
      $("#meal-detail-container .dish[data-id=" + key + "]").find(".untake-order").hide('slow');
    }else{
      $("#meal-detail-container .dish[data-id=" + key + "]").find(".take-order").html('再点一份');
      $("#meal-detail-container .dish[data-id=" + key + "]").find(".untake-order").show('slow');
    }
    var subtotal = 0;
    $("#order .item").each(function(){
      subtotal += parseFloat($(this).find(".amount").text()) * $(this).find(".price").attr("value");
    });
    $("#order .subtotal").html("餐费小计: $" + subtotal.toFixed(2));
    $("#order .subtotal").data("value", subtotal.toFixed(2));
    var delivery = 0;
    $("#order .total").data("value",(subtotal+delivery).toFixed(2));
    $("#order .total").html("合计: $" + (subtotal+delivery).toFixed(2));
    $("#meal-confirm-container .total").text("合计: $" + (subtotal+delivery).toFixed(2));
  }
}

//render order view
function refreshOrder(id){
  var item = $("#order .item[data-id=" + id + "]");
  var left = item.data("left-amount");
  item.find(".amount").html(localOrders[id]);
  $("#meal-detail-container .dish[data-id=" + id + "]").find(".left-amount span").attr("value",left);
  $("#meal-detail-container .dish[data-id=" + id + "]").find(".left-amount span").html(left);
}

function tapController(){
  var tapName = location.hash;
  if(tapName && tapName != ""){
    $("a[href='" + tapName + "']").tab('show');
  }
}

function addRemoveDish(meal_id, dish_id, remove){
  var method = remove ? "DELETE" : "POST"
  var dishSelector = $("#dish-selector");
  $.ajax({
    url : "/meal/" + meal_id + "/dishes/" + dish_id,
    type : method,
    success : function(){

    },
    error : function(err){
      dishSelector.find(".alert").show();
      dishSelector.find(".alert").html(err);
    }
  });
}

function dishListHandler(add,item,remoteData){
  var form = $("#edit-meal-form");
  var dishSelector = $("#dish-selector");
  var dishList = dishSelector.find("#dishList");
  var id = item.data("id");
  var meal_id = form.data("meal-id");
  dishList.find("li").each(function(){
    if($(this).data("id")==id){
      if(add){
        $(this).addClass("select");
        if(remoteData){
          addRemoveDish(meal_id,id,false);
        }
      }else{
        $(this).removeClass("select");
        item.remove();
        if(remoteData){
          addRemoveDish(meal_id,id,true);
        }
      }
    }
  });
}

function dishSelectorSetup(){
  var dishSelector = $("#dish-selector");
  var remoteData = $("#edit-meal-form").length > 0;
  if(dishSelector.length > 0){
    dishSelector.find("#dishList li").click(function(){
      if($(this).hasClass("select")){
        $(this).removeClass("select");
        var id = $(this).data("id");
        var obj = {id : id};
        existDishHandler(false,obj,remoteData);
      }else{
        $(this).addClass("select");
        var title = $(this).find("a[name='title']").text();
        var id = $(this).data("id");
        var obj = {title : title, id : id};
        existDishHandler(true,obj,remoteData);
      }
    });
  }

  function existDishHandler(add,obj,remoteData){
    var form = $("#edit-meal-form");
    var meal_id = form.data("meal-id");
    var dishSelector = $("#dish-selector");
    var dishSelected = dishSelector.find("#dishSelected");
    if(add){
      var title = obj.title;
      var id = obj.id;
      var li = '<li class="row" data-toggle="manipulate-item" data-id="' + id + '"> <div class="col-xs-3">&nbsp;<i class="manipulate-button fa fa-star text-grey cursor-pointer" data-type="feature"></i>&nbsp;<i class="manipulate-button fa fa-camera text-grey cursor-pointer" data-type="cover"></i><label name="title">' + title + '</label></div><div class="col-xs-1"><i class="fa fa-close cursor-pointer" style="margin-left:10px;" onclick="javascript:dishListHandler(false,$(this).parent().parent())"></i></div> <div class="col-xs-5 vertical-align" style="height:52px;padding-top: -10px;"> <div class="input-group amount-input" data-toggle="amount-input"> <div class="input-group-addon minus">-</div> <input class="form-control" type="number" placeholder="1" value="1" style="min-width: 75px;"> <div class="input-group-addon add">+</div> </div> </div><div class="col-xs-3"></div> </li>';
      dishSelected.append(li);
      $(document).ready(function(){
        dishSelected.find('[data-id="' + id + '"] [data-toggle="amount-input"]').amountInput();
        dishSelected.find('[data-toggle="manipulate-item"][data-id="' + id + '"]').manipulate();
      });
      if(remoteData){
        addRemoveDish(meal_id,id,false);
      }
    }else{
      var id = obj.id;
      dishSelected.find("li[data-id='" + id + "']").remove();
      if(remoteData){
        addRemoveDish(meal_id,id,true);
      }
    }
  }
}

function selectorSetup(){
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
                indexChar = "第一款";
              }else if(index==1){
                indexChar = "第二款";
              }else{
                indexChar = "第三款";
              }
              otherDropBtn.data("value","");
              otherDropBtn.html("<div style='width: 100px;display: inline-block;'>" + indexChar + "</div><span class='caret'></span>");
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

function setup(){
  tapController();
  stepContainer();
  getCountyInfo();
  loadOrder(true);
  //setup mutual exclusive selectors(etc. signature dish select)
  selectorSetup();
  dishSelectorSetup();
  adjustLayout();
  $('[data-toggle="popover"]').popover();
  $('#meal-container').mixItUp();

}

$("document").ready(function(){
  if(typeof Stripe != 'undefined'){
    Stripe.setPublishableKey('pk_test_ztZDHzxIInBmBRrkuEKBee8G');
  }
  setup();
});

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
  var footertotop = ($('.footer').position().top);
  var footerHeight = $('.footer').height();
  var fixedElementHeight = $('.floater').height();
  var scrolltop = $(document).scrollTop() + fixedElementHeight + 10 + 360;
  var difference = scrolltop-footertotop;
  if (scrolltop > footertotop) {
    $('.floater').css('bottom',  10 + difference );
  }
  else  {
    $('.floater').css('bottom', 10);
  }
});
