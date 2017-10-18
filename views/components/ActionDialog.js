/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  ReactDOM = require('react-dom'),
  Modal = require('react-bootstrap').Modal,
  Alert = require('react-bootstrap').Alert,
  Button = require('react-bootstrap').Button,
  ControlLabel = require('react-bootstrap').ControlLabel,
  Col = require('react-bootstrap').Col,
  Form = require('react-bootstrap').Form,
  FormGroup = require('react-bootstrap').FormGroup,
  InputGroup = require('react-bootstrap').InputGroup,
  DropdownButton = require('react-bootstrap').DropdownButton,
  FormControl = require('react-bootstrap').FormControl,
  MenuItem = require('react-bootstrap').MenuItem,
  SFMealAPI = require('../helpers/SFMealAPI'),
  ActionCreators = require('../actions/ActionCreators'),
  SearchStore = require('../stores/SearchStore'),
  _ = require('lodash');

var _getStateFromStores = function(){
  return SearchStore.getSearchData();
};

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
    model : PropTypes.string,
    additionalData : PropTypes.object
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
      this.setState({modalVisible: true, msgData : ''});
    }else if(!nextPro.isOpen && this.state.modalVisible){
      this.setState({modalVisible: false});
    }
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
      title : "Enter all fields",
      additionalData : {}
    };
  },

  _onAction : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    var subModel = target.data("submodel");
    var subId = target.data("id");
    if(subId==="fillValue"){
      subId = $("#modalView form").find("[name='" + subId + "']").val();
    }
    var action = target.data("action");
    var model = this.props.model;
    var modelId = this.props.id;
    SFMealAPI.command(model, modelId, action, this.props.isShowDetail, {}, subModel, subId);
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
          return;
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
    this.composeSpecialData(this.props.action, keyValue);
    SFMealAPI.command(this.props.model, this.props.id, this.props.action, this.props.isShowDetail, keyValue);
  },

  composeSpecialData : function(action, keyValues){
    var addressObj;
    var _this = this;
    var orders = {};
    Object.keys(keyValues).forEach(function(key){
      if(action === "adjustAdmin"){
        if(key !== "subtotal"){
          orders[key] = keyValues[key];
          delete keyValues[key];
        }
      }else if(action === "addDish"){
        keyValues["id"]
      }else if(key === "street" || key === "zip" ||  key === "city" || key === "state" || key === "county"){
        addressObj = addressObj || {};
        addressObj[key] = keyValues[key];
        delete keyValues[key];
      }
    });
    if(addressObj){
      keyValues['address'] = [addressObj];
    }
    if(orders){
      keyValues['orders'] = orders;
    }
  },

  renderView : function(view){
    return (
      <div className="modal-container">
      <Modal id="modalView" show={this.state.modalVisible}>
        <Modal.Header closeButton onClick={this._onClose}>
        <Modal.Title >{this.props.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form horizontal>
            {view}
          </Form>
          </Modal.Body>
          <Modal.Footer>
          <Alert bsStyle="danger">{this.state.msgData ? this.state.msgData.errMsg : ""}</Alert>
        <button className="btn btn-info" type="button" onClick={this._onSubmit}>Save</button>
        <button className="btn btn-default close" onClick={this._onClose}>Close</button>
        </Modal.Footer>
      </Modal>
      </div>
    );
  },

  getInputView : function(index, key, valueObj, defaultValue){
    var value = valueObj['value'];
    var type = valueObj['type'];
    var action = valueObj['action'];
    var submodel = valueObj['submodel'];
    var title = valueObj["title"] ? valueObj["title"] : key;
    return (
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}> {title} </Col>
        <Col sm={10}>
          <FormControl name={key} type={type} defaultValue={value||defaultValue}/>
          <Button bsStyle="primary" style={action?{display:"inline-block"}:{display:"none"}} data-id={key} data-action={action} data-submodel={submodel} onClick={this._onAction}>{action}</Button>
        </Col>
      </FormGroup>
    )
  },

  render: function() {
    var _this = this;
    var data = this.props.data;
    if(!data){
      return (<div></div>);
    }
    var inputs = Object.keys(data).map(function(key, i){
      var valueObj = data[key];
      var defaultValue = "";
      var type = 'text';
      if(valueObj.type === 'integer' || valueObj.type === 'float'){
        type = 'number';
        defaultValue = 0;
        return _this.getInputView(i, key, valueObj, defaultValue);
      }else if(valueObj.type === 'date'){
        type = 'date';
        defaultValue = null;
        return _this.getInputView(i, key, valueObj, defaultValue);
      }else if(valueObj.type === 'boolean'){
        type = 'boolean';
        defaultValue = false;
        return _this.getInputView(i, key, valueObj, defaultValue);
      }else {
        type = 'text';
        defaultValue = '';
        return _this.getInputView(i, key, valueObj, defaultValue);
      }
    }, this);

    return _this.renderView(inputs);
  }
});

module.exports = ActionDialog;
