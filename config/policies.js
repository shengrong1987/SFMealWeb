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

  '*': true,

  //'create' : ['sessionAuth','isHost'],

  AuthController : {
    'logout' : ['sessionAuth']
  },

  UserController : {
    '*' : ['sessionAuth','sessionSelf'],
    'becomeHost' : ['sessionAuth','notHost'],
    'findOne' : ['sessionAuth','sessionSelf'],
    'update' : ['sessionAuth','sessionSelf'],
    'find' : ['sessionAuth','sessionSelf'],
    'me' : ['sessionAuth'],
    'calculateSignature' : ['sessionAuth'],
    'deleteObject' : ['sessionAuth'],
    'pocket' : ['sessionAuth']
  },

  MealController : {
    '*' : ['sessionAuth'],
    'create' : ['sessionAuth','isHost'],
    'feature' : true,
    'find' : true,
    'findOne' : true,
    'search' : true
  },

  HostController : {
    'update' : ['sessionAuth','sessionSelf'],
    'createBank' : ['sessionAuth','isHost'],
    'updateBank' : ['sessionAuth','isHost'],
    'me' : ['sessionAuth','isHost'],
    'apply' : ['sessionAuth']
  },

  PaymentController : {
    'findOne' : ['sessionAuth', 'isOwnerOfCard'],
    'find' : ['sessionAuth'],
    'newForm' : ['sessionAuth'],
    'update' : ['sessionAuth','isOwnerOfCard'],
    'delete' : ['sessionAuth','isOwnerOfCard']
  },

  OrderController :{
    'create' : ['sessionAuth','isNotOwnerOfMeal'],
    'adjust_order_form' : ['sessionAuth','isBelongToOrder'],
    'adjust' : ['sessionAuth','isBelongToOrder'],
    'cancel' : ['sessionAuth','isBelongToOrder'],
    'ready' : ['sessionAuth','isBelongToOrder'],
    'receive' : ['sessionAuth','isBelongToOrder']
  },

  DishController : {
    'new_form' : ['sessionAuth', 'isHost'],
    'create' : ['sessionAuth','isHost']
  }

  //MealController : {
  //  '*' : ['sessionAuth']
  //},
  //
  //DishController : {
  //  '*' : ['sessionAuth']
  //},
  //
  //UserController : {
  //  '*' : ['sessionAuth']
  //}

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
