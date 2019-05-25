import "../../styles/importer.scss";
import 'bootstrap';
import { helperMethod } from "../utils/helper";
import QRCodeImage from "../../images/qrcode.jpg";
$(document).ready(function(){
  $("[data-src='../../images/qrcode.jpg']").attr("src",QRCodeImage);
})
window.h = helperMethod;
