import '../../styles/importer.scss';
import { installation, setupObj } from '../installation.js';
import { DayOfMealView, HostSectionInMealView, Meal, Host, UserBarView, DishPreferenceView, Dish, NewUserRewardView, User } from '../model.js';
import { helperMethod, localOrderObj } from "../utils/helper.js";
import { amountInput } from "../library/sfmeal-components";

installation();

let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})
let dayOfMealContainer = $("#dayOfMealContainer");
let dayOfMealView = new DayOfMealView({ el : dayOfMealContainer, model : new Meal()});
let hostSelectionView = new HostSectionInMealView({ el : dayOfMealContainer, model : host});
let user = dayOfMealContainer.data('user');
if(!user){
  helperMethod.wechatLogin();
}
helperMethod.setupWechat(dayOfMealContainer.find("[data=cover-string]").data("cover-string"), "SFMeal本周菜单", "小龙虾，冷串串，麻辣干锅，冰粉");
import BlankImage from "../../images/blank.gif";
import NewUserIcon from "../../images/icon_new.png";
import QRCodeImage from "../../images/qrcode.jpg";
import ProfileImage from "../../images/profile_man.png";
$(document).ready(function(){
  $("[data-src='../../images/blank.gif']").attr("src",BlankImage);
  $("[data-src='../../images/icon_new.png']").attr("src",NewUserIcon);
  $("[data-src='../../images/qrcode.jpg']").attr("src",QRCodeImage);
  $("[data-src='../../images/profile_man.png']").attr("src",ProfileImage);
})
window.h = helperMethod;
window.l = localOrderObj;
window.$ = $;
window.appObj = window.appObj || {};
window.appObj.DishPreferenceView = DishPreferenceView;
window.appObj.Dish = Dish;
window.appObj.User = User;
window.appObj.NewUserRewardView = NewUserRewardView;
window.appObj.setupObj = setupObj;
