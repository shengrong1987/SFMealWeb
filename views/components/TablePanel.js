/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons'),
  Table = require('./Table'),
  Search = require('./Search'),
  TabStore = require('../stores/TabStore')

var _getStateFromStores = function () {
  return TabStore.getCurrentTab();
};

var TablePanel = React.createClass({
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
      headers = {id : 'Host ID', shopName :'Shop Name',intro : 'Intro',full_address : 'Address',email : 'Email',passGuide : 'Status',command : 'Command'};
      details = {id : 'Host ID', shopName :'Shop Name',intro : 'Intro',full_address : 'Address',email : 'Email', "license.url" : 'License', "license.exp" : 'Expire', passGuide : 'passGuide', "license.valid" : "licenseVerified", command : 'Command'};
      criterias = ['id','shopName','email'];
      break;
      case "Meal":
        headers = {id : 'Meal ID', 'chef.id' : 'Host ID', title : 'Title', type : 'MealType', score : 'Score', county : 'County', status : 'Status', command : 'Command'};
        details = {id : 'Meal ID', 'chef.id' : 'Host ID', title : 'Title', type : 'MealType', coverString : 'Cover', score : 'Score', delivery_fee : 'Fee', delivery_range : 'Range', isDelivery : 'isDelivery', county : 'County', provideFromTime : 'provideFrom', provideTillTime : 'provideTill', totalQty : 'totalSupply', leftQty: 'leftSupply', status : 'Status', command : 'Command'};
        criterias = ['id','hostId','keyword','county'];
        break;
      case "Dish":
        headers = {id : 'Dish ID', 'chef.id' : 'Host ID', title :'Title',price : 'Price',score : 'Score', isVerified : 'Status',command : 'Command'};
        details = {id : 'Dish ID', 'chef.id' : 'Host ID', title :'Title',price : 'Price',score : 'Score', photos : 'Photos', isVerified : 'Status', command : 'Command', sold : 'Sold', numberOfReviews : 'numberOfReviews',description : 'Description', type : 'DishType'};
        criterias = ['id','hostId','mealId','keyword'];
        break;
      case "Order":
        headers = {id : 'Order ID', 'host.id' : 'Host ID', 'customer.id' : 'User ID', 'meal.id' : 'Meal ID', subtotal : 'SubTotal', type : 'OrderType', delivery_fee : 'DeliveryFee', method : 'DeliveryMethod', address : 'DeliveryAddress', status : 'Status', command : 'Command'};
        details = {id : 'Order ID', 'host.id' : 'Host ID', 'customer.id' : 'User ID', 'meal.id' : 'Meal ID', subtotal : 'SubTotal', type : 'OrderType', delivery_fee : 'DeliveryFee', method : 'DeliveryMethod', address : 'DeliveryAddress', orders : 'OrderDishes', pickupInfo : 'pickupMethods', guestEmail : 'UserEmail', hostEmail : 'ChefEmail', status : 'Status',lastStatus : 'lastStatus', msg : 'Message', command : 'Command'};
        criterias = ['id','hostId','userId','mealId','status','hostEmail', 'guestEmail'];
        break;
      case "Transaction":
        headers = {id : 'Tran ID', 'metadata.userId' : 'User ID', 'metadata.hostId' : 'Host ID', 'metadata.mealId' : 'meal ID', amount : 'Amount', amount_refunded : 'Refunded', application_fee : 'SFMeal Fee', type : 'Type', month : 'month', day : 'Date',  status : 'Status', command : 'Command'};
        details = {id : 'Tran ID', 'metadata.userId' : 'User ID', 'metadata.hostId' : 'Host ID', 'metadata.mealId' : 'meal ID', amount : 'Amount', amount_refunded : 'Refunded', application_fee : 'SFMeal Fee', type : 'Type', month : 'month', day : 'Date',  status : 'Status', receipt_email : 'receiptEmail',dispute : 'Dispute', failure_message : 'failMsg', fraud_details : 'fraud',  command : 'Command'};
        criterias = ['id','hostId','userId'];
        break;
    }

    return (
      <div>
        <Search criteria={criterias} model={this.state.tab}/>
        <div className="panel panel-default">
          <div className="panel-heading">{this.state.tab}</div>
          <div className="table-responsive">
            <Table header={headers} details={details} model={this.state.tab}/>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = TablePanel;
