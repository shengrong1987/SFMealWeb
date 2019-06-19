import { RegisterView, Auth } from "../model.js";
import { setupObj } from "../installation";
new RegisterView({el : $("#registerView"), model : new Auth()});
h.setupStepContainer();
setupObj.setupValidator();
setupObj.setupInputMask();
if(h.browserVersion()==="uiwebview"){$("#GoogleBtn").hide();}
