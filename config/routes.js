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
  '/auth/resetForm' : "AuthController.resetForm",
  '/auth/done' : "AuthController.loginSuccess",
  '/join' : 'UserController.join',
  '/user/me' : 'UserController.me',
  '/user/me/contact' : 'UserController.contactForm',
  '/user/:id/update' : 'UserController.update',
  '/user/:id/delete' : 'UserController.deleteUser',
  '/user/:id/activate' : 'UserController.activate',
  '/user/:id/deactivate' : 'UserController.deactivate',
  '/user/getSignedUrl' : 'UserController.calculateSignature',
  '/user/me/deleteFile' : 'UserController.deleteUserFile',
  '/user/:id/sendEmailVerification' : 'UserController.sendEmailVerification',
  '/user/verify/:token' : 'UserController.verify',
  '/user/clean' : 'UserController.clean',
  '/user/:id/balance' : "PocketController.getUserBalance",
  '/host/:id/balance' : "PocketController.getHostBalance",
  '/host/me' : 'HostController.me',
  '/host/me/createDish' : 'DishController.new_form',
  '/host/me/createMeal' : 'MealController.new_form',
  '/host/:id/checklist' : 'ChecklistController.findByHost',
  '/host/:id/verifyLicense' : "HostController.verifyLicense",
  '/host/:id/unverifyLicense' : "HostController.unverifyLicense",
  '/host/:id/like' : "HostController.like",
  '/host/:id/follow' : "HostController.follow",
  '/host/:id/unfollow' : "HostController.unfollow",
  '/host/:id/update' : "HostController.update",
  '/host/:id/review' : "HostController.findReview",
  '/host/:id/meal' : "HostController.findMeal",
  '/host/:id/dish' : "HostController.findDish",
  '/host/public/:id' : "HostController.hostPage",
  '/meal/:id/off' : 'MealController.off',
  '/meal/:id/on' : 'MealController.on',
  '/meal/:id/review' : 'MealController.findReview',
  '/meal/:id/order' : 'MealController.findOrder',
  '/meal/:id/coupon/:code' : 'CouponController.applyCoupon',
  '/meal/:id/confirm' : 'MealController.confirm',
  '/meal/:id/report' : "MealController.report",
  '/meal/:id/update' : "MealController.update",
  '/dish/:id/verify' : 'DishController.verify',
  '/dish/:id/fail' : 'DishController.fail',
  '/dish/:id/review' : 'DishController.findReview',
  '/dish/:id/update' : 'DishController.update',
  '/order/:id/adjust-form' : 'OrderController.adjust_order_form',
  '/order/:id/adjustAdmin' : 'OrderController.adjustAdmin',
  '/order/:id/adjust' : 'OrderController.adjust',
  '/order/:id/cancel' : 'OrderController.cancel',
  '/order/:id/confirm' : 'OrderController.confirm',
  '/order/:id/reject' : 'OrderController.reject',
  '/order/:id/ready' : 'OrderController.ready',
  '/order/:id/receive' : 'OrderController.receive',
  '/order/:id/abort' : 'OrderController.abort',
  '/order/:id/refund' : 'OrderController.refund',
  '/order/:id/receipt' : "OrderController.receipt",
  '/order/:id/pay' : "OrderController.pay",
  '/order/:id/deleteOrder' : "OrderController.deleteOrder",
  '/order/:id/receipt/download' : "OrderController.downloadReceipt",
  '/order/process' : "OrderController.process",
  '/order/:id/verifyOrder' : 'OrderController.verifyOrder',
  '/order/:id/update' : 'OrderController.update',
  '/order/:id/updatePickupInfo' : 'OrderController.updatePickupInfo',
  '/job/:name/run' : 'JobController.run',
  '/job/:id/delete' : 'JobController.deleteJob',
  '/job/clean' : 'JobController.cleanJobs',
  '/review/:id/private' : 'ReviewController.private',
  '/account/:id/reject' : 'AccountController.reject',
  '/account/:id/charge' : 'AccountController.charge',
  '/checklist/:id/verify' : 'ChecklistController.verify',
  '/checklist/:id/unVerify' : 'ChecklistController.unVerify',
  '/coupon/:id/delete' : 'CouponController.delete',
  '/pocket/me' : 'PocketController.getBalance',
  '/pocket/user/me' : 'PocketController.getUserBalance',
  '/pocket/host/me' : 'PocketController.getHostBalance',
  '/payment/new' : 'PaymentController.newForm',
  'POST /bank' : 'HostController.createBank',
  'PUT /bank/:id' : 'HostController.updateBank',
  '/notification/msg' : 'NotificationController.sendMessage',
  '/email/test' : { view : 'emailTemplates/chefSelect/html'},
  '/help' : { view : 'help'},
  '/trust' : { view : 'trust'},
  '/terms' : {view : 'terms'},
  "/apply" : "HostController.apply"
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
