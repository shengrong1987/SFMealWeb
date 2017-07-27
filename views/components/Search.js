/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  SearchStore = require('../stores/SearchStore'),
  SFMealAPI = require('../helpers/SFMealAPI');

var _getStateFromStores = function(){
  return SearchStore.getSearchData();
}

var Search = createReactClass({
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    criteria : PropTypes.array,
    model : PropTypes.string
  },

  getDefaultProps: function() {
    return {
      criteria : ["ID"],
      model : 'User'
    };
  },

  getInitialState: function () {
    return {data: _getStateFromStores(), model:'User', message: 'nothing yet'};
  },

  componentWillReceiveProps : function(nextPro){
    this.setState({
      data : { msg : ''}
    })
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
    SFMealAPI.search(this.props.model,$("input[type='radio']:checked").val(),encodeURI($("#searchInput").val()))
  },

  _onCreate : function(){
    SFMealAPI.createForm(this.props.model);
  },

  render: function () {
    var divStyle = {
      width : '100%'
    }, criterias = this.props.criteria.map(function(c, i){
      return (<label key={i} className="radio-inline"><input type="radio" name="criteriaOpt" value={c}/>{c}</label>);
    }, this);
    var buttonStyle = {
      marginLeft: 5 + 'px'
    };
    var resultContent = this.state.data.errMsg ? this.state.data.errMsg : 'Result of "' + this.state.data.criteria + '" searched as "' + decodeURI(this.state.data.search) + '"';
    return (
      <div className="box">
        <div className="input-group row vertical-align">
          <div className="col-xs-10">
            <input id="searchInput" className="input btn-lg btn-outline-blue round text-grey" style={divStyle} type="search"/>
          </div>
          <div className="col-xs-2">
            <div>
              <button className="btn btn-info" onClick={this._onSearch} style={buttonStyle}>Search</button>
            </div>
            <div>
              <button className="btn btn-info" onClick={this._onCreate} style={buttonStyle}>Create</button>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            {criterias}
          </div>
        </div>
        <h1></h1>
        <div className="alert alert-info">{resultContent}</div>
      </div>
    );
  }
});

module.exports = Search;
