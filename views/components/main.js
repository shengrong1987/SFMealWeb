/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react'),
  AdminPanel = require('./AdminPanel'),
  SFMealApi = require('../helpers/SFMealAPI');

SFMealApi.getUsers();

var container = document.getElementById('container');

React.render(
  <AdminPanel title="SF Meal CMS" version="1.0" />,
  container
);
