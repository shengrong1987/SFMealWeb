/**
 * Created by ShengRong on 6/12/16.
 */
module.exports = function(firstPolicy, secondPolicy){

  return function(req, res, next){


    var fakeRes = {};

    for(var i in res){
      if(i === 'forbidden'){
        // override the functions you want the `or` factory to handle
        fakeRes[i] = function(){
          console.log("running second policy");
          secondPolicy(req, res, next);
        };
      }
      else{
        fakeRes[i] = res[i];
      }
    }


    firstPolicy(req, fakeRes, next);
  }
}
