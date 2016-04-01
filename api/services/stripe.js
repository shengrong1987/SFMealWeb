/**
 * Created by shengrong on 12/3/15.
 */
var stripe = require('stripe')(sails.config.StripeKeys.secretKey);

module.exports = {

  createManagedAccount : function(attr,cb){
    stripe.accounts.create({
      managed : true,
      country : 'US',
      email : attr.email,
      transfer_schedule : {
        interval : "weekly",
        weekly_anchor : "monday"
      }
    },function(err, account) {
      if (err) {
        return cb(err);
      }
      cb(null,account);
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
    stripe.balance.listTransactions({stripe_account : attr.id},function(err, transactions){
      if(err){
        return cb(err);
      }
      cb(null,transactions);
    });
  },

  charge : function(attr ,cb){
    stripe.charges.create({
      amount: attr.amount,
      currency: "usd",
      receipt_email: attr.email,
      customer: attr.customerId,
      destination : attr.destination
    }, function (err, charge) {
      if(err){
        return cb(err);
      }
      cb(null,charge);
    });
  },

  refund : function(attr, cb){
    stripe.refunds.create({
      charge : attr.id,
      amount : attr.amount
    },function(err,refund) {
      if(err){
        return cb(err);
      }
      cb(null,refund);
    });
  },

  payment : function(attr, cb){
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

  updatePayment : function(attr, cb){
    stripe.customers.update(attr.id,{
      source : attr.token,
      email : attr.email
    },function(err, customer){
      if(err){
        return cb(err);
      }
      cb(null,customer);
    })
  },

  deleteProfile : function(attr, cb){
    stripe.customers.del(attr.id, function(err,confirmation){
      if(err){
        return cb(err);
      }
      cb(null, confirmation);
    });
  }
};


