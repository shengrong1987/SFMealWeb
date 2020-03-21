/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': false,

  AuthController : {
    'login' : true,
    'register' : true,
    'reset' : true,
    'resetForm' : true,
    'facebook_oauth2' : true,
    'google_oauth2' : true,
    'loginSuccess' : true,
    'logout' : ['sessionAuth'],
    'admin' : 'isAdmin',
    'wechat' : true,
    'wechatSignature' : true,
    'wechatLogin' : true,
    'miniappLogin' : true,
    'getQRCodeTicket' : true,
    'update' : 'isAdmin',
    'refreshUserState' : 'sessionAuth'
  },

  UserController : {
    '*' : 'or(isAdmin,and(sessionAuth,localize,sessionSelf))',
    'create' : false,
    'calculateSignature' : 'sessionAuth',
    'becomeHost' : 'or(isAdmin,and(sessionAuth,localize,notHost))',
    'pocket' : 'or(isAdmin, sessionAuth)',
    'me' : ['sessionAuth','localize'],
    'myorder' : ['sessionAuth','localize'],
    'contactForm' : ['sessionAuth','localize'],
    'search' : 'isAdmin',
    'deleteUserFile' : 'or(isAdmin,sessionAuth)',
    'update' : 'or(isAdmin, and(sessionAuth, sessionSelf, isNotFields("status","pocket","host","customerId","referralBonus","referralCode","points","emailVerified")))',
    'verify' : true,
    'reward' : true,
    'sendEmailVerification' : 'or(isAdmin, and(sessionAuth,localize))',
    'activate' : 'isAdmin',
    'deactivate' : 'isAdmin',
    'clean' : 'isAdmin',
    'invite' : true,
    'join' : true,
    'emailVerificationView' : ['sessionAuth','localize'],
    'redeemReward' : true,
    'verifyEmail' : 'isAdmin',
    'orders' : 'sessionAuth',
    'coupon' : 'sessionAuth',
    'transaction' : 'sessionAuth',
    'card' : 'sessionAuth',
    'redeemCouponReward' : true
  },

  JobController : {
    '*' : 'isAdmin'
  },

  MealController : {
    '*' : 'or(isAdmin, and(sessionAuth,localize,isHost,isOwnerOfMeal))',
    'create' : 'or(isAdmin, and(sessionAuth,isHost))',
    'new_form' : ['sessionAuth','isHost'],
    'feature' : true,
    'find' : 'localize',
    'findOne' : true,
    'search' : 'localize',
    'checkout' : 'localize',
    'catering' : 'localize',
    'findAll' : 'isAdmin',
    'searchAll' : 'isAdmin',
    'findReview' : 'isAdmin',
    'findOrder' : 'isAdmin',
    'updateDishQty' : 'isAdmin',
    'dish' : 'isAdmin',
    'pickup' : 'isAdmin',
    'pintuan' : true,
    'cart' : "sessionAuth",
    'deliveryMap' : true,
    'deliveryData' : true,
    'update' : 'or(isAdmin, and(sessionAuth,isHost,isOwnerOfMeal,isNotFields("isScheduled","chef","score","numberOfReviews","msg","commission")))'
  },

  HostController : {
    '*' : 'or(isAdmin, and(sessionAuth,sessionSelf))',
    'createBank' : 'or(isAdmin, and(sessionAuth,isHost))',
    'updateBank' : 'or(isAdmin, and(sessionAuth,isHost))',
    'verifyLicense' : 'isAdmin',
    'me' : ['sessionAuth','isHost'],
    'apply' : ['sessionAuth'],
    'findOne' : 'isAdmin',
    'update' : 'or(isAdmin,and(sessionAuth, sessionSelf, isNotFields("user","accountId","bankId","long","lat","city","street","passGuide","pocket","commission")))',
    'like' : 'sessionAuth',
    'follow' : 'sessionAuth',
    'unfollow' : 'sessionAuth',
    'search' : 'isAdmin',
    'findReview' : 'isAdmin',
    'findMeal' : 'isAdmin',
    'findDish' : 'isAdmin',
    'hostPage' : 'localize',
    'setup' : 'sessionAuth'
  },

  PaymentController : {
    '*' : 'or(isAdmin, and(sessionAuth, isOwnerOfCard))',
    'create' : 'or(isAdmin,sessionAuth)',
    'newForm' : ['sessionAuth'],
    "update" : 'or(isAdmin, and(sessionAuth, isOwnerOfCard, isNotFields("user")))'
  },

  OrderController : {
    '*' : 'or(isAdmin,and(sessionAuth, isBelongToOrder, isAuthorizedForAction))',
    'find' : 'or(isAdmin,and(sessionAuth, sessionSelf))',
    'create' : 'sessionAuth',
    'search' : 'isAdmin',
    'abort' : 'isAdmin',
    'refund' : 'isAdmin',
    'update' : 'isAdmin',
    'discount' : 'isAdmin',
    'paid' : "isAdmin",
    'receipt' : true,
    'downloadReceipt' : true,
    'paidByWechat' : true,
    'process' : true,
    'verifyOrder' : true,
    'adjustAdmin' : 'isAdmin',
    'updatePickupInfo' : 'isAdmin',
    'findOrdersOfWeek' : true,
    'adjust_order_form' : true,
    'data' : true
  },

  DishController : {
    '*' : 'or(isAdmin,and(sessionAuth, isHost))',
    'verify' : 'isAdmin',
    'fail' : 'isAdmin',
    'destroy' : 'or(isAdmin, and(sessionAuth, isHost, isOwnerOfDish))',
    'update' : 'or(isAdmin, and(sessionAuth, isHost, isOwnerOfDish, isNotFields("sold","numberOfReviews","score","chef", "isFeature", "isVerified","dynamicPrice")))',
    'findReview' : 'isAdmin',
    'preference' : true,
    'find': true
  },

  NotificationController : {
    'sendMessage' : 'isAdmin'
  },

  ReviewController : {
    '*' : ['sessionAuth'],
    'create' : ['sessionAuth', 'isGuestOfMeal'],
    'delete' : 'isAdmin',
    'update' : 'isAdmin',
    'private' : 'isAdmin',
    'orderReview' : true,
    'reviewPopup' : true
  },

  PocketController : {
    '*' : 'isAdmin',
    'getUserBalance' : 'or(isAdmin, and(sessionAuth))',
    'getHostBalance' : 'or(isAdmin, and(sessionAuth, isHost))',
    'getBalance' : 'sessionAuth'
  },

  ChecklistController : {
    'findByHost' : 'or(isAdmin, and(sessionAuth,sessionSelf,isHost))',
    'update' : 'or(isAdmin, and(sessionAuth,sessionSelf,isHost,isNotFields("host")))',
    'find' : 'isAdmin',
    'findOne' : 'isAdmin',
    "verify" : "isAdmin",
    "unVerify" : "isAdmin"
  },

  CouponController : {
    'applyCoupon' : 'sessionAuth',
    'create' : 'isAdmin',
    'find' : 'isAdmin',
    'findOne' : 'isAdmin',
    'delete' : 'isAdmin',
    'redeem' : 'sessionAuth'
  },

  EmailController : {
    'create' : 'isAdmin'
  },

  AccountController : {
    '*' : 'isAdmin'
  },

  DriverController : {
    '*' : 'isAdmin',
    'find' : 'or(isAdmin, and(sessionAuth, isHost))'
  },

  PickupOptionController : {
    '*' : 'isAdmin',
    'find' : 'or(isAdmin, and(sessionAuth, isHost))',
    'updateWeek' : 'isAdmin',
    'current' : true,
    'map' : true
  },

  BadgeController : {
    '*' : 'isAdmin',
    'findBadgeWindow' : true,
    'updateUserBadge' : 'and(sessionAuth, sessionSelf)',
    'update' : 'isAdmin'
  },

  ComboController : {
    '*' : 'isAdmin',
    'find' : true
  }

  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
	// RabbitController: {

		// Apply the `false` policy as the default for all of RabbitController's actions
		// (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
		// '*': false,

		// For the action `nurture`, apply the 'isRabbitMother' policy
		// (this overrides `false` above)
		// nurture	: 'isRabbitMother',

		// Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
		// before letting any users feed our rabbits
		// feed : ['isNiceToAnimals', 'hasRabbitFood']
	// }
};
