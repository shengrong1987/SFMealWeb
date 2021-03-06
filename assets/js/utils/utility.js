/**
 * Created by ShengRong on 5/18/16.
 */
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'moment/locale/en-nz';
import { helperMethod } from "./helper";
// import 'moment-timezone';

var utility  = {
  componentForm : {
    "street_number" : [["form","#streetInput"],["form","input[name='street']"],['.pickup','.location input']],
    "route" : [["form","#streetInput"],["form","input[name='street']"],['.pickup','.location input']],
    "locality" : [["form","#cityInput"],["form","input[name='city']"],['.pickup','.public-location input'],['.pickup','.location input']],
    "postal_code" : [["form","#postalInput"],["form","input[name='zipcode']"],['.pickup','.public-location input']],
    "administrative_area_level_2" : [],
    "administrative_area_level_1" : [["form","input[name='state']"]]
  }
};

utility.googleMapLoaded = false;

utility.initGoogleMapService = function(cb){
  var $this = this;
  if(!utility.googleMapLoaded){
    utility.googleMapLoaded = true;
    jQuery.ajax({
      url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyBwSdr10kQ9xkogbE34AyzwspjaifpaFzA&libraries=places&language=en",
      dataType: 'script',
      async : true,
      defer : true,
      success : function(){
        $this.directionsDisplay = new google.maps.DirectionsRenderer;
        $this.directionsService = new google.maps.DirectionsService;
        $this.geocoder = new google.maps.Geocoder();
        $this.getAutoComplete();
        console.log("google map service loaded");
        if(cb){
          cb();
        }
      },error : function(err){
        console.log(err.statusText);
        if(cb){ cb(err); }
      }
    });
  }
};

utility.initMap = function(ele, center, cb){
  var map = utility.map;
  if(!map){
    console.log("setting map");
    utility.map = new google.maps.Map(ele, {
      center: center,
      scrollwheel: false,
      zoom: 11
    });
    utility.directionsDisplay.setMap(map);
    google.maps.event.trigger(utility.map, "resize");
    utility.map.setCenter(center);
  }
  return cb(null, utility.map);
};

utility.initAutoComplete = function(){
  if(typeof google === 'undefined'){
    utility.initGoogleMapService();
    return;
  }
  utility.getAutoComplete();
};

utility.getPlaceDetail = function(id, ele){
  utility.placesService.getDetails({
    placeId : id
  }, function(place, status){
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      utility.clearField(utility.componentForm, ele);
      utility.fillFromPlace(place.address_components, utility.componentForm, ele);
    }else{
      console.log("place detail status: " + status);
    }
  });
};

utility.getAutoComplete = function(){
  var options = {
    componentRestrictions: {country: 'us'},
    type: ['address'],
    language : 'en'
  };

  var autocomplete;
  var autoCompleteEle = [
    "#streetInput",
    ".location input",
    ".delivery-center input",
    "#paymentInfoView input[name='street']",
    "#contactInfoView input[name='street']",
    "input[name='street']"
  ];
  if(!utility.autoCompletePlaceService){
    utility.autoCompletePlaceService = new google.maps.places.AutocompleteService();
  }
  if(!utility.placesService){
    utility.placesService = new google.maps.places.PlacesService($("#placeServiceHelper").get(0));
  }
  autoCompleteEle.forEach(function (eles) {
    if ($(eles).length) {
      $(eles).toArray().forEach(function (ele) {
        autocomplete = new google["maps"]["places"].Autocomplete(ele, options);
        helperMethod.geolocate(autocomplete);
        autocomplete.addListener('place_changed', function () {
          var place = this["getPlace"]();
          var location = $(ele).val();
          if(!location){
            return;
          }
          utility.autoCompletePlaceService.getQueryPredictions({ input : location }, function(p, status){
            if(status !== google.maps.places.PlacesServiceStatus.OK){
              alert(status);
              return;
            }
            if(p && p.length > 0){
              utility.getPlaceDetail(p[0].place_id, ele);
            }else{
              helperMethod.makeAToast("No results found on the address, please check and try again.");
            }
          });
        });
      });
    }
  });
};

utility.clearField = function(compsForm, ele){
  for (var key in compsForm) {
    compsForm[key].forEach(function (selectors) {
      var container = $(ele).closest(selectors[0]);
      var inputField = container.find(selectors[1]);
      inputField.val("");
      inputField.attr("disabled",false);
    });
  }
};

utility.fillFromPlace = async function(comps, compsForm, ele){
  for(var i=0; i < comps.length; i++){
    var compoType = comps[i].types[0];
    if(compsForm[compoType]){
      //find match component
      var compoValue = comps[i]['long_name'];
      switch (compoType){
        case "postal_code":
          const { default : zipCodeToArea } = await import('../../files/zipcode.json');
          var options = {
            componentRestrictions: {country: 'us'},
            type: ['address']
          };
          Object.keys(zipCodeToArea).forEach(function (area) {
            var zipCodes = zipCodeToArea[area];
            if (zipCodes.indexOf(compoValue) !== -1) {
              $(ele).closest(".autoCompleteTarget").find(".area input").val(area);
              console.log("fill value:" + area);
            }
          })
          break;
        case "administrative_area_level_1":
          compoValue = comps[i]["short_name"];
          break;
        case "administrative_area_level_2":
          $(ele).closest(".autoCompleteTarget").find(".area").data("county", compoValue);
          console.log("fill value:" + compoValue);
          break;
      }
      compsForm[compoType].forEach(function (selectors) {
        var container = $(ele).closest(selectors[0]);
        var inputField = container.find(selectors[1]);
        if (inputField.length) {
          var oldValue = inputField.val();
          var newValue = oldValue ? oldValue + " " + compoValue : compoValue;
          inputField.val(newValue);
          console.log("fill value:" + newValue);
        }
      });
    }
  }
};
utility.geocoding = function(address, cb){
  if(!utility.geocoder){
    return cb("geocoder not initialized");
  }
  utility.geocoder.geocode({ address : address}, function(data, status){
    if (status === google.maps.GeocoderStatus.OK) {
      if (data.length > 0) {
        var location = data[0].geometry.location;
        console.log("geocoding success!");
        cb(null, location, utility.map);
      }
    } else {
      console.log(__('geocodingError') + status);
      cb(__('geocodingError') + status);
    }
  })
},

  utility.distance = function(originalAdd, destAdd, cb){
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
  }

utility.getRoute = function(origin, destination, cb){
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
  var mDate = moment(new Date(date).toISOString()).local();
  return mDate.format("LT");
}

utility.formattedDate = function(date){
  var mDate = moment(new Date(date).toISOString()).local();
  return mDate.format("ddd, M/D, LT");
}

utility.formattedDay = function(date){
  var mDate = moment(new Date(date).toISOString()).local();
  return mDate.format("M/D");
}

utility.monthDesc = function(value){
  return moment.months(value);
}

// moment.tz.add('America/Los_Angeles|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');

export { utility }
