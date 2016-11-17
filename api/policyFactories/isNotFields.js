/**
 * Created by ShengRong on 6/12/16.
 */
module.exports = function(){

  var fields = arguments.callee.arguments;
  return function(req, res, next){

    sails.log.debug("running isNotFields policy checking fields :" + fields.length);
    if(fields.length == 0){
      return next();
    }

    var isInFields = Array.from(fields).some(function(field){
      return req.param(field) != undefined;
    });

    if(isInFields){
      return res.forbidden("You are not permitted to update certain fields");
    }

    next();

  }
}
