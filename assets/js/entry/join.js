import "../../styles/importer.scss";
import { helperMethod } from "../utils/helper";
import { LoginView, Auth } from "../model";
import { setupObj } from "../installation";
setupObj.setupTooltip();
setupObj.setupBootstrapDialog();

$("#wechatBtn").click(function(){
  $("#wechatOverlay").removeClass('hide');
  $("#wechatOverlay").toggle();
})

$("#wechatOverlay").click(function(){
  $("#wechatOverlay").toggle();
})

$(document).ready(function(){
  helperMethod.lazyLoadImage('referral@2x.png');
  helperMethod.setupWechat('', "十三香小龙虾，乐山冷串串，千里香小馄饨，成都纸包鱼...欢迎回家吃饭。", "立即加入获得5元优惠");
});

var user = $("#joinView").data("user");
if(!user){
  helperMethod.wechatLogin();
}

new LoginView({model : new Auth(), el: $("#loginView")});
if(helperMethod.browserVersion()==="uiwebview"){$("#GoogleBtn").hide();}

window.h = helperMethod;
