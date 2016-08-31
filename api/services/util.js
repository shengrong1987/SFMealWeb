/**
 * Created by shengrong on 12/3/15.
 */
var moment = require("moment");

module.exports = {

  getUTCTime : function(){
    var mNow = moment.utc(Date.now());
    return mNow._i;
  },
  getMidNightUTC : function(){
    var today = new Date();
    today.setHours(0,0,0,0);
    var mMidnight = moment.utc(today.getTime());
    return mMidnight._i;
  },
  formattedHour : function(date){
    var mDate = moment(date);
    return mDate.local().format("LT");
  },
  formattedDate : function(date){
    var mDate = moment(date);
    return mDate.local().format("MMM Do YYYY");
  },
  monthDesc : function(value){
    var month = "";
    switch(value){
      case 1:
        month = "Jan";
        break;
      case 2:
        month = "Feb";
        break;
      case 3:
        month = "Mar";
        break;
      case 4:
        month = "Apr";
        break;
      case 5:
        month = "May";
        break;
      case 6:
        month = "June";
        break;
      case 7:
        month = "July";
        break;
      case 8:
        month = "Aug";
        break;
      case 9:
        month = "Sep";
        break;
      case 10:
        month = "Oct";
        break;
      case 11:
        month = "Nov";
        break;
      case 12:
        month = "Dec";
        break;
    }
    return month;
  },
  oneHourBefore : function(date){
    var mDate = moment(date).subtract(1, 'hour');
    return mDate._d;
  },
  oneDayBefore : function(date){
    var mDate = moment(date).subtract(1, 'day');
    return mDate._d;
  },
  minutesBefore : function(date, minutes){
    var mDate = moment(date).subtract(minutes, 'minute');
    return mDate._d;
  },
  calculateTax : function(subtotal, county){
    var tax = 0.08;
    switch(county){
      case "San Francisco County":
        tax = 0.0875;
        break;
      case "Sacramento County":
        tax = 0.08;
        break;
    }
    return (subtotal * (1 + tax)).toFixed(2);
  },
  getTaxRate : function(params){
    var county = (params.host || params.chef).county;
    var tax = 0.08;
    switch(county){
      case "San Francisco County":
        tax = 0.0875;
        break;
      case "Sacramento County":
        tax = 0.08;
        break;
    }
    params.taxRate = tax;
    return tax;
  }
};


