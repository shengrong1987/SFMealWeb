/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons'),
  SearchStore = require('../stores/SearchStore'),
  SFMealAPI = require('../helpers/SFMealAPI');

var _getStateFromStores = function(){
  return SearchStore.getSearchData();
}

var Search = React.createClass({
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    criteria : React.PropTypes.array,
    model : React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      criteria : ["ID"]
    };
  },

  getInitialState: function () {
    return {data: _getStateFromStores(), message: 'nothing yet'};
  },

  componentDidMount: function () {
    SearchStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function () {
    SearchStore.removeChangeListener(this._onChange);
  },

  _onChange: function () {
    this.setState({
      data: _getStateFromStores(),
      message: ''
    });
  },

  _onSearch : function(){
    SFMealAPI.search(this.props.model,"User ID",$("#searchInput").val())
  },

  render: function () {
    var divStyle = {
      width : '100%'
    }, criterias = this.props.criteria.map(function(c){
      return (<label className="radio-inline"><input type="radio" name="criteriaOpt" value={c}/>{c}</label>);
    }, this);
    return (
      <div className="box">
        <div className="input-group row vertical-align">
          <div className="col-xs-10">
            <input id="searchInput" className="input btn-lg btn-outline-blue round text-grey" style={divStyle} type="search"/>
          </div>
          <div className="col-xs-2">
            <button className="btn btn-info" onClick={this._onSearch}>Search</button>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            {criterias}
          </div>
        </div>
        <div className="alert alert-info">Result of {this.state.data.criteria} searched as {this.state.data.search}</div>
      </div>
    );
  }
});

module.exports = Search;
