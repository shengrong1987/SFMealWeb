import "../../styles/importer.scss";
import '../library/jasny-bootstrap';
import { Host, UserBarView, Badge, BadgeView } from "../model";
import { helperMethod } from "../utils/helper";

let userBarView = new UserBarView({el : $("#myUserBar"), model : new Host()});
let badgeView = new BadgeView({el: $("#badgeDetailView"), model : new Badge()});

$(document).ready(function(){
  helperMethod.lazyLoadImage('qrcode.jpg');
  helperMethod.lazyLoadImage('fa-ribbon.png');
});
window.h = helperMethod;
window.appObj = window.appObj || {};
window.appObj.badgeView = badgeView;
