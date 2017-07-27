/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  TabStore = require('../stores/TabStore'),
  SFMealAPI = require('../helpers/SFMealAPI');

var _getStateFromStores = function () {
  return TabStore.getCurrentTab();
};

var Tab = createReactClass({
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    cols: PropTypes.array
  },

  getDefaultProps: function() {
    return {
      cols: ['User','Meal','Dish','Order']
    };
  },

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

  _onSelect : function (event){
    SFMealAPI.changeTab(event.target.text);
  },

  render: function () {
    var tabs = this.props.cols.map(function (tab, i) {
        if(tab === this.state.tab){
          return (<li className="active" key={i} onClick={this._onSelect}><a href={"#"+tab} data-toggle="tab">{tab}</a></li>);
        }else{
          return (<li onClick={this._onSelect} key={i}><a href={"#"+tab} data-toggle="tab">{tab}</a></li>);
        }
    }, this);

    return (

    <div className="navbar">
      <div className="navbar-inner">
        <ul className="nav nav-pills">
          {tabs}
        </ul>
      </div>
    </div>
     );
  }
});

module.exports = Tab;
