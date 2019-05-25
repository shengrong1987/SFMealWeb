import '../../styles/importer.scss';
import '../library/jasny-bootstrap';
import { installation } from "../installation";
import { helperMethod } from "../utils/helper";
import { DishView, Dish } from "../model";
import WelcomeImage1 from "../../images/welcome-1.png";
import WelcomeImage2 from "../../images/welcome-2.png";
$(document).ready(function(){
  $("[data-src='../../images/welcome-1.png']").attr("src",WelcomeImage1);
  $("[data-src='../../images/welcome-2.png']").attr("src",WelcomeImage2);
})
new DishView({ el : $("#dishNewView"), model : new Dish()})
installation();
window.h = helperMethod;

