'use strict';

var ActionCreators = require('../actions/ActionCreators'),
  $ = require('jquery');

module.exports = {

  getUser : function(id){
    $.ajax({
      url: "/user/" + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getUser(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getUsers: function(criteria, value, skip) {
    if(!criteria || !value){
      var url = "/user?skip=" + skip;
    }else{
      var url = "/user/search?skip=" + skip + "&" + criteria + "=" + value;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getUsers(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getHost: function(id) {
    $.ajax({
      url: '/host/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getHost(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getHosts: function(criteria, value, skip) {
    if(!criteria || !value){
      var url = "/host?skip=" + skip;
    }else{
      var url = "/host/search?skip=" + skip + "&" + criteria + "=" + value;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getHosts(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getMeal : function(id){
    $.ajax({
      url: '/meal/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getMeal(data.meals?data.meals:data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getMeals : function(criteria, value, skip){
    if(criteria == "hostId" && value){
      var url = "/host/" + value + "/meals?skip=" + skip;
    }else if(value) {
      var url = "/meal/searchAll?skip=" + skip + "&" + criteria + "=" + value;
    }else{
      var url = "/meal/searchAll?skip=" + skip;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getMeals(data.meals?data.meals:data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getDish : function(id){
    $.ajax({
      url: '/dish/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getDish(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getDishes : function(criteria, value, skip){
    if(criteria == "hostId" && value){
      var url = "/host/" + value + "/dishes?skip=" + skip;
    }else if(criteria == "mealId" && value) {
      var url = "/meal/" + value + "/dishes?skip=" + skip;
    }else if(value) {
      var url = "/dish/search?skip=" + skip + "&" + criteria + "=" + value;
    }else{
      var url = "/dish?skip=" + skip;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getDishes(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getOrder : function(id){
    $.ajax({
      url: '/order/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getOrder(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getOrders : function(criteria, value, skip){
    if(criteria == "hostId" && value){
      var url = "/host/" + value + "/orders?skip=" + skip;
    }else if(criteria == "userId" && value) {
      var url = "/user/" + value + "/orders?skip=" + skip;
    }else if(criteria == "mealId" && value) {
      var url = "/order/search?skip=" + skip + "&meal=" + value;
    }else if(value) {
      var url = "/order/search?skip=" + skip + "&" + criteria + "=" + value;
    }else{
      var url = "/order?skip=" + skip;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getOrders(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getTransaction : function(id){
    $.ajax({
      url: '/pocket/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getTransaction(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getTransactions : function(criteria, value){
    if(criteria === "hostId" && value){
      var url = "/host/" + value + "/balance";
    }else if(criteria === "userId" && value) {
      var url = "/user/" + value + "/balance";
    }else{
      return;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getTransactions(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getJob : function(id){
    $.ajax({
      url: '/job/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getJob(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getJobs : function(criteria, value, skip){
    if(criteria && value){
      var url = "/job?skip=" + skip + "&" + criteria + "=" + value;
    }else{
      var url = "/job?skip=" + skip;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getJobs(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getCheckList : function(id){
    $.ajax({
      url: '/checkList/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getCheckList(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getCheckLists : function(criteria, value, skip){
    if(criteria && value){
      var url = "/checkList?skip=" + skip + "&" + criteria + "=" + value;
    }else{
      var url = "/checkList?skip=" + skip;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getCheckLists(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getCoupon : function(id){
    $.ajax({
      url: '/coupon/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getCoupon(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getCoupons : function(criteria, value, skip){
    if(criteria && value){
      var url = "/coupon?skip=" + skip + "&" + criteria + "=" + value;
    }else{
      var url = "/coupon?skip=" + skip;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json'
    }).done(function (data) {
      ActionCreators.getCoupons(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getReview : function(id){
    $.ajax({
      url: '/review/' + id,
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getReview(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  getReviews : function(criteria, value, skip){
    if(criteria === "dishId" && value){
      var url = "/dish/" + value + "/review?skip=" + skip;
    }else if(criteria === "mealId"){
      url = "/meal/" + value + "/review?skip=" + skip;
    }else if(criteria === "hostId"){
      url = "/host/" + value + "/review?skip=" + skip;
    }else if(value) {
      url = "/review?skip=" + skip + "&" + criteria + "=" + value;
    }else{
      url = "/review?skip=" + skip;
    }
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json'
    }).done(function (data) {
      ActionCreators.getReviews(data);
    }).fail(function(jqXHR, textStatus){
      ActionCreators.noResult(jqXHR.responseText);
    });
  },

  command : function(model, id, action, detail, data){
    var httpMethod = "POST";
    if(action === "create"){
      var url = '/' + model.toLowerCase();
    }else if(action === 'view'){
      url = '/' + model.toLowerCase() + '/' + id;
      httpMethod = "GET";
    }else{
      url = '/' + model.toLowerCase() + '/' + id + '/' + action;
    }
    $.ajax({
      url: url,
      type: httpMethod,
      data : data,
      dataType: 'json'
    }).done(function (data) {
      if(action === "review"){
        ActionCreators.switchTab("Review");
        ActionCreators.getReviews(data);
      }else if(action === "meal"){
        ActionCreators.switchTab("Meal");
        ActionCreators.getMeals(data);
      }else if(action === "dish"){
        ActionCreators.switchTab("Dish");
        ActionCreators.getDishes(data);
      }else if(action === "order"){
        ActionCreators.switchTab("Order");
        ActionCreators.getOrders(data);
      }else{
        switch(model) {
          case "User":
            if(detail){
              ActionCreators.getUser(data);
            }else{
              ActionCreators.getUsers(data);
            }
            break;
          case "Host":
            if(detail){
              ActionCreators.getHost(data);
            }else{
              ActionCreators.getHosts(data);
            }
            break;
          case "Meal":
            if(detail){
              ActionCreators.getMeal(data);
            }else{
              ActionCreators.getMeals(data);
            }
            break;
          case "Dish":
            if(detail){
              ActionCreators.getDish(data);
            }else{
              ActionCreators.getDishes(data);
            }
            break;
          case "Order":
            if(detail){
              ActionCreators.getOrder(data);
            }else{
              ActionCreators.getOrders(data);
            }
            break;
          case "Checklist":
            if(detail){
              ActionCreators.getCheckList(data);
            }else{
              ActionCreators.getCheckLists(data);
            }
            break;
          case "Coupon":
            if(detail){
              ActionCreators.getCoupon(data);
            }else{
              ActionCreators.getCoupons(data);
            }
            break;
          case "Job":
            if(detail){
              ActionCreators.getJob(data);
            }else{
              ActionCreators.getJobs(data);
            }
            break;
          case "Review":
            if(detail){
              ActionCreators.getReview(data);
            }else{
              ActionCreators.getReviews(data);
            }
            break;
        }
      }
    }).fail(function(jqXHR, textStatus){
      ActionCreators.badRequest(jqXHR.responseText);
    });
  },

  changeTab : function(tab){
    ActionCreators.switchTab(tab);
  },

  createForm : function(model){
    var isValid;
    switch(model){
      case "Coupon":
      case "Email":
        isValid = true;
        break;
    }
    if(!isValid){
      ActionCreators.badRequest("Can not create item on " + model);
    }else{
      ActionCreators.create(model);
    }
  },

  search : function(model, criteria, content, pageIndex){
    pageIndex = pageIndex || 0;
    var skip = pageIndex * 30;
    switch (model){
      case "User":
        if(criteria === "id" && content){
          this.getUser(content);
        }else{
          this.getUsers(criteria,content,skip);
        }
        break;
      case "Host":
        if(criteria === "id" && content){
          this.getHost(content)
        }else{
          this.getHosts(criteria,content,skip);
        }
        break;
      case "Meal":
        if(criteria === "id" && content){
          this.getMeal(content);
        }else{
          this.getMeals(criteria,content,skip);
        }
        break;
      case "Dish":
        if(criteria === "id" && content){
          this.getDish(content);
        }else{
          this.getDishes(criteria,content,skip);
        }
        break;
      case "Order":
        if(criteria === "id" && content){
          this.getOrder(content);
        }else{
          this.getOrders(criteria,content,skip);
        }
        break;
      case "Transaction":
        if(criteria === "id" && content){
          this.getTransaction(content);
        }else{
          this.getTransactions(criteria,content,skip);
        }
        break;
      case "Job":
        if(criteria === "id" && content){
          this.getJob(content);
        }else{
          this.getJobs(criteria, content,skip);
        }
        break;
      case "Checklist":
        if(criteria === "id" && content){
          this.getCheckList(content);
        }else{
          this.getCheckLists(criteria, content,skip);
        }
        break;
      case "Coupon":
        if(criteria === "id" && content){
          this.getCoupon(content);
        }else{
          this.getCoupons(criteria, content,skip);
        }
        break;
      case "Review":
        if(criteria === "id" && content){
          this.getReview(content);
        }else{
          this.getReviews(criteria, content, skip);
        }
        break;
    }
    ActionCreators.search(criteria, content);
  }
};
