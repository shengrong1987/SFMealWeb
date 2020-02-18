/**
 * Created by shengrong on 12/3/15.
 */
var stripe = require('stripe')(sails.config.StripeKeys.secretKey);
var async = require('async');

const SERVICE_FEE = 0;
const SYSTEM_DELIVERY_FEE = 0;
const MILEAGE_FEE = 1.18;
const PARTY_ORDER_RANGE_MULTIPLIER = 10;
const ONLINE_TRANSACTION_FEE = 100;
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

  getAccountLinks: function(accountId, cb){
    stripe.accountLinks.create({
      account: accountId,
      failure_url: 'https://localhost:1337/host/apply',
      success_url: 'https://localhost:1337/host/apply',
      type: 'custom_account_verification',
      collect: 'eventually_due'
    }, function(err, accountLinks){
      if(err){
        return cb(err);
      }
      cb(null, accountLinks);
    });
  },

  chargeCash : function(attr, cb){
    var _this = this;
    if(attr.metadata.application_fee_amount === 0){
      return cb(null, { id : 'cash', status : 'succeeded', amount : attr.metadata.total, application_fee_amount : attr.metadata.application_fee_amount}, { amount : 0, application_fee_amount : 0});
    }
    if(attr.metadata.application_fee_amount < 50){
      attr.metadata.application_fee_amount = 50;
    }
    var charge, transfer = null;
    async.auto({
      //----------depreciate----------
      chargeApplicationFee : function(next){
        stripe.charges.create({
          amount : attr.metadata.application_fee_amount,
          currency : 'usd',
          source : attr.destination,
          metadata : attr.metadata
        }, function(err, c){
          if(err){
            return next(err);
          }
          charge = c;
          next();
        });
      },
      transferDiscount : function(next){
        if(attr.metadata.discount === 0){
          return next();
        }
        stripe.transfers.create(
          {
            amount: attr.metadata.discount,
            currency: 'usd',
            destination: attr.destination,
            metadata : attr.metadata
          }, function(err, t){
            if(err){
              return next(err);
            }
            transfer = t;
            next();
          }
        );
      }
    }, function(err){
      if(err){
        return cb(err);
      }
      _this.handlePoint(attr.metadata.total, attr.metadata.userId, function(err, user){
        if(err){
          return cb(err);
        }
        cb(null, { id : charge.id, status : charge.status, amount : attr.metadata.total, application_fee_amount : charge.amount}, transfer);
      });
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
          transfer_data: {
            destination: attr.destination
          },
          metadata : attr.metadata,
          application_fee_amount : attr.metadata.application_fee_amount
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
        async.auto({
          calculateChargedFee : function(next){
            if(!charge){
              return next(null, 0);
            }
            _this.retrieveApplicationFee(charge.application_fee_amount, function(err, fee) {
              if (err) {
                return next(err);
              }
              next(null, fee.amount);
            });
          },
          calculateFee : ['calculateChargedFee', function(next, results){
            var chargedFee = results.calculateChargedFee;
            attr.metadata.application_fee_amount = attr.metadata.application_fee_amount - chargedFee;
            next();
          }]
        }, function(err){
          if(err){
            return cb(err)
          }
          var total = attr.metadata.discount - attr.metadata.application_fee_amount;
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
              cb();
            }
          );
        });
      }]
    }, function(err){
      if(err){
        return final(err);
      }
      if(!attr.metadata.userId || !charge){
        return final(null, charge, transfer);
      }
      _this.handlePoint(charge.amount, attr.metadata.userId, function(err, user){
        if(err){
          return final(err);
        }
        final(null, charge, transfer);
      });
    });
  },

  chargeOthers : function(attr, cb){
    var _this = this;
    if(attr.amount === 0){
      return cb(null, null);
    }
    stripe.charges.create({
      amount: attr.amount,
      currency: "usd",
      receipt_email: attr.email,
      source: attr.source,
      transfer_data: {
        destination : attr.destination
      },
      metadata : attr.metadata,
      application_fee_amount : attr.metadata.application_fee_amount
    }, function (err, charge) {
      if(err){
        return cb(err);
      }

      if(attr.metadata.discount !== 0){
        attr.metadata.discount = parseInt(attr.metadata.discount);
        _this.retrieveApplicationFee(charge.application_fee_amount, function(err, fee){
          if(err){
            return cb(err);
          }
          var leftFee = attr.metadata.application_fee_amount - fee.amount;
          var total = attr.metadata.discount - leftFee;
          attr.metadata.application_fee_amount = leftFee;
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
              if(!charge || charge.amount===0 || attr.metadata.userId){
                return cb(null, charge, transfer);
              }
              _this.handlePoint(charge.amount, attr.metadata.userId, function(err, user){
                if(err){
                  return cb(err);
                }
                cb(null, charge, transfer);
              });
            }
          );
        });
      }else{
        if(!charge || charge.amount===0 || attr.metadata.userId){
          return cb(null, charge);
        }
        _this.handlePoint(charge.amount, attr.metadata.userId, function(err, user){
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

  getTotal : function(orders){
    var _this = this;
    var total = 0;
    orders.forEach(function(order){
      var attr = {
        paymentMethod : order.paymentMethod,
        isInitial : true,
        amount : order.subtotal * 100,
        tip : order.tip,
        deliveryFee : parseInt(order.delivery_fee * 100),
        discount : order.discount * 100,
        email : order.guestEmail,
        customerId : order.customerId,
        destination : order.meal.chef.accountId,
        meal : order.meal,
        method : order.method,
        tax : order.tax,
        isPartyMode : order.isPartyMode,
        metadata : {
          mealId : order.meal.id,
          hostId : order.meal.chef.id,
          orderId : order.id,
          userId : order.customer,
          deliveryFee : parseInt(order.delivery_fee * 100),
          tax : order.tax
        }
      };
      _this.calculateTotal(attr);
      total += attr.metadata.total;
    });
    return total;
  },

  calculateTotal : function(attr){
    var meal = attr.meal;
    var isInitial = attr.isInitial;
    var serviceFee = isInitial ? SERVICE_FEE : 0;

    //declare all fees
    var delivery_application_fee = (!attr.isPartyMode && attr.method && attr.method === "delivery" && meal.isDeliveryBySystem) ? SYSTEM_DELIVERY_FEE : 0;
    var delivery_fee = attr.deliveryFee || 0;
    var discount = parseInt(attr.discount) || 0;
    var tax = attr.tax;
    var tip = (attr.tip || 0) * 100;

    //calculate transaction fee
    if(attr.paymentMethod === "cash"){
      var transaction_fee = 0;
    }else{
      transaction_fee = ONLINE_TRANSACTION_FEE;
    }
    //calculate application fee
    if(attr.paymentMethod === "online"){
      var application_fee_amount = Math.floor(attr.amount * meal.commission) + delivery_application_fee + serviceFee + tip;
    }else{
      application_fee_amount = Math.floor(attr.amount * meal.commission) + delivery_application_fee + serviceFee;
    }

    //calculate subtotal after tax
    var subtotalAfterTax = attr.amount + tax + tip;

    //calculate other fee
    var originalTotal = subtotalAfterTax + delivery_fee + serviceFee + transaction_fee;

    attr.metadata.discount = discount;
    attr.metadata.total = originalTotal - discount;
    attr.metadata.application_fee_amount = application_fee_amount;
    attr.metadata.total = attr.metadata.total < 0 ? 0 : attr.metadata.total;
    attr.metadata.tip = attr.tip || 0;
  },

  charge : function(attr, cb){
    if(attr.paymentMethod === "cash" || attr.paymentMethod === "venmo" || attr.paymentMethod === "paypal"){
      this.calculateTotal(attr);
      this.chargeCash(attr, cb);
    }else if(attr.paymentMethod === "online"){
      this.calculateTotal(attr);
      this.chargeCreditCard(attr, cb);
    }else{
      this.chargeOthers(attr, cb);
    }
  },

  handlePoint : function(amount, userId, cb){
    if(!userId){
      return cb();
    }
    User.findOne(userId).exec(function(err, user){
      if(err){
        return cb(err);
      }
      var points = user.points || 0;
      user.historyPoints = user.historyPoints || points;
      var earnedPoints = Math.floor(amount/200);
      var newPoints = points + earnedPoints;
      sails.log.info("Points difference: " + earnedPoints, " New Points: " + newPoints);
      user.points = newPoints;
      if(earnedPoints > 0){
        user.historyPoints += earnedPoints;
      }
      user.save(cb);
    });
  },

  transfer : function(attr, cb){
    var amount = attr.metadata.amount;
    var _this = this;
    stripe.transfers.create(
      {
        amount: amount,
        currency: 'usd',
        destination: attr.metadata.destination,
        metadata : attr.metadata
      }, function(err, transfer){
        if(err){
          return cb(err);
        }
        if(!transfer || transfer.amount===0 || attr.metadata.userId){
          return cb(null, transfer);
        }
        _this.handlePoint(transfer.amount, attr.metadata.userId, function(err, user){
          if(err){
            return cb(err);
          }
          cb(null, transfer);
        })
      }
    );
  },

  batchRefund : function(charges, transfers, metadata, cb){
    if(!charges && !transfers){
      return cb();
    }
    var _this = this;
    var chargeIds = Object.keys(charges);
    var amount = metadata.amount || -1;
    async.each(chargeIds, function(chargeId, next){
      var thisAmount = charges[chargeId];
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
    console.log("refund amount: " + attr.amount);
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
      if(!attr.metadata.userId || !refund || refund.amount === 0){
        return cb(null, refund);
      }
      $this.handlePoint(-refund.amount, attr.metadata.userId, function(err, user){
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
    var refundingAmount;
    async.each(transferIds, function(transferId, next){
      var thisAmount = transfers[transferId];
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
        _this.handlePoint(-reversal.amount, attr.metadata.userId, function(err, user){
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

  retrieveConnectAccounts : function(attr, cb){
    stripe.accounts.list(
      { limit: attr.limit },
      function(err, accounts) {
        if(err){
          return cb(err);
        }
        cb(null, accounts);
      }
    );
  },

  retrieveConnectAccount : function(attr, cb){
    stripe.accounts.retrieve(
      attr.id,
      function(err, account) {
        if(err){
          return cb(err);
        }
        cb(null, account);
      });
  },

  rejectAccount : function(attr, cb){
    stripe.accounts.reject(
      attr.id,
      {reason: attr.msg},
      function(err, account) {
        if(err){
          return cb(err);
        }
        cb(null, account);
    });
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


