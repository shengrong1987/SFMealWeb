/**
 * Created by shengrong on 12/3/15.
 */

var geocoderProvider = 'google';
var httpAdapter = 'https';
var extra = {
  apiKey: 'AIzaSyC5vopyoqRXjpYBRgtrjCXtnxGCNGWfnMk', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

module.exports = {
  geocode : function(address, cb){
    geocoder.geocode(address, function(err, res) {
      if(err){
        sails.log.debug("Error in geocoding address:" + address);
        return cb(err);
      }
      cb(null,res);
    });
  },

  geocodeCity : function(city, cb){
    geocoder.geocode(city, function(err, data){
      cb(err, data);
    });
  },

  geocodeAdvance : function(zipCode, cb){
    geocoder.geocode({zipcode : zipCode, address : "USA", country : "USA"}, function(err, res) {
      if(err){
        cb(err);
      }else{
        cb(err,res);
      }
    });
  },

  distance : function(address, deliveryCenterAddress, cb){
    sails.log.debug("Calculating distance between " + address + " and " + deliveryCenterAddress);
    var $this = this;
    geocoder.geocode({ address : address}, function(err, res){
      if (err) {
        return cb(err);
      }
      sails.log.info("respond:" + res);
      if(res.length === 0 ){
        return cb("cannot connect to Internet");
      }
      var userLoc = {lat : res[0].latitude, long: res[0].longitude};
      geocoder.geocode( { address : deliveryCenterAddress }, function(err, res){
        if(err){
          return cb(err);
        }
        if(res.length === 0){
          return cb("cannot connect to Internet");
        }
        var deliveryLoc = {lat : res[0].latitude, long: res[0].longitude};
        var distance = $this.getDistance(userLoc, deliveryLoc, "N");
        cb(null, distance);
      });
    })
  },

  getDistance : function( loc1, loc2, unit ){
    var lat1 = loc1.lat;
    var long1 = loc1.long;
    var lat2 = loc2.lat;
    var long2 = loc2.long;
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var theta = long1-long2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist;
  }

}


