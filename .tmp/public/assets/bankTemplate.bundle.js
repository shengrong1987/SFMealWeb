(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{46:function(n,t,e){n.exports='\n<div id="bankView" class="bank">\n  <div class="alert alert-danger d-none">\n    更新失败,请稍后再试。\n  </div>\n  <div class="popup box middle" style="width: 350px;">\n\n    <form class="text-center" data-toggle="validator" role="form">\n\n      <h3 class="text-left text-red">收款银行</strong></h3>\n\n      <fieldset>\n\n        <div class="form-group" role="form">\n          <h4 for="bankAccountNumber" class="text-left"> <small>Account Number</small></h4>\n          <input type="text" class="form-control" id="bankAccountNumber" required data-error="can not be empty">\n          <div class="help-block with-errors"></div>\n        </div>\n\n        <div class="form-group" role="form">\n          <h4 for="bankRoutingNumber" class="text-left"><small>Rounting Number</small></h4>\n          <input type="text" class="form-control" id="bankRoutingNumber" required data-error="can not be empty">\n          <div class="help-block with-errors"></div>\n        </div>\n\n        <div class="alert alert-danger d-none"></div>\n\n        <div class="col-12 form-group">\n          <div class="control-group">\n            <div class="controls">\n              <button type="submit" class="btn btn-danger red">保存</button>\n              <button type="button" name="cancel" class="btn btn-disable">取消</button>\n            </div>\n          </div>\n        </div>\n      </fieldset>\n    </form>\n  </div>\n</div>\n\n<script>\n  appObj.setupObj.setupValidator();\n  new appObj.BankView({ el : $("#bankView"), model : new appObj.Bank()});\n<\/script>\n'}}]);