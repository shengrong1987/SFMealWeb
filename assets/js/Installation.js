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
  // setupTabButtonAnchor();
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
  setupDateTimePicker();
  setupFlexScrollBar();
  setupCollapse();
  setupFullPage();
  setupToaster();
}

function initData(){
  getCountyInfo();
  loadOrder(true);
  loadPreference();
  loadTimeZone();
}

function initHashTag(){
  var hashtag = window.location.hash;
  if (hashtag === '#_=_' || (window.location.href.indexOf("#") !== -1 && window.location.href.split("#")[1] === "")){

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
  }else{
    var dateObjs = { "Monday" : "星期一", "Tuesday" : "星期二", "Wednesday" : "星期三", "Thursday" : "星期四","Friday" : "星期五","Saturday" : "星期六", "Sunday" : "星期日"};
    var tab = $("[data-href='"+hashtag+"']");
    tab.tab('select');
    hashtag = hashtag.replace("#","");
    hashtag = decodeURIComponent(hashtag);
    if(dateObjs.hasOwnProperty(hashtag)){
      var hashTagCN = dateObjs[hashtag];
      hashTagCN = "." + hashTagCN;
    }
    hashtag = "." + hashtag;
    if($("[data-filter='" + hashtag + "']").length){
      var filter = $("[data-filter='" + hashtag + "']");
    }else if($("[data-filter='" + hashTagCN + "']").length){
      filter = $("[data-filter='" + hashTagCN + "']");
      hashtag = hashTagCN;
    }
    if(filter && filter.length){
      var filterType = filter.data("filter-type");
      if(filterType === "date" && dateMixer){
        dateMixer.filter(hashtag);
        createCookie("date", hashtag.replace(".",""));
        $("#dishDatesBar li").removeClass("active");
        $("#dishDatesBar [data-filter='" + hashtag + "']").parent().addClass("active");
      }else if(filterType === "chef" && chefMixer){
        chefMixer.filter(hashtag);
        createCookie("chef", hashtag.replace(".",""));
        $("#hostBarView li").removeClass("active");
        $("#hostBarView [data-filter='" + hashtag + "']").parent().addClass("active");
      }
    }
  }
}

function initQuery(){
  var querys = window.location.search.replace("?","").split("&");
  var queryObj = {};
  querys.forEach(function(query){
    queryObj[query.split("=")[0]] = query.split("=")[1];
  })
  if(queryObj.from && queryObj.from === "emailverification"){
    // BootstrapDialog.show({
    //   title : jQuery.i18n.prop('emailVerifiedTitle'),
    //   message : "<h5><small>" + jQuery.i18n.prop("emailVerifiedTip2") +"</small></h5>" +
    //     "<img class='photo w-100' src='images/points.png'>",
    //   buttons : [{
    //     label : jQuery.i18n.prop('redeem'),
    //     title : jQuery.i18n.prop('redeem'),
    //     cssClass: 'btn-primary',
    //     action : function(dialog){
    //       dialog.close();
    //     }
    //   }]
    // });
  }
}

function initEventHandler(){
  $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });
  $(window).on('hashchange', function() { setupTabButtonAnchor();});
  $(window).on('resize', adjustLayout);
  $(window).scroll(updateScroll);
}

function initLayout(){
  initHashTag();
  // initQuery();
  adjustLayout();
  updateCollapseBtn(true);
}

function loadTimeZone(){
  moment.tz.add('Etc/UTC|UTC|0|0|');
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

      initQuery();

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
    $("a[data-href='" + tapName + "']").tab('select');
  }
}

function setupTooltip(){
  $('[data-toggle="tooltip"]').tooltip({
    trigger : 'hover focus'
  });
}

var pickupMixer, deliveryMixer, dateMixer, chefMixer;

function setupMixin() {
  if($("#pickupTab").length){
    var firstFilter = $("#dishDatesBar").find("a[data-filter]").first().data('filter');
    pickupMixer = mixitup("#pickupTab", {
      pagination: {
        limit: 10
      },
      classNames: {
        elementPager: 'btn btn-mixitup'
      },
      load: {
        filter : firstFilter
      },
      selectors: {
        control : '[data-mixitup-control]'
      }
    });
  }
  if($("#deliveryTab").length){
    var firstFilter = $("#dishDatesBar").find("a[data-filter]").first().data('filter');
    deliveryMixer = mixitup("#deliveryTab", {
      pagination: {
        limit: 10
      },
      classNames: {
        elementPager: 'btn btn-mixitup'
      },
      load: {
        filter : firstFilter
      },
      selectors: {
        control: '[data-mixitup-control]'
      }
    });
  }
  if($("#dishContentView").length){
    var firstFilter = $("#dishDatesBar").find("a[data-filter]").first().data('filter');
    dateMixer = mixitup("#dishContentView", {
      pagination: {
        limit: 200
      },
      classNames: {
        elementPager: 'btn btn-mixitup'
      },
      load: {
        filter : firstFilter
      },
      selectors: {
        control : '[data-mixitup-control][data-mixitup-date]'
      }
    });
  }
  if($("#chefDishView").length){
    var firstFilter = $("#hostBarView").find("a[data-filter]").first().data('filter');
    chefMixer = mixitup("#chefDishView", {
      pagination: {
        limit: 200
      },
      classNames: {
        elementPager: 'btn btn-mixitup'
      },
      load: {
        filter : firstFilter
      },
      selectors: {
        control : '[data-mixitup-control]'
      },
      callbacks: {
        onMixStart: function(state, futureState) {
          changeSelectChefUI(futureState.activeFilter.selector);
          jumpTo("chef", -144);
        }
      },
      multifilter: {
        enable: true // enable the multifilter extension for the mixer
      }
    });
  }
  if($("#transaction_container").length){
    mixitup('#transaction_container', {
      pagination: {
        limit: 50,
        hidePageListIfSinglePage: true
      },
      classNames: {
        elementPager: 'btn btn-mixitup'
      },
      load: {
        sort : 'created:desc'
      }
    })
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

function setupDropdownMenu(){
  var $dropdownMenu = $('[data-toggle="dropdown"][data-selected="true"]').next().find(".dropdown-item");
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
  if(anchor === "Friday" || anchor === "Thursday" || anchor === "Saturday"){

  }
}
function setupSwitchButton(){
  $("[data-toggle='switch-button']").bootstrapSwitch();
}
function setupEchoBox(){
  echo.init({
    offset: 500
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
function setupDateTimePicker(){
  $('[data-toggle="dateTimePicker"]').each(function(){
    var dateString = $(this).data("date");
    var minDate;
    if(typeof dateString !== "undefined" && dateString !== "undefined"){
      var date = new Date(dateString);
      var mDate = moment(date.toISOString());
    }else{
      mDate = new Date();
      minDate = $(this).data("min");
    }
    $(this).datetimepicker({
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
      defaultDate : mDate,
      minDate : minDate
    });
  })
}

function setupCollapseButton(){
  $("#myNavBar").on('show.bs.collapse',function(){
    $("#myUserBar").removeClass('navbar-transparent').removeClass('bg-faded').removeClass('navbar-dark').addClass('navbar-light').addClass('bg-light');
    $("#myUserBar .nav-link").addClass('text-black-50');
  });
  $("#myNavBar").on('hidden.bs.collapse',function(){
    $("#myUserBar").addClass('navbar-transparent').addClass('bg-faded').addClass('navbar-dark').removeClass('navbar-light').removeClass('bg-light');
    $("#myUserBar .nav-link").removeClass('text-black-50');
  });
}

function setupCrumble(){
  $('#tour').crumble();
}

function setupFlexScrollBar(){
  $("[data-toggle='flex-scrollbar'] .control").each(function(){
    var target = $($(this).data("target"));
    var items = target.find('.item');
    var way = $(this).data("way");
    var first = items.first();
    var last = items.last();

    $(this).on('click', function(){
      if(way === "left"){
        target.stop().animate({
          scrollLeft : target.scrollLeft() + first.offset().left - 20
        }, 1200);
      }else{
        target.stop().animate({
          scrollLeft : target.scrollLeft() + last.offset().left - 20
        }, 1200);
      }
    })
  });
}

function setupCollapse(){
  $(".collapse").collapse({
    toggle: false
  });
}

function setupFullPage(){
  var myFullpage = new fullpage('#fullpage', {
    verticalCentered: false,
    anchors: ['experience', 'menu', 'customize'],
    navigationTooltips: ['Experience', 'Menu', 'Customize'],
    scrollOverflow : true,
    menu: "#dishTypeMenu",
    paddingTop : '56px',
    paddingBottom : '90px',
    afterSlideLoad : function(section, origin, destination, direction){
      fullpage_api.reBuild();
    }
  });
}

function setupToaster(){

}

/*
  Init Data
 */
function getCountyInfo(){
  var county = readCookie("county");
  if(county){
    var $citySelector = $("#citySelector");
    var countyName = $citySelector.next().find(".dropdown-item[value='" + county  + "']").text();
    var $citySelectorText = $citySelector;
    $citySelectorText.html(countyName + "&nbsp;<span class='caret'></span>");
    $citySelectorText.attr("value",county);
  }
  return county || "San Francisco County";
}

function adjustLayout(){
  var nextMealView = $("#nextMealView");
  var fMeal = nextMealView.find("li img");
  if(fMeal.length){
    var h = Math.min(fMeal[0].height, fMeal[0].width);
    nextMealView.height(h);
  }
  var dishTagsBar = $("#dishTagsBar");
  if(dishTagsBar.length){
    dishTagsBar.height($("#dishContentView").height()/2);
  }
}
