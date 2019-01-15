/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  ReactDOM = require('react-dom'),
  Modal = require('reactstrap').Modal,
  ModalHeader = require('reactstrap').ModalHeader,
  ModalBody = require('reactstrap').ModalBody,
  ModalFooter = require('reactstrap').ModalFooter,
  Alert = require('reactstrap').Alert,
  Button = require('reactstrap').Button,
  ControlLabel = require('reactstrap').ControlLabel,
  Col = require('reactstrap').Col,
  Form = require('reactstrap').Form,
  Input = require('reactstrap').Input,
  FormGroup = require('reactstrap').FormGroup,
  InputGroup = require('reactstrap').InputGroup,
  DropdownButton = require('reactstrap').DropdownButton,
  FormControl = require('reactstrap').FormControl,
  MenuItem = require('reactstrap').MenuItem,
  SFMealAPI =  require('../helpers/SFMealAPI'),
  ActionCreators = require('../actions/ActionCreators'),
  SearchStore = require('../stores/SearchStore'),
  DateTimePicker = require("react-datetime-picker/dist/entry.nostyle").default,
  moment = require('../../assets/js/dependencies/moment'),
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
    return { modalVisible : false, msgData : null, data : this.props.data};
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
      this.setState({modalVisible: true, msgData : '', data : nextPro.data});
    }else if(!nextPro.isOpen && this.state.modalVisible){
      this.setState({modalVisible: false, msgData : '', data : null});
    }
  },

  _onClose : function() {
    this.setState({modalVisible: false, data : null, msgData : ''});
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

  _onPickerFromTimeChange : function(date){
    var data = this.state.data;
    data["pickupFromTime"].value = date;
    this.setState(data);
  },

  _onPickerTillTimeChange : function(date){
    var data = this.state.data;
    data["pickupTillTime"].value = date;
    this.setState(data);
  },

  _inputOnChange : function(e){
    e.preventDefault();
    var target = $(e.currentTarget);
    var value = target.val();
    var action = this.props.action;
    var fieldName = target.attr("name");
    var data = this.state.data;
    if(data[fieldName].type === "json"){
      data[fieldName].value = JSON.parse(value);
    }else{
      data[fieldName].value = value;
    }
    this.setState(data);
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
          orders[key] = JSON.parse(keyValues[key]);
          delete keyValues[key];
        }
      }else if(key === "street" || key === "zip" ||  key === "city" || key === "state"){
        addressObj = addressObj || {};
        addressObj[key] = keyValues[key];
        delete keyValues[key];
      }else if(key === "pickupFromTime" || key === "pickupTillTime"){
        keyValues[key] = new Date(keyValues[key]).toISOString();
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
        <Modal id="modalView" isOpen={this.state.modalVisible}>
          <ModalHeader toggle={this._onClose}>
            {this.props.title}
          </ModalHeader>
          <ModalBody>
            <Form horizontal>
              {view}
            </Form>
          </ModalBody>
          <ModalFooter>
            <Alert color="danger">{this.state.msgData ? this.state.msgData.errMsg : ""}</Alert>
            <button className="btn btn-info" type="button" onClick={this._onSubmit}>Save</button>
            <button className="btn btn-default close" onClick={this._onClose}>Close</button>
          </ModalFooter>
        </Modal>
      </div>
    );
  },

  getInputView : function(index, key, valueObj, defaultValue){
    var value = valueObj['value'];
    var type = valueObj['type'];
    var action = valueObj['action'];
    var submodel = valueObj['submodel'];
    var readonly = !!valueObj['readonly'];
    var title = valueObj["title"] ? valueObj["title"] : key;
    var inputFormControl = this.getInputFromType(valueObj, key, defaultValue);
    return (
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}> {title} </Col>
        <Col sm={10}>
          {inputFormControl}
          <Button bsStyle="primary" style={action?{display:"inline-block"}:{display:"none"}} data-id={key} data-action={action} data-submodel={submodel} onClick={this._onAction}>{action}</Button>
        </Col>
      </FormGroup>
    )
  },

  getInputFromType : function(valueObj, key, defaultValue){
    var value = valueObj['value'];
    var readonly = !!valueObj['readonly'];
    var inputControl;
    var action = this.props.action;
    var model = this.props.model;
    var _this = this;
    switch(valueObj.type){
      case "select":
        if(!valueObj.options){
          return <select value={value} name={key}></select>;
        }
        var optionsView = valueObj.options.map(function(option){
          if(action === "updatePickupInfo"){
            if(!!_this.state.data.isPartyMode.value && option.method === "delivery" && !!option.isDateCustomized){
              return <option value={option.index}>{option.deliveryCenter}</option>
            }else if(!option.isDateCustomized){
              return <option value={option.index}>{(option.location||option.deliveryCenter) + ":(" + option.method + ")" + new Date(option.pickupFromTime).toLocaleString() + " to " + new Date(option.pickupTillTime).toLocaleString()}</option>
            }
          }else if(model === "PickupOption"){
            return <option value={option.phone}>{option.driverName}:{option.phone}</option>
          }else{
            return <option value={option.index}>{option.value}</option>
          }
        });
        inputControl = (<select name={key} value={value} onChange={this._inputOnChange}>{optionsView}</select>)
        break;
      case "date":
        if(key === "pickupFromTime"){
          inputControl = (<DateTimePicker name={key} onChange={this._onPickerFromTimeChange} value={value}/>)
        }else if(key === "pickupTillTime"){
          inputControl = (<DateTimePicker name={key} onChange={this._onPickerTillTimeChange} value={value}/>)
        }
        break;
      default:
        inputControl = <Input name={key} type={valueObj["type"]} value={value||defaultValue} readOnly={readonly?'readonly':''} onChange={this._inputOnChange}/>;
    }
    return inputControl;
  },

  render: function() {
    var _this = this;
    var data = this.state.data;
    if(!data){
      return (<div></div>);
    }
    var inputs = Object.keys(data).map(function(key, i){
      var valueObj = data[key];
      var defaultValue = "";
      var type = 'text';
      if(valueObj.type === 'integer' || valueObj.type === 'float'){
        valueObj.type = 'number';
        defaultValue = 0;
        return _this.getInputView(i, key, valueObj, defaultValue);
      }else if(valueObj.type === 'date'){
        var copyValue = Object.assign({},valueObj);
        defaultValue = null;
        copyValue.type = 'date';
        copyValue.value = new Date(copyValue.value)
        return _this.getInputView(i, key, copyValue, defaultValue);
      }else if(valueObj.type === 'boolean'){
        valueObj.type = 'boolean';
        defaultValue = false;
        return _this.getInputView(i, key, valueObj, defaultValue);
      }else if(valueObj.type === "json"){
        defaultValue = "";
        copyValue = Object.assign({},valueObj);
        copyValue.type = 'text';
        copyValue.value = JSON.stringify(copyValue.value);
        return _this.getInputView(i, key, copyValue, defaultValue);
      }else if(valueObj.type === "select"){
        return _this.getInputView(i, key, valueObj, 1);
      }else{
        valueObj.type = 'text';
        defaultValue = '';
        return _this.getInputView(i, key, valueObj, defaultValue);
      }
    }, this);

    return _this.renderView(inputs);
  }
});

module.exports = ActionDialog;
