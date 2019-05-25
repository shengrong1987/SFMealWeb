import '../../styles/importer.scss';
import ProfileImage from "../../images/profile_man.png";
$(document).ready(function(){
  $("[data-src='../../images/profile_man.png']").attr("src",ProfileImage);
})
import { helperMethod, localOrderObj } from "../utils/helper";
import { HostPageView, Host, UserBarView } from "../model";
import { installation } from '../installation.js';
installation();

let title = $("#hostProfileView").data("title");
let desc = $("#hostProfileView").data("desc");
new HostPageView({ el : $("#hostProfileView"), model : new Host()})
helperMethod.setupWechat($("#hostProfileView .round_thumb").prop("src"), title , title + ":" + desc);
let user = $("#hostProfileView").data("user");
if(!user){
  helperMethod.wechatLogin();
}
let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})
