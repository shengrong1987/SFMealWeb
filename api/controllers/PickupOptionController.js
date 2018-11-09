/**
 * PickupController
 *
 * @description :: Server-side logic for managing Pickups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	update : function(req, res){
	  var pickupOptionId = req.param("id");
	  PickupOption.update({ id : pickupOptionId }, req.body, function(err, pickupOptions){
	    if(err){
	      return res.badRequest(err);
      }
      res.ok(pickupOptions[0]);
    })
  }
};

