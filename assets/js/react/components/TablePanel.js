'use strict';

import React from 'react';
import Table from './Table';
import Search from './Search';
import TabStore from '../stores/TabStore';
import Pagination from './Pagination';
import autoBind from 'react-autobind';

var _getStateFromStores = function () {
  return TabStore.getCurrentTab();
};

class TablePanel extends React.Component{

  constructor(props) {
    super(props);
    this.state = {tab: 'User'};
    this.props = props;
    autoBind(this);
  }

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */

  componentDidMount() {
    TabStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    TabStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState({
      tab: _getStateFromStores()
    });
  }

  render() {
    var headers;
    var details;
    var criterias;
    var attrs;
    switch (this.state.tab){
      case "User":
        headers = {id: "ID",firstname : 'Firstname','auth.email':'Email','auth.googleEmail':'google', 'auth.faceBookId': 'facebook', 'auth.unionId':'wechat',emailVerified:'emailVerified',newUserRewardIsRedeemed:'rewardRedeemed',points:'Points',full_address:'Address',command :'Command'};
        details = {id: "ID",firstname : 'Firstname',lastname :'Lastname',phone:'Phone','auth.email':'Email',points:'Points',emailVerified:'emailVerified',newUserRewardIsRedeemed:'rewardRedeemed',full_address:'Address','auth.googleEmail':'google', 'auth.faceBookId': 'facebook', 'auth.unionId':'wechat',status :'Status',command :'Command'};
        criterias = ['id','firstname','lastname','phone','email','emailVerified','newUserRewardIsRedeemed'];
        break;
      case "Host":
        headers = {id : 'ID', shopName :'Shop Name', picture: 'Picture', intro : 'Intro',full_address : 'Address',email : 'Email', passGuide : 'passGuide', 'verification.fields_needed' : 'Verification', command : 'Command'};
        details = {id : 'ID', 'user.id': "User ID", shopName :'Shop Name', intro : 'Intro',full_address : 'Address',email : 'Email', passGuide : 'passGuide', 'verification.fields_needed' : 'Verification', "license.url" : 'License', "license.exp" : 'Expire', "license.valid" : "licenseVerified", dishVerifying : "dishVerifying", accountId : "accountId", bankId : "bankId", picture : "picture", locale : "locale", command : 'Command'};
        criterias = ['id','shopName','email'];
      break;
      case "Meal":
        headers = {id : 'ID', 'chef' : 'Host ID', title : 'Title', score : 'Score', county : 'County', pickups : 'pickups', commission: 'Commission', status : 'Status', command : 'Command'};
        details = {id : 'ID', 'chef' : 'Host ID', title : 'Title', type : 'MealType', coverString : 'Cover', score : 'Score', delivery_fee : 'Fee', delivery_range : 'Range', isDelivery : 'isDelivery', county : 'County', provideFromTime : 'provideFrom', provideTillTime : 'provideTill', totalQty : 'totalSupply', leftQty: 'leftSupply', pickups : 'pickups',commission: 'Commission', status : 'Status', command : 'Command'};
        criterias = ['id','hostId','keyword','county'];
        break;
      case "Dish":
        headers = {id : 'ID', 'chef.id' : 'Host ID', title :'Title',price : 'Price',score : 'Score', isVerified : 'Status',command : 'Command'};
        details = {id : 'ID', 'chef.id' : 'Host ID', title :'Title',price : 'Price',score : 'Score', photos : 'Photos', isVerified : 'Status', sold : 'Sold', numberOfReviews : 'numberOfReviews',description : 'Description', type : 'DishType', command : 'Command'};
        criterias = ['id','hostId','mealId','keyword'];
        break;
      case "Order":
        headers = {id : 'ID', subtotal : 'subtotal', paymentMethod: 'pMethod', method:'method', type: 'type', pickupInfo : 'pickup', orders : "ordered", status : 'Status', customerPhone : "customerPhone", customerName : "customerName", command : 'Command'};
        details = {id : 'ID', 'meal.id': 'Meal ID', subtotal : 'subtotal', paymentMethod: 'pMethod', method:'method', type : 'OrderType', pickupInfo : 'pickupInfo', orders : 'dishes', status : 'status', tax : 'tax', guestEmail : 'UserEmail', hostEmail : 'ChefEmail', lastStatus : 'lastStatus', 'host.id' : 'Host ID', 'customer.id' : 'User ID', delivery_fee : 'DeliveryFee', customerPhone : "customerPhone", customerName : "customerName",  command : 'Command'};
        criterias = ['id','hostId','userId','meal','status','hostEmail', 'guestEmail','contactInfo.name'];
        break;
      case "Transaction":
        headers = {id : 'ID', 'metadata.userId' : 'User ID', 'metadata.hostId' : 'Host ID', 'metadata.mealId' : 'meal ID', amount : 'Amount', amount_refunded : 'Refunded', application_fee : 'SFMeal Fee', type : 'Type', month : 'month', day : 'Date',  status : 'Status', command : 'Command'};
        details = {id : 'ID', 'metadata.userId' : 'User ID', 'metadata.hostId' : 'Host ID', 'metadata.mealId' : 'meal ID', amount : 'Amount', amount_refunded : 'Refunded', application_fee : 'SFMeal Fee', type : 'Type', month : 'month', day : 'Date',  status : 'Status', receipt_email : 'receiptEmail',dispute : 'Dispute', failure_message : 'failMsg', fraud_details : 'fraud',  command : 'Command'};
        criterias = ['id','hostId','userId'];
        break;
      case "Job":
        headers = {_id : 'ID', name : 'name', "nextRunAt" : 'nextRunAt', "lastFinishedAt" : "lastFinishedAt", data : "data", lastRunAt : "lastRunAt", command : 'Command' };
        details = {_id : 'ID', name : 'name', "nextRunAt" : 'nextRunAt', "lastFinishedAt" : "lastFinishedAt", data : "data", lastRunAt : "lastRunAt", command : 'Command'} ;
        criterias = ['id', 'name', 'data.orderId', 'data.mealId'];
        break;
      case "Checklist":
        headers = {id : 'ID', 'host.id' : 'host', kitchen : 'kitchen', surface : 'surface', utensil : 'utensil', dishes : 'dishes', refrigerator : 'refrigerator', sourceStorage : 'sourceStorage', dryFoodStorage : 'dryFoodStorage', water : 'water', command : 'Command' };
        details = {id : 'ID', 'host.id' : 'host', kitchen : 'kitchen', surface : 'surface', utensil : 'utensil', dishes : 'dishes', refrigerator : 'refrigerator', sourceStorage : 'sourceStorage', dryFoodStorage : 'dryFoodStorage', water : 'water', command : 'Command' };
        criterias = ['id', 'host', 'key'];
        break;
      case "Coupon":
        headers = {id : 'ID', type : 'type', amount : 'amount', description : 'description', code : 'code', expires : 'expires_at', command : 'Command' };
        details = {id : 'ID', type : 'type', amount : 'amount', description : 'description', code : 'code', expires : 'expires_at', command : 'Command' };
        criterias = ['id', 'code', 'type'];
        break;
      case "Email":
        headers = {id : 'ID', model : 'model', action : 'action', metaData : 'meta', command : 'Command' };
        details = {id : 'ID', model : 'model', action : 'action', metaData : 'meta', command : 'Command' };
        criterias = ['model', 'action', "meta"];
        break;
      case "Review":
        headers = {id : 'ID', title : 'title', price : 'price', score : 'score', review : 'review', username : 'username', command : 'Command' };
        details = {id : 'ID', title : 'title', price : 'price', score : 'score', review : 'review', isPublic : "isPublic", dish : 'dish', meal : 'meal', username : 'username',  command : 'Command' };
        criterias = ['id', 'score', "dishId", "mealId", "hostId", "userId"];
        break;
      case "Account":
        headers = {id : 'ID', 'legal_entity.business_name' : 'business_name', email : 'email', 'legal_entity.verification' : 'verification', 'legal_entity.personal_id_number_provided' : 'id_provided', 'legal_entity.ssn_last_4_provided' : 'ssn_provided',  command : 'Command' };
        details = {id : 'ID', 'legal_entity.business_name' : 'business_name', email : 'email', 'legal_entity.verification' : 'verification', 'legal_entity.personal_id_number_provided' : 'id_provided', 'legal_entity.ssn_last_4_provided' : 'ssn_provided', 'legal_entity.address' : 'address', charges_enabled : 'charges_enabled', payouts_enabled : 'payouts_enabled', verification : 'verification', command : 'Command' };
        criterias = ['id', 'email', 'business_name'];
        break;
      case "Driver":
        headers = {id: 'ID', driverName : 'driverName', phone: 'phone', availability : 'availability', command : 'Command'}
        details = {id: 'ID', driverName : 'driverName', phone: 'phone', availability : 'availability', command : 'Command'}
        criterias = ['id', 'driverName', 'phone'];
        break;
      case "PickupOption":
        headers =  {id : "ID", pickupFromTime : "from", pickupTillTime : "till", location : "location", method : "method", command : "Command"}
        details =  {id : "ID", pickupFromTime : "from", pickupTillTime : "till", location : "location", method : "method", phone : "phone", publicLocation : "publicLocation", comment : "comment", deliveryCenter : "deliveryCenter", deliveryRange : "deliveryRange", area : "area", county : "county", index : "index", nickname : "nickname", command : "Command"}
        criterias = ["id","nickname", "phone"];
        break;
      case "Badge":
        headers =  {id : "ID", title : "title", desc : "desc", model : "model", rule : "rule", largeImage : "largeImage", command : "Command"}
        details =  {id : "ID", title : "title", desc : "desc", model : "model", rule : "rule", largeImage : "largeImage", command : "Command"}
        criterias = ["id","title", "isAchieved"];
        break;
      case "Combo":
        headers =  {id : "ID", title : "title", discount : "discount", pickupOptions : "pickupOptions", dishes : "dishes", command : "Command"}
        details =  {id : "ID", title : "title", discount : "discount", pickupOptions : "pickupOptions", dishes : "dishes", command : "Command"}
        criterias = ["id","title"];
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
}

export default TablePanel;
