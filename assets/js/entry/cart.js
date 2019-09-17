import '../../styles/importer.scss';
import { installation, setupObj } from '../installation.js';
import { helperMethod, localOrderObj } from "../utils/helper.js";
installation();

import { amountInput } from "../library/sfmeal-components";
import { Host, UserBarView, Dish, DishPreferenceView } from '../model.js';
import { CartView, Meal} from "../model";

let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})
let cartContainer = $("#cartContainer");
let cartView = new CartView({ el : cartContainer, model : new Meal()});

window.h = helperMethod;
window.l = localOrderObj;
window.appObj = window.appObj || {};
window.appObj.DishPreferenceView = DishPreferenceView;
window.appObj.Dish = Dish;
window.appObj.setupObj = setupObj;
window.$ = $;
