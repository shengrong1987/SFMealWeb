import { LoginView, Auth } from "../../../.tmp/public/js/model";
import { setupObj } from "../installation";

new LoginView({model : new Auth(), el: $("#sendEmailView")});
setupObj.setupValidator();
