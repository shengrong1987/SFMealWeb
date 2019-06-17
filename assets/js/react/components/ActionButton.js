'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import SFMealAPI from '../helpers/SFMealAPI';
import ActionCreators from '../actions/ActionCreators';
import ActionDialog from './ActionDialog';
import moment from 'moment';
import _ from 'lodash';
import $ from 'jquery';
import autoBind from 'react-autobind';
import Dropdown from 'react-bootstrap/Dropdown';

class ActionButton extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      isOpen: false
    };
    this.props = props;
    autoBind(this);
  }
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  static propTypes = {
    actions: PropTypes.array,
    detail : PropTypes.bool,
    data : PropTypes.object
  }

  static defaultProps = {
    actions : [],
    detail : false,
    data : {}
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ isOpen : false });
  }

  componentWillUnmount(){
    console.log("action button will unmount");
  }

  _openModal(postData, isOpen, title, id, action, isShowDetail, additionalData){
    this.setState({ postData : postData, isOpen : isOpen, title : title, id: id, action : action, isShowDetail : isShowDetail, additionalData : additionalData});
  }

  _doAction(event){
    var _this = this;
    return function(event){
      var target = event.currentTarget;
      var dataset = target.dataset;
      var action = dataset["action"];
      var id = dataset['alt'] || dataset["id"];
      var model = dataset["model"];
      var isShowDetail = action === "view" ? true : _this.props.detail;
      var data = {};
      console.log("model:" + model + "doing action: " + action);
      _this.getPostData(_this.props.model, action, $(target), function(postData){
        var additionalData = _this.getAdditionalData(_this.props.model, action);
        if(postData){
          _this._openModal(postData, true, _this.props.data['name'], id, action, isShowDetail, additionalData);
        }else{
          SFMealAPI.command(model, id, action, isShowDetail, data);
        }
      });
    }(event);
  }

  getAdditionalData(model, action){
    var additionalData;
    switch(model){
      case "Order":
        if(action === "adjustAdmin"){
          additionalData = {
            dishes : { value : this.props.data["dishes"], type : 'array'}
          }
        }
        break;
      default:
    }
    return additionalData;
  }

  getPostData(model, action, target, cb){
    var postData;
    var _this = this;
    switch(model){
      case "Order":
        if(action === "update"){
          postData = {
            delivery_fee : { value : this.props.data["delivery_fee"], type : "float"},
            shipping_fee : { value : this.props.data["shipping_fee"], type : "float"},
            subtotal : { value : this.props.data["subtotal"], type : "float"},
            customerPhone : { value : this.props.data["customerPhone"], type : "string"},
            customerName : { value : this.props.data["customerName"], type : "string"},
            guestEmail : { value : this.props.data["guestEmail"], type : "string"},
            msg : { value : this.props.data["msg"], type : "string"}
          };
          return cb(postData);
        }else if(action === "adjustAdmin"){
          var dishes = this.props.data["dishes"];
          dishes.forEach(function(dish){
            postData = postData || {};
            var dishOrderObj = _this.props.data["orders"][dish.id] || { number : 0, preference : [], price : dish.price};
            postData[dish.id] = { value : dishOrderObj, type : "json", title : dish.title };
          });
          postData["dishes"] = { value: dishes, type: 'json', readonly: true };
          return cb(postData);
        }else if(action === "updatePickupInfo"){
          $.get('/meal/pickup', function(pickups){
            postData = {
              pickupOption : { value : _this.props.data["pickupInfo"]["index"], type : 'select', options : pickups},
              address : { value : _this.props.data["contactInfo"]["address"]},
              customInfo : { value : _this.props.data["customInfo"], type : 'json'},
              comment : { value : _this.props.data["pickupInfo"]["comment"], type : 'string'},
              mealId : { value : _this.props.data["meal"]["id"], readonly : true},
              chef : { value : _this.props.data["host"]["id"], readonly : true},
              isPartyMode : { value : _this.props.data["isPartyMode"], readonly : true},
              method : { value : _this.props.data["method"], readonly : true }
            };
            return cb(postData);
          });
        }else if(action === "discount"){
          postData = {
            discount : { value : this.props.data['discount'], type : 'float'}
          };
          return cb(postData);
        }else if(action === "paid"){
          postData = {
            tip : { value : this.props.data['tip'], type : 'float'}
          };
          return cb(postData);
        }else if(action === "newOrder") {
          $.ajax({
            url: '/meal/dish',
            method: 'POST',
            data: {
              nickname: _this.props.data['pickupInfo']['nickname']
            }
          }).done(function (data) {
            postData = {
              method : { value: _this.props.data['method']},
              contactInfo : { value: _this.props.data['contactInfo'], type: 'json'},
              paymentInfo : { value: _this.props.data['paymentInfo'], type: 'json'},
              tip : { value: _this.props.data['tip'], type: 'number'},
              couponCode : { value: _this.props.data['couponCode']},
              points : { value: _this.props.data['points'], type: 'number'},
              pickupMeal : { value: _this.props.data['pickupMeal'], type: 'select', options: data.meals},
              pickupOption : { value: _this.props.data['pickupInfo']['index'], type: 'number'},
              dishes : { value: data['dishes'], type: 'json', readonly: true}
            };
            data.dishes.forEach(function (dish) {
              var dishOrderObj = _this.props.data["orders"][dish.id] || {number: 0, preference: [], price: dish.price};
              postData[dish.id] = { value: dishOrderObj, type: "json", title: dish.title};
            });
            return cb(postData);
          });
        }else{
          cb();
        }
        break;
      case "User":
        if(action === "update"){
          postData = {
            firstname : { value : this.props.data['firstname']},
            lastname : { value : this.props.data['lastname']},
            phone : { value : this.props.data['phone']},
            points : { value : this.props.data['points']}
          };

        }else if(action === "deactivate"){
          postData = { msg : { value : ""}};
        }else if(action === "activate"){
          postData = { msg : { value : ""}};
        }
        return cb(postData);
        break;
      case "Host":
        if(action === "update"){
          postData = {
            shopName : { value : this.props.data['shopName']},
            phone : { value : this.props.data['phone']},
            intro : { value : this.props.data['intro']},
            street : { value : this.props.data['street']},
            city : { value : this.props.data['city']},
            state : { value : this.props.data['state']},
            zip : { value : this.props.data['zip']},
            county : { value : this.props.data['county']},
            passGuide : { value : this.props.data['passGuide'], type : 'boolean'},
            locale : { value : this.props.data['locale']},
            picture : { value : this.props.data['picture']}
          };
        }else if(action === "verifyLicense"){
          postData = {
            month: {value: '', type: 'integer'}, day: {value: "", type: 'integer'}, year: {value: "", type: 'integer'}
          }
        }
        return cb(postData);
        break;
      case "Job":
        if(action === "run"){
          if(this.props.data['data']){
            Object.keys(this.props.data['data']).forEach(function(key){
              postData = postData || {};
              postData[key] = {
                value : _this.props.data['data'][key],
                type : "string"
              }
            });
          }
        }
        return cb(postData);
        break;
      case "Dish":
        if(action === "update"){
          var tags = this.props.data['tags'];
          postData = {
            title : { value : this.props.data['title'] },
            price : { value : this.props.data['price'] },
            type : { value : this.props.data['type'] },
            description : { value : this.props.data['description']},
            tags : { value : tags }
          };
        }
        return cb(postData);
        break;
      case "Meal":
        if(action === "update"){
          var provideFromTime = new Date(this.props.data['provideFromTime']);
          var provideTillTime = new Date(this.props.data['provideTillTime']);
          $.get('/pickupOption', function(options){
            let _options = [];
            options.forEach(function(p){
              if(!_options.some(function( o ){ return o.nickname === p.nickname })){
                _options.push(p);
              }
            })
            _options.push({ nickname : "custom" });
            postData = {
              title : { value : _this.props.data['title'] },
              type : { value : _this.props.data['type'] },
              cover : { value : _this.props.data['cover'] },
              delivery_fee : { value : _this.props.data['delivery_fee'] || 0 },
              isDelivery : { value : _this.props.data['isDelivery'], type : 'boolean'},
              county : { value : _this.props.data['county'] },
              provideFromTime : { value : moment(provideFromTime.toISOString()).format('YYYY-MM-DD[T]HH:mm'), type : 'date'},
              provideTillTime : { value : moment(provideTillTime.toISOString()).format('YYYY-MM-DD[T]HH:mm'), type : 'date'},
              description : { value : _this.props.data['description']},
              status : { value : _this.props.data['status']},
              nickname : { value : _this.props.data['nickname'], type: 'select', options: _options},
              pickups : { value : _this.props.data['pickups'], type : 'json' }
            };
            return cb(postData);
          });
        }else if(action === "removeDish"){
          var dishes = this.props.data["dishes"];
          dishes.forEach(function(dish){
            postData = postData || {};
            postData[dish.id] = { value : dish.title, type : "string", submodel : "dishes", action : "delete"};
          })
          return cb(postData);
        }else if(action === "addDish"){
          let mealDishes = this.props.data['dishes'];
          $.get('/host/'+this.props.data['chef']+'/dishes',function(dishes){
            dishes = dishes.forEach(function(d1){
              if(!mealDishes.some(function(d2){
                return d2.id === d1.id;
              })){
                postData = postData || {};
                postData[d1.id] = { value : d1.title, action : "add", submodel: "dishes"};
              }
            });
            return cb(postData);
          })
        }else if(action === "updateDishQty"){
          postData = postData || {};
          let leftQty = this.props.data['leftQty'];
          let dishes = this.props.data['dishes'];
          Object.keys(leftQty).forEach(function(dishId){
            let leftNum = leftQty[dishId];
            let dish = dishes.filter(function(d){
              return d.id === dishId;
            })[0];
            postData[dishId] = { title: dish.title, value: leftNum }
          })
          return cb(postData);
        }else{
          return cb();
        }
        break;
        case "Email":
          if(action === "create"){
            postData = {
              model : { value : target.closest('tr').find("input[name='model']").val()},
              action : { value : target.closest('tr').find("input[name='action']").val()},
              metadata : { value : target.closest('tr').find("input[name='metaData']").val()}
            }
          }
          return cb(postData);
        case "Coupon":
          if(action === "create"){
            var expire = new Date(target.closest('tr').find("input[name='expire']").val() * 1000);
            if(moment(expire).isBefore(moment(new Date()))){
              ActionCreators.badRequest("expiration date should be in the future");
              return false;
            }
            postData = {
              type : { value : target.closest('tr').find("input[name='type']").val()},
              amount : { value : target.closest('tr').find("input[name='amount']").val(), type : 'integer'},
              description : { value : target.closest('tr').find("input[name='description']").val()},
              code : { value : target.closest('tr').find("input[name='code']").val()},
              expire : { value : expire, type : 'Date'}
            }
          }
          return cb(postData);
        case "Account":
          if(action === "charge"){
            postData = {
              mealId : { value : ''},
              orderId : { value : ''},
              msg : { value : 'reason for charge'},
              applicationFee : { value : 0, type : 'integer'}
            }
          }else if(action === "reject"){
            postData = {
              msg : { value : "fraud"}
            }
          }
          return cb(postData);
        case "Driver":
          if(action === "create" || action === "update"){
            postData = {
              driverName : { value : this.props.data['driverName'] || ''},
              phone : { value : this.props.data['phone'] || ''},
              availability : { value : this.props.data['availability'] || ''}
            }
          }
          return cb(postData);
        case "PickupOption":
          if(action === "create"){
            $.get('/pickupoption/drivers', function(drivers){
              postData = {
                pickupFromTime : { value : _this.props.data['pickupFromTime'] || new Date(), type : "date"},
                pickupTillTime : { value : _this.props.data['pickupTillTime'] || new Date(), type : "date"},
                location : { value : _this.props.data['location'] || ''},
                method : {value: _this.props.data['method'] || ''},
                phone : {value: _this.props.data['phone'] || '', type : 'select', options : drivers},
                publicLocation : {value: _this.props.data['publicLocation'] || ''},
                comment : {value: _this.props.data['comment'] || ''},
                deliveryCenter : {value: _this.props.data['deliveryCenter'] || ''},
                deliveryRange : {value: _this.props.data['deliveryRange'] || 0 },
                area : {value: _this.props.data['area'] || ''},
                county : {value: _this.props.data['county'] || ''},
                index : {value: _this.props.data['index'] || ''},
                nickname : {value: _this.props.data['nickname'] || ''},
                minimalOrder : {value: _this.props.data["minimalOrder"] || 0 }
              }
              return cb(postData);
            });
          }else if(action === "update"){
            postData = {
              pickupFromTime : { value : this.props.data['pickupFromTime'] || new Date(), type : "date"},
              pickupTillTime : { value : this.props.data['pickupTillTime'] || new Date(), type : "date"},
              location : { value : this.props.data['location'] || ''},
              method : {value: this.props.data['method'] || ''},
              phone : {value: this.props.data['phone'] || '', type : 'select', options : this.props.data['drivers']},
              publicLocation : {value: this.props.data['publicLocation'] || ''},
              comment : {value: this.props.data['comment'] || ''},
              deliveryCenter : {value: this.props.data['deliveryCenter'] || ''},
              deliveryRange : {value: this.props.data['deliveryRange'] || 0 },
              area : {value: this.props.data['area'] || ''},
              county : {value: this.props.data['county'] || ''},
              index : {value: this.props.data['index'] || ''},
              nickname : {value: this.props.data['nickname'] || ''},
              minimalOrder : {value: this.props.data["minimalOrder"] || 0 }
            }
            return cb(postData);
          }
          break;
        case "Badge":
          if(action === "create" || action === "update"){
            postData = {
              title : { value : this.props.data['title'] || ''},
              desc : { value : this.props.data['desc'] || ''},
              largeImage : { value: this.props.data['largeImage'] },
              rule : { value: this.props.data['rule'], type : "json" },
              model : { value: this.props.data['model']}
            }
          }
          return cb(postData);
        default:
          return cb();
    }
  }

  getActionList(model, rowData){
    var actions = [];
    var postData = {};
    var status = "action";
    switch(model){
      case "User":
        if(rowData.hasOwnProperty('status')){
          if(rowData['status'] === "active"){
            actions.push("deactivate");
          }else{
            actions.push("activate");
          }
        }
        if(rowData.hasOwnProperty('email')){
          !!rowData['emailVerified'] ? actions.push('unverifyEmail') : actions.push('verifyEmail');
        }
        actions.push("delete");
        actions.push("update");
        break;
      case "Dish":
        if(rowData.hasOwnProperty('isVerified')){
          actions.push(rowData['isVerified'] ? "fail" : "verify");
        }
        actions.push("update","review");
        break;
      case "Meal":
        if(rowData.hasOwnProperty('status')){
          actions.push(rowData['status'] === "on" ? "off" : "on");
        }
        actions.push("update","order","review","removeDish","addDish","updateDishQty");
        break;
      case "Order":
        if(rowData.hasOwnProperty('status')){
          if(rowData['status'] !== 'complete' && rowData['status'] !== 'cancel'){
            actions = actions.concat(['discount','paid','abort','refund','newOrder']);
          }else if(rowData.hasOwnProperty('charges')){
            if(rowData['charges'] && Object.keys(rowData['charges']).length > 0){
              actions.concat(['discount','refund']);
            }
          }
          status = rowData['status'];
        }
        actions.push("update");
        actions.push("adjustAdmin");
        actions.push("updatePickupInfo");
        break;
        case "Host":
          if(rowData.hasOwnProperty('license')){
            if(rowData['license']){
              var isValid = rowData['license']['valid'];
              if(isValid){
                var month = new Date(rowData['license']['exp']).getMonth() + 1;
                var day = new Date(rowData['license']['exp']).getDate();
                var year = new Date(rowData['license']['exp']).getFullYear();
                actions.push('unVerifyLicense')
              }else{
                actions.push('verifyLicense');
                postData = {
                  month : "",
                  day : "",
                  year :""
                }
              }
              status = rowData['license']['valid'] ? 'valid' : 'pending';
            }
          }
          actions.push("update",'review','meal','dish');
          break;
        case "Job":
          actions.push("run");
          if(!rowData["nextRunAt"]){
            actions.push("delete");
          }
          break;
        case "Checklist":
          actions = actions.concat(['verifyPhoto','unVerifyPhoto']);
          break;
        case "Coupon":
          if(!rowData.hasOwnProperty("id")){
            actions.push("create","delete");
          }else{
            actions.push("delete");
          }
          break;
        case "Email":
          actions.push("create");
          break;
        case "Review":
          actions.push('create');
          if(rowData['isPublic']){
            actions.push('private');
          }
          break;
        case "Account":
          actions.push("charge","reject");
          break;
        case "Driver":
          if(!rowData.hasOwnProperty("id")){
            actions.push("create","update");
          }else{
            actions.push("update","delete");
          }
          break;
      case "PickupOption":
        if(!rowData.hasOwnProperty("id")){
          actions.push("create","update");
        }else{
          actions.push("update","delete");
        }
        break;
      case "Badge":
        if(!rowData.hasOwnProperty("id")){
          actions.push("create","update");
        }else{
          actions.push("update","delete");
        }
        break;
    }
    if(!this.props.detail){
      actions.push('view');
    }
    return { actions : actions, status : status };
  }

  render() {
    var actionData = this.getActionList(this.props.model, this.props.data);
    var buttons = actionData.actions.map(function(action, i){
      return (
        <Dropdown.Item key={i}>
          <a className="btn btn-info"
            data-model={this.props.model}
            data-id={this.props.data['id']||this.props.data['_id']}
            data-action={action}
            data-alt={this.props.data['name']||''}
            onClick={this._doAction}>{action}</a>
        </Dropdown.Item>
      )
    }, this);

    return (
      <div>
        <Dropdown>
          <Dropdown.Toggle variant="info">
            {actionData.status}
            <span className="caret"></span>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {buttons}
          </Dropdown.Menu>
        </Dropdown>
        <ActionDialog
          data={this.state.postData}
          title={this.state.title}
          isOpen={this.state.isOpen}
          action={this.state.action}
          id={this.state.id}
          isShowDetail={this.state.isShowDetail}
          model={this.props.model}
        />
      </div>
    );
  }
}

export default ActionButton;
