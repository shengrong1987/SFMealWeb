import "../../styles/importer.scss";
import { setupObj } from "../installation";
import { UserBarView, User, AddressView, Host} from "../model";

setupObj.setupCollapse();
let userBarView = new UserBarView({el : $("#myUserBar"), model : new Host()})
import { helperMethod } from "../utils/helper";
window.h = helperMethod;

$(document).ready(function(){
  helperMethod.lazyLoadImage('qrcode.jpg');
})
