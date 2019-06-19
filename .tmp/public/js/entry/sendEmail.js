import { LoginView, Auth } from "../model";
import { setupObj } from "../installation";

new LoginView({model : new Auth(), el: $("#sendEmailView")});
setupObj.setupValidator();
