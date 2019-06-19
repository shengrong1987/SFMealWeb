import '../../styles/importer.scss';
import '../library/jasny-bootstrap';
import { helperMethod, localOrderObj } from "../utils/helper";
import { AddressView, UserProfileView, ReviewView, OrderView, User, Order, Review, Host, UserBarView} from "../model";
import { installation } from "../installation";
import { setupObj } from "../installation";
import { utility } from "../utils/utility";

installation();
let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})
var addressView = new AddressView({ el : $("#myaddress"), model : new User()})
var userProfileView = new UserProfileView( { el: $("#myinfo"), model : new User()})
new ReviewView({ el : $("#myreview"), model : new Review()})
var orderView = new OrderView({ el : $("#myorder"), model : new Order()});

import ProfileMan from "../../images/profile_man.png";
$(document).ready(function(){
  $("[data-src='../../images/profile_man.png']").attr("src",ProfileMan);
  $(".fileinput").on("clear.bs.fileinput",function(){
    $("input[type='file']").data("isDelete",true);
  });
})

window.h = helperMethod;
window.l = localOrderObj;
window.appObj = window.appObj || {};
window.appObj.utility = utility;
window.appObj.addressView = addressView;
window.appObj.AddressView = AddressView;
window.appObj.orderView = orderView;
window.appObj.User = User;
window.appObj.userProfileView = userProfileView;
window.appObj.setupObj = setupObj;
window.appObj.Order = Order;
window.appObj.OrderView = OrderView;
window.$ = $;
