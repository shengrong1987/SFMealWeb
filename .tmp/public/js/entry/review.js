import {ReviewView, Order, Host, UserBarView} from "../model";
new ReviewView({ el : $("#orderReviewPopup"), model : new Order()})
let userBarView = new UserBarView({el : $("#myUserBar"), model : new Host()})
import { setupObj } from "../installation";
setupObj.setupStarSet();
setupObj.setupBootstrapDialog();
