/**
 * Created by shengrong on 1/25/16.
 */
import 'moment';
import { helperMethod } from "../utils/helper";
import { utility } from "../utils/utility";

let pagination = function ($) {
  'use strict';

  let Pagination = function(element, options){
    this.$element = $(element);
    this.$options = options;
    this.$curPage = parseInt(this.$options.index);
    if(this.$options.target){
      this.render(false);
    }
  };

  Pagination.prototype.render = function(isUpdate){
    if(!isUpdate){
      let parent = $(this.$options.target);
      let itemCount = parent.find(".item").length;
      let npp = this.$options.npp;
      this.$element.empty();
      this.$element.hide();
      if(itemCount === 0 || itemCount <= npp){
        return
      }else{
        let pages = Math.floor(itemCount / npp);
        let left = itemCount % npp;
        if(left>0){
          pages++;
        }
        this.$pages = pages;
      }
      if(this.$pages > 1){
        this.$element.show();
        for(var i = 0; i < this.$pages; i++){
          var li = $("<li class='page-item'><a class='page-link' href='javascript:void(0)'></a></li>");
          if(this.$curPage && i===this.$curPage-1){
            li.addClass("active");
          }else if(i===0 && !this.$curPage){
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
          if(index === curPage){
            $(this).addClass('active');
          }
        });
      }else{
        //no page data on page change, something went wrong
      }
    }
    this.showContent();
  };

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
  };

  Pagination.prototype.change = function(node){
    this.$curPage = node.data("index");
    this.render(true);
  };

  Pagination.DEFAULTS = {
    npp : 10,
    index : 1
  };

  $.fn.pagination           = Plugin;
  $.fn.pagination.Constructor = Pagination;

  function Plugin(option ,root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      var $this = $(this);
      if(!hasRoot) root = $(this);
      var options = $.extend({},Pagination.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data("bs.pagination");
      if(!data) root.data("bs.pagination",(data = new Pagination(root, options)));
      if(typeof option === 'string') data[option]($this);
    });
  }

  var pageChangeHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'change',$(this).parentsUntil('[data-trigger="pagination"]').length > 0 ? $(this).parentsUntil('[data-trigger="pagination"]').parent() : $(this).parent());
  };
}(jQuery);

let tab = function($){
  'use strict';

  let Tab = function(element, options){
    this.element = $(element);
    this.element.on('click', this.click);
  }

  Tab.prototype.click = function(e){
    e.preventDefault();
    // e.stopPropagation();
    $(this).data("bs.tab").select($(e.currentTarget));
  }

  Tab.prototype.select = function(button){
    button.parents("ul").find(".nav-link").removeClass('active');
    button.parents("ul").find(".nav-item").removeClass('active');
    button.parents(".btn-group").find("button").removeClass('active');
    button.parent().addClass('active');
    button.addClass('active');
    var tabTarget = $(button.data("href"));
    var parent = tabTarget.siblings('.tab-pane').hide().removeClass('active');
    tabTarget.stop().fadeIn("fast").addClass('active');
    helperMethod.removeHash();
    button.trigger('shown.bs.tab');
    button.parent().trigger('change');
  }

  Tab.prototype.show = function(button){}

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var $this = $(this);
      var options = $.extend({}, Tab.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data("bs.tab");
      if(!data) root.data("bs.tab",(data = new Tab(root, options)));
      if(typeof option === 'string') data[option]($this);
    });
  }

  $.fn.tab             = Plugin;
  $.fn.tab.Constructor = Tab;

}(jQuery);

var datePickup = function($){
  'use strict';

  var DatePicker = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},DatePicker.DEFAULTS, options);
    if(this.$options.from){
      this.$element.find(".date a").on("change",this.dateChangeHandler);
      this.show();
    }
  };

  DatePicker.DEFAULTS = {
    from : new Date()
  };

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
  };

  //select today's date
  DatePicker.prototype.pickNow = function(){
    var from = DatePicker.DEFAULTS.from;
    var month = from.getMonth() + 1;
    var day = from.getDate();
    var year = from.getUTCFullYear();
    this.$element.find(".date").each(function(){
      var date_format = $(this).data("date-format");
      if(date_format==="month"){
        $(this).find("a").html(month + "月");
        $(this).find("a").attr("value",month);
      }else if(date_format==="day"){
        $(this).find("a").html(day + "日");
        $(this).find("a").attr("value",day);
      }else{
        $(this).find("a").html(year + "年");
        $(this).find("a").attr("value",year);
      }
    });
  };

  DatePicker.prototype.dateChangeHandler = function(e){
    e.preventDefault();
    var ele = $(this).parentsUntil($("[data-toggle='date-picker']")).parent();
    Plugin.call($(this),"show",ele);
  };

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
  };

  //show date result from select date
  DatePicker.prototype.show = function(){
    var from = new Date(this.$options.from);
    var monthSection = this.$element.find("[data-date-format='month']");
    var yearSection = this.$element.find("[data-date-format='year']");

    var yearDropDownBtn = yearSection.find("[data-toggle='dropdown']");
    var monthDropDownBtn = monthSection.find("[data-toggle='dropdown']");

    var yearSelected = parseInt(yearDropDownBtn.attr("value"));
    var monthSelected = parseInt(monthSection.find("[data-toggle='dropdown']").attr("value"));

    if(monthSection.length>0){
      if(yearSelected === from.getUTCFullYear()){
        var month = parseInt(from.getMonth()) + 1;
      }else{
        month = 1;
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
      if(monthSelected === from.getMonth() + 1){
        var day = parseInt(from.getDate());
        var curMonth = monthSelected;
      }else if(monthSelected){
        day = 1;
        curMonth = monthSelected;
      }else{
        day = parseInt(from.getDate());
        curMonth = from.getMonth() + 1;
      }
      var dayInMonth = DatePicker.dateData.dayInMonth[curMonth];
      list = daySection.find("ul");
      list.empty();
      for(i= day; i <= dayInMonth; i++){
        var dayItem = "<li><a value='" + i + "'>" + i + "日</a></li>";
        list.append(dayItem);
      }
    }

    if(yearSection.length>0){
      var year = from.getUTCFullYear();
      list = yearSection.find("ul");
      list.empty();
      for(i= year; i <= year+1; i++){
        var yearItem = "<li><a value='" + i + "'>" + i + "年</a></li>";
        list.append(yearItem);
      }
    }

    var hourSection = this.$element.find("[data-date-format='hour']");
    if(hourSection.length > 0){
      list = hourSection.find("ul");
      list.empty();
      for(i=0; i <= 24; i++){
        var hourItem = "<li><a value='" + i + "'>" + i + ":00</a></li>";
        list.append(hourItem);
      }
    }
    this.addEvent();
  };

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var $this = $(this);
      var options = $.extend({}, DatePicker.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data("bs.amount-input");
      if(!data) root.data("bs.amount-input",(data = new DatePicker(root, options)));
      if(typeof option === 'string') data[option]($this);
    });
  }

  $.fn.datePickup             = Plugin;
  $.fn.datePickup.Constructor = DatePicker;

}(jQuery);

let amountInput = function($){
  'use strict';

  let AmountInput = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},AmountInput.DEFAULTS, options);
    this.$value = parseInt(this.$element.find("input").val());
    if(this.$options.customclickhandle){
      return;
    }
    this.$element.find(".add").on('click',addHandler);
    this.$element.find(".minus").on('click',minusHandler);
  };

  AmountInput.DEFAULTS = {
    init : 1,
    max : 100
  };

  AmountInput.prototype.update = function(){
    this.$value = parseInt(this.$element.find("input").val());
  };

  AmountInput.prototype.add = function(node){
    if(this.$value < this.$options.max){
      this.$value = this.$value + 1;
    }
    node.prev().val(this.$value);
  };

  AmountInput.prototype.minus = function(node){
    if(this.$value > 0){
      this.$value = this.$value - 1;
    }
    node.next().val(this.$value);
  };

  var addHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'add',$(this).parentsUntil("[data-toggle='amount-input']").length > 0 ? $(this).parentsUntil("[data-toggle='amount-input']").parent() : $(this).parent())
    $(this).trigger('change');
  };

  var minusHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'minus',$(this).parentsUntil("[data-toggle='amount-input']").length > 0 ? $(this).parentsUntil("[data-toggle='amount-input']").parent() : $(this).parent());
    $(this).trigger('change');
  };

  function Plugin(option,root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var $this = $(this);
      var options = $.extend({}, AmountInput.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data("bs.amount-input");
      if(!data) root.data("bs.amount-input",(data = new AmountInput(root, options)));
      if(typeof option === 'string') data[option]($this);
    });
  }

  $.fn.amountInput             = Plugin;
  $.fn.amountInput.Constructor = AmountInput;

}(jQuery);


let countDown = function($){
  'use strict';

  let CountDown = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},CountDown.DEFAULTS, options);
    this.$diff = this.$element.data("diff");
    let _this = this;
    setInterval(function(){
      _this.update();
    },1000);
  };

  CountDown.DEFAULTS = {
  };

  CountDown.prototype.update = function () {
    this.$diff -= 1000;
    let f = moment.utc(this.$diff).format("D day HH:mm:ss");
    this.$element.text(f);
  }

  function Plugin(option,root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var $this = $(this);
      var options = $.extend({}, CountDown.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data("bs.count-down");
      if(!data) root.data("bs.conut-down",(data = new CountDown(root, options)));
      if(typeof option === 'string') data[option]($this);
    });
  }

  $.fn.countDown             = Plugin;
  $.fn.countDown.Constructor = CountDown;

}(jQuery);



let exclusiveInput = function($){
  'use strict';
  let ExclusiveInput = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},ExclusiveInput.DEFAULTS, options);
    this.$element.find(".input-group").off('change');
    this.$element.find(".input-group").on('change',onchangeHandler);
  };

  ExclusiveInput.DEFAULTS = {};

  ExclusiveInput.prototype.change = function(node){
    var ele = this.$element;
    ele.find(".input-group").each(function(){
      if($(this).attr('name')!==node.attr('name')){
        $(this).find("input").val('');
      }
    });
  };

  function Plugin(option,root){
    var hasRoot = typeof root !== 'undefined';
    if(!hasRoot) root = $(this);
    return this.each(function(){
      var options = $.extend({}, ExclusiveInput.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data("bs.exclusive-input");
      if(!data) root.data("bs.exclusive-input",(data = new ExclusiveInput(root, options)));
      if(typeof option === 'string') data[option]($(this));
    });
  }

  $.fn.exclusiveInput           = Plugin;
  $.fn.exclusiveInput.Constructor = ExclusiveInput;

  var onchangeHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'change',$(this).parentsUntil('[data-toggle="exclusive-input"]').parent());
  };

}(jQuery);

let manipulateItem = function($){
  'use strict';

  let ManipulateItem = function(element, options){
    this.$element = $(element);
    this.$options = $.extend({},ManipulateItem.DEFAULTS, options);
    this.$element.find(".manipulate-button").off('click');
    this.$element.find(".manipulate-button").on('click',clickHandler);
  };

  ManipulateItem.DEFAULTS = {};

  ManipulateItem.reset = function(){
    $("[data-toggle='manipulate-item'] .manipulate-button[data-type='cover']").each(function(){
      if($(this).hasClass("text-yellow")){
        $(this).removeClass("text-yellow");
        $(this).addClass("text-grey");
        var element = $(this).parentsUntil("[data-toggle='manipulate-item']").parent();
        element.data($(this).data().type,false);
      }
    });
  };

  ManipulateItem.prototype.operate = function(button){
    var element = this.$element;
    var mealId = element.data("meal-id");
    var dishId = element.data("id");
    var postType;
    if(button.hasClass("text-grey")){
      if(button.data().type === "cover"){
        ManipulateItem.reset();
      }else if(button.data().type === "fire"){
        if(mealId && dishId){
          postType = "POST";
          $.ajax({
            url : "/dish/"+dishId+"/dynamicMeals/" + mealId,
            type : postType,
            success : function(){
              helperMethod.makeAToast(__('saveSuccess'),'success');
            },
            error : function(){
              helperMethod.makeAToast(__('error'),'error');
            }
          })
        }
      }
      button.removeClass("text-grey");
      button.addClass("text-yellow");
      element.data(button.data().type,true);
    }else{
      if(button.data().type === "fire"){
        if(mealId && dishId){
          postType = "DELETE";
          $.ajax({
            url : "/dish/"+dishId+"/dynamicMeals/" + mealId,
            type : postType,
            success : function(){
              helperMethod.makeAToast(__('saveSuccess'),'success');
            },
            error : function(){
              helperMethod.makeAToast(__('error'),'error');
            }
          })
        }
      }else if(button.data().type === "cover"){
        return;
      }
      button.removeClass("text-yellow");
      button.addClass("text-grey");
      element.data(button.data().type,false);
    }
    element.trigger("change");
  };

  function Plugin(option,root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, ManipulateItem.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data('bs.manipulate-item');
      if(!data){
        root.data('bs.manipulate-item',(data = new ManipulateItem(root, options)));
      }
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }

  $.fn.manipulate             = Plugin;
  $.fn.manipulate.Constructor = ManipulateItem;

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'operate', $(this).parentsUntil("[data-toggle='manipulate-item']").parent());
  };

}(jQuery);

let starSet = function($){
  'use strict';

  let StarSet = function(element, options){
    this.element = $(element);
    this.options = options;
    if(this.element.data("rate")){
      this.show();
    }else{
      this.element.find("i").addClass("text-lightgrey");
      this.element.find("i").on('click',clickHandler);
      this.element.find("i").on('mouseover',overHandler);
    }
  };

  StarSet.DEFAULTS = {};

  //show star based on rating
  StarSet.prototype.show = function(){
    var ele = this.element;
    var rate = ele.data("rate");
    rate = (Math.floor(rate * 4))/4;
    //0,1,1.25,1.5,1.75,2
    var index = rate;
    for(var i=1; i <= 5; i++){
      var j = i - 1;
      var star = ele.find("i:eq(" + j +  ")");
      star.addClass("text-lightgrey");
      if(i <= index){
        star.removeClass("text-lightgrey").addClass("text-yellow");
      }else{
        var left = i-index;
        var count = left / 0.25;
        if(count===1){
          //over 0.75
          star.removeClass("text-lightgrey").addClass("text-yellow");
        }else if(count === 2 || count===3){
          star.removeClass("fa-star").addClass("fa-star-half").removeClass("text-lightgrey").addClass("text-yellow");
        }else{
          star.removeClass("fas").addClass("fal");
        }
      }
    }
  };

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
  };

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
  };

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'click',$(this).parentsUntil('[data-toggle="star-set"]').length > 0 ? $(this).parentsUntil('[data-toggle="star-set"]').parent() : $(this).parent());
  };

  var overHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'over',$(this).parentsUntil('[data-toggle="star-set"]').length > 0 ? $(this).parentsUntil('[data-toggle="star-set"]').parent() : $(this).parent());
  };

  $.fn.starSet              = Plugin;
  $.fn.starSet.Constructor  = StarSet;

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, StarSet.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data('bs.star-set');
      if(!data){
        root.data('bs.star-set',(data = new StarSet(root, options)));
      }
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }
}(jQuery);

let collectItem = function($){
  'use strict';

  let CollectItem = function(element, options){
    this.element = $(element);
    this.options = options;
    if(this.options.select === "true" || this.options.select === true){
      if(this.options["heart"]){
        this.element.addClass("text-red");
      }
    }else{

    }
    this.element.on("click",clickHandler);
  };

  CollectItem.DEFAULTS = {

  };

  //click on star
  CollectItem.prototype.click = function(node){
    var ele = this.element;
    var mealId = ele.data("meal");
    var userId = ele.data("user");
    if(!userId || userId === "undefined"){
      return;
    }
    if(this.options.select === "true" || this.options.select === true){
      var method = "DELETE";
      ele.removeClass('text-red');
      this.options.select = false;
    }else{
      method = "POST";
      ele.addClass('text-red');
      this.options.select = true;
    }
    var $this = this;
    $.ajax({
      url : "/user/" + userId + "/collects/" + mealId,
      data : {},
      method : method,
      success : function(){
        if($this.options.cb){
          eval($this.options.cb);
        }
      },error : function(err){}
    });
  };

  $.fn.collectItem              = Plugin;
  $.fn.collectItem.Constructor  = CollectItem;

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, CollectItem.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data('bs.collect-item');
      if(!data){
        root.data('bs.collect-item',(data = new CollectItem(root, options)));
      }
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'click',$(this));
  };

}(jQuery);

let alertButton = function($){
  'user strict';

  let AlertButton = function(element, options){
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
  };

  $.fn.alertButton              = Plugin;
  $.fn.alertButton.Constructor  = AlertButton;

  var template = function(options){
    var popover =
      '<div class="popover" role="tooltip">' +
      '<div class="arrow"></div>' +
      '<h3 class="popover-header">$title</h3>' +
      '<div class="popover-body">$content' +
      '</div></div>';
    popover = popover.replace("$title",options["title"]).replace("$content",options["content"]);
    return popover;
  };

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, AlertButton.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data('bs.alert-button');
      if(!data){
        root.data('bs.alert-button',(data = new AlertButton(root, options)));
      }
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }

}(jQuery);

let switchBox = function($){
  'user strict'

  let SwitchBox = function(element, options){
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
    if(this.options.index === this.options.max){
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
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'switch',$(this).parentsUntil('[data-toggle="switch-box"]').length > 0 ? $(this).parentsUntil('[data-toggle="switch-box"]').parent() : $(this).parent());
  }

}(jQuery);

let btnSet = function($){
  'user strict'

  let BtnSet = function(element, options){
    this.element = element;
    this.options = options;
    this.element.children().off("click");
    this.element.children().on("click",clickHandler);
    this.element.children().removeClass("disabled");
  }

  $.fn.btnSet              = Plugin
  $.fn.btnSet.Constructor  = BtnSet

  BtnSet.prototype.switch = function(node){
    this.element.children().each(function(){
      $(this).removeClass("active");
      $($(this).data("target")).removeClass("active");
    });
    node.addClass("active");
    $(node.data("target")).addClass("active");
    var a = node.find("a");
    if(a.length){
      var href = a.attr('href');
      var offset = a.data("offset");
      helperMethod.jumpTo(href, offset);
    }
    this.element.trigger('change');
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
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }

  var clickHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'switch',$(this).parentsUntil('[data-toggle="btn-set"]').length > 0 ? $(this).parentsUntil('[data-toggle="btn-set"]').parent() : $(this).parent());
  }

}(jQuery);

let timeSpan = function($){
  'user strict'

  let TimeSpan = function(element, options){
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

}(jQuery);

let durationFilter = function($){
  'user strict'

  let DurationFilter = function(element, options){
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

}(jQuery);

let dishSelector = function($){
  'user strict'

  let DishSelector = function(element, options){
    this.element = element;
    this.options = options;
    this.element.find("#dishList li").on('click', selectHandler)
    this.element.find("#dishSelected li [data-type='close']").on('click', selectHandler);
  };

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
  };

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
  };

  DishSelector.prototype.render = function(dishId){
    var isAppend = this.options.isAppend;
    var content = this.options.content;
    var selectedDishContainer = this.element.find("#dishSelected");
    var isCover = selectedDishContainer.children().length === 0;
    var selectingDishContainer = this.element.find("#dishList");
    var mealId = this.options.mealid || '';
    var isCoverClass = isCover ? "text-yellow" : "text-grey";
    if(isAppend){
      var li = '<li class="d-flex justify-content-around vertical-align" data-toggle="manipulate-item" data-meal-id="' + mealId + '" data-id="' + dishId + '" data-cover=' + isCover + '>' +
        '<div><button class="close cursor-pointer select" data-id="' + dishId + '" data-type="close" style="margin-left:10px;"><span aria-hidden="true">&times;</span></button></div>' +
        '<div class="w-100 flex-grow-1">&nbsp;&nbsp;' +
        '<i data-type="feature" class="manipulate-button fa fa-star text-grey cursor-pointer"></i>&nbsp;' +
        '<i data-type="fire" class="manipulate-button fa fa-fire text-grey cursor-pointer"></i>&nbsp;' +
        '<i data-type="cover" class="manipulate-button fa fa-camera cursor-pointer ' + isCoverClass + '"></i>&nbsp;' +
        '<label name="title">' + content + '</label>' +
        '</div>' +
        '<div class="vertical-align"> ' +
        '<div class="input-group amount-input" data-toggle="amount-input"> ' +
        '<div class="input-group-prepend minus"><span class="input-group-text">-</span></div> ' +
        '<input class="form-control" type="number" placeholder="1" value="1" style="min-width:50px;">' +
        '<div class="input-group-append add"><span class="input-group-text">+</span></div> </div> </div>' +
        ' </li>';
      $.when(selectedDishContainer.append(li)).done(function(){
        selectedDishContainer.find("[data-type='close']").on('click', selectHandler);
        reloadComp(dishId);
      });
    }else{
      selectingDishContainer.find("li[data-id='" + dishId + "']").removeClass("select");
      selectedDishContainer.find("li[data-id='" + dishId +  "']").remove();
    }
  };

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
  };

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, DishSelector.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data('bs.dish-selector');
      if(!data){
        root.data('bs.dish-selector',(data = new DishSelector(root, options)));
      }
      if(typeof option === 'string'){
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
}(jQuery);

let inputToggle = function($){
  'user strict'

  let InputToggle = function(element, options){
    this.element = element;
    this.options = options;
    var targetEle = this.options.target ? $(this.options.target).children().first() : this.element.next();
    var secondInput = targetEle.next();
    secondInput.css('display', 'none');
    this.element.on('click', toggleHandler);
  }

  $.fn.inputToggle              = Plugin
  $.fn.inputToggle.Constructor  = InputToggle

  InputToggle.prototype.toggle = function(){
    var targetEle = this.options.target ? $(this.options.target).children().first() : this.element.next();
    var firstInput = targetEle;
    var secondInput = targetEle.next();
    if(firstInput.css('display') === 'none'){
      firstInput.css('display', this.options.displaystyle);
      secondInput.css('display', 'none');
    }else{
      firstInput.css('display', 'none');
      secondInput.css('display', this.options.displaystyle);
    }
  }

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, InputToggle.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data('bs.input-toggle');
      if(!data){
        root.data('bs.input-toggle',(data = new InputToggle(root, options)));
      }
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }

  InputToggle.DEFAULTS = {
    displaystyle : 'block'
  }

  var toggleHandler = function(e){
    e.preventDefault();
    Plugin.call($(this),'toggle');
  }

}(jQuery);

let popupTooltip = function($){
  let PopupTooltip = function(element, options){
    this.element = element;
    this.options = options;
    var trigger = options.trigger;
    this.element.on(trigger, triggerHandler);
  }

  PopupTooltip.prototype.trigger = function(){
    setTooltip(this.element, this.options.popuptext);
    hideTooltip(this.element);
  }

  function setTooltip(btn, message) {
    $(btn).tooltip('hide')
      .attr('data-original-title', message)
      .tooltip('show');
  }

  function hideTooltip(btn) {
    setTimeout(function() {
      $(btn).tooltip('hide');
    }, 1000);
  }

  function triggerHandler(e){
    e.preventDefault();
    Plugin.call($(this), 'trigger');
  }

  function Plugin(option, root){
    var hasRoot = typeof root !== 'undefined';
    return this.each(function(){
      if(!hasRoot) root = $(this);
      var options = $.extend({}, PopupTooltip.DEFAULTS, root.data(), typeof option === 'object' && option);
      var data = root.data('bs.popup-tooltip');
      if(!data){
        root.data('bs.popup-tooltip',(data = new PopupTooltip(root, options)));
      }
      if(typeof option === 'string'){
        data[option]($(this));
      }
    });
  }

  $.fn.popupTooltip = Plugin;
  $.fn.popupTooltip.Construtor = PopupTooltip;

}(jQuery);

export { pagination, tab, datePickup, amountInput, countDown, exclusiveInput, manipulateItem, starSet, collectItem, alertButton, switchBox, btnSet, timeSpan, durationFilter, dishSelector, inputToggle, popupTooltip }
