/**
 * Created by shengrong on 12/3/15.
 */
var stripe = require('stripe')(sails.config.StripeKeys.secretKey);
var async = require('async');

module.exports = {

  createManagedAccount : function(attr,cb){
    stripe.accounts.create(attr,function(err, account) {
      if (err) {
        return cb(err);
      }
      cb(null,account);
    });
  },

  updateManagedAccount : function(id, attr, cb){
    stripe.accounts.update(id, attr, cb);
  },

  uploadFile : function(params, id, cb){
    stripe.fileUploads.create(params, {
      stripe_account : id
    }, cb);
  },

  getAccount : function(id, cb){
    stripe.accounts.retrieve(id, function(err, result){
      if(err){
        return cb(err);
      }
      cb(null, result);
    });
  },

  updateBank : function(attr, cb){
    if(attr.isNew){
      stripe.accounts.createExternalAccount(
          attr.id,
          {external_account: attr.token},
          function(err, bank_account){
            if(err){
              return cb(err);
            }
            cb(null,bank_account);
          }
      );
    }else{
      stripe.accounts.updateExternalAccount(
          attr.id,
          attr.bankId,
          {metadata : {external_account: attr.token}},
          function(err, bank_account) {
            if(err){
              return cb(err);
            }
            cb(null, bank_account)
          }
      );
    }
  },

  getBalance : function(attr, cb){
    stripe.balance.retrieve({stripe_account : attr.id},function(err, balance){
      if(err){
        return cb(err);
      }
      cb(null,balance);
    });
  },

  listTransactions : function(attr, cb){
    stripe.balance.listTransactions({},{stripe_account : attr.id},function(err, transactions){
      if(err){
        return cb(err);
      }
      async.each(transactions.data, function(tran, next){
        stripe.charges.retrieve(tran.source,{stripe_account : attr.id}, function(err, charge){
          if(err){
            return next(err);
          }
          tran.metadata = charge.metadata || {};
          next();
        });
      },function(err){
        if(err){
          return cb(err);
        }
        cb(null, transactions);
      });
    });
  },

  retrieveCharge : function(attr, cb){
    stripe.charges.retrieve(attr, cb);
  },

  retrieveTransfer : function(id, cb){
    stripe.transfers.retrieve(id, cb);
  },

  charge : function(attr ,cb){
    var meal = attr.meal;
    var delivery_application_fee = 0;
    if(attr.method && attr.method == "delivery"){
      if(meal.isDeliveryBySystem){
        delivery_application_fee = 5.99;
      }
    }
    var service_fee = 1;
    var application_fee = Math.floor(attr.amount * meal.commission) + delivery_application_fee + service_fee;
    stripe.charges.create({
      amount: attr.amount,
      currency: "usd",
      receipt_email: attr.email,
      customer: attr.customerId,
      destination : attr.destination,
      metadata : attr.metadata,
      application_fee : application_fee
    }, function (err, charge) {
      if(err){
        return cb(err);
      }
      cb(null,charge);
    });
  },

  refund : function(attr, cb){
    sails.log.debug("refunding customer : " + attr.amount || "fully");
    stripe.refunds.create({
      charge : attr.id,
      amount : attr.amount,
      reverse_transfer : true,
      refund_application_fee : true
    },function(err,refund) {
      if(err){
        return cb(err);
      }
      cb(null,refund);
    });
  },

  newCustomerWithCard : function(attr, cb){
    stripe.customers.create({
      source : attr.token,
      email : attr.email
    },function(err, customer){
      if(err){
        return cb(err);
      }
      return cb(null, customer);
    });
  },

  newPaymentSource : function(attr, cb){
    stripe.customers.createSource(attr.id,{
      source : attr.token,
      email : attr.email
    },function(err, card){
      if(err){
        return cb(err);
      }
      cb(null,card);
    })
  },

  updateCard : function(attr, cb){
    stripe.customers.updateCard(attr.id, attr.cardId, attr.params, function(err, card){
      if(err){
        return cb(err);
      }
      cb(null, card);
    });
  },

  updateDefaultSource : function(attr, cb){
    stripe.customers.update(attr.id, {
      default_source : attr.cardId
    }, function(err, customer){
      return cb(err, customer);
    })
  },

  retrieveCard : function(attr, cb){
    stripe.customers.retrieveCard(attr.id, attr.cardId, function(err, card){
      return cb(err, card);
    });
  },

  retrieveCustomer : function(attr, cb){
    stripe.customers.retrieve(
      attr.id, function(err, customer){
        if(err){
          return cb(err);
        }
        cb(null,customer);
    })
  },

  deleteCard : function(attr, cb){
    stripe.customers.deleteCard(attr.id, attr.cardId, function(err,confirmation){
      if(err){
        return cb(err);
      }
      cb(null, confirmation);
    });
  }
};


