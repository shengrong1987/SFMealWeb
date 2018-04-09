/**
 * Created by shengrong on 12/3/15.
 */

// MailChimp Credentials
var key = sails.config.mailChimp.apiKey;
var Mailchimp = require('mailchimp-api-v3');
var mailChimp = new Mailchimp(key);

module.exports = {

  /*
    @params
    userData : { BIRTHDAY }
    type : member, subscriber, chef
   */
  updateMember : function(userData, type){
    var calls;
    var memberId = require("blueimp-md5")(userData.email.toLowerCase());
    switch (type){
      case "member":
        calls = [
          {
            method : 'PATCH',
            path : '/lists/760e040b5f/members/' + memberId,
            body : {
              merge_fields: {
                BIRTHDAY : userData.birthday
              }
            }
          }
        ];
        break;
      case "subscriber":
        calls = [
          {
            method : 'PATCH',
            path : '/lists/760e040b5f/members/' + memberId,
            body : {
              merge_fields: {
                BIRTHDAY : userData.birthday
              }
            }
          },
          {
            method : 'PATCH',
            path : '/lists/bbdeb059b8/members/' + memberId,
            body : {
              merge_fields: {
                BIRTHDAY : userData.birthday
              }
            }
          }
        ];
        break;
      case "chef":
        calls = [
          {
            method : 'PATCH',
            path : '/lists/74b646cc22/members/' + memberId,
            body : {
              merge_fields: {
                BIRTHDAY : userData.birthday
              }
            }
          }
        ];
        break;
    }
    if(calls.length === 0){
      sails.log.debug("ListID doesn't exist, you probably enter the wrong type of list");
      return;
    }
    mailChimp.batch(calls, function(err, result){
      if(err){
        sails.log.debug(err);
      }
    }, {
      wait : true,
      unpack : true
    })
  },
  /*
    @params
    userData : { EMAIL, FNAME, LNAME}
    type : member, subscriber, chef
   */
  addMemberToList : function(userData, type, userId){
    var calls;
    switch (type){
      case "member":
        calls = [
          {
            method : 'post',
            path : '/lists/760e040b5f/members',
            body : {
              email_address : userData.email,
              status : 'subscribed',
              merge_fields: {
                FNAME : userData.firstname,
                LNAME : userData.lastname
              },
              language : userData.language
            }
          }
        ];
        break;
      case "subscriber":
        calls = [
          {
            method : 'post',
            path : '/lists/760e040b5f/members',
            body : {
              email_address : userData.email,
              status : 'subscribed',
              merge_fields: {
                FNAME : userData.firstname,
                LNAME : userData.lastname
              },
              language : userData.language
            }
          },
          {
            method : 'post',
            path : '/lists/bbdeb059b8/members',
            body : {
              email_address : userData.email,
              status : 'subscribed',
              merge_fields: {
                FNAME : userData.firstname,
                LNAME : userData.lastname
              },
              language : userData.language
            }
          }
        ];
        break;
      case "chef":
        calls = [
          {
            method : 'post',
            path : '/lists/74b646cc22/members',
            body : {
              email_address : userData.email,
              status : 'subscribed',
              merge_fields: {
                SHOPNAME : userData.shopName,
                FNAME : userData.firstname,
                LNAME : userData.lastname
              },
              language : userData.language
            }
          }
        ];
        break;
    }
    if(calls.length === 0){
      sails.log.debug("ListID doesn't exist, you probably enter the wrong type of list");
      return;
    }
    mailChimp.batch(calls, function(err, result){
      if(err){
        sails.log.debug(err);
      }
    }, {
      wait : true,
      unpack : true
    })
  }
}


