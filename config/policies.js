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
    '*' : 'or(and(sessionAuth,localize,sessionSelf),isAdmin)',
    'create' : false,
    'calculateSignature' : 'sessionAuth',
    'becomeHost' : 'or(and(sessionAuth,localize,notHost),isAdmin)',
    'pocket' : 'or(sessionAuth,isAdmin)',
    'me' : ['sessionAuth','localize'],
    'myorder' : ['sessionAuth','localize'],
    'contactForm' : ['sessionAuth','localize'],
    'search' : 'isAdmin',
    'deleteUserFile' : 'or(sessionAuth,isAdmin)',
    'update' : 'or(and(sessionAuth, sessionSelf, isNotFields("status","pocket","host","customerId","referralBonus","referralCode","points","emailVerified")),isAdmin)',
    'verify' : true,
    'reward' : true,
    'sendEmailVerification' : 'or(and(sessionAuth,localize),isAdmin)',
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
    'transaction' : 'sessionAuth'
  },

  JobController : {
    '*' : 'isAdmin'
  },

  MealController : {
    '*' : 'or(and(sessionAuth,localize,isHost,isOwnerOfMeal),isAdmin)',
    'create' : 'or(and(sessionAuth,isHost),isAdmin)',
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
    'update' : 'or(and(sessionAuth,isHost,isOwnerOfMeal,isNotFields("isScheduled","chef","score","numberOfReviews","msg","commission")),isAdmin)'
  },

  HostController : {
    '*' : 'or(and(sessionAuth,sessionSelf),isAdmin)',
    'createBank' : 'or(and(sessionAuth,isHost),isAdmin)',
    'updateBank' : 'or(and(sessionAuth,isHost),isAdmin)',
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
    '*' : 'or(and(sessionAuth, isOwnerOfCard),isAdmin)',
    'create' : 'or(sessionAuth,isAdmin)',
    'newForm' : ['sessionAuth'],
    "update" : 'or(and(sessionAuth, isOwnerOfCard, isNotFields("user")), isAdmin)'
  },

  OrderController : {
    '*' : 'or(and(sessionAuth, isBelongToOrder, isAuthorizedForAction), isAdmin)',
    'find' : 'or(and(sessionAuth, sessionSelf),isAdmin)',
    'create' : true,
    'search' : 'isAdmin',
    'abort' : 'isAdmin',
    'refund' : 'isAdmin',
    'update' : 'isAdmin',
    'discount' : 'isAdmin',
    'paid' : "isAdmin",
    'receipt' : true,
    'downloadReceipt' : true,
    'process' : true,
    'verifyOrder' : true,
    'adjustAdmin' : 'isAdmin',
    'updatePickupInfo' : 'isAdmin',
    'findOrdersOfWeek' : true,
    'adjust_order_form' : true,
    'data' : true
  },

  DishController : {
    '*' : 'or(and(sessionAuth, isHost),isAdmin)',
    'verify' : 'isAdmin',
    'fail' : 'isAdmin',
    'destroy' : 'or(and(sessionAuth, isHost, isOwnerOfDish), isAdmin)',
    'update' : 'or(and(sessionAuth, isHost, isOwnerOfDish, isNotFields("sold","numberOfReviews","score","chef", "isFeature", "isVerified","dynamicPrice")), isAdmin)',
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
    'getUserBalance' : 'or(and(sessionAuth), isAdmin)',
    'getHostBalance' : 'or(and(sessionAuth, isHost), isAdmin)',
    'getBalance' : 'sessionAuth'
  },

  ChecklistController : {
    'findByHost' : 'or(and(sessionAuth,sessionSelf,isHost), isAdmin)',
    'update' : 'or(and(sessionAuth,sessionSelf,isHost,isNotFields("host")), isAdmin)',
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
