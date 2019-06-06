import "../../styles/importer.scss";
import { helperMethod } from "../utils/helper";
import { LoginView, Auth } from "../model";
import { setupObj } from "../installation";
setupObj.setupTooltip();

$("#wechatBtn").click(function(){
  $("#wechatOverlay").removeClass('hide');
  $("#wechatOverlay").toggle();
})

$("#wechatOverlay").click(function(){
  $("#wechatOverlay").toggle();
})

$(document).ready(function(){
  helperMethod.lazyLoadImage('referral@2x.png');
});
// $('.social-share').share({
//   title : "SFMeal私房菜平台，喂想家的你，加入即可领取5元现金券吧！",
//   sites : ['wechat','qq','weibo','facebook'],
//   description : "十三香小龙虾，葱油拌面，千里香小馄饨，重庆酸辣粉...欢迎回家吃饭。"
// });

var user = $("#joinView").data("user");
if(!user){
  helperMethod.wechatLogin();
}

new LoginView({model : new Auth(), el: $("#loginView")});
if(helperMethod.browserVersion()==="uiwebview"){$("#GoogleBtn").hide();}

window.h = helperMethod;
