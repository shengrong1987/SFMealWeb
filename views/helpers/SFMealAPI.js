'use strict';

var ActionCreators = require('../actions/ActionCreators'),
  $ = require('jquery');

module.exports = {

  getUsers: function() {
    $.ajax({
      url: '/user',
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getUsers(data);
    });
  },

  getHosts: function() {
    $.ajax({
      url: '/host',
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getHosts(data);
    });
  },

  getMeals : function(){
    $.ajax({
      url: '/meal',
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getMeals(data);
    });
  },

  getOrders : function(){
    $.ajax({
      url: '/order',
      type: 'GET',
      dataType: 'json',
    }).done(function (data) {
      ActionCreators.getOrders(data);
    });
  },

  changeTab : function(tab){
    ActionCreators.switchTab(tab);
  },

  search : function(model, criteria, content){
    console.log("ddd");
    ActionCreators.search(model, criteria, content);
  }



};
