/*
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
  - jumpTo : "scroll page to element with specific id"
  - search : "on user search handler"
  - createCookie : "create new cookie by name"
  - readCookie : "get cookie by name"
  - eraseCookie : "remove a cookie by name"
  - loadStripeJS : "load Stripe js"
  - isViewport : "xs,sm,md,lg,xl"
  - isPC
 */

import { utility } from './utility.js';
import VAR from '../variable';

let googleAPILoaded;
let helperMethod = {
  geolocate : function (autocomplete) {
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
  },

  //UI Components setup
  setupStepContainer : function(){
    console.log("step container");
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
  },

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
  },

  browserVersion : function(){
    var standalone = window.navigator.standalone,
      userAgent = window.navigator.userAgent.toLowerCase(),
      safari = /safari/.test( userAgent ),
      ios = /iphone|ipod|ipad/.test( userAgent );

    if(userAgent.match(/MicroMessenger/i) && userAgent.match(/MicroMessenger/i)[0]==="micromessenger") {
      return 'uiwebview';
    }else{
      return '';
    }
  },

  makeAToast : async function(msg, type){
    const { default: toastr } = await import(
      /* webpackChunkName: "toaster" */
      /* webpackPrefetch: true */
      '../library/jquery.toaster.js'
      );
    type = type || 'warning';
    if(typeof toastr[type] === 'function'){
      toastr[type](msg);
    }
  },

  getMsgFromError : function(err){
    var responseJSON = err['responseJSON'];
    return responseJSON ? (responseJSON.responseText || responseJSON.summary) : err.responseText
  },

  //Modal open/switch
  toggleModal : function(event, cb){
    $('body').addClass("loading");
    var target = event.currentTarget ? event.currentTarget : event;
    var modalId = $(target).data('target');
    var url = $(target).data("href");
    this.toggleModalUrl(url, modalId, target, cb);
  },

  getModalFromUrl : async function(model, action){
    console.log("importing templates: " + model + "/" + action);
    switch(model){
      case 'user':
        switch(action){
          case 'signin':
            var { default: content } = await import(/* webpackChunkName: 'signinTemplate' */ '../../templates/user/signin.html');
            return content;
          case 'signup':
            var { default: content } = await import(/* webpackChunkName: 'signupTemplate' */ '../../templates/user/signup.html');
            return content;
          case 'sendEmail':
            var { default: content } = await import(/* webpackChunkName: 'sendEmailTemplate' */ '../../templates/user/sendEmail.html');
            return content;
          case 'bank':
            var { default: content } = await import(/* webpackChunkName: 'bankTemplate' */ '../../templates/user/bank.html');
            return content;
          case 'address':
            var { default: content } = await import(/* webpackChunkName: 'addressTemplate' */ '../../templates/user/address.html');
            return content;
        }
        break;
      case 'meal':
        switch(action){
          case 'map':
            var { default: content } = await import(/* webpackChunkName: 'map' */ '../../templates/meal/map.html');
            return content;
        }
        break;
      case 'dish':
        switch(action){
          case 'preference':
            var { default: content } = await import(/* webpackChunkName: 'dishPreference' */ '../../templates/dish/preference.html');
            return content;
        }
        break;
    }
  },

  toggleModalUrl : async function(url, modalId, target, cb){
    var _this = this;
    var model = $(target).data('model');
    var action = $(target).data('action');
    var modal = $(modalId);
    if(modal.hasClass('show')){
      modal.on('hidden.bs.modal', async function(){
        utility.map = null;
        modal.off('hidden.bs.modal');
        modal.on('shown.bs.modal',function(){
          modal.off('shown.bs.modal');
          modal.modal('show');
          $('body').removeClass("loading");
        });
        if(url){
          $(modalId+' .modal-content').load(url);
          modal.modal();
          if(cb){cb(target);}
        }else{
          const urlContent = await _this.getModalFromUrl(model,action);
          $(modalId+' .modal-content').html(urlContent);
          modal.modal();
          if(cb){cb(target);}
        }
      });
      modal.modal('hide');
      modal.removeData('bs.modal');
    }else{
      modal.removeData('bs.modal');
      modal.on('shown.bs.modal',function(){
        modal.off('shown.bs.modal');
        modal.on('hidden.bs.modal', function(){
          utility.map = null;
          modal.off('hidden.bs.modal');
        });
        $('body').removeClass("loading");
        modal.modal('show');
      });
      if(url){
        $(modalId+' .modal-content').load(url);
        modal.modal();
        modal.modal('show');
        if(cb){cb(target);}
      }else{
        const urlContent = await _this.getModalFromUrl(model,action);
        $(modalId+' .modal-content').html(urlContent);
        modal.modal();
        modal.modal('show');
        if(cb){cb(target);}
      }
    }
  },

  //Modal dismiss
  dismissModal : function(event, cb){
    let modal = $("#myModal");
    if(cb){
      modal.on('hidden.bs.modal',cb);
    }
    modal.modal('hide');
    modal.removeData('bs.modal');
  },

  reloadUrl : function(url, tag){
    var hash = location.hash;
    if(location.href.indexOf(url)===-1){
      location.href = url + tag;
    }else if(tag !== hash){
      location.href = url + tag;
    }else{
      location.reload();
    }
    return false;
  },

  getPosition : function(element){
    var e = document.getElementById(element);
    var left = 0;
    var top = 0;

    do{
      left += e.offsetLeft;
      top += e.offsetTop;
    }while(e = e.offsetParent);

    return [left, top];
  },

  isPc : function (){
    var userAgentInfo = navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
      if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }
    }
    return flag;
  },

  deleteHandler : function (id, module, alertView){
    alertView.hide();
    var url = "/" + module + "/destroy/" + id;
    $.ajax({
      url : url,
      success : function(){
        location.reload();
      },error : function(err){
        alertView.show();
        alertView.html(this.getMsgFromError(err));
      }
    })
  },

  lazyLoadImage : async function(imageName){
    let imageView = $("[data-src='../../images/" + imageName + "']");
    if(!imageView.length){
      return;
    }
    let image = await import(
      /* webpackMode: "lazy-once" */
      `../../images/${imageName}`
      )
    imageView.attr("src",image.default);
  },

  imageHandler : function (modual,file,progressBar,cb,error,index,name,isDelete){
    if(isDelete){
      this.deleteImage(name,modual,function(){
        return cb();
      },function(){
        return error();
      });
    }else{
      this.uploadImage(modual,file,progressBar,function(url){
        cb(url);
      },function(err){
        error(err);
      },index,name);
    }
  },

  deleteImage : function (filename,modual,cb,error){
    $.ajax({
      url : '/user/me/deleteFile',
      data : {
        name : filename,
        modual : modual
      },
      type : 'POST',
      success : function(result){
        cb();
      },
      error : function(err){
        console.log("some thing went wrong:" + err.responseText);
        error();
      }
    });
  },

  uploadImage : function(modual,file,progressBar,cb,error,index,name){
    if(!file){
      return cb();
    }
    var filename = "";
    var fileType = file.name.split('.').pop();
    switch(modual){
      case "thumbnail":
        filename = "thumbnail." + fileType
        break;
      case "license":
        filename = "license." + fileType;
        break;
      case "story":
        filename = "story." + fileType;
        break;
      case "dish":
        if(name && name!==""){
          filename = name;
        }
        break;
      case "checklist":
        filename = name + "." + fileType;
        break;
      case "badge":
        filename = "badge-" + name + "." + fileType;
        break;
      default :
        break;
    }
    $.ajax({
      url : '/user/getSignedUrl',
      data : {
        name : filename,
        type : file.type,
        module : modual
      },
      type : 'POST',
      success : function(result){
        var opts = result.opts;
        var fd = new FormData();
        fd.append('key', result.key);
        fd.append('acl', 'public-read');
        fd.append('content-type', file.type);
        fd.append('policy', result.policy);
        fd.append('AWSAccessKeyId',result.AWSAccessKeyId);
        fd.append('success_action_status','201');
        fd.append('signature', result.signature);
        fd.append("file", file);
        $.ajax({
          xhr: function() {
            var xhr = new window.XMLHttpRequest();

            // Upload progress
            progressBar.show();
            xhr.upload.addEventListener("progress", function(evt){
              if (evt.lengthComputable) {
                var percentComplete = ((evt.loaded / evt.total) * 100).toFixed(2);
                //Do something with upload progress
                progressBar.html(__('fileUploading') + percentComplete + "%");
              }
            }, false);

            return xhr;
          },
          type : 'POST',
          url : result.url,
          data : fd,
          processData: false,
          contentType: false,
          success : function(){
            cb(result.url + result.key);
          },
          error : function(err){
            var xmlResult = $($.parseXML(err.responseText));
            var message = xmlResult.find('Message');
            error(message);
          }
        })
      },
      error : function(err){
        console.log("some thing went wrong:" + err.responseText);
      }
    });
  },

  wechatLogin : function(userInit, button){
    var gm_ua = navigator.userAgent.toLowerCase();
    if(gm_ua.match(/MicroMessenger/i) && gm_ua.match(/MicroMessenger/i)[0]==="micromessenger"){
      let redirectUrl = VAR.BASE_URL + '/auth/wechatCode';
      let scope = "snsapi_userinfo";
      let appId = VAR.WECHAT_APPID;
      let state = location.href;
      let wechatUrl = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=$APPID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$SCOPE&state=$STATE#wechat_redirect";
      wechatUrl = wechatUrl.replace('$APPID', appId);
      wechatUrl = wechatUrl.replace('$REDIRECT_URI',redirectUrl);
      wechatUrl = wechatUrl.replace('$SCOPE',scope);
      wechatUrl = wechatUrl.replace('$STATE',state);
      location.href = wechatUrl;
    }else if(userInit){
      if(helperMethod.isPc()){
        let redirectUrl = encodeURIComponent(VAR.BASE_URL + '/auth/wechatCodeWeb');
        let scope = "snsapi_login";
        let appId = VAR.WECHAT_APPID2;
        let state = encodeURIComponent(location.href);
        let wechatUrl = "https://open.weixin.qq.com/connect/qrconnect?appid=$APPID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$SCOPE&state=$STATE#wechat_redirect";
        wechatUrl = wechatUrl.replace('$APPID', appId);
        wechatUrl = wechatUrl.replace('$REDIRECT_URI',redirectUrl);
        wechatUrl = wechatUrl.replace('$SCOPE',scope);
        wechatUrl = wechatUrl.replace('$STATE',state);
        location.href = wechatUrl;
      }else{
        let redirectUrl = VAR.BASE_URL + '/auth/wechatCode';
        let scope = "snsapi_userinfo";
        let appId = VAR.WECHAT_APPID;
        let state = location.href;
        let wechatUrl = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=$APPID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$SCOPE&state=$STATE#wechat_redirect";
        wechatUrl = wechatUrl.replace('$APPID', appId);
        wechatUrl = wechatUrl.replace('$REDIRECT_URI',redirectUrl);
        wechatUrl = wechatUrl.replace('$SCOPE',scope);
        wechatUrl = wechatUrl.replace('$STATE',state);
        location.href = wechatUrl;
      }
    }
  },

  setupWechat : async function(imgSrc, title, desc){
    const { default: wx } = await import (/* webpackChunkName: "weixin-js" */ 'weixin-js-sdk');
    var gm_ua = navigator.userAgent.toLowerCase();
    if(gm_ua.match(/MicroMessenger/i) && gm_ua.match(/MicroMessenger/i)[0]==="micromessenger") {
      imgSrc = imgSrc || "https://s3.us-west-1.amazonaws.com/sfmeal/images/logo.png";
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
  },

  createCookie : function(name, value, days) {
    var expires;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    } else {
      expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
  },

  readCookie : function(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return '';
  },

  eraseCookie : function (name) {
    this.createCookie(name, "", -1);
  },

  removeHash : function () {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  },

  changeSelectChefUI : function (filter){
    var filters = filter.split(".");
    var chefFilter = "";
    if(filters.length){
      chefFilter = filters[filters.length-1];
    }
    var filterBtn = $("[data-mixitup-control][data-filter-type='chef'][data-filter='." + chefFilter + "']");
    if(!filterBtn.length){
      return;
    }
    var container = $("#chef+div").first();
    container.find("img").prop("src", filterBtn.data("picture"));
    container.find("[data-rate]").data("rate", filterBtn.data("rate"));
    container.find("[data-rate]").starSet("show");
    container.find(".shopName").text(chefFilter.replace(".",""));
    container.find("#likeBtn [data-count]").data("count", filterBtn.data("likes"));
    container.find("#likeBtn [data-count]").text(filterBtn.data("likes"));
    container.find("#likeBtn").data("host", filterBtn.data("host"));
    container.find("img").off("click");
    container.find("img").on("click", function(e){
      window.location.href = "/host/public/" + filterBtn.data("host");
    })
    var isFollowed = filterBtn.data("followed");
    if(isFollowed){
      container.find("#followBtn").data("host", filterBtn.data("host"));
      container.find("#followBtn").data("followed", true);
      container.find("#followBtn .text").text(filterBtn.data("followed-text"));
      container.find("#followBtn i").removeClass("far").addClass("fas");
    }else{
      container.find("#followBtn").data("followed", false);
      container.find("#followBtn .text").text(filterBtn.data("follow-text"));
      container.find("#followBtn i").removeClass("fas").addClass("far");
    }
  },

  copyLink : function (target) {
    let copyTargetName = $(target).data("target");
    var copyText = $(copyTargetName);
    copyText.select();
    document.execCommand("Copy");
    $("#copyBtn").tooltip('hide')
      .attr('data-original-title', $("#copyBtn").data("title-clicked"))
      .tooltip('_fixTitle')
      .tooltip('show')
      .focus();
  },

  jumpTo : function (id, offset, target){
  // var coordinate = getPosition(id);
    console.info("跳转到：%s, 偏移量: %d, 偏移目标：%s", id, offset, target);
    if(!$("#" + id).length){
      return;
    }
    if($(target).length){
      offset = -$(target).outerHeight();
    }
    offset = offset || 0;

    $("html,body").animate({
      scrollTop : $("#" + id).offset().top + offset
    },1000);
  },

  //on user search action - redirect
  search : function (target, isRegular){
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
            alert(__('zipcodeGeoError'));
            return;
          }
          var result = response.results[0];
          var county = result["address_components"][2]["long_name"];
          query += "&county=" + county;
          location.href = "/meal/search?" + query;
        }, error: function () {
          alert(__('notAvailable'));
        }
      });
    }else{
      query += "&county=" + county;
      location.href = "/meal/search?" + query;
    }
  },

  setCountyInfo : function(county){
    var $citySelector = $("#citySelector");
    var countyName = $citySelector.find("ul a[value='" + county  + "']").text();
    var $citySelectorText = $citySelector.find(">a");
    $citySelectorText.html(countyName + "&nbsp;<span class='caret'></span>");
    $citySelectorText.attr("value",county);
    this.createCookie("county", county, 1);
    location.hash = "";
    location.reload();
  },

  isStripeLoaded : false,
  loadStripeJS : function (cb){
    if(!this.isStripeLoaded){
      $('body').addClass("loading");
      this.isStripeLoaded = true;
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
  },
  updateCollapseBtn : function (initialize){
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
};

/*
* Local Order
*
*/
let localOrderObj = {
  localOrders : {},
  localCoupon : {},
  localPoints : false,
  /*
    Load previous order from cookies
   */
  loadOrder : function (fromCache){
    console.group("Load local order...");
    this.updateOrderWindow(fromCache);
    this.loadCoupon(fromCache);
    this.loadPoints(fromCache);
    this.refreshCheckoutMenu();
    this.updateOrderPreview();
    console.groupEnd();
  },

  /*
    Load dish preference
   */
  loadPreference : function(){
    let _this = this;
    $("#order").find(".item").each(function(){
      let dishId = $(this).data("id");
      _this.refreshPreference(dishId);
    });
  },

  /*
    Update order window
  */
  updateOrderWindow : function (fromCache, isTrigger){
    if(!!isTrigger){
      helperMethod.updateCollapseBtn(false);
    }
    let _this = this;
    $("#order").find(".item").each(function(){
      let _this2 = $(this);
      let dishId = $(this).data("id");
      if(fromCache){
        let localDish = helperMethod.readCookie(dishId);
        if(localDish && localDish !== "undefined"){
          localDish = JSON.parse(localDish);
        }else{
          localDish = {number : 0, preference : [], price : $(this).find(".price").attr("value")};
        }
        _this.localOrders[dishId] = localDish;
        var left = parseInt($(this).attr("data-left-amount") - parseInt(_this.localOrders[dishId].number));
        var number = _this.localOrders[dishId].number;
        if(number){
          var dishItems = $("#order").find(".dish[data-id='" + dishId + "']");
          dishItems.each(function(){
            $(this).find("[name='input-group']").removeClass("d-none");
            $(this).find("[name='input-group']").show();
            $(this).find("[name='order-btn']").hide();
            $(this).find(".amount").val(_this.localOrders[dishId].number);
            $(this).find(".amount").text(_this.localOrders[dishId].number);
            _this2.amountInput('update',$(this).find("[data-toggle='amount-input']"));
            $(this).find("[data-toggle='amount-input']").on('change', _this.refreshCheckoutMenu);
          })
          $(this).data("left-amount", left);
          _this.updateMenuView(dishId);
        }
      }else{
        _this.localOrders[dishId] = {
          number : parseInt($(this).find(".amount").val()),
          preference : $(this).data("preference") || [],
          price : $(this).find(".price").attr("value")
        };
      }
    });
  },
  /*
    Update menu view
  */
  updateMenuView : function(id){
    var _this = this;
    var number = this.localOrders[id].number;
    var dateDesc = decodeURI(helperMethod.readCookie("date"));
    var dishItems = $("#order").find(".item[data-id=" + id + "]");
    dishItems.each(function(){
      var dishItem = $(this);
      var left = dishItem.data("left-amount");
      dishItem.find(".amount").text(number);
      dishItem.find(".amount").val(number);
      dishItem.amountInput('update',dishItem.find("[data-toggle='amount-input']"));
      if(number>0){
        dishItem.addClass("table-success");
        if(dishItem.hasClass(dateDesc)){
          dishItem.show();
        }
        $(this).find("[name='input-group']").removeClass('d-none').show();
        $(this).find("[name='order-btn']").hide();
      }else{
        $(this).find("[name='input-group']").hide();
        $(this).find("[name='order-btn']").show();
        dishItem.removeClass("table-success");
      }
      dishItem.find(".left-amount span").attr("value",left);
      dishItem.find(".left-amount span").html(left);
      var priceItem = dishItem.find(".price");
      var preference = _this.localOrders[id].preference;
      var discount = priceItem.data("discount");
      var price = priceItem.attr("value");
      var oldPrice = (parseFloat(price) + parseFloat(discount)).toFixed(2);
      if(preference && preference.length){
        var extra = preference.reduce(function(total, next){
          return total + next.extra;
        }, 0);
        priceItem.data("extra", extra);
        if(extra > 0){
          if(discount){
            priceItem.html("<s class='text-grey' style='font-size: small;'>$" + oldPrice + "</s><br/>" + "$" + price + " ($" + extra + ")");
          }else{
            priceItem.html("$" + price + " ($" + extra + ")");
          }
        }else{
          if(discount){
            priceItem.html("<s class='text-grey' style='font-size: small;'>$" + oldPrice + "</s><br/>" + "$" + price);
          }else{
            priceItem.html("$" + price);
          }
        }
      }else{
        priceItem.data("extra", 0);
        if(discount){
          priceItem.html("<s class='text-grey' style='font-size: small;'>$" + oldPrice + "</s><br/>" + "$" + price);
        }else{
          priceItem.html("$" + price);
        }
      }
    })
  },
  refreshPreference : function(id){
    let preferenceView = $("#dishPreferenceView[data-id='" + id +  "']");
    if(!preferenceView.length){
      return;
    }
    let propertiesLabel = preferenceView.find(".properties");
    let numberInput = preferenceView.find(".amount");
    let amountInput = preferenceView.find(".amount-input");
    let priceLabel = preferenceView.find(".price");
    let price = priceLabel.data("price");
    let number = this.localOrders[id].number || 1;
    let preferences = this.localOrders[id].preference;
    let propertiesText = "";
    let item = $("#order").find(".item[data-id=" + id + "]");
    let max = item.find(".amount-input").data("max");
    if(preferences && preferences.length){
      preferences.forEach(function(preference, index){
        var props = preference.property;
        var extra = preference.extra;
        if(props && props.length){
          var propInArray = props;
          if(propInArray && propInArray.length){
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
  },
  loadCoupon : function(fromCache){
    if(!!fromCache){
      var coupon = helperMethod.readCookie('coupon');
      if(coupon){
        coupon = JSON.parse(coupon);
      }else{
        coupon = {};
      }
    }else{
      coupon = {};
      //set code and amount as key & value
    }
    this.localCoupon = coupon;
  },
  loadPoints : function(fromCache){
    let hasPoints = false;
    if(!!fromCache){
      hasPoints = helperMethod.readCookie('points');
    }
    this.localPoints = hasPoints;
  },
  /*
    Order Food Public API
    @id: Dish Id,
    @number: +1/-1
    @initial: is initialized by user
   */
  orderFood : function(id,number,initial){
    var _this = this;
    var $order = $("#order");
    var item = $order.find(".item[data-id=" + id + "]");
    var prefs = item.data('prefs');
    if(prefs>0 && number>0){
      if(!$("#myModal").hasClass('show')) {
        var url = "/dish/" + id + "/preference";
        _this.orderFoodLogic(id, number, initial);
        helperMethod.toggleModalUrl(url, "#myModal");
      }else{
        _this.orderFoodLogic(id, number, initial);
      }
    }else{
      this.orderFoodLogic(id, number, initial);
    }
  },
  /*
    Order Food Logic
   */
  orderFoodLogic : function(id, number, initial){
    this.updateAmountInput(id, number);
    this.updateLocalOrders(id, number);
    helperMethod.createCookie(id,JSON.stringify(this.localOrders[id]),1);
    this.updateMenuView(id);
    this.refreshCheckoutMenu();
    this.refreshPreference(id);
    this.updateOrderPreview();
  },
  /*
    更新菜式已点数量
   */
  updateAmountInput : function(id, number){
    var $order = $("#order");
    $order.find(".item[data-id=" + id + "]:hidden").each(function(){
      var item = $(this);
      if(number > 0){
        item.find("[data-toggle='amount-input']").amountInput('add',item.find("[data-toggle='amount-input']"));
      }else if(number < 0){
        item.find("[data-toggle='amount-input']").amountInput('minus',item.find("[data-toggle='amount-input']"));
      }
      var left = parseInt(item.data("left-amount"));
      item.data("left-amount", left);
    })
  },
  /*
    更新本地订单缓存
   */
  updateLocalOrders : function(id, number){
    var $order = $("#order");
    var theItem = $order.find(".item[data-id=" + id + "]:visible");
    var price = parseFloat(theItem.find(".price").attr("price"));
    this.localOrders[id] = this.localOrders[id] ? this.localOrders[id] : { number : 0, preference : [{ property : '', extra : 0}], price : price};
    this.localOrders[id].number += number;
    var left = parseInt(theItem.data("left-amount"));
    var amount = parseInt(theItem.find(".amount").val());
    if(number < 0){
      if(amount > 0){
        left++;
        this.localOrders[id].preference.pop();
        theItem.data("left-amount", left);
      }else{
        this.localOrders[id].number -= number;
      }
    }else{
      if(left<=0 && number > 0){
        this.localOrders[id].number -= number;
        helperMethod.makeAToast(__("no-dish-left"));
      }else{
        left--;
        theItem.data("left-amount",left);
        var preferences = this.localOrders[id].preference;
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
            var p = activeBtn.data("property");
            var e = parseFloat(activeBtn.data("extra"));
            var t = prefType;
            properties.push({ property : p, preftype : t});
            extra += e;
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
  },
  _tooltipAnimateId : 0,
  /*
    更新已点菜式预览
   */
  updateOrderPreview : function(){
    var orderPreviewListText = "";
    var _this = this;
    if(this.localOrders){
      Object.keys(this.localOrders).forEach(function(dishId){
        var dishTitle = $("#order .dishItem[data-id='" + dishId +"']").find("[data-title]").data("title");
        var order = _this.localOrders[dishId];
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
      .tooltip('_fixTitle');
  },
  /*
    更新结账界面
   */
  refreshCheckoutMenu : function(){
    var numberOfItem = 0;
    var subtotal = 0;
    var method = $("#method").find(".active").attr("value");
    var $order = $("#order");
    var _dishes = [];
    $order.find(".item").each(function(){
      var dishId = $(this).data("id");
      if(_dishes.includes(dishId)){
        return;
      }else{
        _dishes.push(dishId);
      }
      var unitPrice = parseFloat($(this).find(".price").attr("value"));
      var amount = parseInt($(this).find(".amount").val());
      var dishView = $("#meal-confirm-container").find(".dish[data-id='" + dishId + "']");
      if(amount){
        dishView.addClass("table-success").show();
      }else if(dishView.hasClass("table-success")){
        dishView.removeClass("table-success").hide();
      }
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
    var coupons = Object.keys(this.localCoupon);
    var $orderTotal = $order.find(".total");
    if(coupons.length > 0){
      $("#applyCouponBtn").hide();
      $("#disApplyCouponBtn").show();
      $order.find(".coupon-code").val(coupons[0]);
      var discount = this.localCoupon[coupons[0]];
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
    if(this.localPoints){
      discount = this.localPoints/10;
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
    this.refreshCart(total, numberOfItem);
  },
  refreshCart : function(subtotal, numberOfItem){
    var shoppingCart = $("#shoppingCartView");
    shoppingCart.find(".total-preview").text(subtotal);
    shoppingCart.find(".total-preview").data('subtotal', subtotal);
    shoppingCart.find(".order-preview").text(numberOfItem);
    shoppingCart.find(".order-preview").data('item',numberOfItem);
  },
  applyCoupon : function(isApply, amount, code){
    //set localVar and cookie
    if(!!isApply){
      this.localCoupon = this.localCoupon || {};
      this.localCoupon[code] = amount;
      helperMethod.createCookie('coupon',JSON.stringify(this.localCoupon),5);
    }else{
      $(".coupon-code").val('');
      this.localCoupon = {};
      helperMethod.eraseCookie('coupon');
    }
    this.refreshCheckoutMenu();
  },
  applyPoints : function(isApply, amount){
    if(!!isApply){
      this.localPoints = amount;
      helperMethod.createCookie('points',this.localPoints,5);
    }else{
      this.localPoints = 0;
      helperMethod.eraseCookie('points');
    }
    this.refreshCheckoutMenu();
  }
};

export { helperMethod, localOrderObj }
