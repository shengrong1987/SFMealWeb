/**
 * CouponController
 *
 * @description :: Server-side logic for managing coupons
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * @error       :: -1 coupon already used
 *                 -2 coupon invalid
 *                 -3 coupon expire
 *                 -4 coupons reward already redeemed
 */

module.exports = {

  find: function(req, res){
    let query = req.query;
    Coupon.find(query).exec(function(err, coupons){
      if(err){
        return res.badRequest(err)
      }
      res.ok(coupons)
    })
  },

  redeem : function(req, res){
    let userId = req.session.user.id;
    if(req.session.user.couponRewardIsRedeemed){
      return res.badRequest({ code: -4, responseText: "coupon reward already redeemed"});
    }
    Coupon.find({type: 'new_user_reward'}).exec(function(err, coupons) {
      if (err) {
        return res.badRequest(err)
      }
      let couponIds = coupons.map(function (coupon) {
        return coupon.id;
      });
      User.findOne(userId).populate("auth").exec(function(err, user){
        if (err) {
          return res.badRequest(err);
        }
        if(!user.unionid && !user.emailVerified){
          return res.badRequest({ code : -8, responseText: req.__('email-unverified') });
        }
        couponIds.forEach(function(cId){
          user.coupons.add(cId);
        });
        user.couponRewardIsRedeemed = true;
        user.numCoupon = couponIds.length;
        user.save(function (err, u) {
          if (err) {
            return res.badRequest(err);
          }
          req.session.user = user;
          res.ok(user)
        })
      });
    })
  },

  applyCoupon : function(req, res){
    var couponCode = req.params.code;
    var userId = req.session.user.id;
    var mealId = req.params.id;
    User.findOne(userId).populate("coupons").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      if(!user.email || !user.emailVerified){
        return res.badRequest({ code : -48, responseText : req.__('coupon-unverified-email')});
      }
      var couponIsValid = true;
      couponIsValid = !user.coupons.some(function(coupon){
        return coupon.code === couponCode;
      });
      if(!couponIsValid){
        return res.badRequest({ code : -1, responseText : req.__('coupon-already-redeem-error')});
      }
      Coupon.find({ code : couponCode }).exec(function(err, coupons){
        if(err){
          return res.badRequest(err);
        }
        if(!coupons || coupons.length === 0){
          return res.badRequest({ code : -2, responseText : req.__('coupon-invalid-error')});
        }
        var coupon = coupons[0];
        if(coupon.expires_at < new Date()){
          return res.badRequest({ code : -3, responseText : req.__('coupon-expire-error')});
        }
        Meal.findOne(mealId).exec(function(err, meal){
          if(err){
            return res.badRequest(err);
          }
          var amount = 0;
          switch(coupon.type){
            case "fix":
              amount = coupon.amount;
              break;
            case "freeShipping":
              amount = meal.delivery_fee;
              break;
          }
          res.ok({ amount : amount, code : coupon.code});
        });
      });
    });
  },

  delete : function(req, res){
    var id = req.params.id;
    Coupon.destroy(id).exec(function(err){
      if(err){
        return res.badRequest(err);
      }
      Coupon.find().exec(function(err, data){
        if(err){
          return res.badRequest(err);
        }
        res.ok(data);
      })
    })
  }
};

