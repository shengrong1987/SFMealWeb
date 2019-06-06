/**
 * BadgeController
 *
 * @description :: Server-side logic for managing Badges
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var async = require("async");

module.exports = {

  findBadgeWindow : function(req, res){
    var badgeId = req.params.id;
    var userId = req.params.userId;
    User.findOne(userId).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      Badge.findOne(badgeId).exec(function(err, badge) {
        if (err) {
          return res.notFound(err);
        }
        if (user && user.badgeInfo && user.badgeInfo.hasOwnProperty(badgeId)) {
          badge.isAchieved = user.badgeInfo[badgeId]['isAchieved'];
          badge.achievedDate = user.badgeInfo[badgeId]['achievedDate'];
          badge.customImage = user.badgeInfo[badgeId]['customImage'];
        }
        res.view('badge', { badge: badge, badgeUser: user, user : req.session.user });
      });
    })
  },

  updateUserBadge : function(req, res){
    var id = req.params.id;
    var userId = req.session.user.id;
    var params = req.body;
    User.findOne(userId).exec(function(err, user){
      if(err){
        return res.badRequest(err);
      }
      Badge.findOne(id).exec(function (err, badge) {
        if(err){
          return res.badRequest(err);
        }
        user.badgeInfo = user.badgeInfo || {};
        user.badgeInfo[id] = user.badgeInfo[id] || {};
        Object.keys(params).forEach(function(key){
          user.badgeInfo[id][key] = params[key];
        });
        user.save(function(err, u){
          if(err){
            return res.badRequest(err);
          }
          res.ok(badge);
        })
      })
    });
  },

  findOne : function(req, res){
    Badge.findOne(req.params.id).exec(function(err, badge){
      if(err){
        return res.badRequest(err);
      }
      res.ok(badge);
    })
  },

  update : function(req, res){
    Badge.update(req.params.id, req.body).exec(function(err, badges){
      if(err){
        return res.badRequest(err);
      }
      res.ok(badges[0]);
    })
  }
};

