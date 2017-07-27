/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  TablePanel = require('./TablePanel'),
  Tab = require('./Tab');

var AdminPanel = createReactClass({

  propTypes : {
    title : PropTypes.string,
    version : PropTypes.string,
    currentTab : PropTypes.string
  },

  render: function () {
    var tabs = ['User', 'Host', 'Meal','Dish','Order','Transaction', 'Job', 'Checklist', 'Coupon', 'Email','Review'];

    return (
      <div className="box">
        <h1>{this.props.title} {this.props.version}</h1>
        <Tab cols={tabs}/>
        <TablePanel/>
      </div>
    );
  }
});

module.exports = AdminPanel;
