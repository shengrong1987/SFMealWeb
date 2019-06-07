import '../../styles/importer.scss';
import { Host, UserBarView, Auth, LoginView } from "../model";
import { setupObj } from "../installation";

setupObj.setupValidator();

let host = new Host();
let userBarView = new UserBarView({el : $("#myUserBar"), model : host})
new LoginView({model : new Auth(), el: $("#resetPasswordView")});
