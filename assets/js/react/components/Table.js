'use strict';

import React from 'react';
import TableHeader from './TableHeader';
import UserStore from '../stores/UserStore';
import HostStore from '../stores/HostStore';
import MealStore from '../stores/MealStore';
import DishStore from '../stores/DishStore';
import OrderStore from '../stores/OrderStore';
import TransactionStore from '../stores/TransactionStore';
import JobStore from '../stores/JobStore';
import CheckListStore from '../stores/CheckListStore';
import CouponStore from '../stores/CouponStore';
import EmailStore from '../stores/EmailStore';
import ReviewStore from '../stores/ReviewStore';
import AccountStore from '../stores/AccountStore';
import DriverStore from '../stores/DriverStore';
import PickupOptionStore from '../stores/PickupOptionStore';
import BadgeStore from '../stores/BadgeStore';
import ComboStore from "../stores/ComboStore";
import TableItem from './TableItem';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

class Table extends React.Component{
  constructor(props) {
    super(props);
    this.state = this.getStateFromStore();
    this.props = props;
    autoBind(this);
  }

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  static propTypes = {
    model : PropTypes.string,
    attrs : PropTypes.array,
    header : PropTypes.object
  }

  static defaultProps = {
    model : 'User',
    attrs : [],
    header : []
  }

  getStateFromStore(model){
    switch( model || this.props.model ){
      case "User":
        return {data : UserStore.getAllUsers(), detail : UserStore.isShowDetail()};
        break;
      case "Host":
        return {data : HostStore.getAllHost(), detail : HostStore.isShowDetail()};
        break;
      case "Meal":
        return {data : MealStore.getAllMeals(), detail : MealStore.isShowDetail()};
        break;
      case "Dish":
        return {data : DishStore.getAllDishes(), detail : DishStore.isShowDetail()};
        break;
      case "Order":
        return {data : OrderStore.getAllOrders(), detail : OrderStore.isShowDetail()};
        break;
      case "Transaction":
        return {data : TransactionStore.getAllTransactions(), headData : TransactionStore.getBalance(), detail : TransactionStore.isShowDetail()};
        break;
      case "Job":
        return {data : JobStore.getAllJobs(), detail : JobStore.isShowDetail()};
        break;
      case "Checklist":
        return {data : CheckListStore.getAllChecklist(), detail : CheckListStore.isShowDetail()};
        break;
      case "Coupon":
        return {data : CouponStore.getAllCoupons(), detail : CouponStore.isShowDetail(), isCreate : CouponStore.isCreate()};
        break;
      case "Email":
        return {data : EmailStore.getAllEmails(), isCreate : EmailStore.isCreate()};
        break;
      case "Review":
        return {data : ReviewStore.getAllReviews(), detail : ReviewStore.isShowDetail()};
        break;
      case "Account":
        return {data : AccountStore.getAllAccounts(), detail : AccountStore.isShowDetail()};
        break;
      case "Driver":
        return {data: DriverStore.getAllDrivers(), detail : DriverStore.isShowDetail(), isCreate : DriverStore.isCreate()};
        break;
      case "PickupOption":
        return {data: PickupOptionStore.getAllPickups(), detail : PickupOptionStore.isShowDetail(), isCreate : PickupOptionStore.isCreate()};
        break;
      case "Badge":
        return {data: BadgeStore.getAllBadges(), detail : BadgeStore.isShowDetail(), isCreate : BadgeStore.isCreate()};
        break;
      case "Combo":
        return {data: ComboStore.getAllCombos(), detail : ComboStore.isShowDetail(), isCreate : ComboStore.isCreate()};
        break;
    }
  }

  componentWillReceiveProps(nextProps){
    this.setState(this.getStateFromStore(nextProps.model));
  }

  componentDidMount() {
    UserStore.addChangeListener(this._onChange);
    HostStore.addChangeListener(this._onChange);
    MealStore.addChangeListener(this._onChange);
    DishStore.addChangeListener(this._onChange);
    OrderStore.addChangeListener(this._onChange);
    TransactionStore.addChangeListener(this._onChange);
    JobStore.addChangeListener(this._onChange);
    CheckListStore.addChangeListener(this._onChange);
    CouponStore.addChangeListener(this._onChange);
    EmailStore.addChangeListener(this._onChange);
    ReviewStore.addChangeListener(this._onChange);
    AccountStore.addChangeListener(this._onChange);
    DriverStore.addChangeListener(this._onChange);
    PickupOptionStore.addChangeListener(this._onChange);
    BadgeStore.addChangeListener(this._onChange);
    ComboStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this._onChange);
    HostStore.removeChangeListener(this._onChange);
    MealStore.removeChangeListener(this._onChange);
    DishStore.removeChangeListener(this._onChange);
    OrderStore.removeChangeListener(this._onChange);
    TransactionStore.removeChangeListener(this._onChange);
    JobStore.removeChangeListener(this._onChange);
    CheckListStore.removeChangeListener(this._onChange);
    CouponStore.removeChangeListener(this._onChange);
    EmailStore.removeChangeListener(this._onChange);
    ReviewStore.removeChangeListener(this._onChange);
    AccountStore.removeChangeListener(this._onChange);
    DriverStore.removeChangeListener(this._onChange);
    PickupOptionStore.removeChangeListener(this._onChange);
    BadgeStore.removeChangeListener(this._onChange);
    ComboStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState(this.getStateFromStore(this.props.model));
  }

  render() {
    if(this.state.detail){
      var detailHeaders = this.props.details;
      var attrs = Object.keys(detailHeaders);
      var header = Object.keys(detailHeaders).map(function(key){
        return detailHeaders[key];
      });
    }else{
      var propHeaders = this.props.header;
      var attrs = Object.keys(propHeaders);
      var header = Object.keys(propHeaders).map(function(key){
        return propHeaders[key];
      });
    }

    var model = this.props.model;
    var isCreate = this.state.isCreate;
    var tableStyle = { minHeight : '500px' };


    if(isCreate){
      var tableRows = <TableItem
        attrs={attrs}
        model={model}
        isCreate={isCreate}/>;
    }else{
      var tableRows = this.state.data.map(function(item, key){
        return (
          <TableItem
        key={key}
        data={item}
        attrs={attrs}
        model={model}
        detail={this.state.detail}
        />
        );
      },this);
    }

    return (
        <div>
          <table className="table table-striped table-bordered table-hover table-sm table-responsive" style={tableStyle}>
            <tbody><tr><td colSpan={header.length}>{this.state.headData}</td></tr></tbody>
            <TableHeader cols={header}/>
            <tbody>
              {tableRows}
            </tbody>
          </table>
        </div>
    );
  }
}

export default Table;
