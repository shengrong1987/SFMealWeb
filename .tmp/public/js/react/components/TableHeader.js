'use strict';

import React from 'react';
import PropTypes from 'prop-types';

class TableHeader extends React.Component{
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  static propTypes = {
    cols: PropTypes.array,
    data : PropTypes.object
  }

  static defaultProps = {
    cols: [],
    data: null
  }

  render() {
    var header = this.props.cols.map(function (col, i) {
        return (
          <th key={i} className="col-md-1">{col}</th>
        );
      }, this);

    return (
      <thead>
        <tr>
          {header}
        </tr>
      </thead>
    );
  }
}

export default TableHeader;
