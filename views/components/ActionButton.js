// /**
//  * @jsx React.DOM
//  */
// 'use strict';
//
// var React = require('react/addons'),
//   SFMealAPI = require('../helpers/SFMealAPI'),
//   ActionCreators = require('../actions/ActionCreators'),
//   _ = require('lodash');
//
// var ActionButton = React.createClass({
//
//   /*
//     Validation to ensure that the properties sent from the
//       parent component is the correct type.
//   */
//   propTypes: {
//     actions: React.PropTypes.array
//   },
//
//   getDefaultProps: function () {
//     return {
//       actions : []
//     };
//   },
//
//   _doAction : function(event){
//     var target = $(event.currentTarget);
//     var actionName = target.data("action");
//     var isShowDetail = this.props.detail;
//     var data = target.find("form").length ? target.find("form").serialize() : {};
//     SFMealAPI.command(target.data("model"), target.data("id"), actionName, isShowDetail, data);
//   },
//
//   _verifyPhoto : function(event){
//     var target = $(event.target);
//     var key = target.find("~input[name='key']").val();
//     if(!key){
//       ActionCreators.badRequest("need key");
//       return;
//     }
//     SFMealAPI.command(target.data('model'),target.data('id'),'verify',this.props.detail, { key : key});
//   },
//
//   _unVerifyPhoto : function(event){
//     var target = $(event.target);
//     var key = target.find("~input[name='key']").val();
//     if(!key){
//       ActionCreators.badRequest("need key");
//       return;
//     }
//     SFMealAPI.command(target.data('model'),target.data('id'),'unVerify',this.props.detail, { key : key});
//   },
//
//   _verifyLicense : function(event){
//     var target = $(event.target);
//     var month = target.find("~input[name='month']").val();
//     var day = target.find("~input[name='day']").val();
//     var year = target.find("~input[name='year']").val();
//     if(!month || !day || !year){
//       ActionCreators.badRequest("need expiration date");
//       return;
//     }
//     var date = new Date(year, month-1, day);
//     if(date.getTime() < new Date().getTime()){
//       ActionCreators.badRequest("expiration date should be in the future");
//       return;
//     }
//     var data = {
//       month : month,
//       day : day,
//       year : year
//     }
//     SFMealAPI.command(target.data('model'),target.data('id'),'verifyLicense',this.props.detail, data);
//   },
//
//   _create : function(event){
//     var target = $(event.target);
//     var model = target.data("model");
//     switch(model){
//       case "Coupon":
//         var type = target.closest('tr').find("input[name='type']").val();
//         var amount = target.closest('tr').find("input[name='amount']").val();
//         var description = target.closest('tr').find("input[name='description']").val();
//         var code = target.closest('tr').find("input[name='code']").val();
//         var expires = new Date(parseInt(target.closest('tr').find("input[name='expires']").val() * 1000));
//         if(Object.prototype.toString.call(expires) === "[object Date]" ){
//           if(isNaN(expires.getTime())){
//             ActionCreators.badRequest("expire date is not valid");
//             return;
//           }
//         }else{
//           ActionCreators.badRequest("expire date is not valid");
//           return;
//         }
//         if(!type || !amount || !description || !code){
//           ActionCreators.badRequest("please fill in all values");
//           return;
//         }
//         var data = {
//           type : type,
//           amount : amount,
//           description : description,
//           code : code,
//           expires : expires
//         };
//         SFMealAPI.command(model, null, 'create', false, data);
//         break;
//       case "Email":
//         var modelType = target.closest('tr').find("input[name='model']").val();
//         var action = target.closest('tr').find("input[name='action']").val();
//         var metaData = target.closest('tr').find("input[name='metaData']").val();
//         if(!model || !action || !metaData){
//           ActionCreators.badRequest("please fill in all values");
//           return;
//         }
//         try{
//           JSON.parse(metaData)
//         }catch(e){
//           ActionCreators.badRequest("metaData must be a json string");
//           return;
//         }
//         var data = {
//           model : modelType,
//           action : action,
//           metaData : metaData
//         }
//         SFMealAPI.command(model, null, 'create', false, data);
//         break;
//     }
//   },
//
//   _run : function(event){
//     var target = $(event.target);
//     SFMealAPI.command(target.data('model'), target.data('id'), 'run', this.props.detail, target.data('job-data'));
//   },
//
//   _unverifyLicense : function(event){
//     var target = $(event.target);
//     SFMealAPI.command(target.data('model'),target.data('id'),'unverifyLicense',this.props.detail);
//   },
//
//   _renderRow : function(rowContent, col, rowData, isCreate){
//     if(isCreate){
//       if(col === "command"){
//         rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._create}>Create</button>
//       }else{
//         if(col !== "id"){
//           rowContent = <input type="text" name={col}></input>
//         }
//       }
//     }
//     else if((typeof rowContent !== 'boolean' && rowContent) || typeof rowContent === 'boolean' || col === 'command'){
//       if(col === 'command'){
//         switch(this.props.model){
//           case "Dish":
//             if(rowData.hasOwnProperty('isVerified')){
//               if(rowData['isVerified']){
//                 rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._fail}>Off</button>
//               }else{
//                 rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._verify}>On</button>
//               }
//             }
//             break;
//           case "Meal":
//             if(rowData.hasOwnProperty('status')){
//               if(rowData['status'] === 'on'){
//                 rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._off}>Off</button>
//               }else{
//                 rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._on}>On</button>
//               }
//             }
//             break;
//           case "Order":
//             if(rowData.hasOwnProperty('status')){
//               if(rowData['status'] !== 'complete' && rowData['status'] !== 'cancel'){
//                 rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._abort}>Cancel</button><button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._refund}>Refund</button></div>
//               }else if(rowData.hasOwnProperty('charges')){
//                 if(rowData['charges'] && Object.keys(rowData['charges']).length > 0){
//                   rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._refund}>Refund</button>
//                 }
//               }
//             }
//             break;
//           case "Host":
//             if(rowData.hasOwnProperty('license')){
//               if(rowData['license']){
//                 if(!rowData['license']['valid']){
//                   rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._verifyLicense}>VerifyLicense</button><input name="month" type="text" placeholder="month"/><input  name="day" type="text" placeholder="day"/><input name="year" type="text" placeholder="year"/></div>
//                 }else{
//                   rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._unverifyLicense}>UnverifyLicense</button><input name="month" type="text" value={new Date(rowData['license']['exp']).getMonth() + 1}/><input name="day" type="text" value={new Date(rowData['license']['exp']).getDate()}/><input name="year" type="text" value={new Date(rowData['license']['exp']).getFullYear()}/></div>
//                 }
//               }
//             }
//             break;
//           case "Job":
//               rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={rowData['name']} onClick={this._run} data-job-data={JSON.stringify(rowData['data'])}>Run</button>
//             break;
//           case "Checklist":
//               rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._verifyPhoto}>VerifyPhoto</button><button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._unVerifyPhoto}>UnVerifyPhoto</button><input name="key" type="text"/></div>
//             break;
//           case "Coupon":
//               rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={rowData['id']} onClick={this._delete}>Delete</button></div>
//             break;
//         }
//       }else if(this._isImage(rowContent)){
//         rowContent = <img src={rowContent} width="100"/>
//       }else if(Array.isArray(rowContent)){
//         rowContent = rowContent.map(function(ele){
//           for(var key in ele){
//             if(this._isImage(ele[key])){
//               ele[key] = <img src={ele[key]} width="100"/>
//             }
//           }
//           return key + ":" + ele[key];
//         });
//       }else if(typeof rowContent === "boolean"){
//         rowContent = rowContent ? "true" : "false";
//       }else if(typeof rowContent === 'object'){
//         rowContent = Object.keys(rowContent).map(function(key){
//           return <p>{key} : {rowContent[key]}</p>;
//         });
//       }else if(this._isDate(rowContent)){
//         if(col == 'nextRunAt' && new Date(rowContent).getTime() <= new Date().getTime()){
//           rowContent = 'null';
//         }else{
//           rowContent = new Date(rowContent).toLocaleString();
//         }
//       }
//     }
//     return rowContent;
//   },
//
//   render: function() {
//     var item = this.props.data,
//       attributes = this.props.attrs,
//       isCreate = this.props.isCreate,
//       cols = attributes.map(function (col, i){
//         var attrs = col.split('.');
//         var rowContent;
//         if(attrs.length === 1){
//           rowContent = this._renderRow(item[col], col, item, isCreate);
//         }else{
//           var tmpItem = Object.assign({}, item);
//           attrs.map(function(attr){
//             if(!tmpItem){return;}
//             tmpItem = tmpItem[attr] || null;
//           },this);
//           rowContent = this._renderRow(tmpItem, col, null, isCreate);
//         }
//         return (
//           <td key={i} className="col-md-1">{rowContent}</td>
//         );
//       }, this);
//
//     return (
//       <tr>
//         {cols}
//       </tr>
//     );
//   },
//
//   _isImage : function(value){
//     return typeof value == 'string' && (/\.(jpg|png|gif|jpeg)$/i).test(value)
//   },
//
//   _isDate : function(value){
//     return typeof value === 'string' && new Date(value) !== 'Invalid Date' && new Date(value).getTime() > new Date(2015,1,1).getTime() && !isNaN(new Date(value));
//   }
// });
//
// module.exports = TableItem;
