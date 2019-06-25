import "../../styles/importer.scss";
import { helperMethod } from "../utils/helper";
import {TransactionView, Transaction, UserBarView, Host, PaymentView, Payment, BankView, Bank} from "../model";
import { installation, setupObj } from "../installation";
import { utility } from "../utils/utility";

let transactionView = new TransactionView({ el : $("#mydetail"), model : new Transaction()});
let userBarView = new UserBarView({el : $("#myUserBar"), model : new Host()});
installation();

import ProfileMan from "../../images/profile_man.png";
$(document).ready(function(){
  $("[data-src='../../images/profile_man.png']").attr("src",ProfileMan);
})

window.h = helperMethod;
window.appObj = window.appObj || {};
window.appObj.transactionView = transactionView;
window.appObj.PaymentView = PaymentView;
window.appObj.Payment = Payment;
window.appObj.setupObj = setupObj;
window.appObj.BankView = BankView;
window.appObj.Bank = Bank;
window.appObj.utility = utility;
window.$ = $;

