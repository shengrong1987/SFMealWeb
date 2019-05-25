import "../../styles/home.scss";
import LogoImage from "../../images/logo.png";
import Slide1 from "../../images/mv01-min.jpg";
import Message1 from "../../images/img_message-min.jpg";
import Message1_SP from "../../images/img_message_sp-min.jpg";
import Button1 from "../../images/btn_01.png";
import Button2 from "../../images/btn_02.png";
import QRCode from "../../images/WechatIMG50.jpeg";
$(document).ready(function(){
  $("[data-src='../../images/logo.png']").attr("src",LogoImage);
  $("[data-src='../../images/mv01-min.jpg']").attr("src",Slide1);
  $("[data-src='../../images/img_message-min.jpg']").attr("src",Message1);
  $("[data-src='../../images/img_message_sp-min.jpg]").attr("src",Message1_SP);
  $("[data-src='../../images/btn_01.png']").attr("src",Button1);
  $("[data-src='../../images/btn_02.png']").attr("src",Button2);
  $("[data-src='../../images/WechatIMG50.jpeg']").attr("src",QRCode);
})
import "../home/slick.js";
import "../home/anime.min.js";
import "../home/scrollMonitor.js";
import "../home/main.js";
import "../home/top.js";
$(document).ready(function() {
  $('#mvSlick').slick({
    arrows: false,
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true
  });
  $('#mvSlickSp').slick({
    arrows: false,
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    fade: true
  });
});
