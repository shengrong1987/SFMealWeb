
module.exports = function(){

  var nextFn = function(req, res, count, next){
    count++;
    if(count < args.length){
      args[count](req, res, function(){
        nextFn(req, res, count, next);
      })
    }else{
      return next();
    }
  }

  var args = arguments.callee.arguments;
  var count = 0;

  return function(req, res, next){
    args[count](req, res, function(){
      if(count + 1 < args.length){
        nextFn(req, res, count, next);
      }else{
        next();
      }
    });
  }
};
