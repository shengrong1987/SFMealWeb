'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import SFMealAPI from '../helpers/SFMealAPI';
import ActionCreators from '../actions/ActionCreators';
import ActionButton from './ActionButton';
import _ from 'lodash';

class TableItem extends React.Component{

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  static propTypes = {
    data: PropTypes.object,
    model : PropTypes.string,
    detail : PropTypes.bool
  }

  static defaultProps = {
    data: {},
    attrs: [],
    model : 'User',
    detail : false
  }

  getContent(rowContent, key){
    var _this = this;
    if(this._isImage(rowContent)){
      rowContent = <img key={key} src={rowContent} width="100"/>
    }else if(Array.isArray(rowContent)){
      rowContent = rowContent.map(function(ele, j){
        return _this.getContent(ele, j) + '\n';
      });
    }else if(typeof rowContent === "boolean"){
      rowContent = !!rowContent;
    }else if(typeof rowContent === "object"){
      console.log(rowContent);
      rowContent = JSON.stringify(rowContent, null, 2);
    }else if(this._isDate(rowContent)){
      if(key === 'nextRunAt' && new Date(rowContent).getTime() <= new Date().getTime()){
        rowContent = 'null';
      }else{
        rowContent = new Date(rowContent).toLocaleString();
      }
    }
    return rowContent;
  }

  _renderRow(rowContent, col, rowData, isCreate){
    var _this = this;
    if(col !== 'command' && (!rowContent || rowContent === 'undefined')){return ''};
    if(isCreate){
      if(col === "command"){
        rowContent = <ActionButton model={this.props.model} data={rowData} detail={this.props.detail}></ActionButton>
      }else{
        if(col !== "id"){
          rowContent = <input type="text" name={col}></input>
        }
      }
    }else if(col === "command"){
      rowContent = <ActionButton model={this.props.model} data={rowData} detail={this.props.detail}></ActionButton>
    }else{
      if(this.props.detail){
        rowContent = <pre>{_this.getContent(rowContent, col)}</pre>
      }else{
        rowContent = <div className="scrollText"><pre>{_this.getContent(rowContent, col)}</pre></div>;
      }
    }
    return rowContent;
  }

  render() {
    var item = this.props.data,
      attributes = this.props.attrs,
      isCreate = this.props.isCreate,
      cols = attributes.map(function (col, i){
        var attrs = col.split('.');
        var rowContent;
        if(attrs.length === 1){
          if(typeof col === 'function'){
            rowContent = this._renderRow(col(item), col, item, isCreate);
          }else{
            rowContent = this._renderRow(item[col], col, item, isCreate);
          }
        }else{
          var tmpItem = Object.assign({}, item);
          attrs.map(function(attr){
            if(!tmpItem){return;}
            if(typeof attr === 'function'){
              tmpItem = attr(tmpItem);
            }else{
              tmpItem = tmpItem[attr];
            }
          },this);
          rowContent = this._renderRow(tmpItem, col, null, isCreate);
        }
        return (
          <td key={i}>{rowContent}</td>
        );
      }, this);

    return (
      <tr>
        {cols}
      </tr>
    );
  }

  _isImage(value){
    return typeof value === 'string' && (/\.(jpg|png|gif|jpeg)$/i).test(value)
  }

  _isDate(value){
    return typeof value === 'string' && new Date(value) !== 'Invalid Date' && new Date(value).getTime() > new Date(2015,1,1).getTime() && !isNaN(new Date(value));
  }
};

export default TableItem;
