import "../../styles/importer.scss";
import { setupObj } from "../installation";
setupObj.setupTab();
setupObj.setupInputMask();
setupObj.setupBootstrapDialog();

$('.next').click(function(){
  var nextId = $(this).parents('.tab-pane').next().attr("id");
  $('[data-href="#'+nextId+'"]').tab('select');
  return false;
})

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
  //update progress
  var step = $(e.target).data('step');
  var percent = (parseInt(step) / 6) * 100;
  $('.progress-bar').css({width: percent + '%'});
  $('.progress-bar').text("步骤 " + step + " / " + 6);
});

import { helperMethod } from "../utils/helper";
import { ApplyView, AddressView, Host, User } from "../model";
import { utility } from "../utils/utility";

helperMethod.setupStepContainer();
new ApplyView({el : $("#applyView"), model : new Host()});
let addressView = new AddressView({ el : $("#applyView"), model : new User()});
window.appObj = window.appObj || {};
window.appObj.addressView = addressView;
window.appObj.utility = utility;
window.appObj.setupObj = setupObj;
window.h = helperMethod;
