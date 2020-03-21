function getComponent() {
  var element = document.createElement('div');
  import(/* webpackChunkName: "lodash" */'lodash').then(({ default : _ }) => {
    element.innerHTML = _.join(['Hello', 'webpack'], ' ');
    return element;
  }).catch(error => 'An error occurred while loading the component');

}

getComponent().then(component => {
  document.body.appendChild(component);
})
