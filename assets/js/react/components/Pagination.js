'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import SFMealAPI from '../helpers/SFMealAPI';
import autoBind from 'react-autobind';

class Pagination extends React.Component{

  constructor(props) {
    super(props);
    this.state = { index : props.index };
    this.props = props;
    autoBind(this);
  }

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  static propTypes = {
    index: PropTypes.number,
    model : PropTypes.string,
    maxIndex : PropTypes.number
  }

  static defaultProps = {
    index: 0,
    model: 'User',
    maxIndex : 10
  }

  _change(event){
    var target = $(event.target);
    var index = target.data("index");
    this.setState({ index : index});
    SFMealAPI.search(this.props.model,'','',index);
  }

  render() {
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
        <li key={i} className={activeClass.join(' ')}><a href="javascript:void(0)" data-index={i} onClick={this._change}>{i+1}</a></li>
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
}

export default Pagination;
