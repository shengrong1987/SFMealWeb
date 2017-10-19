/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  PropTypes = require('prop-types'),
  createReactClass = require('create-react-class'),
  SFMealAPI = require('../helpers/SFMealAPI'),
  ActionCreators = require('../actions/ActionCreators'),
  ActionButton = require('./ActionButton'),
  _ = require('lodash');

var TableItem = createReactClass({

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    data: PropTypes.object,
    model : PropTypes.string,
    detail : PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      data: {},
      attrs: [],
      model : 'User',
      detail : false
    };
  },

  getContent : function(rowContent){
    var _this = this;
    if(this._isImage(rowContent)){
      rowContent = <img src={rowContent} width="100"/>
    }else if(Array.isArray(rowContent)){
      rowContent = rowContent.map(function(ele){
        return _this.getContent(ele);
      });
    }else if(typeof rowContent === "boolean"){
      rowContent = !!rowContent;
    }else if(typeof rowContent === "object"){
      rowContent = JSON.stringify(rowContent);
    }else if(this._isDate(rowContent)){
      rowContent = new Date(rowContent).toLocaleString();
    }
    return rowContent;
  },

  _renderRow : function(rowContent, col, rowData, isCreate){
    var _this = this;
    if(isCreate){
      if(col === "command"){
        rowContent = <ActionButton model={this.props.model} data={rowData} detail={this.props.detail}></ActionButton>
      }else{
        if(col !== "id"){
          rowContent = <input type="text" name={col}></input>
        }
      }
    }
    else if((typeof rowContent !== 'boolean' && rowContent) || typeof rowContent === 'boolean' || col === 'command'){
      if(col === 'command'){
        rowContent = <ActionButton model={this.props.model} data={rowData} detail={this.props.detail}></ActionButton>
      }else if(this._isImage(rowContent)){
        rowContent = <img src={rowContent} width="100"/>
      }else if(Array.isArray(rowContent)){
        rowContent = rowContent.map(function(ele){
          return _this.getContent(ele);
        });
      }else if(typeof rowContent === "boolean"){
        rowContent = !!rowContent;
      }else if(typeof rowContent === 'object'){
        rowContent = Object.keys(rowContent).map(function(key,i){
          return (<div className="form-group">
            <label>{key}</label>
            <input className="form-control" readOnly type="text" key={i} value={_this.getContent(rowContent[key])}></input>
          </div>);
        });
      }else if(this._isDate(rowContent)){
        if(col === 'nextRunAt' && new Date(rowContent).getTime() <= new Date().getTime()){
          rowContent = 'null';
        }else{
          rowContent = new Date(rowContent).toLocaleString();
        }
      }
    }
    if(col !== "command"){
      return <div className="scrollText">{rowContent}</div>;
    }else{
      return rowContent;
    }
  },

  render: function() {
    var item = this.props.data,
      attributes = this.props.attrs,
      isCreate = this.props.isCreate,
      cols = attributes.map(function (col, i){
        var attrs = col.split('.');
        var rowContent;
        if(attrs.length === 1){
          rowContent = this._renderRow(item[col], col, item, isCreate);
        }else{
          var tmpItem = Object.assign({}, item);
          attrs.map(function(attr){
            if(!tmpItem){return;}
            tmpItem = tmpItem[attr];
          },this);
          rowContent = this._renderRow(tmpItem, col, null, isCreate);
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
  },

  _isImage : function(value){
    return typeof value === 'string' && (/\.(jpg|png|gif|jpeg)$/i).test(value)
  },

  _isDate : function(value){
    return typeof value === 'string' && new Date(value) !== 'Invalid Date' && new Date(value).getTime() > new Date(2015,1,1).getTime() && !isNaN(new Date(value));
  }
});

module.exports = TableItem;
