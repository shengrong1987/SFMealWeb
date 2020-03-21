'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import ModalHeader from 'react-bootstrap/ModalHeader';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalFooter from 'react-bootstrap/ModalFooter'
import Button from 'react-bootstrap/Button';
import FormLabel from 'react-bootstrap/FormLabel';
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form';
import FormGroup from 'react-bootstrap/FormGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import SFMealAPI from '../helpers/SFMealAPI';
import ActionCreators from '../actions/ActionCreators';
import SearchStore from '../stores/SearchStore';
import DateTimePicker from "react-datetime-picker";
import moment from 'moment';
import _ from 'lodash';
import autoBind from 'react-autobind';

var _getStateFromStores = function(){
  return SearchStore.getSearchData();
};

class ActionDialog extends React.Component{

  constructor(props) {
    super(props);
    this.state = { modalVisible : false, msgData : null, data : this.props.data };
    this.props = props;
    autoBind(this);
  }

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */

  static propTypes = {
    data: PropTypes.object,
    title : PropTypes.string,
    isOpen : PropTypes.bool,
    action : PropTypes.string,
    id : PropTypes.string,
    isShowDetail : PropTypes.bool,
    model : PropTypes.string,
    additionalData : PropTypes.object
  }

  static defaultProps = {
    id : '',
    data : {},
    action : '',
    model : 'User',
    isOpen : false,
    isShowDetail : false,
    title : "Enter all fields"
  }

  componentDidMount() {
    SearchStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    SearchStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState({
      msgData: _getStateFromStores()
    });
  }

  componentWillReceiveProps(nextPro){
    if(nextPro.isOpen && !this.state.modalVisible){
      this.setState({modalVisible: true, msgData : '', data : nextPro.data});
    }else if(!nextPro.isOpen && this.state.modalVisible){
      this.setState({modalVisible: false, msgData : '', data : null});
    }
  }

  _onClose() {
    this.setState({modalVisible: false, data : null, msgData : ''});
  }

  _onDateTimePickerChange(date, name){
    var data = this.state.data;
    data[name].value = date;
    this.setState(data);
  }

  _inputOnChange(e){
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
  }

  _onAction(e){
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
  }

  _onSubmit(e){
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
  }

  composeSpecialData(action, keyValues){
    let addressObj;
    let _this = this;
    let subtotal = 0;

    Object.keys(keyValues).forEach(function(key){
      if(key === "street" || key === "zip" ||  key === "city" || key === "state"){
        addressObj = addressObj || {};
        addressObj[key] = keyValues[key];
        delete keyValues[key];
      }else if(key === "pickupFromTime" || key === "pickupTillTime"){
        keyValues[key] = new Date(keyValues[key]).toISOString();
      }else if(action === "updateDishQty"){
        keyValues['leftQty'] = keyValues['leftQty'] || {};
        keyValues['leftQty'][key] = keyValues[key];
        delete keyValues[key];
      }else if(action === "adjustAdmin" || action === "newOrder"){
        keyValues['orders'] = keyValues['orders'] || {};
        let d = JSON.parse(keyValues['dishes']).filter(function(d){
          return d.id === key;
        })[0];
        if(d){
          let orderDishObj = JSON.parse(keyValues[key]);
          keyValues['orders'][key] = orderDishObj;
          subtotal += parseInt(orderDishObj.number) * parseFloat(d.price);
          delete keyValues[key];
        }
      }
    });
    // if(keyValues.hasOwnProperty('dishes')){
    //   delete keyValues['dishes'];
    // }
    if(addressObj){
      keyValues['address'] = [addressObj];
    }
    if(subtotal){
      keyValues['subtotal'] = subtotal;
    }
    if(keyValues.hasOwnProperty('contactInfo')){
      keyValues['contactInfo'] = JSON.parse(keyValues['contactInfo']);
    }
    if(keyValues.hasOwnProperty('paymentInfo')){
      keyValues['paymentInfo'] = JSON.parse(keyValues['paymentInfo']);
    }
    if(keyValues.hasOwnProperty('rule')){
      keyValues['rule'] = JSON.stringify(keyValues['rule']);
    }
  }

  renderView(view){
    return (
      <Modal id="modalView" show={this.state.modalVisible} onHide={this._onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.model}: {this.props.action}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>{view}</Form>
        </Modal.Body>
        <Modal.Footer>
          <Alert color="danger">{this.state.msgData ? this.state.msgData.errMsg : ""}</Alert>
          <Button variant="info" onClick={this._onSubmit}>Save</Button>
          <Button variant="light" onClick={this._onClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  getInputView(index, key, valueObj, defaultValue){
    var value = valueObj['value'];
    var type = valueObj['type'];
    var action = valueObj['action'];
    var submodel = valueObj['submodel'];
    var readonly = !!valueObj['readonly'];
    var title = valueObj["title"] ? valueObj["title"] : key;
    var inputFormControl = this.getInputFromType(valueObj, key, defaultValue);
    return (
      <FormGroup>
        <Col componentClass={FormLabel} sm={2}> {title} </Col>
        <Col sm={10}>
          {inputFormControl}
          <Button bsStyle="primary" style={action?{display:"inline-block"}:{display:"none"}} data-id={key} data-action={action} data-submodel={submodel} onClick={this._onAction}>{action}</Button>
        </Col>
      </FormGroup>
    )
  }

  getInputFromType(valueObj, key, defaultValue){
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
              return <option value={option.id}>{option.deliveryCenter}</option>
            }else if(!option.isDateCustomized){
              return <option value={option.id}>{(option.location||option.deliveryCenter) + ":(" + option.method + ")" + new Date(option.pickupFromTime).toLocaleString() + " to " + new Date(option.pickupTillTime).toLocaleString()}</option>
            }
          }else if(model === "PickupOption"){
            return <option value={option.phone}>{option.driverName}:{option.phone}</option>
          }else if(model === "Meal" && action === "update"){
            return <option value={option.nickname}>{option.nickname}</option>
          }else if(model === "Order" && action === "newOrder"){
            return <option value={option.id}>{option.title}</option>
          }else{
            return <option value={option.index}>{option.value}</option>
          }
        });
        inputControl = (<select name={key} value={value} onChange={this._inputOnChange}>{optionsView}</select>)
        break;
      case "date":
        inputControl = (<DateTimePicker name={key} onChange={date => this._onDateTimePickerChange(date, key)} value={value}/>)
        break;
      default:
        inputControl = <Form.Control name={key} type={valueObj["type"]} value={value||defaultValue} readOnly={readonly?'readonly':''} onChange={this._inputOnChange}/>;
    }
    return inputControl;
  }

  render() {
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
}

export default ActionDialog;
