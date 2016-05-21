/**
 * Created by ShengRong on 5/18/16.
 */
(function(global){

  var utility  = {};

  utility.distance = function(address, location, cb){
    geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address : address}, function(results, status){
      if (status == google.maps.GeocoderStatus.OK) {
        var distance = utility.getDistance({lat : results[0].geometry.location.lat(), long: results[0].geometry.location.lng()}, location);
        cb(null, distance);
      } else {
        alert("Geocode was not successful for the following reason: " + status);
        cb("Geocode was not successful for the following reason: ");
      }
    })
  }

  utility.getDistance = function( loc1, loc2, unit ){
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

  utility.getUTCTime = function(){
    var mNow = moment.utc(Date.now());
    return mNow._i;
  }

  utility.getMidNightUTC = function(){
    var today = new Date();
    today.setHours(0,0,0,0);
    var mMidnight = moment.utc(today.getTime());
    return mMidnight._i;
  }

  utility.formattedHour = function(date){
    var mDate = moment(date);
    return mDate.local().format("LT");
  }

  utility.formattedDate = function(date){
    var mDate = moment(date);
    return mDate.local().format("MMM Do YYYY LT");
  }

  utility.formattedDay = function(date){
    var mDate = moment(date);
    return mDate.local().format("MMM Do YYYY");
  }

  utility.monthDesc = function(value){
    return moment.months(value);
  }

  global.utility = utility;

})(this);
