'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import SearchStore from '../stores/SearchStore';
import SFMealAPI from '../helpers/SFMealAPI';
import autoBind from 'react-autobind';

var _getStateFromStores = function(){
  return SearchStore.getSearchData();
}

class Search extends React.Component{

  constructor(props) {
    super(props);
    this.state = {data: _getStateFromStores(), model:'User', message: 'nothing yet'};
    this.props = props;
    autoBind(this);
  }

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  static propTypes = {
    criteria : PropTypes.array,
    model : PropTypes.string
  }

  static defaultProps = {
    criteria : ["ID"],
    model : 'User'
  }

  componentWillReceiveProps(nextPro){
    this.setState({
      data : { msg : ''}
    })
  }

  componentDidMount() {
    SearchStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    SearchStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState({
      data: _getStateFromStores(),
      message: ''
    });
  }

  _onSearch(){
    SFMealAPI.search(this.props.model,$("input[type='radio']:checked").val(),encodeURI($("#searchInput").val()))
  }

  _onCreate(){
    SFMealAPI.createForm(this.props.model);
  }

  _onClean(){
    SFMealAPI.clean(this.props.model);
  }

  _onUpdatePickupOption(){
    SFMealAPI.updateAll(this.props.model, "updateWeek", {});
  }

  render() {
    var divStyle = {
      width : '100%'
    }, criterias = this.props.criteria.map(function(c, i){
      return (<div className="form-check form-check-inline"><input className="form-check-input" type="radio" name="criteriaOpt" value={c}/><label key={i} className="form-check-label">{c}</label></div>);
    }, this);
    var buttonStyle = {
      marginLeft: 5 + 'px',
      marginTop: 5 + 'px'
    };
    var resultContent = this.state.data.errMsg ? this.state.data.errMsg : 'Result of "' + this.state.data.criteria + '" searched as "' + decodeURI(this.state.data.search) + '"';
    return (
      <div className="box">
        <div className="input-group row vertical-align">
          <div className="col-10">
            <input id="searchInput" className="input btn-lg btn-outline-blue round text-grey" style={divStyle} type="search"/>
          </div>
          <div className="col-2">
            <div>
              <button className="btn btn-info" onClick={this._onSearch} style={buttonStyle}>Search</button>
            </div>
            <div>
              <button className="btn btn-info" onClick={this._onCreate} style={buttonStyle}>Create</button>
            </div>
            <div>
              <button className="btn btn-info" onClick={this._onClean} style={buttonStyle}>Clean</button>
            </div>
            <div>
              <button className="btn btn-info" onClick={this._onUpdatePickupOption} style={buttonStyle}>UpdateAll</button>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            {criterias}
          </div>
        </div>
        <h1></h1>
        <div className="alert alert-info">{resultContent}</div>
      </div>
    );
  }
}

export default Search;
