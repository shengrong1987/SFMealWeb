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

  getUsers: function(criteria, value) {
    if(!criteria || !value){
      var url = "/user";
    }else{
      var url = "/user/search?" + criteria + "=" + value;
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

  getHosts: function(criteria, value) {
    if(!criteria || !value){
      var url = "/host";
    }else{
      var url = "/host/search?" + criteria + "=" + value;
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

  getMeals : function(criteria, value){
    if(criteria == "hostId" && value){
      var url = "/host/" + value + "/meals";
    }else if(value) {
      var url = "/meal/searchAll?" + criteria + "=" + value;
    }else{
      var url = "/meal/findAll";
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

  getDishes : function(criteria, value){
    if(criteria == "hostId" && value){
      var url = "/host/" + value + "/dishes";
    }else if(criteria == "mealId" && value) {
      var url = "/meal/" + value + "/dishes";
    }else if(value) {
      var url = "/dish/search?" + criteria + "=" + value;
    }else{
      var url = "/dish";
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

  getOrders : function(criteria, value){
    if(criteria == "hostId" && value){
      var url = "/host/" + value + "/orders";
    }else if(criteria == "userId" && value) {
      var url = "/user/" + value + "/orders";
    }else if(criteria == "mealId" && value) {
      var url = "/order/search?meal=" + value;
    }else if(value) {
      var url = "/order/search?" + criteria + "=" + value;
    }else{
      var url = "/order";
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
    if(criteria == "hostId" && value){
      var url = "/host/" + value + "/balance";
    }else if(criteria == "userId" && value) {
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

  command : function(model, id, action, detail, data){
    var url = '/' + model.toLowerCase() + '/' + id + '/' + action;
    $.ajax({
      url: url,
      type: 'POST',
      data : data,
      dataType: 'json',
    }).done(function (data) {
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
      }
    }).fail(function(jqXHR, textStatus){
      ActionCreators.badRequest(jqXHR.responseText);
    });
  },

  changeTab : function(tab){
    ActionCreators.switchTab(tab);
  },

  search : function(model, criteria, content){
    switch (model){
      case "User":
        if(criteria == "id" && content){
          this.getUser(content);
        }else{
          this.getUsers(criteria,content);
        }
        break;
      case "Host":
        if(criteria == "id" && content){
          this.getHost(content)
        }else{
          this.getHosts(criteria,content);
        }
        break;
      case "Meal":
        if(criteria == "id" && content){
          this.getMeal(content);
        }else{
          this.getMeals(criteria,content);
        }
        break;
      case "Dish":
        if(criteria == "id" && content){
          this.getDish(content);
        }else{
          this.getDishes(criteria,content);
        }
        break;
      case "Order":
        if(criteria == "id" && content){
          this.getOrder(content);
        }else{
          this.getOrders(criteria,content);
        }
        break;
      case "Transaction":
        if(criteria == "id" && content){
          this.getTransaction(content);
        }else{
          this.getTransactions(criteria,content);
        }
        break;
    }
    ActionCreators.search(criteria, content);
  }



};
