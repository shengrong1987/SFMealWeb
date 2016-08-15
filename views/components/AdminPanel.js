/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  TablePanel = require('./TablePanel'),
  Tab = require('./Tab'),
  UserStore = require('../stores/UserStore'),
  ActionCreators = require('../actions/ActionCreators');

var AdminPanel = React.createClass({

  propTypes : {
    title : React.PropTypes.string,
    version : React.PropTypes.string,
    currentTab : React.PropTypes.string
  },

  render: function () {
    var tabs = ['User', 'Host', 'Meal','Dish','Order','Transaction'];

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