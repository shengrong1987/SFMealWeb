/**
 * Created by shengrong on 12/3/15.
 */
var stripe = require('stripe')(sails.config.StripeKeys.secretKey);
var async = require('async');

const SERVICE_FEE = 0;
const SYSTEM_DELIVERY_FEE = 399;
const MILEAGE_FEE = 1.18;
const PARTY_ORDER_RANGE_MULTIPLIER = 3;
const SOURCE_FAIL = "failed";
const SOURCE_CANCEL = "canceled";
const SOURCE_PENDING = "pending";
const SOURCE_CHARGEABLE = "chargeable";
const SOURCE_CONSUMED = "consumed";

module.exports = {

  SYSTEM_DELIVERY_FEE : SYSTEM_DELIVERY_FEE,
  SERVICE_FEE : SERVICE_FEE,
  MILEAGE_FEE : MILEAGE_FEE,
  PARTY_ORDER_RANGE_MULTIPLIER : PARTY_ORDER_RANGE_MULTIPLIER,
  SOURCE_FAIL : SOURCE_FAIL,
  SOURCE_CANCEL : SOURCE_CANCEL,
  SOURCE_PENDING : SOURCE_PENDING,
  SOURCE_CHARGEABLE : SOURCE_CHARGEABLE,
  SOURCE_CONSUMED : SOURCE_CONSUMED,

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
    if(attr === "cash"){
      return cb(null, { id: "cash" });
    }
    stripe.charges.retrieve(attr, cb);
  },

  retrieveTransfer : function(id, cb){
    stripe.transfers.retrieve(id, cb);
  },

  retrieveApplicationFee : function(id, cb){
    if(!id){
      return cb(null, null);
    }
    stripe.applicationFees.retrieve(id, function(err, applicationFee) {
      if(err){
        return cb(err);
      }
      cb(null, applicationFee);
    });
  },

  chargeCash : function(attr, cb){
    if(attr.metadata.application_fee === 0){
      return cb(null, { id : 'cash', status : 'succeeded', amount : attr.metadata.total, application_fee : attr.metadata.application_fee}, { amount : 0, application_fee : 0});
    }
    stripe.charges.create({
      amount : attr.metadata.application_fee,
      currency : 'usd',
      source : attr.destination,
      metadata : attr.metadata
    }, function(err, charge){
      if(err){
        return cb(err);
      }
      return cb(null, { id : 'cash', status : 'succeeded', amount : attr.metadata.total, application_fee : attr.metadata.application_fee}, charge);
    });
  },

  chargeCreditCard : function(attr, final){
    var _this = this;
    var charge = null, transfer = null;

    async.auto({
      createCharge : function(cb){
        if(attr.metadata.total === 0){
          return cb();
        }
        stripe.charges.create({
          amount: attr.metadata.total,
          currency: "usd",
          receipt_email: attr.email,
          customer: attr.customerId,
          destination : attr.destination,
          metadata : attr.metadata,
          application_fee : attr.metadata.application_fee
        }, function (err, c) {
          if (err) {
            return cb(err);
          }
          charge = c;
          cb(null, c);
        });
      },
      createTransfer : ['createCharge', function(cb, results){
        if(attr.metadata.discount === 0){
          return cb();
        }
        var charge = results.createCharge;
        sails.log.info("charge: " + charge);
        async.auto({
          calculateChargedFee : function(next){
            if(!charge){
              return next(null, 0);
            }
            _this.retrieveApplicationFee(charge.application_fee, function(err, fee) {
              if (err) {
                return next(err);
              }
              next(null, fee.amount);
            });
          },
          calculateFee : ['calculateChargedFee', function(next, results){
            var chargedFee = results.calculateChargedFee;
            sails.log.info("charged application fee: " + chargedFee);
            attr.metadata.application_fee = attr.metadata.application_fee - chargedFee;
            next();
          }]
        }, function(err){
          if(err){
            return cb(err)
          }
          sails.log.info("charge remain application fee: " + attr.metadata.application_fee);
          var total = attr.metadata.discount - attr.metadata.application_fee;
          stripe.transfers.create(
            {
              amount: total,
              currency: 'usd',
              destination: attr.destination,
              metadata : attr.metadata
            }, function(err, t){
              if(err){
                return cb(err);
              }
              transfer = t;
              sails.log.info("extra transfer created: " + t.amount);
              cb();
            }
          );
        });
      }]
    }, function(err){
      if(err){
        return final(err);
      }
      if(!attr.metadata.userId){
        return final(null, charge);
      }
      _this.handlePoint(charge, attr.metadata.userId, true, function(err, user){
        if(err){
          return final(err);
        }
        final(null, charge, transfer);
      });
    });
  },

  chargeOthers : function(attr, cb){
    var _this = this;
    sails.log.info("charge amount by source: " + attr.amount);
    if(attr.amount === 0){
      return cb(null, null);
    }
    stripe.charges.create({
      amount: attr.amount,
      currency: "usd",
      receipt_email: attr.email,
      source: attr.source,
      destination : attr.destination,
      metadata : attr.metadata,
      application_fee : attr.metadata.application_fee
    }, function (err, charge) {
      if(err){
        return cb(err);
      }
      if(attr.metadata.discount !== 0){
        _this.retrieveApplicationFee(charge.application_fee, function(err, fee){
          if(err){
            return cb(err);
          }
          var leftFee = attr.metadata.application_fee - fee.amount;
          var total = attr.metadata.discount - leftFee;
          sails.log.info("charge remain application fee: " + leftFee);
          attr.metadata.application_fee = leftFee;
          stripe.transfers.create(
            {
              amount: total,
              currency: 'usd',
              destination: attr.destination,
              metadata : attr.metadata
            }, function(err, transfer){
              if(err){
                return cb(err);
              }
              sails.log.info("extra transfer created: " + transfer.amount);
              _this.handlePoint(charge, attr.metadata.userId, true, function(err, user){
                if(err){
                  return cb(err);
                }
                cb(null, charge, transfer);
              });
            }
          );
        });
      }else{
        if(!attr.metadata.userId){
          return cb(null, charge);
        }
        _this.handlePoint(charge, attr.metadata.userId, true, function(err, user){
          if(err){
            return cb(err);
          }
          cb(null, charge);
        });
      }
    });
  },

  newSource : function(attr, cb){
    var _this = this;
    this.calculateTotal(attr);
    if(attr.metadata.total === 0){
      return cb(null, "no-charge");
    }
    stripe.sources.create({
      type: attr.type,
      amount: attr.metadata.total,
      currency: 'usd',
      redirect: {
        return_url:  (process.env.NODE_ENV === 'production' ? 'https://sfmeal.com/' : 'http://localhost:1337/') + 'order/process'
      },
      metadata : attr.metadata
    }, function(err, source){
      if(err){
        return cb(err);
      }
      cb(null, source);
    })
  },

  getSource : function(attr, cb){
    stripe.sources.retrieve(
      attr.id,
      function(err, source){
        if(err){
          return cb(err);
        }
        cb(null, source);
      }
    )
  },

  calculateTotal : function(attr){
    var meal = attr.meal;
    var isInitial = attr.isInitial;
    var serviceFee = isInitial ? SERVICE_FEE : 0;

    //declare all fees
    var delivery_application_fee = (attr.method && attr.method === "delivery" && meal.isDeliveryBySystem) ? SYSTEM_DELIVERY_FEE : 0;
    var delivery_fee = attr.deliveryFee || 0;
    var discount = attr.discount || 0;
    var tax = attr.tax;

    sails.log.info("delivery application fee is: " + delivery_application_fee);
    sails.log.info("delivery fee is: " + delivery_fee);
    sails.log.info("discount is: " + discount);
    sails.log.info("subtotal is: " + attr.amount);
    sails.log.info("tax is: " + tax);

    //calculate application fee
    var application_fee = Math.floor(attr.amount * meal.commission) + delivery_application_fee + serviceFee;

    sails.log.info("application fee is: " + application_fee);

    //calculate subtotal after tax
    var subtotalAfterTax = attr.amount + tax;

    //calculate other fee
    var originalTotal = subtotalAfterTax + delivery_fee + serviceFee;

    //apply discount

    attr.metadata.discount = discount;
    attr.metadata.total = originalTotal - discount;
    attr.metadata.application_fee = application_fee;
    attr.metadata.total = attr.metadata.total < 0 ? 0 : attr.metadata.total;

    sails.log.info("charge total: " + attr.metadata.total);
  },

  charge : function(attr, cb){
    if(attr.paymentMethod === "cash"){
      this.calculateTotal(attr);
      this.chargeCash(attr, cb);
    }else if(attr.paymentMethod === "online"){
      this.calculateTotal(attr);
      this.chargeCreditCard(attr, cb);
    }else{
      this.chargeOthers(attr, cb);
    }
  },

  handlePoint : function(charge, userId, isCharge, cb){
    if(!charge || charge.status !== "succeeded"){
      return cb();
    }
    User.findOne(userId).exec(function(err, user){
      if(err){
        return cb(err);
      }
      var points = user.points || 0;
      var earnedPoints = Math.floor(charge.amount/100);
      if(isCharge){
        var newPoints = points + earnedPoints;
      }else{
        newPoints = points - earnedPoints;
      }
      sails.log.info("user old points: " + points);
      sails.log.info("points difference: " + earnedPoints);
      sails.log.info("user total points: " + newPoints);
      user.points = newPoints;
      user.save(cb);
    })
  },

  batchRefund : function(charges, transfers, metadata, cb){
    if(!charges && !transfers){
      return cb();
    }
    var _this = this;
    var chargeIds = Object.keys(charges);
    var amount = metadata.amount || -1;
    sails.log.info("total money to refund: " + amount/100);
    async.each(chargeIds, function(chargeId, next){
      var thisAmount = charges[chargeId];
      sails.log.info("refund amount in this charge: " + chargeId, " is: " + thisAmount);
      var refundAmount;
      if(thisAmount === 0){
        return next();
      }else if(amount !== -1){
        if(amount === 0){
          return next();
        }else if(thisAmount <= amount){
          refundAmount = thisAmount;
        }else if(thisAmount > amount){
          refundAmount = amount;
        }
        amount -= refundAmount;
      }else{
        refundAmount = thisAmount;
      }
      _this.refund({
        id : chargeId,
        amount : refundAmount,
        metadata : metadata
      },function(err, refund){
        if(err){
          return next(err);
        }
        charges[chargeId] -= refund.amount;
        next();
      });
    },function(err){
      if(err){
        return cb(err);
      }
      if((amount === -1 || amount > 0) && transfers){
        //if refund amount still left or need fully refund, then check transfer.
        metadata.amount = amount;
        _this.batchReverse(transfers, metadata, cb);
      }else{
        cb();
      }
    })
  },

  refund : function(attr, cb){
    if(attr.id === "cash"){
      return cb(null, { amount : attr.amount });
    }
    var $this = this;
    sails.log.debug("refunding customer : $" + attr.amount/100 );
    stripe.refunds.create({
      charge : attr.id,
      amount : attr.amount,
      metadata : attr.metadata,
      reverse_transfer : attr.metadata.reverse_transfer || false,
      refund_application_fee : attr.metadata.refund_application_fee || false
    },function(err,refund) {
      if(err){
        return cb(err);
      }
      if(!attr.metadata.userId){
        return cb(null, refund);
      }
      $this.handlePoint(refund, attr.metadata.userId, false, function(err, user){
        if(err){
          return cb(err);
        }
        cb(null,refund);
      });
    });
  },

  batchReverse : function(transfers, metadata, cb){
    if(!transfers){
      return cb();
    }
    var _this = this;
    var transferIds = Object.keys(transfers);
    var amount = metadata.amount;
    sails.log.info("total money to transfer: $" + amount/100);
    var refundingAmount;
    async.each(transferIds, function(transferId, next){
      var thisAmount = transfers[transferId];
      sails.log.info("amount left in this transfer: $" + thisAmount/100);
      if(thisAmount === 0){
        return next();
      }else if(amount !== -1){
        if(amount === 0){
          return next();
        }else if(thisAmount <= amount){
          refundingAmount = thisAmount;
        }else if(thisAmount > amount){
          refundingAmount = amount;
        }
        amount -= refundingAmount;
      }else{
        refundingAmount = thisAmount;
      }
      _this.reverse({
        id : transferId,
        amount : refundingAmount,
        metadata : metadata
      },function(err, refund){
        if(err){
          return next(err);
        }
        transfers[transferId] -= refund.amount;
        next();
      });
    },function(err){
      if(err){
        return cb(err);
      }
      cb();
    })
  },

  reverse : function(attr, cb){
    var _this = this;
    sails.log.info("reversing transfer: $" + attr.amount/100);
    stripe.transfers.createReversal(
      attr.id,
      {
        amount : attr.amount,
        metadata : attr.metadata,
        refund_application_fee : attr.metadata.refund_application_fee || false
      },
      function(err, reversal){
        if(err){
          return cb(err);
        }
        _this.handlePoint(reversal, attr.metadata.userId, false, function(err, user){
          if(err){
            return cb(err);
          }
          cb(null,reversal);
        });
      }
    );
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


