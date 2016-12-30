/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons'),
  TableHeader = require('./TableHeader'),
  UserStore = require('../stores/UserStore'),
  HostStore = require('../stores/HostStore'),
  MealStore = require('../stores/MealStore'),
  DishStore = require('../stores/DishStore'),
  OrderStore = require('../stores/OrderStore'),
  TransactionStore = require('../stores/TransactionStore'),
  JobStore = require('../stores/JobStore'),
  CheckListStore = require('../stores/CheckListStore'),
  CouponStore = require('../stores/CouponStore'),
  TableItem = require('./TableItem');

var Table = React.createClass({
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    model : React.PropTypes.string,
    attrs : React.PropTypes.array,
    header : React.PropTypes.object
  },

  getDefaultProps: function() {
    return {
      model : 'User',
      attrs : [],
      header : []
    };
  },

  getStateFromStore : function(model){
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
    }
  },

  getInitialState: function () {
    return this.getStateFromStore();
  },

  componentWillReceiveProps : function(nextProps){
    this.state = this.getStateFromStore(nextProps.model);
  },

  componentDidMount: function () {
    UserStore.addChangeListener(this._onChange);
    HostStore.addChangeListener(this._onChange);
    MealStore.addChangeListener(this._onChange);
    DishStore.addChangeListener(this._onChange);
    OrderStore.addChangeListener(this._onChange);
    TransactionStore.addChangeListener(this._onChange);
    JobStore.addChangeListener(this._onChange);
    CheckListStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function () {
    UserStore.removeChangeListener(this._onChange);
    HostStore.removeChangeListener(this._onChange);
    MealStore.removeChangeListener(this._onChange);
    DishStore.removeChangeListener(this._onChange);
    OrderStore.removeChangeListener(this._onChange);
    TransactionStore.removeChangeListener(this._onChange);
    JobStore.removeChangeListener(this._onChange);
    CheckListStore.removeChangeListener(this._onChange);
  },

  _onChange: function () {
    this.setState(this.getStateFromStore());
  },

  render: function () {
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
    return (
        <table className="table table-striped table-bordered table-hover">
          <tr><td colSpan={header.length}>{this.state.headData}</td></tr>
          <TableHeader cols={header}/>
          <tbody>
            {tableRows}
          </tbody>
        </table>
    );
  }
});

module.exports = Table;
