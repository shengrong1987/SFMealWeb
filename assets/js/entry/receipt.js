import "../../styles/importer.scss";
import {ReceiptView, Order, Host, UserBarView} from "../model";
new ReceiptView({ el : $("#receiptView"), model : new Order()});
let userBarView = new UserBarView({el : $("#myUserBar"), model : new Host()})
import { helperMethod } from "../utils/helper";
helperMethod.setupWechat($("#receiptView .dishImg:eq(0)").prop('src'),$("#receiptView").data("title"), $("#receiptView").data("desc"));
window.h = helperMethod;
