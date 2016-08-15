/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons'),
  TableHeader = require('./TableHeader');

var Hosts = React.createClass({
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
  },

  getDefaultProps: function() {
    return {
    };
  },

  render: function () {
    return (
      React.createElement('input',{
        type : 'text'
      }),
      <table className="table table-striped table-bordered table-hover">
        <TableHeader cols={this.props.header}/>
        <tbody>
        </tbody>
      </table>
    );
  }
});

module.exports = Hosts;