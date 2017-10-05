/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  createReactClass = require('create-react-class'),
  Table = require('./Table'),
  Search = require('./Search'),
  TabStore = require('../stores/TabStore'),
  Pagination = require('./Pagination');

var _getStateFromStores = function () {
  return TabStore.getCurrentTab();
};

var TablePanel = createReactClass({
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */

  getInitialState: function () {
    return {tab: 'User'};
  },

  componentDidMount: function () {
    TabStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function () {
    TabStore.removeChangeListener(this._onChange);
  },

  _onChange: function () {
    this.setState({
      tab: _getStateFromStores()
    });
  },

  render: function () {
    var headers;
    var details;
    var criterias;
    var attrs;
    switch (this.state.tab){
      case "User":
        headers = {id: "User ID",firstname : 'Firstname',lastname :'Lastname',phone:'Phone','auth.email':'Email',status :'Status',command :'Command'};
        details = {id: "User ID",firstname : 'Firstname',lastname :'Lastname',phone:'Phone','auth.email':'Email',status :'Status',command :'Command'};
        criterias = ['id','firstname','lastname','phone','email'];
        break;
      case "Host":
        headers = {id : 'Host ID', shopName :'Shop Name',intro : 'Intro',full_address : 'Address',email : 'Email', passGuide : 'passGuide', command : 'Command'};
        details = {id : 'Host ID', userId: "User ID", shopName :'Shop Name',intro : 'Intro',full_address : 'Address',email : 'Email', passGuide : 'passGuide', "license.url" : 'License', "license.exp" : 'Expire', "license.valid" : "licenseVerified", dishVerifying : "dishVerifying", accountId : "accountId", bankId : "bankId", picture : "picture", locale : "locale", command : 'Command'};
        criterias = ['id','shopName','email'];
      break;
      case "Meal":
        headers = {id : 'Meal ID', 'chef' : 'Host ID', title : 'Title', type : 'MealType', score : 'Score', county : 'County', pickups : 'pickups', status : 'Status', command : 'Command'};
        details = {id : 'Meal ID', 'chef' : 'Host ID', title : 'Title', type : 'MealType', coverString : 'Cover', score : 'Score', delivery_fee : 'Fee', delivery_range : 'Range', isDelivery : 'isDelivery', county : 'County', provideFromTime : 'provideFrom', provideTillTime : 'provideTill', totalQty : 'totalSupply', leftQty: 'leftSupply', pickups : 'pickups', status : 'Status', command : 'Command'};
        criterias = ['id','hostId','keyword','county'];
        break;
      case "Dish":
        headers = {id : 'Dish ID', 'chef.id' : 'Host ID', title :'Title',price : 'Price',score : 'Score', isVerified : 'Status',command : 'Command'};
        details = {id : 'Dish ID', 'chef.id' : 'Host ID', title :'Title',price : 'Price',score : 'Score', photos : 'Photos', isVerified : 'Status', sold : 'Sold', numberOfReviews : 'numberOfReviews',description : 'Description', type : 'DishType', command : 'Command'};
        criterias = ['id','hostId','mealId','keyword'];
        break;
      case "Order":
        headers = {id : 'Order ID', 'meal.id' : 'Meal ID', subtotal : 'SubTotal', type : 'OrderType', delivery_fee : 'DeliveryFee', method : 'DeliveryMethod', address : 'DeliveryAddress', pickupInfo : 'pickupInfo', tax : 'tax', status : 'Status', command : 'Command'};
        details = {id : 'Order ID', 'mealId' : 'Meal ID', subtotal : 'SubTotal', type : 'OrderType', delivery_fee : 'DeliveryFee', method : 'DeliveryMethod', address : 'DeliveryAddress', orders : 'OrderDishes', pickupInfo : 'pickupInfo', tax : 'tax', guestEmail : 'UserEmail', hostEmail : 'ChefEmail', status : 'Status', lastStatus : 'lastStatus', msg : 'Message', 'host.id' : 'Host ID', 'customer.id' : 'User ID', command : 'Command'};
        criterias = ['id','hostId','userId','meal','status','hostEmail', 'guestEmail','contactInfo.name'];
        break;
      case "Transaction":
        headers = {id : 'Tran ID', 'metadata.userId' : 'User ID', 'metadata.hostId' : 'Host ID', 'metadata.mealId' : 'meal ID', amount : 'Amount', amount_refunded : 'Refunded', application_fee : 'SFMeal Fee', type : 'Type', month : 'month', day : 'Date',  status : 'Status', command : 'Command'};
        details = {id : 'Tran ID', 'metadata.userId' : 'User ID', 'metadata.hostId' : 'Host ID', 'metadata.mealId' : 'meal ID', amount : 'Amount', amount_refunded : 'Refunded', application_fee : 'SFMeal Fee', type : 'Type', month : 'month', day : 'Date',  status : 'Status', receipt_email : 'receiptEmail',dispute : 'Dispute', failure_message : 'failMsg', fraud_details : 'fraud',  command : 'Command'};
        criterias = ['id','hostId','userId'];
        break;
      case "Job":
        headers = {_id : 'Job ID', name : 'name', "nextRunAt" : 'nextRunAt', "lastFinishedAt" : "lastFinishedAt", data : "data", lastRunAt : "lastRunAt", command : 'Command' };
        details = {_id : 'Job ID', name : 'name', "nextRunAt" : 'nextRunAt', "lastFinishedAt" : "lastFinishedAt", data : "data", lastRunAt : "lastRunAt", command : 'Command'} ;
        criterias = ['id', 'name', 'data.orderId', 'data.mealId'];
        break;
      case "Checklist":
        headers = {id : 'checklist ID', 'host.id' : 'host', kitchen : 'kitchen', surface : 'surface', utensil : 'utensil', dishes : 'dishes', refrigerator : 'refrigerator', sourceStorage : 'sourceStorage', dryFoodStorage : 'dryFoodStorage', water : 'water', command : 'Command' };
        details = {id : 'checklist ID', 'host.id' : 'host', kitchen : 'kitchen', surface : 'surface', utensil : 'utensil', dishes : 'dishes', refrigerator : 'refrigerator', sourceStorage : 'sourceStorage', dryFoodStorage : 'dryFoodStorage', water : 'water', command : 'Command' };
        criterias = ['id', 'host', 'key'];
        break;
      case "Coupon":
        headers = {id : 'Coupon ID', type : 'type', amount : 'amount', description : 'description', code : 'code', expires : 'expires_at', command : 'Command' };
        details = {id : 'Coupon ID', type : 'type', amount : 'amount', description : 'description', code : 'code', expires : 'expires_at', command : 'Command' };
        criterias = ['id', 'code', 'type'];
        break;
      case "Email":
        headers = {id : 'Email ID', model : 'model', action : 'action', metaData : 'meta', command : 'Command' };
        details = {id : 'Email ID', model : 'model', action : 'action', metaData : 'meta', command : 'Command' };
        criterias = ['model', 'action', "meta"];
        break;
      case "Review":
        headers = {id : 'Review ID', title : 'title', price : 'price', score : 'score', review : 'review', isPublic : "isPublic", command : 'Command' };
        details = {id : 'Review ID', title : 'title', price : 'price', score : 'score', review : 'review', isPublic : "isPublic", dish : 'dish', meal : 'meal', username : 'username',  command : 'Command' };
        criterias = ['id', 'score', "dishId", "mealId", "hostId", "userId"];
        break;
    }

    return (
      <div>
        <Search criteria={criterias} model={this.state.tab}/>
        <div className="panel panel-default">
          <div className="panel-heading">{this.state.tab}</div>
          <div className="table-responsive">
            <Table header={headers} details={details} model={this.state.tab}/>
            <Pagination maxIndex={10} model={this.state.tab}/>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = TablePanel;
