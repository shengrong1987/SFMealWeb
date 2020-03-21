import '../../styles/importer.scss';
import {OrderView, Order, Host, UserBarView} from "../model";
import { helperMethod } from "../utils/helper";
import { setupObj } from "../installation";
let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})
setupObj.setupTimeSpan();
setupObj.setupTab();
var orderView = new OrderView({ el : $("#myorder"), model : new Order()});
window.h = helperMethod;
