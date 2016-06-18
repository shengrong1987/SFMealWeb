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
    'loginSuccess' : ['sessionAuth'],
    'logout' : ['sessionAuth']
  },

  UserController : {
    '*' : 'or(and(sessionAuth, sessionSelf),isAdmin)',
    'calculateSignature' : 'sessionAuth',
    'becomeHost' : 'or(and(sessionAuth, notHost),isAdmin)',
    'pocket' : 'or(sessionAuth,isAdmin)',
    'me' : ['sessionAuth']
  },

  MealController : {
    '*' : 'or(and(sessionAuth,isHost,isOwnerOfMeal),isAdmin)',
    'create' : 'or(and(sessionAuth,isHost),isAdmin)',
    'new_form' : ['sessionAuth','isHost'],
    'feature' : true,
    'find' : true,
    'findOne' : true,
    'search' : true
  },

  HostController : {
    '*' : 'or(and(sessionAuth,sessionSelf),isAdmin)',
    'createBank' : 'or(and(sessionAuth,isHost),isAdmin)',
    'updateBank' : 'or(and(sessionAuth,isHost),isAdmin)',
    'me' : ['sessionAuth','isHost'],
    'apply' : ['sessionAuth']
  },

  PaymentController : {
    '*' : 'or(and(sessionAuth, isOwnerOfCard),isAdmin)',
    'create' : 'or(sessionAuth,isAdmin)',
    'newForm' : ['sessionAuth']
  },

  OrderController :{
    '*' : 'or(and(sessionAuth, isBelongToOrder), isAdmin)',
    'find' : 'or(and(sessionAuth, sessionSelf),isAdmin)',
    'create' : 'or(and(sessionAuth,isNotOwnerOfMeal),isAdmin)'
  },

  DishController : {
    '*' : 'or(and(sessionAuth, isHost),isAdmin)',
  },

  NotificationController : {
    '*' : true
  },

  ReviewController : {
    '*' : ['sessionAuth'],
    'create' : ['sessionAuth', 'isGuestOfMeal'],
    'delete' : ['isAdmin'],
    'update' : ['isAdmin']
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
