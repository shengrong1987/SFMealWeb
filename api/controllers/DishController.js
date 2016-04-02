/**
 * DishController
 *
 * @description :: Server-side logic for managing Dishes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	new_form : function(req, res){
    var user = req.session.user;
    return res.view("dish_new",{user : user});
  }
};

