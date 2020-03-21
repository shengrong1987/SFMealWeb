import "../../styles/home.scss";
import { helperMethod } from "../utils/helper";
$(document).ready(function(){
  helperMethod.lazyLoadImage('logo.png');
  helperMethod.lazyLoadImage('mv01-min.jpg');
  helperMethod.lazyLoadImage('img_message-min.jpg');
  helperMethod.lazyLoadImage('img_message_sp-min.jpg');
  helperMethod.lazyLoadImage('btn_01.png');
  helperMethod.lazyLoadImage('btn_02.png');
  helperMethod.lazyLoadImage('WechatIMG50.jpeg');
  helperMethod.lazyLoadImage('access.png');
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
