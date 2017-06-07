/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var SFMealAPI = require('../helpers/SFMealAPI');

var Pagination = React.createClass({

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    index: React.PropTypes.number,
    model : React.PropTypes.string,
    maxIndex : React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      index: 0,
      model: 'User',
      maxIndex : 10
    }
  },

  getInitialState : function(){
    return { index : this.props.index };
  },

  _change : function(event){
    var target = $(event.target);
    var index = target.data("index");
    this.setState({ index : index});
    SFMealAPI.search(this.props.model,'','',index);
  },

  render: function () {
    var indexes = [];
    for(var i=0; i < this.props.maxIndex; i++){
      indexes.push(i);
    }
    var pages = indexes.map(function (e, i) {

      if(i==this.state.index){
        var activeClass = ['active'];
      }else{
        activeClass = [''];
      }
      return (
        <li className={activeClass.join(' ')}><a href="javascript:void(0)" data-index={i} onClick={this._change}>{i+1}</a></li>
      );
    }, this);

    return (
      <nav className="pull-right">
        <ul className="pagination pagination-sm">
          {pages}
        </ul>
      </nav>
    );
  }
});

module.exports = Pagination;