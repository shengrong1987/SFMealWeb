/**
 * Created by shengrong on 12/3/15.
 */
var moment = require("moment");

module.exports = {
  formattedHour : function(date){
    var mDate = moment(date);
    return mDate.format("LT");
  },
  formattedDate : function(date){
    var mDate = moment(date);
    return mDate.format("MMM Do YYYY");
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
  }
};


