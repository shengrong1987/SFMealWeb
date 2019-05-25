import "../../styles/importer.scss";
import 'bootstrap';
import { LoginView, Auth } from "../model";
import { helperMethod } from "../utils/helper";
import QRCodeImage from "../../images/qrcode.jpg";
$(document).ready(function(){
  $("[data-src='../../images/qrcode.jpg']").attr("src",QRCodeImage);
})
new LoginView({model : new Auth(), el: $("#loginView")});
var isLogin = $("#403View").data('login');
if(!isLogin){
  helperMethod.wechatLogin();
}
if(helperMethod.browserVersion()==="uiwebview"){$("#GoogleBtn").hide();}
window.h = helperMethod;
