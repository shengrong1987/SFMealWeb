import { setupObj } from "../installation";
import { BankView, Bank } from "../model";
setupObj.setupValidator();
new BankView({ el : $("#bankView"), model : new Bank()});
