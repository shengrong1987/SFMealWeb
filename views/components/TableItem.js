/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons'),
  SFMealAPI = require('../helpers/SFMealAPI'),
  ActionCreators = require('../actions/ActionCreators'),
  _ = require('lodash');

var TableItem = React.createClass({

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    data: React.PropTypes.object,
    model : React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      data: {},
      attrs: [],
      model : 'User'
    };
  },

  _verify : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'),target.data('id'),'verify',this.props.detail);
  },

  _fail : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'),target.data('id'),'fail',this.props.detail);
  },

  _on : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'),target.data('id'),'on',this.props.detail);
  },

  _off : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'),target.data('id'),'off',this.props.detail);
  },

  _abort : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'),target.data('id'),'abort',this.props.detail);
  },

  _refund : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'),target.data('id'),'refund',this.props.detail);
  },

  _verifyPhoto : function(event){
    var target = $(event.target);
    var key = target.find("~input[name='key']").val();
    if(!key){
      ActionCreators.badRequest("need key");
      return;
    }
    SFMealAPI.command(target.data('model'),target.data('id'),'verify',this.props.detail, { key : key});
  },

  _unVerifyPhoto : function(event){
    var target = $(event.target);
    var key = target.find("~input[name='key']").val();
    if(!key){
      ActionCreators.badRequest("need key");
      return;
    }
    SFMealAPI.command(target.data('model'),target.data('id'),'unVerify',this.props.detail, { key : key});
  },

  _verifyLicense : function(event){
    var target = $(event.target);
    var month = target.find("~input[name='month']").val();
    var day = target.find("~input[name='day']").val();
    var year = target.find("~input[name='year']").val();
    if(!month || !day || !year){
      ActionCreators.badRequest("need expiration date");
      return;
    }
    var date = new Date(year, month-1, day);
    if(date.getTime() < new Date().getTime()){
      ActionCreators.badRequest("expiration date should be in the future");
      return;
    }
    var data = {
      month : month,
      day : day,
      year : year
    }
    SFMealAPI.command(target.data('model'),target.data('id'),'verifyLicense',this.props.detail, data);
  },

  _run : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'), target.data('id'), 'run', this.props.detail, target.data('job-data'));
  },

  _unverifyLicense : function(event){
    var target = $(event.target);
    SFMealAPI.command(target.data('model'),target.data('id'),'unverifyLicense',this.props.detail);
  },

  _renderRow : function(rowContent, col, item){
    if((typeof rowContent !== 'boolean' && rowContent) || typeof rowContent === 'boolean' || col === 'command'){
      if(col === 'command'){
        switch(this.props.model){
          case "Dish":
            if(item.hasOwnProperty('isVerified')){
              if(item['isVerified']){
                rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._fail}>Off</button>
              }else{
                rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._verify}>On</button>
              }
            }
            break;
          case "Meal":
            if(item.hasOwnProperty('status')){
              if(item['status'] === 'on'){
                rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._off}>Off</button>
              }else{
                rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._on}>On</button>
              }
            }
            break;
          case "Order":
            if(item.hasOwnProperty('status')){
              if(item['status'] !== 'complete' && item['status'] !== 'cancel'){
                rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._abort}>Cancel</button><button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._refund}>Refund</button></div>
              }else if(item.hasOwnProperty('charges')){
                if(item['charges'] && Object.keys(item['charges']).length > 0){
                  rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._refund}>Refund</button>
                }
              }
            }
            break;
          case "Host":
            if(item.hasOwnProperty('license')){
              if(item['license']){
                if(!item['license']['valid']){
                  rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._verifyLicense}>VerifyLicense</button><input name="month" type="text" placeholder="month"/><input  name="day" type="text" placeholder="day"/><input name="year" type="text" placeholder="year"/></div>
                }else{
                  rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._unverifyLicense}>UnverifyLicense</button><input name="month" type="text" value={new Date(item['license']['exp']).getMonth() + 1}/><input name="day" type="text" value={new Date(item['license']['exp']).getDate()}/><input name="year" type="text" value={new Date(item['license']['exp']).getFullYear()}/></div>
                }
              }
            }
            break;
          case "Job":
            {
              rowContent = <button className="btn btn-info" data-model={this.props.model} data-id={item['name']} onClick={this._run} data-job-data={JSON.stringify(item['data'])}>Run</button>
            }
            break;
          case "Checklist":
            {
              rowContent = <div><button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._verifyPhoto}>VerifyPhoto</button><button className="btn btn-info" data-model={this.props.model} data-id={item['id']} onClick={this._unVerifyPhoto}>UnVerifyPhoto</button><input name="key" type="text"/></div>
            }
            break;
        }
      }else if(typeof rowContent == 'string' && (/\.(jpg|png|gif|jpeg)$/i).test(rowContent)){
        rowContent = <img src={rowContent} width="100"/>
      }else if(Array.isArray(rowContent)){
        rowContent = rowContent.map(function(ele){
          for(var key in ele){
            if(typeof ele[key] === 'string' && (/\.(jpg|png|gif|jpeg)$/i).test(ele[key])){
              ele[key] = <img src={ele[key]} width="100"/>
              return ele[key];
            }
          }
          return key + ":" + ele[key];
        });
      }else if(typeof rowContent === "boolean"){
        rowContent = rowContent ? "true" : "false";
      }else if(typeof rowContent === 'object'){
        rowContent = Object.keys(rowContent).map(function(key){
          return <p>{key} : {rowContent[key]}</p>;
        });
      }else if(typeof rowContent === 'string' && new Date(rowContent) !== 'Invalid Date' && !isNaN(new Date(rowContent))){
        if(col == 'nextRunAt' && new Date(rowContent).getTime() <= new Date().getTime()){
          rowContent = 'null';
        }else{
          rowContent = new Date(rowContent).toLocaleString();
        }
      }
    }
    return rowContent;
  },

  render: function() {
    var item = this.props.data,
      attributes = this.props.attrs,
      cols = attributes.map(function (col, i) {
        var attrs = col.split('.');
        if(attrs.length == 1){
          var rowContent = item[col];
          rowContent = this._renderRow(rowContent, col, item);
        }else{
          var tmpItem = Object.assign({}, item);
          attrs.map(function(attr){
            if(!tmpItem){
              return;
            }
            tmpItem = tmpItem[attr]?tmpItem[attr]:null;
          },this);
          var rowContent = this._renderRow(tmpItem, col, null);
        }
        return (
          <td key={i} className="col-md-1">{rowContent}</td>
        );
      }, this);

    return (
      <tr>
        {cols}
      </tr>
    );
  }
});

module.exports = TableItem;
