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
    $('[data-toggle="dropdown"]').next().find("li").click(function(e){
      //e.preventDefault();
      var text = $(this).text();
      var value = $(this).find("a").attr("value");
      var parent = $(this).parent().prev();
      parent.text(text);
      parent.attr("value",value);
      parent.trigger("click.after");
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
    if(this.options.select){
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
    if(this.options.select){
      var method = "DELETE";
      ele.removeClass('text-red');
    }else{
      method = "POST";
      ele.addClass('text-red');
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
    var myTemplate = template(this.options.title, this.options.content, this.options.actionfn, this.options.argument);
    var container = this.element.parent();
    this.element.popover({
      template : myTemplate,
      container : container,
      trigger : "click",
      placement : "bottom"
    });
  }

  $.fn.alertButton              = Plugin
  $.fn.alertButton.Constructor  = AlertButton

  var template = function(title,content,actionFn,arg1){
    var popover = '<div class="popover" role="tooltip"><div class="arrow"></div> <div class="text-center"><h3 class="popover-title">$title</h3> <div style="width: 200px;padding: 5px;"> <input id="popover_msg" class="form-control" type="text" name="msg" maxlength="20"></div> <button class="btn btn-info middle" data-target="#popover_msg" style="margin-bottom: 5px;" onclick="$actionFn(event)" data-order=$argument">确认</button></div></div>';
    popover = popover.replace("$title",title).replace("$content",content).replace("$actionFn",actionFn).replace("$argument","'" + arg1 + "'");
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
      if(typeof dateString != "undefined"){
        var date = new Date(dateString);
        var mDate = moment(date.toISOString());
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
