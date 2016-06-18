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
    return {tab: 'Users'};
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
    var criterias;
    switch (this.state.tab){
      case "Users":
        headers = ['Name','User ID','Phone','Email','Status','Command'];
        criterias = ['Name','User ID','Phone','Email'];
      case "Hosts":
        headers = ['Name','User ID','Phone','Email','Status','Command'];
        criterias = ['Name','User ID','Phone','Email'];
    }

    return (
      <div>
        <Search criteria={criterias}/>
        <div className="panel panel-default">
          <div className="panel-heading">{this.state.tab}</div>
          <div className="table-responsive">
            <Table header={headers}/>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = TablePanel;
