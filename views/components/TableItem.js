/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons'),
  SFMealAPI = require('../helpers/SFMealAPI'),
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

  render: function() {
    var item = this.props.data,
      attributes = this.props.attrs,
      cols = attributes.map(function (col, i) {
        var attrs = col.split('.');
        if(attrs.length == 1){
          var rowContent = item[col];
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
          }
        }else{
          var tmpItem = Object.assign({}, item);
          attrs.map(function(attr){
            tmpItem = tmpItem[attr]?tmpItem[attr]:tmpItem;
          },this);
          var rowContent = tmpItem;
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
