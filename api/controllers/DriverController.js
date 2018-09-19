/**
 * DriverController
 *
 * @description :: Server-side logic for managing drivers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  destroy : function(req, res){
    var id = req.params.id;
    Driver.destroy(id).exec(function(err){
      if(err){
        return res.badRequest(err);
      }
      Driver.find().exec(function(err, data){
        if(err){
          return res.badRequest(err);
        }
        res.ok(data);
      })
    })
  }
};

