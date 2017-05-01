/**
 * Created by shengrong on 1/25/16.
 */

+function ($) {
  'use strict';

  var Pagination = function(element, options){
    this.$element = $(element);
    this.$options = options;
    this.$curPage = this.$options.index;
    if(this.$options.target){
      this.render(false);
    }
  }

  Pagination.prototype.render = function(isUpdate){
    if(!isUpdate){
      var parent = $(this.$options.target);
      var itemCount = parent.find(".item").length;
      var npp = this.$options.npp;
      this.$element.empty();
      this.$element.hide();
      if(itemCount == 0 || itemCount <= npp){
        return
      }else{
        var pages = Math.floor(itemCount / npp);
        var left = itemCount % npp;
        if(left>0){
          pages++;
        }
        this.$pages = pages;
      }
      if(this.$pages > 1){
        this.$element.show();
        for(var i = 0; i < this.$pages; i++){
          var li = $("<li><a href='javascript:void(0)'></a></li>");
          if(this.$curPage && i==this.$curPage-1){
            li.addClass("active");
          }else if(i==0 && !this.$curPage){
            this.$curPage = i+1;
            li.addClass("active");
          }
          li.find("a").html(i+1);
          li.data("index",i+1);
          li.on("click",pageChangeHandler);
          this.$element.append(li);
        }
      }
    }else{
      if(this.$pages && this.$pages > 1){
        var curPage = this.$curPage;
        this.$element.find("li").each(function(){
          $(this).removeClass('active');
          var index = $(this).data('index');
          if(index == curPage){
            $(this).addClass('active');
          }
        });
      }else{
        //no page data on page change, something went wrong
      }
    }
    this.showContent();
  }

  Pagination.prototype.showContent = function (){
    var curPage = this.$curPage;
    var npp = this.$options.npp;
    $(this.$options.target).find(".item").hide().each(function(index){
      var min = (curPage - 1) * npp;
      var max = curPage * npp;
      if(index >= min && index < max){
        $(this).show();
      }
    });
  }

  Pagination.prototype.change = function(node){
    this.$curPage = node.data("index");
    this.render(true);
  }

  Pagination.DEFAULTS = {
    npp : 5,
    index : 1
  }

  function Plugin(option ,root){
    return this.each(function(){
      var $this = $(this);
      var options = $.extend({},Pagination.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data("bs.pagination");
      if(!data) root.data("bs.pagination",(data = new Pagination(root, options)));
      if(typeof option == 'string') data[option]($this);
    });
  }

  var pageChangeHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'change',$(this).parentsUntil('[data-trigger="pagination"]').length > 0 ? $(this).parentsUntil('[data-trigger="pagination"]').parent() : $(this).parent());
  }

  $(window).on('load',function(){
    $('[data-trigger="pagination"]').each(function(){
      var pagination = $(this);
      Plugin.call(pagination,pagination.data(),pagination);
    });
    $('[data-toggle="alert"]').each(function(){
      $(this).hide();
    });
  });
}(jQuery);

+function($){
  'use strict'

  var DatePicker = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},DatePicker.DEFAULTS, options);
    if(this.$options.from){
      this.$element.find(".date a").on("change",this.dateChangeHandler);
      this.show();
    }
  }

  DatePicker.DEFAULTS = {
    from : new Date()
  }

  DatePicker.dateData = {
    dayInMonth : {
      1 : "31",
      2 : "28",
      3 : "31",
      4 : "29",
      5 : "30",
      6 : "29",
      7 : "31",
      8 : "30",
      9 : "31",
      10 : "30",
      11 : "29",
      12 : "31"
    }
  }

  //select today's date
  DatePicker.prototype.pickNow = function(){
    var from = DatePicker.DEFAULTS.from;
    var month = from.getMonth() + 1;
    var day = from.getDate();
    var year = from.getUTCFullYear();
    this.$element.find(".date").each(function(){
      var date_format = $(this).data("date-format");
      if(date_format=="month"){
        $(this).find("a").html(month + "月");
        $(this).find("a").attr("value",month);
      }else if(date_format=="day"){
        $(this).find("a").html(day + "日");
        $(this).find("a").attr("value",day);
      }else{
        $(this).find("a").html(year + "年");
        $(this).find("a").attr("value",year);
      }
    });
  }

  DatePicker.prototype.dateChangeHandler = function(e){
    e.preventDefault();
    var ele = $(this).parentsUntil($("[data-toggle='date-picker']")).parent();
    Plugin.call($(this),"show",ele);
  }

  DatePicker.prototype.addEvent = function(){
    $('[data-toggle="date-picker"] .date .dropdown-menu li').click(function(e){
      e.preventDefault();
      var text = $(this).text();
      var value = $(this).find("a").attr("value");
      var parent = $(this).parent().prev();
      parent.text(text);
      parent.attr("value",value);
      parent.trigger("change");
    });
  }

  //show date result from select date
  DatePicker.prototype.show = function(){
    var from = new Date(this.$options.from);
    var monthSection = this.$element.find("[data-date-format='month']");
    var yearSection = this.$element.find("[data-date-format='year']");

    var yearDropDownBtn = yearSection.find("[data-toggle='dropdown']");
    var monthDropDownBtn = monthSection.find("[data-toggle='dropdown']");

    var yearSelected = yearDropDownBtn.attr("value");
    var monthSelected = monthSection.find("[data-toggle='dropdown']").attr("value");

    if(monthSection.length>0){
      if(yearSelected == from.getUTCFullYear()){
        var month = parseInt(from.getMonth()) + 1;
      }else{
        var month = 1;
      }
      var list = monthSection.find("ul");
      list.empty();
      for(var i= month; i <= 12; i++){
        var monthItem = "<li><a value='" + i + "'>" + i + "月</a></li>";
        list.append(monthItem);
      }
    }
    var daySection = this.$element.find("[data-date-format='day']");
    if(daySection.length>0){
      if(monthSelected == from.getMonth() + 1){
        var day = parseInt(from.getDate());
        var curMonth = monthSelected;
      }else if(monthSelected){
        var day = 1;
        var curMonth = monthSelected;
      }else{
        var day = parseInt(from.getDate());
        var curMonth = from.getMonth() + 1;
      }
      var dayInMonth = DatePicker.dateData.dayInMonth[curMonth];
      var list = daySection.find("ul");
      list.empty();
      for(var i= day; i <= dayInMonth; i++){
        var dayItem = "<li><a value='" + i + "'>" + i + "日</a></li>";
        list.append(dayItem);
      }
    }

    if(yearSection.length>0){
      var year = from.getUTCFullYear();
      var list = yearSection.find("ul");
      list.empty();
      for(var i= year; i <= year+1; i++){
        var yearItem = "<li><a value='" + i + "'>" + i + "年</a></li>";
        list.append(yearItem);
      }
    }

    var hourSection = this.$element.find("[data-date-format='hour']");
    if(hourSection.length > 0){
      var list = hourSection.find("ul");
      list.empty();
      for(var i=0; i <= 24; i++){
        var hourItem = "<li><a value='" + i + "'>" + i + ":00</a></li>";
        list.append(hourItem);
      }
    }
    this.addEvent();
  }

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var $this = $(this);
      var options = $.extend({}, DatePicker.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data("bs.amount-input");
      if(!data) root.data("bs.amount-input",(data = new DatePicker(root, options)));
      if(typeof option == 'string') data[option]($this);
    });
  }

  $.fn.datePickup             = Plugin
  $.fn.datePickup.Constructor = DatePicker

  $(window).on('load',function(){
    $('[data-toggle="date-picker"]').each(function(){
      var datePicker = $(this);
      Plugin.call(datePicker,datePicker.data());
    });
  });

}(jQuery);

+function($){
  'use strict'

  var AmountInput = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},AmountInput.DEFAULTS, options);
    this.$value = parseInt(this.$element.find("input").val());
    this.$element.find(".add").on('click',addHandler);
    this.$element.find(".minus").on('click',minusHandler);
  }

  AmountInput.DEFAULTS = {
    init : 1
  }

  AmountInput.prototype.add = function(node){
    this.$value = this.$value + 1;
    node.prev().val(this.$value);
  }

  AmountInput.prototype.minus = function(node){
    if(this.$value > 0) this.$value = this.$value - 1;
    node.next().val(this.$value);
  }

  var addHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'add',$(this).parentsUntil("[data-toggle='amount-input']").length > 0 ? $(this).parentsUntil("[data-toggle='amount-input']").parent() : $(this).parent())
  }

  var minusHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'minus',$(this).parentsUntil("[data-toggle='amount-input']").length > 0 ? $(this).parentsUntil("[data-toggle='amount-input']").parent() : $(this).parent());
  }

  function Plugin(option,root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var $this = $(this);
      var options = $.extend({}, AmountInput.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data("bs.amount-input");
      if(!data) root.data("bs.amount-input",(data = new AmountInput(root, options)));
      if(typeof option == 'string') data[option]($this);
    });
  }

  $.fn.amountInput             = Plugin
  $.fn.amountInput.Constructor = AmountInput

  $(window).on('load',function(){
    $('[data-toggle="amount-input"]').each(function(){
      var amountInput = $(this);
      Plugin.call(amountInput,amountInput.data());
    });
  });

}(jQuery);

+function($){
  'use strict'
  var ExclusiveInput = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},ExclusiveInput.DEFAULTS, options);
    this.$element.find(".input-group").off('change');
    this.$element.find(".input-group").on('change',onchangeHandler);
  }

  ExclusiveInput.DEFAULTS = {

  }

  ExclusiveInput.prototype.change = function(node){
    var ele = this.$element;
    ele.find(".input-group").each(function(){
      if($(this).attr('name')!=node.attr('name')){
        $(this).find("input").val('');
      }
    });
  }

  function Plugin(option,root){
    return this.each(function(){
      var options = $.extend({}, ExclusiveInput.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data("bs.exclusive-input");
      if(!data) root.data("bs.exclusive-input",(data = new ExclusiveInput(root, options)));
      if(typeof option == 'string') data[option]($(this));
    });
  }

  $.fn.exclusiveInput           = Plugin
  $.fn.exclusiveInput.Constructor = ExclusiveInput

  var onchangeHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'change',$(this).parentsUntil('[data-toggle="exclusive-input"]').parent());
  }

  $(window).on('load',function(){
    $('[data-toggle="exclusive-input"]').each(function(){
      var exclusive_input = $(this);
      Plugin.call(exclusive_input,exclusive_input.data(),exclusive_input);
    });
  });

}(jQuery);

+function($){
  'use strict'

  var ManipulateItem = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},ManipulateItem.DEFAULTS, options);
    this.$element.find(".manipulate-button").off('click');
    this.$element.find(".manipulate-button").on('click',clickHandler);
  }

  ManipulateItem.DEFAULTS = {

  }

  ManipulateItem.reset = function(){
    $("[data-toggle='manipulate-item'] .manipulate-button[data-type='cover']").each(function(){
      if($(this).hasClass("text-yellow")){
        $(this).removeClass("text-yellow");
        $(this).addClass("text-grey");
        var element = $(this).parentsUntil("[data-toggle='manipulate-item']").parent();
        element.data($(this).data().type,false);
      }
    });
  }

  ManipulateItem.prototype.operate = function(button){
    var element = this.$element;
    if(button.hasClass("text-grey")){
      if(button.data().type == "cover"){
        ManipulateItem.reset();
      }
      button.removeClass("text-grey");
      button.addClass("text-yellow");
      element.data(button.data().type,true);
    }else{
      button.removeClass("text-yellow");
      button.addClass("text-grey");
      element.data(button.data().type,false);
    }
  }

  function Plugin(option,root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, ManipulateItem.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.manipulate-item');
      if(!data){
        root.data('bs.manipulate-item',(data = new ManipulateItem(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  $.fn.manipulate             = Plugin
  $.fn.manipulate.Constructor = ManipulateItem

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'operate', $(this).parentsUntil("[data-toggle='manipulate-item']").parent());
  }

  $(window).on('load',function(){
    $('[data-toggle="manipulate-item"]').each(function(){
      var manipulate_item = $(this);
      Plugin.call(manipulate_item,manipulate_item.data());
    });
  });

}(jQuery);

+function($){
  'use strict'

  var StarSet = function(element, options){
    this.element = $(element);
    this.options = options;
    if(this.element.data("rate")){
      this.show();
    }else{
      this.element.find("i").addClass("text-lightgrey");
      this.element.find("i").on('click',clickHandler);
      this.element.find("i").on('mouseover',overHandler);
    }
  }

  StarSet.DEFAULTS = {

  }

  //show star based on rating
  StarSet.prototype.show = function(){
    var ele = this.element;
    var rate = ele.data("rate");
    rate = (Math.floor(rate * 4))/4;
    //0,1,1.25,1.5,1.75,2
    var index = 5 - rate;
    for(var i=4; i >= 0; i--){
      var star = ele.find("i:eq(" + i +  ")");
      star.addClass("text-lightgrey");
      if(i >= index){
        star.removeClass("fa-star").addClass("fa-star text-yellow");
      }else{
        var left = index - i;
        var count = left / 0.25;
        if(count==1){
          //over 0.75
          star.removeClass("fa-star").addClass("fa-star text-yellow");
        }else if(count == 2 || count==3){
          star.removeClass("fa-star text-yellow").addClass("fa-star-half-empty text-yellow");
        }else{
          star.removeClass("fa-star text-yellow").addClass("fa-star text-lightgrey");
        }
      }
    }
  }

  //mouse over on star
  StarSet.prototype.over = function(node){
    var ele = this.element;
    var index = ele.find("i").index(node);
    for(var i=4; i >= 0; i--){
      var star = ele.find("i:eq(" + i +  ")");
      if(i >= index){
        star.removeClass("fa-star").addClass("fa-star text-yellow");
      }else{
        star.removeClass("fa-star text-yellow").addClass("fa-star text-lightgrey");
      }
    }
  }

  //click on star
  StarSet.prototype.click = function(node){
    var ele = this.element;
    var index = ele.find("i").index(node);
    for(var i=4; i >= 0; i--){
      var star = ele.find("i:eq(" + i +  ")");
      if(i >= index){
        star.removeClass("fa-star").addClass("fa-star text-yellow");
      }else{
        star.removeClass("fa-star text-yellow").addClass("fa-star text-lightgrey");
      }
    }
    ele.data("rate",5-index);
  }

  $.fn.starSet              = Plugin
  $.fn.starSet.Constructor  = StarSet

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, StarSet.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.star-set');
      if(!data){
        root.data('bs.star-set',(data = new StarSet(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'click',$(this).parentsUntil('[data-toggle="star-set"]').length > 0 ? $(this).parentsUntil('[data-toggle="star-set"]').parent() : $(this).parent());
  }

  var overHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'over',$(this).parentsUntil('[data-toggle="star-set"]').length > 0 ? $(this).parentsUntil('[data-toggle="star-set"]').parent() : $(this).parent());
  }

  $(window).on('load',function(){
    $('[data-toggle="star-set"]').each(function(){
      var starSet = $(this);
      Plugin.call(starSet,starSet.data());
    });
  });
}(jQuery);

+function($){
  'use strict'

  var CollectItem = function(element, options){
    this.element = $(element);
    this.options = options;
    if(this.options.select === "true" || this.options.select === true){
      if(this.options["heart"]){
        this.element.addClass("text-red");
      }
    }else{

    }
    this.element.on("click",clickHandler);
  }

  CollectItem.DEFAULTS = {

  }

  //click on star
  CollectItem.prototype.click = function(node){
    var ele = this.element;
    var mealId = ele.data("meal");
    var userId = ele.data("user");
    if(!userId || userId == "undefined"){
      return;
    }
    if(this.options.select === "true" || this.options.select === true){
      var method = "DELETE";
      ele.removeClass('fa-heart');
      ele.addClass('fa-heart-o');
      this.options.select = false;
    }else{
      method = "POST";
      ele.removeClass('fa-heart-o');
      ele.addClass('fa-heart');
      this.options.select = true;
    }
    var $this = this;
    $.ajax({
      url : "/user/" + userId + "/collects/" + mealId,
      data : {

      },
      method : method,
      success : function(){
        if($this.options.cb){
          eval($this.options.cb);
        }
      },error : function(err){}
    });
  }

  $.fn.collectItem              = Plugin
  $.fn.collectItem.Constructor  = CollectItem

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, CollectItem.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.collect-item');
      if(!data){
        root.data('bs.collect-item',(data = new CollectItem(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'click',$(this));
  }

  $(window).on('load',function(){
    $('[data-toggle="collect-item"]').each(function(){
      var collectItem = $(this);
      Plugin.call(collectItem,collectItem.data());
    });
  });
}(jQuery);

+function($){
  'user strict'

  var AlertButton = function(element, options){
    this.element = $(element);
    this.options = options;
    var myTemplate = template(this.options);
    var container = $(this.options.container) || this.element.parent();
    this.element.popover({
      template : myTemplate,
      container : container,
      trigger : "click",
      placement : "bottom"
    });
  }

  $.fn.alertButton              = Plugin
  $.fn.alertButton.Constructor  = AlertButton

  var template = function(options){
    var popover = '<div class="popover" role="tooltip"><div class="arrow"></div> <div class="text-center"><h3 class="popover-title">$title</h3> <div style="width: 200px;padding: 5px;"> <input id="popover_msg" class="form-control" type="text" name="msg" maxlength="20"></div> <button class="btn btn-info middle" data-target="#popover_msg" style="margin-bottom: 5px;" onclick="$actionFn(event)" data-error-container="$error-container" data-order=$argument">确认</button></div></div>';
    popover = popover.replace("$title",options["title"]).replace("$content",options["content"]).replace("$actionFn",options["actionfn"]).replace("$argument","'" + options["argument"] + "'").replace("$error-container", options["errorContainer"]);
    return popover;
  }

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, AlertButton.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.alert-button');
      if(!data){
        root.data('bs.alert-button',(data = new AlertButton(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  $(window).on('load',function(){
    $('[data-toggle="alert-button"]').each(function(){
      var alertButton = $(this);
      Plugin.call(alertButton,alertButton.data());
    });
  });

}(jQuery);

+function($){
  'user strict'

  var SwitchBox = function(element, options){
    this.element = element;
    this.options = options;
    this.element.find(".switch-button").on("click",clickHandler);
    this.element.find(".box-item").hide();
    this.options.index = 0;
    this.options.max = this.element.find(".box-item").length;
    this.element.find(".box-item").eq(this.options.index).show();
  }

  $.fn.switchBox              = Plugin
  $.fn.switchBox.Constructor  = SwitchBox

  SwitchBox.prototype.switch = function(node){
    this.element.find(".box-item").hide();
    this.options.index++;
    if(this.options.index == this.options.max){
      this.options.index = 0;
    }
    this.element.find(".box-item").eq(this.options.index).fadeIn('fast');

  }

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, SwitchBox.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.switch-box');
      if(!data){
        root.data('bs.switch-box',(data = new SwitchBox(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'switch',$(this).parentsUntil('[data-toggle="switch-box"]').length > 0 ? $(this).parentsUntil('[data-toggle="switch-box"]').parent() : $(this).parent());
  }

  $(window).on('load',function(){
    $('[data-toggle="switch-box"]').each(function(){
      var switchBox = $(this);
      Plugin.call(switchBox, switchBox.data());
    })
  });
}(jQuery);

+function($){
  'user strict'

  var BtnSet = function(element, options){
    this.element = element;
    this.options = options;
    this.element.find("button").on("click",clickHandler);

  }

  $.fn.btnSet              = Plugin
  $.fn.btnSet.Constructor  = BtnSet

  BtnSet.prototype.switch = function(node){
    this.element.find("button").each(function(){
      $(this).removeClass("active");
      $($(this).data("target")).removeClass("active");
    });
    node.addClass("active");
    $(node.data("target")).addClass("active");
  }

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, BtnSet.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.btn-set');
      if(!data){
        root.data('bs.btn-set',(data = new BtnSet(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  var clickHandler = function(e){
    //e.preventDefault();
    Plugin.call($(this),'switch',$(this).parentsUntil('[data-toggle="btn-set"]').length > 0 ? $(this).parentsUntil('[data-toggle="btn-set"]').parent() : $(this).parent());
  }

  $(window).on('load',function(){
    $('[data-toggle="btn-set"]').each(function(){
      var btnSet = $(this);
      Plugin.call(btnSet, btnSet.data());
    })
  });
}(jQuery);

+function($){
  'user strict'
  $(window).on('load',function(){
    $('[data-toggle="dateTimePicker"]').each(function(){
      var dateString = $(this).data("date");
      if(typeof dateString != "undefined" && dateString != "undefined"){
        var date = new Date(dateString);
        var mDate = moment(date.toISOString());
        // if(mDate.isBefore(moment()) && $(this).data("min") == "now"){
        //   mDate = moment();
        // }
      }
      $(this).datetimepicker({
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
        defaultDate : mDate
      });
    })
  });
}(jQuery);

+function($){
  'user strict'

  var TimeSpan = function(element, options){
    this.element = element;
    this.options = options;
    if(this.options.format === "hourly"){
      this.element.text( utility.formattedHour(this.options.from) + " - " + utility.formattedHour(this.options.to));
    }else if(this.options.format === "date"){
      this.element.text( utility.formattedDate(this.options.from) + " - " + utility.formattedDate(this.options.to));
    }else if(this.options.format === "day"){
      this.element.text( utility.formattedDay(this.options.date));
    }
  }

  $.fn.timeSpan              = Plugin
  $.fn.timeSpan.Constructor  = TimeSpan

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, TimeSpan.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.time-span');
      if(!data){
        root.data('bs.time-span',(data = new TimeSpan(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  $(window).on('load',function(){
    $('[data-toggle="time-span"]').each(function(){
      var timeSpan = $(this);
      Plugin.call(timeSpan, timeSpan.data());
    })
  });
}(jQuery);

+function($){
  'user strict'

  var DurationFilter = function(element, options){
    this.element = element;
    this.options = options;
    this.element.find(".do").on("click",filterHandler);
  }

  $.fn.durationFilter              = Plugin
  $.fn.durationFilter.Constructor  = DurationFilter

  DurationFilter.prototype.filter = function(node){
    this.element.find(".alert").hide();
    var from = this.element.find(".from").data("DateTimePicker").date();
    var to = this.element.find(".to").data("DateTimePicker").date();
    if(from){
      from = from.unix();
    }
    if(to){
      to = to.unix();
    }
    var container = $(this.options.target);
    container.find(".item").each(function(){
      var date = $(this).data("created");
      if(from && to){
        if(date < from || date > to){
          $(this).hide();
        }else{
          $(this).show();
        }
      }else if(from && date < from){
        $(this).hide();
      }else if(to && date > to){
        $(this).hide();
      }else{
        $(this).show();
      }
    });
  }

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, DurationFilter.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.duration-filter');
      if(!data){
        root.data('bs.duration-filter',(data = new DurationFilter(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  var filterHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'filter',$(this).parentsUntil('[data-toggle="duration-filter"]').length > 0 ? $(this).parentsUntil('[data-toggle="duration-filter"]').parent() : $(this).parent());
  }

  $(window).on('load',function(){
    $('[data-toggle="duration-filter"]').each(function(){
      var durationFilter = $(this);
      Plugin.call(durationFilter, durationFilter.data());
    })
  });
}(jQuery);

+function($){
  'user strict'

  var DishSelector = function(element, options){
    this.element = element;
    this.options = options;
    this.element.find("#dishList li").on('click', selectHandler)
    this.element.find("#dishSelected li [data-type='close']").on('click', selectHandler);
  }

  $.fn.dishSelector              = Plugin
  $.fn.dishSelector.Constructor  = DishSelector

  DishSelector.prototype.select = function(node){
    this.options.isAppend = true;
    this.options.content = node.find("a[name='title']").text();
    var isRemote = this.options.isremote;
    var $this = this;
    if(isRemote){
      this.remote(node.data("id"),function(success){
        if(success){
          node.addClass('select');
          $this.render(node.data('id'));
        }
      });
    }else{
      node.addClass('select');
      $this.render(node.data('id'));
    }
  }

  DishSelector.prototype.remove = function(node){
    this.options.isAppend = false;
    this.options.content = node.find("a[name='title']").text();
    var isRemote = this.options.isremote;
    var $this = this;
    if(isRemote){
      this.remote(node.data("id"),function(success){
        if(success){
          node.removeClass('select');
          $this.render(node.data('id'));
        }
      });
    }else{
      node.removeClass('select');
      $this.render(node.data('id'));
    }
  }

  DishSelector.prototype.render = function(dishId){
    var isAppend = this.options.isAppend;
    var content = this.options.content;
    var selectedDishContainer = this.element.find("#dishSelected");
    var selectingDishContainer = this.element.find("#dishList");
    var mealId = this.options.mealid;
    if(isAppend){
      var li = '<li class="row" data-toggle="manipulate-item" data-id="' + dishId + '"> <div class="col-xs-6">&nbsp;<i class="manipulate-button fa fa-star text-grey cursor-pointer" data-type="feature"></i>&nbsp;<i class="manipulate-button fa fa-camera text-grey cursor-pointer" data-type="cover"></i><label name="title">' + content + '</label></div><div class="col-xs-1"><i class="fa fa-close cursor-pointer select" data-id="' + dishId + '" data-type="close" style="margin-left:10px;"></i></div> <div class="col-xs-4 vertical-align" style="height:52px;padding-top: -10px;"> <div class="input-group amount-input" data-toggle="amount-input"> <div class="input-group-addon minus">-</div> <input class="form-control" type="number" placeholder="1" value="1" style="min-width: 75px;"> <div class="input-group-addon add">+</div> </div> </div><div class="col-xs-3"></div> </li>';
      $.when(selectedDishContainer.append(li)).done(function(){
        selectedDishContainer.find("[data-type='close']").on('click', selectHandler);
        reloadComp(dishId);
      });
    }else{
      selectingDishContainer.find("li[data-id='" + dishId + "']").removeClass("select");
      selectedDishContainer.find("li[data-id='" + dishId +  "']").remove();
    }
  }

  DishSelector.prototype.remote = function(dishId, cb){
    var isAppend = this.options.isAppend;
    var alertView = this.element.find(".alert");
    alertView.hide();
    var mealId = this.options.mealid;
    var requestType = this.options.isAppend ? "POST" : "DELETE";
    var url = "/meal/" + mealId + "/dishes/" + dishId;
    $.ajax({
      url : url,
      type : requestType,
      success : function(){
        cb(true);
      },
      error : function(err){
        alertView.show();
        alertView.html(err.responseJSON ? err.responseJSON.responseText : err.responseText);
        cb(false);
      }
    })
  }

  function Plugin(option, root){
    var hasRoot = typeof root != 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, DishSelector.DEFAULTS, root.data(), typeof option == 'object' && option);
      var data = root.data('bs.dish-selector');
      if(!data){
        root.data('bs.dish-selector',(data = new DishSelector(root, options)));
      }
      if(typeof option == 'string'){
        data[option]($(this));
      }
    });
  }

  DishSelector.DEFAULTS = {

  }

  var reloadComp = function(dishId) {
    $('[data-toggle="amount-input"]').each(function(){
      var amountInput = $(this);
      amountInput.amountInput(amountInput.data(), amountInput);
    });
    $('[data-toggle="manipulate-item"][data-id="' + dishId + '"]').each(function(){
      var manipulate = $(this);
      manipulate.manipulate(manipulate.data(),manipulate);
    });
  }

  var selectHandler = function(e){
    e.preventDefault();
    var node = $(e.currentTarget);
    if(node.hasClass('select')){
      Plugin.call($(this),'remove',$(this).closest('[data-toggle="dish-selector"]'));
    }else{
      Plugin.call($(this),'select',$(this).closest('[data-toggle="dish-selector"]'));
    }
  }

  $(window).on('load',function(){
    $('[data-toggle="dish-selector"]').each(function(){
      var dishSelector = $(this);
      Plugin.call(dishSelector, dishSelector.data());
    })
  });
}(jQuery);

(function ($) {

  var defaults = {
    buttonSize: "btn-md",
    buttonType: "btn-default",
    labelMargin: "10px",
    scrollable: true,
    scrollableHeight: "250px",
    placeholder: {
      value: '',
      text: 'Please select country'
    }
  };

  var countries = {
    "AF": "Afghanistan",
    "AL": "Albania",
    "DZ": "Algeria",
    "AS": "American Samoa",
    "AD": "Andorra",
    "AO": "Angola",
    "AI": "Anguilla",
    "AG": "Antigua and Barbuda",
    "AR": "Argentina",
    "AM": "Armenia",
    "AW": "Aruba",
    "AU": "Australia",
    "AT": "Austria",
    "AZ": "Azerbaijan",
    "BS": "Bahamas",
    "BH": "Bahrain",
    "BD": "Bangladesh",
    "BB": "Barbados",
    "BY": "Belarus",
    "BE": "Belgium",
    "BZ": "Belize",
    "BJ": "Benin",
    "BM": "Bermuda",
    "BT": "Bhutan",
    "BO": "Bolivia, Plurinational State of",
    "BA": "Bosnia and Herzegovina",
    "BW": "Botswana",
    "BV": "Bouvet Island",
    "BR": "Brazil",
    "IO": "British Indian Ocean Territory",
    "BN": "Brunei Darussalam",
    "BG": "Bulgaria",
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "KH": "Cambodia",
    "CM": "Cameroon",
    "CA": "Canada",
    "CV": "Cape Verde",
    "KY": "Cayman Islands",
    "CF": "Central African Republic",
    "TD": "Chad",
    "CL": "Chile",
    "CN": "China",
    "CO": "Colombia",
    "KM": "Comoros",
    "CG": "Congo",
    "CD": "Congo, the Democratic Republic of the",
    "CK": "Cook Islands",
    "CR": "Costa Rica",
    "CI": "C" + "&ocirc;" + "te d'Ivoire",
    "HR": "Croatia",
    "CU": "Cuba",
    "CW": "Cura" + "&ccedil;" + "ao",
    "CY": "Cyprus",
    "CZ": "Czech Republic",
    "DK": "Denmark",
    "DJ": "Djibouti",
    "DM": "Dominica",
    "DO": "Dominican Republic",
    "EC": "Ecuador",
    "EG": "Egypt",
    "SV": "El Salvador",
    "GQ": "Equatorial Guinea",
    "ER": "Eritrea",
    "EE": "Estonia",
    "ET": "Ethiopia",
    "FK": "Falkland Islands (Malvinas)",
    "FO": "Faroe Islands",
    "FJ": "Fiji",
    "FI": "Finland",
    "FR": "France",
    "GF": "French Guiana",
    "PF": "French Polynesia",
    "TF": "French Southern Territories",
    "GA": "Gabon",
    "GM": "Gambia",
    "GE": "Georgia",
    "DE": "Germany",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GR": "Greece",
    "GL": "Greenland",
    "GD": "Grenada",
    "GP": "Guadeloupe",
    "GU": "Guam",
    "GT": "Guatemala",
    "GG": "Guernsey",
    "GN": "Guinea",
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HT": "Haiti",
    "HM": "Heard Island and McDonald Islands",
    "VA": "Holy See (Vatican City State)",
    "HN": "Honduras",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "IS": "Iceland",
    "IN": "India",
    "ID": "Indonesia",
    "IR": "Iran, Islamic Republic of",
    "IQ": "Iraq",
    "IE": "Ireland",
    "IM": "Isle of Man",
    "IL": "Israel",
    "IT": "Italy",
    "JM": "Jamaica",
    "JP": "Japan",
    "JE": "Jersey",
    "JO": "Jordan",
    "KZ": "Kazakhstan",
    "KE": "Kenya",
    "KI": "Kiribati",
    "KP": "Korea, Democratic People's Republic of",
    "KR": "Korea, Republic of",
    "KW": "Kuwait",
    "KG": "Kyrgyzstan",
    "LA": "Lao People's Democratic Republic",
    "LV": "Latvia",
    "LB": "Lebanon",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libya",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MO": "Macao",
    "MK": "Macedonia, the former Yugoslav Republic of",
    "MG": "Madagascar",
    "MW": "Malawi",
    "MY": "Malaysia",
    "MV": "Maldives",
    "ML": "Mali",
    "MT": "Malta",
    "MH": "Marshall Islands",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MU": "Mauritius",
    "YT": "Mayotte",
    "MX": "Mexico",
    "FM": "Micronesia, Federated States of",
    "MD": "Moldova, Republic of",
    "MC": "Monaco",
    "MN": "Mongolia",
    "ME": "Montenegro",
    "MS": "Montserrat",
    "MA": "Morocco",
    "MZ": "Mozambique",
    "MM": "Myanmar",
    "NA": "Namibia",
    "NR": "Nauru",
    "NP": "Nepal",
    "NL": "Netherlands",
    "NC": "New Caledonia",
    "NZ": "New Zealand",
    "NI": "Nicaragua",
    "NE": "Niger",
    "NG": "Nigeria",
    "NU": "Niue",
    "NF": "Norfolk Island",
    "MP": "Northern Mariana Islands",
    "NO": "Norway",
    "OM": "Oman",
    "PK": "Pakistan",
    "PW": "Palau",
    "PS": "Palestinian Territory, Occupied",
    "PA": "Panama",
    "PG": "Papua New Guinea",
    "PY": "Paraguay",
    "PE": "Peru",
    "PH": "Philippines",
    "PN": "Pitcairn",
    "PL": "Poland",
    "PT": "Portugal",
    "PR": "Puerto Rico",
    "QA": "Qatar",
    "RE": "R" + "&eacute;" + "union",
    "RO": "Romania",
    "RU": "Russian Federation",
    "RW": "Rwanda",
    "SH": "Saint Helena, Ascension and Tristan da Cunha",
    "KN": "Saint Kitts and Nevis",
    "LC": "Saint Lucia",
    "MF": "Saint Martin (French part)",
    "PM": "Saint Pierre and Miquelon",
    "VC": "Saint Vincent and the Grenadines",
    "WS": "Samoa",
    "SM": "San Marino",
    "ST": "Sao Tome and Principe",
    "SA": "Saudi Arabia",
    "SN": "Senegal",
    "RS": "Serbia",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SG": "Singapore",
    "SX": "Sint Maarten (Dutch part)",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "SB": "Solomon Islands",
    "SO": "Somalia",
    "ZA": "South Africa",
    "GS": "South Georgia and the South Sandwich Islands",
    "SS": "South Sudan",
    "ES": "Spain",
    "LK": "Sri Lanka",
    "SD": "Sudan",
    "SR": "Suriname",
    "SZ": "Swaziland",
    "SE": "Sweden",
    "CH": "Switzerland",
    "SY": "Syrian Arab Republic",
    "TW": "Taiwan, Province of China",
    "TJ": "Tajikistan",
    "TZ": "Tanzania, United Republic of",
    "TH": "Thailand",
    "TL": "Timor-Leste",
    "TG": "Togo",
    "TK": "Tokelau",
    "TO": "Tonga",
    "TT": "Trinidad and Tobago",
    "TN": "Tunisia",
    "TR": "Turkey",
    "TM": "Turkmenistan",
    "TC": "Turks and Caicos Islands",
    "TV": "Tuvalu",
    "UG": "Uganda",
    "UA": "Ukraine",
    "AE": "United Arab Emirates",
    "GB": "United Kingdom",
    "US": "United States",
    "UM": "United States Minor Outlying Islands",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VU": "Vanuatu",
    "VE": "Venezuela, Bolivarian Republic of",
    "VN": "Viet Nam",
    "VG": "Virgin Islands, British",
    "VI": "Virgin Islands, U.S.",
    "WF": "Wallis and Futuna",
    "EH": "Western Sahara",
    "YE": "Yemen",
    "ZM": "Zambia",
    "ZW": "Zimbabwe"
  };

  $.flagStrap = function (element, options, i) {

    var plugin = this;

    var uniqueId = generateId(8);

    plugin.countries = {};
    plugin.selected = {value: null, text: null};
    plugin.settings = {inputName: 'country-' + uniqueId};

    var $container = $(element);
    var htmlSelectId = 'flagstrap-' + uniqueId;
    var htmlSelect = '#' + htmlSelectId;

    plugin.init = function () {

      // Merge in global settings then merge in individual settings via data attributes
      plugin.countries = countries;

      // Initialize Settings, priority: defaults, init options, data attributes
      plugin.countries = countries;
      plugin.settings = $.extend({}, defaults, options, $container.data());

      if (undefined !== plugin.settings.countries) {
        plugin.countries = plugin.settings.countries;
      }

      if (undefined !== plugin.settings.inputId) {
        htmlSelectId = plugin.settings.inputId;
        htmlSelect = '#' + htmlSelectId;
      }

      // Build HTML Select, Construct the drop down button, Assemble the drop down list items element and insert
      $container
        .addClass('flagstrap')
        .append(buildHtmlSelect)
        .append(buildDropDownButton)
        .append(buildDropDownButtonItemList);

      // Check to see if the onSelect callback method is assigned / callable, bind the change event for broadcast
      if (plugin.settings.onSelect !== undefined && plugin.settings.onSelect instanceof Function) {
        $(htmlSelect).change(function (event) {
          var element = this;
          options.onSelect($(element).val(), element);
        });
      }

      // Hide the actual HTML select
      $(htmlSelect).hide();

    };

    var buildHtmlSelect = function () {
      var htmlSelectElement = $('<select/>').attr('id', htmlSelectId).attr('name', plugin.settings.inputName);

      $.each(plugin.countries, function (code, country) {
        var optionAttributes = {value: code};
        if (plugin.settings.selectedCountry !== undefined) {
          if (plugin.settings.selectedCountry === code) {
            optionAttributes = {value: code, selected: "selected"};
            plugin.selected = {value: code, text: country}
          }
        }
        htmlSelectElement.append($('<option>', optionAttributes).text(country));
      });

      if (plugin.settings.placeholder !== false) {
        htmlSelectElement.prepend($('<option>', {
          value: plugin.settings.placeholder.value,
          text: plugin.settings.placeholder.text
        }));
      }

      return htmlSelectElement;
    };

    var buildDropDownButton = function () {

      var selectedText = $(htmlSelect).find('option').first().text();
      var selectedValue = $(htmlSelect).find('option').first().val();

      selectedText = plugin.selected.text || selectedText;
      selectedValue = plugin.selected.value || selectedValue;

      if (selectedValue !== plugin.settings.placeholder.value) {
        var $selectedLabel = $('<i/>').addClass('flagstrap-icon flagstrap-' + selectedValue.toLowerCase()).css('margin-right', plugin.settings.labelMargin);
      } else {
        var $selectedLabel = $('<i/>').addClass('flagstrap-icon flagstrap-placeholder');
      }

      var buttonLabel = $('<span/>')
        .addClass('flagstrap-selected-' + uniqueId)
        .html($selectedLabel)
        .append(selectedText);

      var button = $('<button/>')
        .attr('type', 'button')
        .attr('data-toggle', 'dropdown')
        .attr('id', 'flagstrap-drop-down-' + uniqueId)
        .addClass('btn ' + plugin.settings.buttonType + ' ' + plugin.settings.buttonSize + ' dropdown-toggle')
        .html(buttonLabel);

      $('<span/>')
        .addClass('caret')
        .css('margin-left', plugin.settings.labelMargin)
        .insertAfter(buttonLabel);

      return button;

    };

    var buildDropDownButtonItemList = function () {
      var items = $('<ul/>')
        .attr('id', 'flagstrap-drop-down-' + uniqueId + '-list')
        .attr('aria-labelled-by', 'flagstrap-drop-down-' + uniqueId)
        .addClass('dropdown-menu');

      if (plugin.settings.scrollable) {
        items.css('height', 'auto')
          .css('max-height', plugin.settings.scrollableHeight)
          .css('overflow-x', 'hidden');
      }

      // Populate the bootstrap dropdown item list
      $(htmlSelect).find('option').each(function () {

        // Get original select option values and labels
        var text = $(this).text();
        var value = $(this).val();

        // Build the flag icon
        if (value !== plugin.settings.placeholder.value) {
          var flagIcon = $('<i/>').addClass('flagstrap-icon flagstrap-' + value.toLowerCase()).css('margin-right', plugin.settings.labelMargin);
        } else {
          var flagIcon = null;
        }


        // Build a clickable drop down option item, insert the flag and label, attach click event
        var flagStrapItem = $('<a/>')
          .attr('data-val', $(this).val())
          .html(flagIcon)
          .append(text)
          .on('click', function (e) {
            $(htmlSelect).find('option').removeAttr('selected');
            $(htmlSelect).find('option[value="' + $(this).data('val') + '"]').attr("selected", "selected");
            $(htmlSelect).trigger('change');
            $('.flagstrap-selected-' + uniqueId).html($(this).html());
            e.preventDefault();
          });

        // Make it a list item
        var listItem = $('<li/>').prepend(flagStrapItem);

        // Append it to the drop down item list
        items.append(listItem);

      });

      return items;
    };

    function generateId(length) {
      var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

      if (!length) {
        length = Math.floor(Math.random() * chars.length);
      }

      var str = '';
      for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
      return str;
    }

    plugin.init();

  };

  $.fn.flagStrap = function (options) {

    return this.each(function (i) {
      if ($(this).data('flagStrap') === undefined) {
        $(this).data('flagStrap', new $.flagStrap(this, options, i));
      }
    });

  }

})(jQuery);