/**
 * Created by shengrong on 2017/9/1.
 */
import 'bootstrap';
import { helperMethod, localOrderObj } from "./utils/helper";

let installation = function() {
  $("document").ready(function () {
    initData();
    setup();
    initEventHandler();
    initLayout();
  });
};

function initData(){
  getCountyInfo();
  localOrderObj.loadOrder(true);
  // loadTimeZone();
}

function setup(){
  setupObj.setupStarSet();
  setupObj.setupTooltip();
  setupObj.setupMixitup();
  setupObj.setupDishSelector();
  setupObj.setupDropdownMenu();
  setupObj.setupSubmenu();
  setupObj.setupLightBox();
  setupObj.setupPopover();
  setupObj.setupValidator();
  setupObj.setupCountrySelector();
  setupObj.setupSelector();
  setupObj.setupInputMask();
  setupObj.setupAnchor();
  setupObj.setupSwitchButton();
  setupObj.setupEchoBox();
  setupObj.setupGlobalLoading();
  setupObj.setupDateTimePicker();
  setupObj.setupFlexScrollBar();
  setupObj.setupCollapse();
  setupObj.setupFullPage();
  setupObj.setupPagination();
  setupObj.setupAlert();
  setupObj.setupTab();
  setupObj.setupDatePicker();
  setupObj.setupAmountInput();
  setupObj.setupCountDown();
  setupObj.setupExclusiveInput();
  setupObj.setupManipulateItem();
  setupObj.setupCollectItem();
  setupObj.setupAlertButton();
  setupObj.setupSwitchBox();
  setupObj.setupBtnSet();
  setupObj.setupTimeSpan();
  setupObj.setupDurationFilter();
  setupObj.setupDishSelector();
  setupObj.setupInputToggle();
  setupObj.setupPopupTooltip();
  setupObj.setupBootstrapDialog();
}

async function initHashTag(){
  console.group("初始化Anchor");
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
    var tabItem = $("[data-href='"+hashtag+"']");
    if(tabItem.length){
      const { default : tab } = await import(/* webpackChunkName:"tab" */ './library/sfmeal-components.js');
      tabItem.tab('select');
      console.info("选择Tab: %s", hashtag);
    }
    hashtag = hashtag.replace("#","");
    hashtag = decodeURIComponent(hashtag);
    if(hashtag){
      var dateObjs = { "Monday" : "星期一", "Tuesday" : "星期二", "Wednesday" : "星期三", "Thursday" : "星期四","Friday" : "星期五","Saturday" : "星期六", "Sunday" : "星期日"};
      hashtag.split("&").forEach(function(h){
        if(dateObjs.hasOwnProperty(h)){
          var hashTagCN = dateObjs[h];
          hashTagCN = "." + hashTagCN;
        }
        h = "." + h;
        let cFilter = $("[data-filter='" + h + "']");
        if(cFilter.length){
          var filter = $("[data-filter='" + h + "']");
        }else if($("[data-filter='" + hashTagCN + "']").length){
          filter = $("[data-filter='" + hashTagCN + "']");
          h = hashTagCN;
        }
        if(filter && filter.length){
          var filterType = filter.data("filter-type");
          console.info("已找到filter: %s, 类型：%s 准备过滤", h, filterType);
          if(filterType === "date" && dateMixer){
            dateMixer.filter(h);
            helperMethod.createCookie("date", h.replace(".",""));
            $("#dishDatesBar [data-filter]").removeClass("active");
            $("#dishDatesBar [data-filter='" + h + "']").addClass("active");
          }else if(filterType === "chef" && chefMixer){
            chefMixer.filter(h);
            helperMethod.createCookie("chef", h.replace(".",""));
            $("#hostBarView [data-filter]").removeClass("active");
            $("#hostBarView [data-filter='" + h + "']").addClass("active");
          }
        }
      })
    }
  }
  console.groupEnd();
}

function initQuery(){
  var querys = window.location.search.replace("?","").split("&");
  var queryObj = {};
  querys.forEach(function(query){
    queryObj[query.split("=")[0]] = query.split("=")[1];
  })
  if(queryObj.from && queryObj.from === "emailverification"){
    // BootstrapDialog.show({
    //   title : __('emailVerifiedTitle'),
    //   message : "<h5><small>" + __("emailVerifiedTip2") +"</small></h5>" +
    //     "<img class='photo w-100' src='images/points.png'>",
    //   buttons : [{
    //     label : __('redeem'),
    //     title : __('redeem'),
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
  $(window).on('hashchange', function() { setupObj.setupTabButtonAnchor();});
  $(window).on('resize', adjustLayout);
}

function initLayout(){
  initHashTag();
  // initQuery();
  adjustLayout();
  updateCollapseBtn(true);
}
//
// async function loadTimeZone(){
//   await import
//     (
//     /* webpackChunkName: 'moment-timezone' */
//     /* webpackPrefetch: true */
//     'moment-timezone'
//     );
//   moment.tz.add('Etc/UTC|UTC|0|0|');
// }
let pickupMixer, deliveryMixer, dateMixer, chefMixer;

let setupObj = {
  setupTabButtonAnchor : function (){
    var tapName = location.hash;
    if(tapName && tapName !== ""){
      $("a[data-href='" + tapName + "']").tab('select');
    }
  },
  setupTooltip : function (){
    $('[data-toggle="tooltip"]').tooltip({
      trigger : 'hover focus'
    });
  },

  setupMixitup : async function () {

    console.group("开始安装Mixitup组件");
    if($("#pickupTab .mix").length || $("#deliveryTab .mix").length || $("#dishContentView .mix").length || $("#chefDishView .mix").length || $("#transaction_container .mix").length){
      const { default: mixitup } = await import(/* webpackChunkName: "mixitup" */ 'mixitup');
      window.mixitup = mixitup;
      const { default: mixitupPagination } = await import(/* webpackChunkName: "mixitup-pagination" */ './library/jquery.mixitup-pagination.min');
      let dateFilter = $("#dishDatesBar").find("a[data-filter]").first().data('filter');
      let chefFilter = $("#hostBarView").find("button[data-filter]").first().data('filter');
      if($("#chefDishView").length){
        const { default: mixitupMultifilter } = await import(/* webpackChunkName: "mixitupMultifilter" */ './library/mixitup-multifilter.js');
      }
      if($("#pickupTab .mix").length){
        console.info("初始化自取选项卡Mixitup组件...");
        pickupMixer = mixitup("#pickupTab", {
          pagination: {
            limit: 10
          },
          classNames: {
            elementPager: 'btn btn-mixitup'
          },
          load: {
            filter : dateFilter
          },
          selectors: {
            control : '[data-mixitup-control]'
          }
        });
        appObj.mealConfirmView.initDateFilter();
      }
      if($("#deliveryTab .mix").length){
        console.info("初始化送餐选项卡Mixitup组件...");
        deliveryMixer = mixitup("#deliveryTab", {
          pagination: {
            limit: 10
          },
          classNames: {
            elementPager: 'btn btn-mixitup'
          },
          load: {
            filter : dateFilter
          },
          selectors: {
            control: '[data-mixitup-control]'
          }
        });
        appObj.mealConfirmView.initDateFilter();
      }
      if($("#dishContentView .mix").length){
        console.info("初始化Main Menu Mixitup组件...");
        dateMixer = mixitup("#dishContentView", {
          pagination: {
            limit: 200
          },
          classNames: {
            elementPager: 'btn btn-mixitup'
          },
          load: {
            filter : dateFilter
          },
          selectors: {
            control : '[data-mixitup-control][data-mixitup-date]'
          }
        });
        appObj.dayOfMealView.initDate();
        initHashTag();

      }
      if($("#chefDishView").length){
        console.info("初始化Chef Menu Mixitup组件...");
        chefMixer = mixitup("#chefDishView", {
          pagination: {
            limit: 200
          },
          classNames: {
            elementPager: 'btn btn-mixitup'
          },
          selectors: {
            control: '[data-mixitup-control]'
          },
          callbacks: {
            onMixStart: function (state, futureState) {
              helperMethod.changeSelectChefUI(futureState.activeFilter.selector);
              helperMethod.jumpTo("chef", -144);
            }
          },
          multifilter: {
            enable: true // enable the multifilter extension for the mixer
          },
          animation: {
            enable: false,
            effects: 'fade translateZ(-100px)'
          }
        });
        chefMixer.setFilterGroupSelectors('date',dateFilter);
        chefMixer.setFilterGroupSelectors('chef',chefFilter);
        chefMixer.parseFilterGroups();
        chefMixer.configure({
          animation: {
            enable: true
          }
        });
        appObj.dayOfMealView.initialize();
        initHashTag();
      }
      if($("#transaction_container").length){
        console.info("初始化 Transaction Mixitup组件...");
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
    console.groupEnd();
  },

  setupDropdownMenu : function (){
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
  },

  setupSubmenu : async function (){
    $('[data-submenu]').each(async function(){
      await import(
        /* webpackChunkName: 'submenuPicker'*/
        'bootstrap-submenu'
        );
      $(this).submenupicker();
      $(this).find("[data-selected='true']").next().find("li a").on("click", function(){
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
    })
  },

  setupLightBox : function (){
    $(document).delegate('*[data-toggle="lightbox"]', 'click', async function(event) {
      event.preventDefault();
      await import
        (
        /* webpackChunkName: 'ekko-lightbox'*/
        'ekko-lightbox'
        );
      $(this).ekkoLightbox({
        left_arrow_class : ".glyphicon-chevron-left .fa .fa-arrow-left",
        right_arrow_class : ".glyphicon-chevron-right .fa .fa-arrow-right"
      });
    });
  },

  setupPopover : function (){
    $('[data-toggle="popover"]').popover();
  },

  setupValidator : function (){
    $('[data-toggle="validator"]').each(async function() {
      const { validator }  = await import(/* webpackChunkName: "validator"*/ 'bootstrap-validator');
      $(this).validator({
        feedback: {
          success: "fa fa-check",
          error: "fa fa-remove"
        },
        custom: {
          wantsimage: function ($el) {
            var requiredImg = $el.data("wantsimage");
            var ext = $el[0].value.match(/\.(.+)$/)[1].toLowerCase();
            if (requiredImg && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png' && ext !== 'gif' && ext !== 'pdf') {
              return __('imageTypeRequire');
            }
          }, strictimage: function ($el) {
            var requiredImg = $el.data("strictimage");
            var exts = $el[0].value.match(/\.(.+)$/);
            if (!exts) {
              return "";
            }
            if (exts.length < 1) {
              return __('strictImageTypeRequire');
            }
            var ext = exts[1].toLowerCase();
            if (requiredImg && ext !== 'jpeg' && ext !== 'png' && ext !== 'jpg') {
              return __('strictImageTypeRequire');
            }
          }
        }
      });
    });
  },

  setupCountrySelector : function (){
    // $('.flagstrap').each(async function(){
    //   const { flagStrap } = await import(/* webpackChunkName: "country-selector"*/ './library/country-selector.js');
    //   $(this).flagStrap({
    //     onSelect : function(value){
    //       $('.flagstrap').data('selected-country', value);
    //     },
    //     buttonType : 'btn-red'
    //   });
    // });
  },

  setupSelector : function (){
    $('[data-toggle="select"]').on('change', function(e){
      e.preventDefault();
      var val = $(this).find("option:selected").attr('value');
      $(this).attr('value', val);
    });
  },

  setupInputMask : function (){
    $("input[type='tel']").each(async function(){
      await import
        (
        /* webpackChunkName: 'jquery-mask'*/
        'jquery-mask-plugin'
        );
      $(this).mask("(000)000-0000")
    });
  },

  setupAnchor : function (){
    var anchor = location.hash;
    if(anchor){
      anchor = anchor.replace("#","");
    }
    if(anchor === "Sacramento" || anchor === "San Francisco"){
      helperMethod.setCountyInfo(anchor + " County");
    }
    if(anchor === "Friday" || anchor === "Thursday" || anchor === "Saturday"){

    }
  },

  setupSwitchButton : function (){
    $("[data-toggle='switch-button']").each(async function(){
      await import(/* webpackChunkName: "bootstrap4-toggle" */'bootstrap4-toggle');
      $(this).bootstrapToggle();
    });
  },

  setupEchoBox : async function (){
    await import
      (
      /* webpackChunkName: "echo" */
      /* webpackPrefetch: true */
      './library/echo.js'
      );
    echo.init({
      offset: 500
    });
  },

  setupGlobalLoading : function (){
    $("document").on({
      ajaxStart: function() {
        $('body').addClass("loading");
      },
      ajaxStop: function() {
        $('body').removeClass("loading");
      }
    })
  },

  setupDateTimePicker : function (){
    $('[data-toggle="dateTimePicker"]').each(async function(){
      const { default: moment } = await import(
        /* webpackChunkName: 'moment' */
        /* webpackPrefetch: true */
        'moment');
      window.moment = moment;
      const { default: datetimepicker } = await import
        (
        /* webpackChunkName: 'bootstrap4-datetimepicker'*/
        'pc-bootstrap4-datetimepicker'
        )
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
        locale: 'en',
        stepping : 30,
        defaultDate : mDate,
        minDate : minDate
      });
    })
  },

  setupFlexScrollBar : function (){
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
  },

  setupCollapse : function (){
    $(".collapse").collapse({
      toggle: false
    });
  },

  setupFullPage : async function (){
    if(!$("#fullpage").length){
      return;
    }
    const { default: fullpage } = await import(
      /* webpackChunkname: 'fullpage'*/
      'fullpage/build/fullpage.js'
      );
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
  },

  setupPagination : function (){
    $('[data-trigger="pagination"]').each(async function(){
      const { default : pagination } = await import(/* webpackChunkName:"pagination" */ './library/sfmeal-components.js');
      $(this).pagination($(this).data());
    });
  },

  setupAlert : function (){
    $('[data-toggle="alert"]').each(function(){
      $(this).hide();
    });
  },

  setupTab : function (){
    $("[data-toggle='tab']").each(async function(){
      const { default : tab } = await import(/* webpackChunkName:"tab" */ './library/sfmeal-components.js');
      $(this).tab($(this).data());
    });
  },

  setupDatePicker : function (){
    $("[data-toggle='date-picker']").each(async function(){
      const { default : datePicker } = await import(/* webpackChunkName:"datePicker" */ './library/sfmeal-components.js');
      $(this).datePickup($(this).data());
    });
  },

  setupAmountInput : function (){
    $("[data-toggle='amount-input']").each(async function(){
      const { default : amountInput } = await import(/* webpackChunkName:"amountInput" */ './library/sfmeal-components.js');
      $(this).amountInput($(this).data());
    });
  },

  setupCountDown : function (){
    $('[data-toggle="count-down"]').each(async function(){
      const { default : countDown } = await import(/* webpackChunkName:"countDown" */ './library/sfmeal-components.js');
      $(this).countDown($(this).data());
    });
  },

  setupExclusiveInput : function (){
    $('[data-toggle="exclusive-input"]').each(async function(){
      const { default : exclusiveInput } = await import(/* webpackChunkName:"exclusiveInput" */ './library/sfmeal-components.js');
      $(this).exclusiveInput($(this).data());
    });
  },

  setupManipulateItem : function (){
    $('[data-toggle="manipulate-item"]').each(async function(){
      const { default : manipulateItem } = await import(/* webpackChunkName:"manipulateItem" */ './library/sfmeal-components.js');
      $(this).manipulate($(this).data());
    });
  },

  setupStarSet : function (){
    $('[data-toggle="star-set"]').each(async function(){
      const { default : starSet } = await import(/* webpackChunkName:"starSet" */ './library/sfmeal-components.js');
      $(this).starSet($(this).data());
    });
  },

  setupCollectItem : function (){
    $('[data-toggle="collect-item"]').each(async function(){
      const { default : collectItem } = await import(/* webpackChunkName:"collectItem" */ './library/sfmeal-components.js');
      $(this).collectItem($(this).data());
    });
  },

  setupAlertButton : function (){
    $('[data-toggle="alert-button"]').each(async function(){
      const { default : alertButton } = await import(/* webpackChunkName:"alertButton" */ './library/sfmeal-components.js');
      $(this).alertButton($(this).data());
    });
  },

  setupSwitchBox : function (){
    $('[data-toggle="switch-box"]').each(async function(){
      const { default : switchBox } = await import(/* webpackChunkName:"switchBox" */ './library/sfmeal-components.js');
      $(this).switchBox($(this).data());
    });
  },

  setupBtnSet : function (){
    $('[data-toggle="btn-set"]').each(async function(){
      const { btnSet } = await import(/* webpackChunkName:"btnSet" */ './library/sfmeal-components.js');
      $(this).btnSet($(this).data());
    });
  },

  setupTimeSpan : function (){
    $('[data-toggle="time-span"]').each(async function(){
      const { timeSpan } = await import(/* webpackChunkName:"timeSpan" */ './library/sfmeal-components.js');
      $(this).timeSpan($(this).data());
    });
  },

  setupDurationFilter : function (){
    $('[data-toggle="duration-filter"]').each(async function(){
      const { default : durationFilter } = await import(/* webpackChunkName:"durationFilter" */ './library/sfmeal-components.js');
      $(this).durationFilter($(this).data());
    });
  },

  setupDishSelector : function (){
    $('[data-toggle="dish-selector"]').each(async function(){
      const { dishSelector } = await import(/* webpackChunkName:"dishSelector" */ './library/sfmeal-components.js');
      $(this).dishSelector($(this).data());
    });
  },

  setupInputToggle : function (){
    $('[data-toggle="input-toggle"]').each(async function(){
      const { inputToggle } = await import(/* webpackChunkName:"inputToggle" */ './library/sfmeal-components.js');
      $(this).inputToggle($(this).data());
    });
  },

  setupPopupTooltip : function (){
    $('[data-toggle="popupTooltip"]').each(async function(){
      const { popupTooltip } = await import(/* webpackChunkName:"popupTooltip" */ './library/sfmeal-components.js');
      $(this).popupTooltip($(this).data());
    });
  },

  setupBootstrapDialog : async function(){
    const { BootstrapDialog } = await import(/* webpackPrefetch: true, webpackChunkName:"bootstrapDialog"*/ 'bootstrap4-dialog');
    window.BootstrapDialog = BootstrapDialog;
  }
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

/*
  Init Data
 */
function getCountyInfo(){
  var county = helperMethod.readCookie("county");
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
    dishTagsBar.height(window.innerHeight-108-66);
  }
}

export { pickupMixer, dateMixer, chefMixer, deliveryMixer, installation, setupObj };
