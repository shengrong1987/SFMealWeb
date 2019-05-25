import "../../styles/importer.scss";
import React from 'react';
import ReactDOM from 'react-dom';
import AdminPanel from '../react/components/AdminPanel';

let container = document.getElementById('container');

ReactDOM.render(
  <AdminPanel title="SF Meal CMS" version="1.0" />,
  container
);
