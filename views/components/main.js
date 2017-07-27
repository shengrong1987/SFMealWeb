/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  ReactDOM = require('react-dom'),
  AdminPanel = require('./AdminPanel');

var container = document.getElementById('container');

ReactDOM.render(
  <AdminPanel title="SF Meal CMS" version="1.0" />,
  container
);
