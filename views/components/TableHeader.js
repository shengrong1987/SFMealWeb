/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  createReactClass = require('create-react-class'),
  PropTypes = require('prop-types');

var TableHeader = createReactClass({

  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    cols: PropTypes.array,
    data : PropTypes.object
  },

  getDefaultProps: function () {
    return {
      cols: [],
      data: null
    }
  },

  render: function () {
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
});

module.exports = TableHeader;
