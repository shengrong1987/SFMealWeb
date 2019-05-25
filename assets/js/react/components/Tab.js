'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import TabStore from '../stores/TabStore';
import SFMealAPI from '../helpers/SFMealAPI';
import autoBind from 'react-autobind';

var _getStateFromStores = function () {
  return TabStore.getCurrentTab();
};

class Tab extends React.Component{

  constructor(props) {
    super(props);
    this.state = { tab: 'Users'};
    this.props = props;
    autoBind(this);
  }
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */

  static defaultProps = {
    cols: ['User','Meal','Dish','Order']
  }

  componentDidMount() {
    TabStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    TabStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState({
      tab: _getStateFromStores()
    });
  }

  _onSelect(event){
    SFMealAPI.changeTab(event.target.text);
  }

  render() {
    var tabs = this.props.cols.map(function (tab, i) {
        if(tab === this.state.tab){
          return (<li className="nav-item" onClick={this._onSelect} data-value={tab} key={i}><a className="nav-link active" href={"#"+tab}>{tab}</a></li>);
        }else{
          return (<li className="nav-item" onClick={this._onSelect} data-value={tab} key={i}><a className="nav-link" href={"#"+tab}>{tab}</a></li>);
        }
    }, this);

    return (

    <div className="navbar">
      <div className="navbar-inner">
        <ul className="nav nav-pills">
          {tabs}
        </ul>
      </div>
    </div>
     );
  }
}

export default Tab;
