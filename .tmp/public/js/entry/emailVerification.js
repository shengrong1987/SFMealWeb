import { EmailVerificationView, User } from "../model";
import { setupObj } from "../installation";
new EmailVerificationView({ model : new User(), el: $("#emailVerificationView")});
setupObj.setupValidator();
