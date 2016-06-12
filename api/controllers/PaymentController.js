/**
 * PaymentController
 *
 * @description :: Server-side logic for managing payments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var stripe = require("../services/stripe.js");

module.exports = {
  create : function(req, res){
    var userId = req.session.user.id;
    var cardnumber = req.body.cardNumber;
    var email = req.session.user.auth.email;
    Payment.find({user:userId,cardNumber:cardnumber}).exec(function(err,card){
      if(err){
        return res.badRequest(err);
      }
      if(card.length > 0){
        return res.badRequest(req.__('payment-card-exist'));
      }
      var param = req.body;
      param.user = userId;
      var token = param.stripeToken;
      stripe.payment({
        token : token,
        email : email
      },function(err, customer){
        delete param.stripeToken;
        param.customerId = customer.id;
        Payment.update({user : userId},{isDefaultPayment : false}).exec(function(err, payments){
          if(err){
            return res.badRequest(err);
          }
          param.isDefaultPayment = true;
          Payment.create(param).exec(function(err,p){
            if(err){
              return res.badRequest(err);
            }
            res.ok(p);
          })
        });
      });
    });
  },
  update : function(req, res){
    var paymentId = req.param("id");
    var isSetToDefault = req.body.isDefaultPayment;
    var userId = req.session.user.id;
    var token = req.body.stripeToken;
    var email = req.session.user.auth.email;
    if(isSetToDefault){
      Payment.update({user:userId},{isDefaultPayment : false}).exec(function(err,payments){
        if(err){
          return res.badRequest(err);
        }
        Payment.update({id:paymentId},req.body).exec(function(err,p){
          if(err){
            return res.badRequest(err);
          }
          var customerId = p[0].customerId;
          stripe.updatePayment({
            id : customerId,
            token : token,
            email : email
          },function(err, customer){
            if(err){
              return res.badRequest(err);
            }
            res.ok(p[0]);
          });
        })
      });
    }else {
      Payment.update({id:paymentId},req.body).exec(function(err,p){
        if(err){
          return res.badRequest(err);
        }
        var customerId = p[0].customerId;
        stripe.updatePayment({
          id : customerId,
          token : token,
          email : email
        },function(err, customer){
          if(err){
            return res.badRequest(err);
          }
          res.ok(p[0]);
        });
      })
    }
  },
  destroy : function(req, res){
    var paymentId = req.param("id");
    var userId = req.session.user.id;
    Payment.count({user: userId}).exec(function(err,found){
      if(found==1){
        return res.badRequest(req.__('payment-unique-card'));
      }
      Payment.destroy(paymentId).exec(function(err,p){
        if(err){
          return res.badRequest(err);
        }
        var customerId = p[0].customerId;
        stripe.deleteProfile({
          id : customerId
        },function(err, confirmation){
          if(err){
            return res.badRequest(err);
          }
          if(confirmation.deleted){
            if(p[0].isDefaultPayment){
              Payment.findOne({user:userId}).exec(function(err,p2){
                if(err){
                  return res.badRequest(err);
                }
                p2.isDefaultPayment = true;
                p2.save(function(err,p3){
                  if(err){
                    return res.badRequest(err);
                  }
                  res.ok();
                });
              });
            }else{
              return res.ok();
            }
          }
        });
      });
    });
  },
  newForm : function(req, res) {
    res.view("payment",{layout:false});
  }
};

