/**
 * ChecklistController
 *
 * @description :: Server-side logic for managing checklists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	findByHost : function(req, res){
	  var hostId = req.params.id;
    Checklist.findOne({ host : hostId}).exec(function(err, checklist){
      if(err){
        return res.badRequest(err);
      }
      res.view("checklist",{ checklist : checklist});
    })
  },
  update : function(req, res){
    var id = req.params.id;
    var keys = Object.keys(req.body).forEach(function(key){
      if(key != "id"){
        var checkListValue = JSON.parse(req.body[key]);
        if(checkListValue.url && checkListValue.url != ""){
          checkListValue.status = "pending";
        }else{
          checkListValue.status = "needed";
        }
        req.body[key] = checkListValue;
      }
    });
    Checklist.update(id, req.body).exec(function(err, checkList){
      if(err){
        return res.badRequest(err);
      }
      res.ok(checkList);
    })
  },
  verify : function(req, res){
    var id = req.params.id;
    var key = req.body.key;
    Checklist.findOne(id).exec(function(err, checklist){
      if(err){
        return res.badRequest(err);
      }
      if( checklist[key] ){
        checklist[key].status = "valid";
        checklist.save(function(err, result){
          if(err){
            return res.badRequest(err);
          }
          res.ok(checklist);
        })
      }else{
        res.badRequest("invalid key provided");
      }
    })
  },
  unVerify : function(req, res){
    var id = req.params.id;
    var key = req.body.key;
    Checklist.findOne(id).exec(function(err, checklist){
      if(err){
        return res.badRequest(err);
      }
      if( checklist[key] ){
        checklist[key].status = "fail";
        checklist.save(function(err, result){
          if(err){
            return res.badRequest(err);
          }
          res.ok(checklist);
        })
      }else{
        res.badRequest("invalid key provided");
      }
    })
  }
};

