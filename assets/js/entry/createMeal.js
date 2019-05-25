import '../../styles/importer.scss';
import { installation } from "../installation";
import { helperMethod } from "../utils/helper";
import { MealView, Meal } from "../model";
import { utility } from "../utils/utility";
import WelcomeImage1 from "../../images/welcome-1.png";
import WelcomeImage2 from "../../images/welcome-2.png";
$(document).ready(function(){
  $("[data-src='../../images/welcome-1.png']").attr("src",WelcomeImage1);
  $("[data-src='../../images/welcome-2.png']").attr("src",WelcomeImage2);
})
var mealView = new MealView({ el : $("#mealCreatingView"), model : new Meal()});
utility.initAutoComplete();
installation();
window.h = helperMethod;
window.$ = $;
