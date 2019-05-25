'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import TablePanel from './TablePanel';
import Tab from './Tab';

class AdminPanel extends React.Component{

  static propTypes = {
    title : PropTypes.string,
    version : PropTypes.string,
    currentTab : PropTypes.string
  }

  render() {
    var tabs = ['User', 'Host', 'Meal','Dish','Order','Transaction', 'Job', 'Checklist', 'Coupon', 'Email','Review','Account','Driver', 'PickupOption','Badge'];

    return (
      <div className="box">
        <h1>{this.props.title} {this.props.version}</h1>
        <Tab cols={tabs}/>
        <TablePanel/>
      </div>
    );
  }
};

export default AdminPanel;
