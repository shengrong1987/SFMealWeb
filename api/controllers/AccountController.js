/**
 * OrderController
 *
 * @description :: Server-side logic for managing Orders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripe = require("../services/stripe.js");
var moment = require("moment");

module.exports = {
  charge : function(req, res){
    var accountId = req.param("id");
    var params = req.body;
    if(!accountId){
      return res.badRequest({ code : -1, responseText : "need an account id to charge"});
    }
    if(!params.mealId || !params.orderId || !params.msg){
      return res.badRequest({ code : -2, responseText : "need to enter charge information"});
    }
    var metaData = {
      application_fee : params.applicationFee,
      mealId : params.mealId,
      orderId : params.orderId,
      msg : params.msg
    };
    stripe.chargeCash({
      metadata : metaData,
      destination : accountId
    }, function(err, charge, transfer){
      if(err){
        return res.badRequest(err);
      }
      res.ok({});
    })
  },

  find : function(req, res){
    stripe.retrieveConnectAccounts({
      limits : 100
    }, function(err, accounts){
      if(err){
        return res.badRequest(err);
      }
      res.ok(accounts.data);
    })
  },

  findOne : function(req, res){
    var accountId = req.param('id');
    stripe.retrieveConnectAccount({
      id : accountId
    }, function(err, account){
      if(err){
        return res.badRequest(err);
      }
      res.ok(account);
    })
  },

  reject : function(req, res){
    var accountId = req.param('id');
    var msg = req.body.msg;
    stripe.rejectAccount({
      id : accountId,
      msg :msg
    }, function (err, account) {
      if(err){
        return res.badRequest(err);
      }
      res.ok(account);
    })
  }
};

