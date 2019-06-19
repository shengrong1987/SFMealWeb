import "../../styles/importer.scss";
import { setupObj } from "../installation";
import { helperMethod } from "../utils/helper";
import { Host, UserBarView} from "../model";

let userBarView = new UserBarView({el : $("#myUserBar"), model : new Host()})
setupObj.setupCollapse();
window.h = helperMethod;

$(document).ready(function(){
  helperMethod.lazyLoadImage('qrcode.jpg');
})
