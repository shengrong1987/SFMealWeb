/**
 * PaymentController
 *
 * @description :: Server-side logic for managing payments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * @error       :: -1 payment card exist
 *              :: -2 can not delete only card
 *              :: -3 need email to create payment method
 */
var stripe = require("../services/stripe.js");
var async = require('async');

module.exports = {

  findOne : function(req, res){
    Payment.findOne(req.param("id")).exec(function(err, payment){
      if(err){
        return res.badRequest(err);
      }
      var cardId = payment.cardId;
      var customerId = payment.customerId;
      stripe.retrieveCard({ id : customerId, cardId : cardId}, function(err, card){
        if(err){
          return res.badRequest(err);
        }
        switch (card.brand) {
          case "MasterCard":
            card.brand = "master";
            break;
          case "American Express":
            card.brand = "AE";
            break;
          case "Diners Club":
            card.brand = "DC";
            break;
        }
        res.view('payment', { id : payment.id, payment : card, layout : false, user : req.session.user });
      });
    });
  },

  create : function(req, res){
    var userId = req.session.user.id;
    var params = req.body;
    var email = req.session.user.email || req.session.user.auth.email || params.email;
    if(!email){
      return res.badRequest({ code : -3, responseText : req.__('payment-lackof-email')})
    }
    var cardnumber = params.cardNumber;

    User.findOne(userId).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      params.user = userId;
      async.auto({
        checkCardExistence : function(next){
          if(!user.customerId){
            return next();
          }
          stripe.retrieveCustomer({ id : user.customerId }, function(err, customer){
            if(err){
              return next();
            }
            if(customer.sources && customer.sources.data && customer.sources.data.length > 0){
              var cardExisted = customer.sources.data.some(function(card){
                return card.last4 === cardnumber.slice(-4);
              });
              if(cardExisted){
                return next({ code : -1, responseText : req.__('payment-card-exist')});
              }
              next();
            }else{
              next();
            }
          });
        },
        createNewCustomerWithCard : ['checkCardExistence', function(next){
          if(user.customerId){
            return next();
          }
          params.isDefaultPayment = true;
          stripe.newCustomerWithCard({
              token : params.stripeToken,
              email : email
            }, function(err, customer){
            if(err){
              return next(err);
            }
            delete params.stripeToken;
            var card = customer.sources.data[0];
            user.customerId = customer.id;
            user.email = email;
            params.customerId = customer.id;
            params.cardId = card.id;
            params.last4 = card.last4;
            switch (card.brand) {
              case "MasterCard":
                card.brand = "master";
                break;
              case "American Express":
                card.brand = "AE";
                break;
              case "Diners Club":
                card.brand = "DC"
                break;
            }
            params.brand = card.brand;
            user.save(next);
          });
        }],
        updateCustomerWithCard : ['checkCardExistence', function(next){
          if(!user.customerId){
            return next();
          }
          stripe.retrieveCustomer({ id : user.customerId}, function(err, customer){
            if(err){
              return next(err);
            }
            if(!customer.default_source){
              params.isDefaultPayment = true;
            }
            stripe.newPaymentSource({ id : user.customerId, token : params.stripeToken }, function(err, card){
              if(err){
                return next(err);
              }
              params.customerId = user.customerId;
              params.cardId = card.id;
              params.last4 = card.last4;
              switch (card.brand) {
                case "MasterCard":
                  card.brand = "master";
                  break;
                case "American Express":
                  card.brand = "AE";
                  break;
                case "Diners Club":
                  card.brand = "DC"
                  break;
              }
              params.brand = card.brand;
              next();
            })
          });
        }]
      }, function(err){
        if(err){
          return res.badRequest(err);
        }
        var isDefault = params.isDefaultPayment;
        async.auto({
          updateOtherCards : function(cb){
            if(!isDefault){
              return cb();
            }
            Payment.update({user : userId},{isDefaultPayment : false}).exec(function(err, payments) {
              if(err){
                return cb(err);
              }
              stripe.updateDefaultSource({ id : params.customerId, cardId : params.cardId }, function(err, customer){
                if(err){
                  return cb(err);
                }
                cb();
              });
            });
          },
          createCard : [ 'updateOtherCards', function(cb){
            delete params.cardNumber;
            Payment.create(params).exec(function(err, p){
              if(err){
                return cb(err);
              }
              cb(null, p);
            })
          }]
        }, function(err, results){
          if(err){
            return res.badRequest(err);
          }
          return res.ok(results.createCard);
        })
      })
    });
  },

  update : function(req, res){

    var paymentId = req.param("id");
    var userId = req.session.user.id;
    var email = req.session.user.auth.email;
    var params = req.body;
    var isDefaultPayment = params.isDefaultPayment;

    Payment.findOne(paymentId).exec(function(err, payment){
      if(err){
        return res.badRequest(err);
      }
      var customerId = payment.customerId;
      var cardId = payment.cardId;
      var updatedParam = {};
      updatedParam.isDefaultPayment = false;
      async.auto({
        updateCard : function(cb){
          delete params.id;
          delete params.isDefaultPayment;
          stripe.updateCard({
            id : customerId,
            cardId : cardId,
            params : params
          },function(err, card){
            if(err){
              return cb(err);
            }
            updatedParam.last4 = card.last4;
            switch (card.brand) {
              case "MasterCard":
                card.brand = "master";
                break;
              case "American Express":
                card.brand = "AE";
                break;
              case "Diners Club":
                card.brand = "DC";
                break;
            }
            updatedParam.brand = card.brand;
            cb();
          });
        },
        updateDefaultSource : function(cb){
          if(!isDefaultPayment || isDefaultPayment === "false"){
            return cb();
          }
          stripe.updateDefaultSource({
            id : customerId,
            cardId : cardId
          }, function(err, customer){
            if(err){
              return cb(err);
            }
            updatedParam.isDefaultPayment = true;
            Payment.update({user:userId},{isDefaultPayment : false}).exec(function(err,payments) {
              if (err) {
                return cb(err);
              }
              cb();
            });
          });
        }
      }, function(err, results){
        if(err){
          return res.badRequest(err);
        }
        Payment.count({user:userId}).exec(function(err, number){
          if(err){
            return res.badRequest(err);
          }
          if(number === 1){
            updatedParam.isDefaultPayment = true;
          }
          Payment.update(paymentId, updatedParam).exec(function(err, payment){
            if(err){
              return res.badRequest(err);
            }
            res.ok(payment[0]);
          });
        })
      })
    });
  },

  destroy : function(req, res){
    var paymentId = req.param("id");
    Payment.findOne(paymentId).exec(function(err, payment){
      if(err){
        return res.badRequest(err);
      }
      var customerId = payment.customerId;
      var cardId = payment.cardId;
      stripe.deleteCard({ id : customerId, cardId : cardId}, function(err, confirmation) {
        if (err) {
          return res.badRequest(err);
        }

        Payment.destroy(payment.id).exec(function (err, p) {
          if (err) {
            return res.badRequest(err);
          }
          stripe.retrieveCustomer({id: p[0].customerId}, function (err, customer) {
            if (err) {
              return res.badRequest(err);
            }
            var defaultSource = customer.default_source;
            if (!defaultSource) {
              return res.ok(confirmation);
            }
            Payment.update({cardId: defaultSource}, {isDefaultPayment: true}).exec(function (err, payments) {
              if (err) {
                return res.badRequest(err);
              }
              res.ok(confirmation);
            });
          })
        })
      })
    });
  },

  newForm : function(req, res) {
    res.view("payment",{ layout:false, user: req.session.user });
  }
};

