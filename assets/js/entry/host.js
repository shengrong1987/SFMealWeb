import "../../styles/importer.scss";
import '../library/jasny-bootstrap';
import { helperMethod, localOrderObj } from "../utils/helper";
import { MyMealView, Meal, HostProfileView, Host, AddressView, OrderView, Order, UserBarView } from "../model";
import { installation, setupObj } from "../installation";

installation();

var myMealView = new MyMealView({ el : $("#mymeal"), model : new Meal()});
var hostProfileView = new HostProfileView( { el : $("#myinfo"), model : new Host()})
var addressView = new AddressView({ el : $("#hostAddressView"), model : new Host()})
var orderView = new OrderView({ el : $("#myorder"), model : new Order()});
let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})

import UploadDefault from "../../images/upload_default.png";
import ProfileMan from "../../images/profile_man.png";
import {utility} from "../utils/utility";
$(document).ready(function(){
  $("[data-src='../../images/upload_default.png']").attr("src",UploadDefault);
  $("[data-src='../../images/profile_man.png']").attr("src",ProfileMan);
  $(".fileinput").on("clear.bs.fileinput",function(){
    $("input[type='file']").data("isDelete",true);
  });
})

window.h = helperMethod;
window.l = localOrderObj;
window.$ = $;
window.appObj = window.appObj || {};
window.appObj.addressView = addressView;
window.appObj.hostProfileView = hostProfileView;
window.appObj.utility = utility;
window.appObj.setupObj = setupObj;
