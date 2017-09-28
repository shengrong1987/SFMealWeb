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
  hourOfDay : function(m){
    return m.hours();
  },
  getTimeOfDay : function(date){
    var h = this.hourOfDay(moment(date));
    if(h < 12){
      return "am";
    }else{
      return "pm";
    }
  },
  formattedDate : function(date){
    var mDate = moment(date);
    return mDate.local().format("MMM D ddd");
  },
  getMonthNameFromDate : function(date){
    var mDate = moment(date);
    return mDate.format('MMM');
  },
  getMonthFromDate : function(date){
    return moment(date).format("M");
  },
  getDayOfMonth : function(date){
    return moment(date).format("D");
  },
  getDateFromDate : function(date){
    var mDate = moment(date);
    return mDate.date();
  },
  getWeekFromDate : function(date){
    var mDate = moment(date);
    return mDate.format('ddd');
  },
  getDaysAfterDate : function(date, day){
    var mDate = date.add(day, 'days');
    return mDate.date();
  },
  getDateFromDaysAfterNow : function(date, day){
    return date.add(day, 'days').hour(0).minute(0).second(0).millisecond(0);
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
  getTaxRate : function(county){
    var tax = 0.08;
    switch(county){
      case "San Francisco County":
        tax = 0.085;
        break;
      case "Sacramento County":
        tax = 0.0825;
        break;
      case "San Mateo County":
        tax = 0.0875;
        break;
      case "San Jose County":
        tax = 0.0925;
        break;
    }
    return tax;
  }
};


