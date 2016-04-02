/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': 'MealController.feature',
  '/meal/:id/confirm' : 'MealController.confirm',
  '/payment/new' : 'PaymentController.newForm',
  '/user/me' : 'UserController.me',
  '/user/getSignedUrl' : 'UserController.calculateSignature',
  '/user/delete' : 'UserController.deleteObject',
  '/user/pocket' : 'UserController.pocket',
  'POST /bank' : 'HostController.createBank',
  'PUT /bank/:id' : 'HostController.updateBank',
  '/host/me' : 'HostController.me',
  '/host/me/createDish' : 'DishController.new_form',
  '/host/me/createMeal' : 'MealController.new_form',
  '/meal/:id/off' : 'MealController.off',
  '/meal/:id/on' : 'MealController.on',
  '/order/:id/adjust-form' : 'OrderController.adjust_order_form',
  '/order/:id/adjust' : 'OrderController.adjust',
  '/order/:id/cancel' : 'OrderController.cancel',
  '/order/:id/confirm' : 'OrderController.confirm',
  '/order/:id/reject' : 'OrderController.reject',
  '/order/:id/ready' : 'OrderController.ready',
  '/order/:id/receive' : 'OrderController.receive',
  '/auth/resetForm' : "AuthController.resetForm"

  //'PUT /meal/:mealId/dish' : 'MealController.addNewDishes',
  //'DELETE /meal/:mealId/dish/:dishId' : 'MealController.removeDish',
  //'DELETE /meal/:mealId/dish' : 'MealController.removeAllDishes'

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
