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
$(document).ready(function(){
  helperMethod.lazyLoadImage("blank.gif");
  helperMethod.lazyLoadImage("icon_new.png");
  helperMethod.lazyLoadImage("icon_share.png");
  helperMethod.lazyLoadImage("qrcode.jpg");
  helperMethod.lazyLoadImage("profile_man.png");
  helperMethod.lazyLoadImage("image-loader.gif")
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
window.appObj.dayOfMealView = dayOfMealView;
