import "../../styles/importer.scss";
import { UserBarView, User, AddressView, Host } from "../model";
import { installation } from "../installation";

let userBarView = new UserBarView({el : $("#myUserBar"), model : new Host()})
import { helperMethod } from "../utils/helper";

$(document).ready(function(){
  helperMethod.lazyLoadImage('qrcode.jpg');
})
