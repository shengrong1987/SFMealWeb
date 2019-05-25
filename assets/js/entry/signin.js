import { LoginView, Auth } from "../model";
new LoginView({model : new Auth(), el: $("#loginView")});
if(h.browserVersion()==="uiwebview"){$("#GoogleBtn").hide();}
