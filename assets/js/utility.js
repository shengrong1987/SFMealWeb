/**
 * Created by ShengRong on 5/18/16.
 */
(function(global){

  var utility  = {

  };

  utility.googleMapLoaded = false;

  utility.initGoogleMapService = function(cb){
    var $this = this;
    if(!utility.googleMapLoaded){
      utility.googleMapLoaded = true;
      jQuery.ajax({
        url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyBwSdr10kQ9xkogbE34AyzwspjaifpaFzA&libraries=places",
        dataType: 'script',
        async: true,
        defer : true,
        success : function(){
          $this.directionsDisplay = new google.maps.DirectionsRenderer;
          $this.directionsService = new google.maps.DirectionsService;
          $this.geocoder = new google.maps.Geocoder();
          initAutoComplete(google);
          cb(null, google);
        },error : function(err){
          cb(err);
        }
      });
    }else if(typeof google === 'object' && typeof google.maps === 'object'){
      cb(null, google);
    }
  }

  utility.initMap = function(ele, center, cb){
    utility.initGoogleMapService(function(err){
      if(err){
        return cb(err);
      }
      var map = utility.map;
      if(!map){
        utility.map = new google.maps.Map(ele, {
          center: center,
          scrollwheel: false,
          zoom: 11
        });
        utility.directionsDisplay.setMap(map);
        var alignmentHeight = $($(ele).data("target")).height();
        $(ele).parent().on("shown.bs.collapse", function(e){
          e.preventDefault();
          google.maps.event.trigger(utility.map, "resize");
          utility.map.setCenter(center);
        })
        $(ele).height(alignmentHeight);
        $(ele).parent().height(alignmentHeight);
        google.maps.event.trigger(utility.map, "resize");
        utility.map.setCenter(center);
      }
      return cb(null, utility.map);
    })
  },

  utility.initAutoComplete = function(){
    utility.initGoogleMapService(function(err, google) {
      if (err) {
        return cb(err);
      }
      initAutoComplete(google);
    });
  },

  utility.geocoding = function(address, cb){
    this.initGoogleMapService(function(err){
      if(err){
        return cb(err);
      }
      utility.geocoder.geocode({ address : address}, function(data, status){
        if (status === google.maps.GeocoderStatus.OK) {
          if (data.length > 0) {
            var location = data[0].geometry.location;
            cb(null, location, utility.map);
          }
        } else {
          console.log(jQuery.i18n.prop('geocodingError') + status);
          cb(jQuery.i18n.prop('geocodingError') + status);
        }
      })
    });
  },

  utility.distance = function(originalAdd, destAdd, cb){
    this.initGoogleMapService(function(err){
      if(err){
        return cb(err);
      }
      utility.geocoding(originalAdd, function(err, originalLoc){
        if(err){
          return cb(err);
        }
        utility.geocoding(destAdd, function(err, destLoc) {
          if (err) {
            return cb(err);
          }
          var distance = utility.getDistance(originalLoc, destLoc, "N");
          cb(null, distance);
        });
      })
    });
  }

  utility.getRoute = function(origin, destination, cb){
    utility.initGoogleMapService(function(err){
      if(err){
        return cb(err);
      }
      utility.directionsService.route({
        origin : origin,
        destination : destination,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(Date.now() + 30 * 60 * 1000),  // for the time N milliseconds from now.
          trafficModel: "optimistic"
        }
      }, function(response, status){
        if (status === google.maps.DirectionsStatus.OK) {
          utility.directionsDisplay.setDirections(response);
          var distance = response.routes[0].legs[0].distance.value * 0.0006;
          return cb(null, distance);
        } else {
          console.log("gogole route service unexpected status: " + response.error);
          return cb(response.error);
        }
      })
    })
  }

  utility.getDistance = function( loc1, loc2, unit ){
    var lat1 = loc1.lat();
    var long1 = loc1.lng();
    var lat2 = loc2.lat();
    var long2 = loc2.lng();
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
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().format("LT");
  }

  utility.formattedDate = function(date){
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().format("ddd, l, LT");
  }

  utility.formattedDay = function(date){
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().format("l");
  }

  utility.monthDesc = function(value){
    return moment.months(value);
  }

  global.utility = utility;

})(this);
