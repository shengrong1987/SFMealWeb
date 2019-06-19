import '../../styles/importer.scss';
import { installation, setupObj } from '../installation.js';
import { helperMethod, localOrderObj } from "../utils/helper.js";
installation();

import { amountInput } from "../library/sfmeal-components";
import { OrderView, Order, AddressView, User, MealConfirmView, Meal, ContactInfoView, Host, UserBarView, Payment, PaymentView, MapView  } from '../model.js';
import { utility } from "../utils/utility";

new OrderView({ el : $("#meal-confirm-container"), model : new Order()})
let addressView = new AddressView({ el : $("#meal-confirm-container"), model : new User()});
let mealConfirmView = new MealConfirmView( { el : $("#meal-confirm-container"), model : new Meal()});
new ContactInfoView({ el : $("#contactInfoView"), model : new User()});
let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})

var select = $(".card-expiry-year"), year = new Date().getFullYear();

for(var i = 0; i < 12; i++) {
  select.append($("<option value='"+(i + year)+"' "+(i === 0 ? "selected" : "")+">"+(i + year)+"</option>"))
}

var month = $(".card-expiry-month").attr("value");
$(".card-expiry-month option").each(function(){
  if($(this).attr("value")===month){
    $(this).attr("selected","selected");
  }
});

var year = $(".card-expiry-year").attr("value");
$(".card-expiry-year option").each(function(){
  if($(this).attr("value")===year){
    $(this).attr("selected","selected");
  }
});

window.h = helperMethod;
window.l = localOrderObj;
window.$ = $;
window.appObj = window.appObj || {};
window.appObj.mealConfirmView = mealConfirmView;
window.appObj.addressView = addressView;
window.appObj.utility = utility;
window.appObj.PaymentView = PaymentView;
window.appObj.Payment = Payment;
window.appObj.setupObj = setupObj;
window.appObj.MapView = MapView;
