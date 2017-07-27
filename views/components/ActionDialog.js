/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  ReactDOM = require('react-dom'),
  Modal = require('react-bootstrap').Modal,
  SFMealAPI = require('../helpers/SFMealAPI'),
  ActionCreators = require('../actions/ActionCreators'),
  SearchStore = require('../stores/SearchStore'),
  _ = require('lodash');

var _getStateFromStores = function(){
  return SearchStore.getSearchData();
}

var ActionDialog = createReactClass({

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  getInitialState: function() {
    return { modalVisible : false, msgData : null};
  },

  propTypes: {
    data: PropTypes.object,
    title : PropTypes.string,
    isOpen : PropTypes.bool,
    action : PropTypes.string,
    id : PropTypes.string,
    isShowDetail : PropTypes.bool,
    model : PropTypes.string
  },

  componentDidMount: function () {
    SearchStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function () {
    SearchStore.removeChangeListener(this._onChange);
  },

  _onChange: function () {
    this.setState({
      msgData: _getStateFromStores()
    });
  },

  componentWillReceiveProps : function(nextPro){
    if(nextPro.isOpen && !this.state.modalVisible){
      this.setState({modalVisible: true});
    }else if(!nextPro.isOpen && this.state.modalVisible){
      this.setState({modalVisible: false});
    }
    this.setState({
      msgData : ''
    })
  },

  _onClose : function() {
    this.setState({modalVisible: false});
  },

  getDefaultProps: function () {
    return {
      id : '',
      data : {},
      action : '',
      model : 'User',
      isOpen : false,
      isShowDetail : false,
      title : "Enter all fields"
    };
  },

  _onSubmit : function(e){
    e.preventDefault();
    var target = $("#modalView").find("form");
    var postDatas = target.serialize().split("&");
    var isValid = true;
    var keyValue = {};
    if(postDatas.length){
      postDatas.forEach(function(data){
        var dataKeyValues = data.split("=");
        if(!dataKeyValues[1]){
          isValid = false;
        }
        if(dataKeyValues[0] === "provideFromTime" || dataKeyValues[0] === "provideTillTime"){
          keyValue[dataKeyValues[0]] = new Date(decodeURIComponent(dataKeyValues[1])).toISOString();
        }else{
          keyValue[dataKeyValues[0]] = decodeURIComponent(dataKeyValues[1].replace(/\+/g,' '));
        }
      })
    }
    if(!isValid){
      ActionCreators.badRequest("You must enter all fields");
      return;
    }
    this.composeSpecialData(keyValue);

    SFMealAPI.command(this.props.model, this.props.id, this.props.action, this.props.isShowDetail, keyValue);
  },

  composeSpecialData : function(keyValues){
    var addressObj;
    Object.keys(keyValues).forEach(function(key){
      if(key === "street" || key === "zip" ||  key === "city" || key === "state" || key === "county"){
        addressObj = addressObj || {};
        addressObj[key] = keyValues[key];
        delete keyValues[key];
      }
    })
    if(addressObj){
      keyValues['address'] = [addressObj];
    }
  },

  render: function() {
    var data = this.props.data;
    if(!data){
      return (<div></div>);
    }
    var inputs = Object.keys(data).map(function(key, i){
      var valueObj = data[key];
      var type = 'text';
      if(valueObj.type === 'integer' || valueObj.type === 'float'){
        type = 'number';
      }else if(valueObj.type === 'date'){
        type = 'date';
      }else if(valueObj.type === 'boolean'){
        type = 'boolean';
      }
      return (
        <div key={i} className="form-group">
        <label>{key}</label>
        <input className="form-control" name={key} type={valueObj.type} defaultValue={valueObj['value']||'null'}/>
        </div>
      );
    }, this);

    return (
      <div className="modal-container">
        <Modal id="modalView" show={this.state.modalVisible}>

          <Modal.Header closeButton onClick={this._onClose}>
            <Modal.Title>{this.state.msgData ? this.state.msgData.errMsg : this.props.title}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form className="form" role="form">
              {inputs}
            </form>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-info" type="button" onClick={this._onSubmit}>Save</button>
            <button className="btn btn-default close" onClick={this._onClose}>Close</button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = ActionDialog;
