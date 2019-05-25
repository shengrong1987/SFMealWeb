/**
 * BadgeController
 *
 * @description :: Server-side logic for managing Badges
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  findBadgeWindow : function(req, res){
    var badgeId = req.params.id;
    Badge.findOne(badgeId).exec(function(err, badge){
      if(err){
        return res.notFound(err);
      }
      res.view('badge', badge);
    })
  }
};

