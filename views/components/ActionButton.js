/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  SFMealAPI = require('../helpers/SFMealAPI'),
  ActionCreators = require('../actions/ActionCreators'),
  ActionDialog = require('./ActionDialog'),
  moment = require('../../assets/js/dependencies/moment'),
  _ = require('lodash');

var ActionButton = createReactClass({

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  getInitialState: function() {
    return { isOpen : false };
  },

  propTypes: {
    actions: PropTypes.array,
    detail : PropTypes.bool,
    data : PropTypes.object
  },

  getDefaultProps: function () {
    return {
      actions : [],
      detail : false,
      data : {}
    };
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({ isOpen : false });
  },

  componentWillUnmount : function(){
    console.log("action button will unmount");
  },

  _getData : function(target, action){
    var data = {};
    return data;
  },

  _openModal : function(postData, isOpen, title, id, action, isShowDetail, additionalData){
    this.setState({ postData : postData, isOpen : isOpen, title : title, id: id, action : action, isShowDetail : isShowDetail, additionalData : additionalData});
  },

  _doAction : function(event){
    var _this = this;
    return function(event){
      var target = event.currentTarget;
      var dataset = target.dataset;
      var action = dataset["action"];
      var id = dataset['alt'] || dataset["id"];
      var model = dataset["model"];
      var isShowDetail = action === "view" ? true : _this.props.detail;
      var data = {};
      var postData = _this.getPostData(_this.props.model, action, $(target));
      var additionalData = _this.getAdditionalData(_this.props.model, action);
      if(postData){
        _this._openModal(postData, true, _this.props.data['name'], id, action, isShowDetail, additionalData);
      }else{
        SFMealAPI.command(model, id, action, isShowDetail, data);
      }
    }(event);
  },

  getAdditionalData : function(model, action){
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
  },

  getPostData  : function(model, action, target){
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
        }else if(action === "adjustAdmin"){
          var dishes = this.props.data["dishes"];
          dishes.forEach(function(dish){
            postData = postData || {};
            var dishOrderObj = _this.props.data["orders"][dish.id] || { number : 0, preference : [], price : dish.price};
            postData[dish.id] = { value : dishOrderObj, type : "json", title : dish.title };
          })
          postData["subtotal"] = { value : _this.props.data["subtotal"], type : "float" }
        }else if(action === "updatePickupInfo"){
          postData = {
            pickupOption : { value : this.props.data["pickupInfo"]["index"], type : 'select', options : this.props.data["meal"]["pickups"]},
            address : { value : this.props.data["contactInfo"]["address"]},
            customInfo : { value : this.props.data["customInfo"], type : 'json'},
            comment : { value : this.props.data["pickupInfo"]["comment"], type : 'string'},
            mealId : { value : this.props.data["meal"]["id"], readonly : true},
            chef : { value : this.props.data["host"]["id"], readonly : true},
            isPartyMode : { value : this.props.data["isPartyMode"], readonly : true},
            method : { value : this.props.data["method"], readonly : true}
          }
        }else if(action === "discount"){
          postData = {
            discount : { value : this.props.data['discount'], type : 'float'}
          }
        }else if(action === "paid"){
          postData = {
            tip : { value : this.props.data['tip'], type : 'float'}
          }
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
        break;
      case "Dish":
        if(action === "update"){
          postData = {
            title : { value : this.props.data['title'] },
            price : { value : this.props.data['price'] },
            type : { value : this.props.data['type'] },
            description : { value : this.props.data['description']}
          };
        }
        break;
      case "Meal":
        if(action === "update"){
          var provideFromTime = new Date(this.props.data['provideFromTime']);
          var provideTillTime = new Date(this.props.data['provideTillTime']);
          postData = {
            title : { value : this.props.data['title'] },
            type : { value : this.props.data['type'] },
            cover : { value : this.props.data['cover'] },
            delivery_fee : { value : this.props.data['delivery_fee'] },
            isDelivery : { value : this.props.data['isDelivery'], type : 'boolean'},
            county : { value : this.props.data['county'] },
            provideFromTime : { value : moment(provideFromTime.toISOString()).format('YYYY-MM-DD[T]HH:mm'), type : 'datetime-local'},
            provideTillTime : { value : moment(provideTillTime.toISOString()).format('YYYY-MM-DD[T]HH:mm'), type : 'datetime-local'},
            description : { value : this.props.data['description']},
            status : { value : this.props.data['status']}
          };
        }else if(action === "removeDish"){
          var dishes = this.props.data["dishes"];
          dishes.forEach(function(dish){
            postData = postData || {};
            postData[dish.id] = { value : dish.title, type : "string", submodel : "dishes", action : "delete"};
          })
        }else if(action === "addDish"){
          postData = {
            fillValue : { value : "请输入dish id", action : "add", submodel: "dishes"}
          }
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
        break;
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
          break;
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
          break;
        case "Driver":
          if(action === "create" || action === "update"){
            postData = {
              driverName : { value : this.props.data['driverName'] || ''},
              phone : { value : this.props.data['phone'] || ''},
              availability : { value : this.props.data['availability'] || ''}
            }
          }
          break;
        case "PickupOption":
          if(action === "create" || action === "update"){
            postData = {
              pickupFromTime : { value : this.props.data['pickupFromTime'] || '', type : "Date"},
              pickupTillTime : { value : this.props.data['pickupTillTime'] || '', type : "Date"},
              location : { value : this.props.data['location'] || ''},
              method : {value: this.props.data['method'] || ''},
              phone : {value: this.props.data['phone'] || '', type : 'select', options : this.props.data['drivers']},
              publicLocation : {value: this.props.data['publicLocation'] || ''},
              comment : {value: this.props.data['comment'] || ''},
              deliveryCenter : {value: this.props.data['deliveryCenter'] || ''},
              deliveryRange : {value: this.props.data['deliveryRange'] || ''},
              area : {value: this.props.data['area'] || ''},
              county : {value: this.props.data['county'] || ''},
              index : {value: this.props.data['index'] || ''},
              nickname : {value: this.props.data['nickname'] || ''}
             }
          }
          break;
    }
    return postData;
  },

  getActionList : function(model, rowData){
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
        actions.push("update","order","review","removeDish","addDish");
        break;
      case "Order":
        if(rowData.hasOwnProperty('status')){
          if(rowData['status'] !== 'complete' && rowData['status'] !== 'cancel'){
            actions = actions.concat(['discount','paid','abort','refund']);
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
    }
    if(!this.props.detail){
      actions.push('view');
    }
    return { actions : actions, status : status };
  },

  render: function() {
    var actionData = this.getActionList(this.props.model, this.props.data);
    var buttons = actionData.actions.map(function(action, i){
      return (
        <li key={i}>
          <a className="btn btn-info"
            data-model={this.props.model}
            data-id={this.props.data['id']||this.props.data['_id']}
            data-action={action}
            data-alt={this.props.data['name']||''}
            onClick={this._doAction}>{action}</a>
        </li>
      )
    }, this);

    return (
      <div className="dropdown">
        <button className="btn btn-info dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          {actionData.status}
          <span className="caret"></span>
        </button>
        <ul className="dropdown-menu">
          {buttons}
        </ul>
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
});

module.exports = ActionButton;
