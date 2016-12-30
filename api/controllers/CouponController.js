/**
 * CouponController
 *
 * @description :: Server-side logic for managing coupons
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * @error       :: -1 coupon already used
 *                 -2 coupon invalid
 *                 -3 coupon expire
 */

module.exports = {
  applyCoupon : function(req, res){
    var couponCode = req.params.code;
    var userId = req.session.user.id;
    var mealId = req.params.id;
    User.findOne(userId).populate("coupons").exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      var couponIsValid = true;
      couponIsValid = !user.coupons.some(function(coupon){
        return coupon.code == couponCode;
      })
      if(!couponIsValid){
        return res.badRequest({ code : -1, responseText : req.__('coupon-already-redeem-error')});
      }
      Coupon.find({ code : couponCode }).exec(function(err, coupons){
        if(err){
          return res.badRequest(err);
        }
        if(!coupons || coupons.length == 0){
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
  }
};

