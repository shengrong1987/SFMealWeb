/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');

var Search = React.createClass({
  /*
    Validation to ensure that the properties sent from the
      parent component is the correct type.
  */
  propTypes: {
    criteria : React.PropTypes.array
  },

  getDefaultProps: function() {
    return {
      criteria : ["ID"]
    };
  },

  render: function () {
    var divStyle = {
      width : '100%'
    }, criterias = this.props.criteria.map(function(c){
      return (<label className="radio-inline"><input type="radio" name="criteriaOpt" value={c}/>{c}</label>);
    }, this);
    return (
      <div className="box">
        <div className="input-group row">
          <div className="col-xs-10">
            <input className="input btn-lg btn-outline-blue round text-grey" style={divStyle} type="search"/>
          </div>
          <div className="col-xs-2">
            <button className="btn btn-info">Search</button>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            {criterias}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Search;
