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
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().format("LT");
  },
  hourOfDay : function(m){
    return m.hours();
  },
  getTimeOfDay : function(date){
    var h = this.hourOfDay(moment(new Date(date).toISOString()));
    if(h < 12){
      return "am";
    }else{
      return "pm";
    }
  },
  formattedDate : function(date){
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().format("MMM D ddd");
  },
  getMonthNameFromDate : function(date){
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().format('MMM');
  },
  getMonthFromDate : function(date){
    return moment(new Date(date).toISOString()).local().format("M");
  },
  getDayOfMonth : function(date){
    return moment(new Date(date).toISOString()).local().format("D");
  },
  getDateFromDate : function(date){
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().date();
  },
  getWeekFromDate : function(date){
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().format('ddd');
  },
  getWeekOfYear : function(date){
    var mDate = moment(new Date(date).toISOString());
    return mDate.local().isoWeek();
  },
  getDaysAfterDate : function(date, day){
    var mDate = date.add(day, 'days');
    return mDate.local().date();
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
    var mDate = moment(new Date(date).toISOString()).subtract(1, 'hour');
    return mDate.local().toDate();
  },
  oneDayBefore : function(date){
    var mDate = moment(new Date(date).toISOString()).subtract(1, 'day');
    return mDate.local().toDate();
  },
  minutesBefore : function(date, minutes){
    var mDate = moment(new Date(date).toISOString()).subtract(minutes, 'minute');
    return mDate.local().toDate();
  },
  humanizeDate : function(date){
    var date = moment(date);
    var dateDesc = "unknown";
    if(date.isSame(moment(),'day')){
      dateDesc = 'today';
    }else if(date.isSame(moment().add(1,'days'),'day')){
      dateDesc = 'tomorrow';
    }else if(moment.duration(date.diff(moment())).asDays() <= 7){
      dateDesc = date.format('dddd');
    }else{
      dateDesc = date.format('[day]M-DD');
    }
    return dateDesc;
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
  },
  ConvertToCSV : function(objArray) {
    var array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    var line = '';

    for (var index in array[0]) {
      if (index === 'constructor'){
        break;
      }
      if (line !== '') line += ';';

      line += index;
    }

    str += line + '\r\n';

    line = '';

    for (var i = 0; i < array.length; i++) {
      for (index in array[0]) {
        if (index === 'constructor'){
          break;
        }
        if (line !== '') line += ';';

        if(typeof array[i][index] === 'object'){
          array[i][index] = JSON.stringify(array[i][index]);
        }

        line += array[i][index];
        sails.log.info("value: " + array[i][index]);
      }

      str += line + '\r\n';
      line = '';
    }
    return str;
  }
};


