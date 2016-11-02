/**
 * Module dependencies
 */
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil.js');

/**
 * Find One Record
 *
 * get /:modelIdentity/:id
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified id.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to look up *
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findOneRecord (req, res) {

  var Model = actionUtil.parseModel(req);
  var pk = actionUtil.requirePk(req);
  var isEditMode = req.query.edit;

  if(isEditMode){
    var user = req.session.user;
    if(!user){
      return res.forbidden();
    }
    var host = user.host;
    var hostId = host.id ? host.id : host;
    if(!hostId){
      return res.forbidden();
    }
  }

  var query = Model.findOne(pk);
  query = actionUtil.populateEach(query, req);
  query.exec(function found(err, matchingRecord) {
    if (err) return res.serverError(err);
    if(!matchingRecord) return res.notFound('No record found with the specified `id`.');

    if (sails.hooks.pubsub && req.isSocket) {
      Model.subscribe(req, matchingRecord);
      actionUtil.subscribeDeep(req, matchingRecord);
    }

    if(req.wantsJSON && sails.config.environment === 'development'){
     res.ok(matchingRecord);
    }else if(Model.adapter.identity == "meal"){
      if(isEditMode){
        matchingRecord.userId = user.id;
        Host.findOne(hostId).populate("user").populate("dishes").exec(function(err,host){
          if(err){
            return res.badRequest(err);
          }
          matchingRecord.allDishes = host.dishes;
          matchingRecord.phone = host.user.phone;
          res.view('meal_edit',{meal : matchingRecord});
        });
      }else{
        if(req.session.authenticated){
          var userId = req.session.user.id;
          User.findOne(userId).populate("collects").exec(function(err,user){
            if(err){
              return res.badRequest(err);
            }
            Order.find({meal : matchingRecord.id, status : ["schedule","preparing"]}).exec(function(err, orders){
              if(err){
                return res.badRequest(err);
              }
              orders = orders.map(function(order){
                return order.orders;
              });
              res.view('meal',{meal : matchingRecord, user : user, orders : orders});
            });
          });
        }else{
          res.view('meal',{meal : matchingRecord, user : undefined, orders : null});
        }
      }
    }else if(Model.adapter.identity == "user"){
      res.view('user',{user : matchingRecord});
    }else if(Model.adapter.identity == "payment"){
      res.view('payment',{payment: matchingRecord,layout:false});
    }else if(Model.adapter.identity == "dish"){
      if(isEditMode){
        matchingRecord.userId = user.id;
        res.view('dish_edit',{dish : matchingRecord});
      }else{
        res.ok(matchingRecord);
      }
    }else{
      res.ok(matchingRecord);
    }
  });

};
