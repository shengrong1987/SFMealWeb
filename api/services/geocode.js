/**
 * Created by shengrong on 12/3/15.
 */

var geocoderProvider = 'google';
var httpAdapter = 'https';
var extra = {
  apiKey: 'AIzaSyC-VZJQI2nbr25QpGJBJh8LMFum4l3x2t4', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

module.exports = {

  geocode : function(address, cb){
    geocoder.geocode(address, function(err, res) {
      if(err){
        cb(err);
      }else{
        cb(err,res);
      }
    });
  }
}


