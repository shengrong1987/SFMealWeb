/**
 * Created by shengrong on 2017/9/1.
 */
$("document").ready(function(){
  initData();
  setup();
  initEventHandler();
  initLayout();
});
function setup(){
  setupLanguage();
  setupTabButtonAnchor();
  setupTooltip();
  setupMixin();
  setupDishSelector();
  setupDropdownMenu();
  setupSubmenu();
  setupLightBox();
  setupPopover();
  setupValidator();
  setupCountrySelector();
  setupSelector();
  setupInputMask();
  setupAnchor();
  setupSwitchButton();
  setupEchoBox();
  setupGlobalLoading();
  setupCrumble();
}

function initData(){
  getCountyInfo();
  loadOrder(true);
  loadPreference();
  initHashTag();
}

function initHashTag(){
  if (window.location.hash === '#_=_' || (window.location.href.indexOf("#") !== -1 && window.location.href.split("#")[1] === "")){

    // Check if the browser supports history.replaceState.
    if (history.replaceState) {

      // Keep the exact URL up to the hash.
      var cleanHref = window.location.href.split('#')[0];

      // Replace the URL in the address bar without messing with the back button.
      history.replaceState(null, null, cleanHref);

    } else {

      // Well, you're on an old browser, we can get rid of the _=_ but not the #.
      window.location.hash = '';

    }
  }
}

function initEventHandler(){
  $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });
  $(window).on('hashchange', function() { setupTabButtonAnchor();});
  $(window).scroll(updateScroll);
}

function initLayout(){
  adjustLayout();
  updateCollapseBtn(true);
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
        if($(this).data('param')){
          $(this).text(jQuery.i18n.prop($(this).data("key"), $(this).data('param')));
        }else{
          $(this).text(jQuery.i18n.prop($(this).data("key")));
        }
        if($(this).data("title")){
          $(this).attr("title", jQuery.i18n.prop($(this).data("title")));
        }
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

function setupTabButtonAnchor(){
  var tapName = location.hash;
  if(tapName && tapName !== ""){
    $("a[href='" + tapName + "']").tab('show');
  }
}

function setupTooltip(){
  $('[data-toggle="tooltip"]').tooltip({
    trigger : 'hover focus'
  });
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

function setupDropdownMenu(){
  var $dropdownMenu = $('[data-toggle="dropdown"][data-selected="true"]').next().find("li a");
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
function setupLightBox(){
  $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox({
      left_arrow_class : ".glyphicon-chevron-left .fa .fa-arrow-left",
      right_arrow_class : ".glyphicon-chevron-right .fa .fa-arrow-right"
    });
  });
}
function setupPopover(){
  $('[data-toggle="popover"]').popover();
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
function setupCountrySelector(){
  $('.flagstrap').flagStrap({
    onSelect : function(value){
      $('.flagstrap').data('selected-country', value);
    },
    buttonType : 'btn-red'
  });
}
function setupSelector(){
  $('[data-toggle="select"]').on('change', function(e){
    e.preventDefault();
    var val = $(this).find("option:selected").attr('value');
    $(this).attr('value', val);
  });
}
function setupInputMask(){
  $("input[type='tel']").mask("(000)000-0000");
}
function setupAnchor(){
  var anchor = location.hash;
  if(anchor){
    anchor = anchor.replace("#","");
  }
  if(anchor === "Sacramento" || anchor === "San Francisco"){
    setCountyInfo(anchor + " County");
  }
}
function setupSwitchButton(){
  $("[data-toggle='switch-button']").bootstrapSwitch();
}
function setupEchoBox(){
  echo.init({
    offset: 1000
  });
}
function setupGlobalLoading(){
  $("document").on({
    ajaxStart: function() {
      $('body').addClass("loading");
    },
    ajaxStop: function() {
      $('body').removeClass("loading");
    }
  })
}

function setupCrumble(){
  $('#tour').crumble();
  // $("#cateringModeBtn").grumble({
  //   text : "Hello",
  //   angle : 315,
  //   distance : 3,
  //   showAfter : 100,
  //   useRelativePositioning : true
  // });
}

/*
  Init Data
 */
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

function adjustLayout(){
  var $myinfo = $("#myinfo");
  var dishes = $myinfo.find(".dishes .signatureDish li");
  if(dishes){
    var count = dishes.length;
    var height = count * 50 < 50 ? 50 : count * 50;
    $myinfo.find(".dishes").css("height",height);
  }
}
