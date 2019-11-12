(window.webpackJsonp=window.webpackJsonp||[]).push([[42],{40:function(n,a,e){n.exports='<div id="registerView" class="step-container">\n  <div class="alert alert-warning hide">该用户已存在, 请使用邮箱登录</div>\n  <div id="step1" class="text-center step">\n    <div class="card m-auto w-100" style="min-width:300px;">\n\n      <div class="card-body">\n        <div class="card-title">\n          <h3>\n            <button aria-label="close" class="close" onclick="javascript:h.dismissModal()">\n              <span aria-hidden="true">&times;</span>\n            </button>\n          </h3>\n        </div>\n        <div class="my-2 w-50 mx-auto" style="min-width:250px;">\n          <button id="FBBtn" class="popline btn btn-blue btn-lg light w-100" style="font-weight: lighter;">\n            <span><i class="fab fa-facebook-f pr-3"></i>Facebook <span>登录</span></span>\n          </button>\n        </div>\n        <div class="my-2 w-50 mx-auto" style="min-width:250px;">\n          <button id="GoogleBtn" class="popline btn btn-google btn-lg outline white text-orange w-100" style="font-weight: lighter;">\n            <span><i class="fab fa-google pr-3"></i>Google <span>登录</span></span>\n          </button>\n        </div>\n        <div class="my-2 w-50 mx-auto" style="min-width:250px;">\n          <button id="wechatBtn" class="popline btn btn-green btn-lg outline text-white w-100" style="font-weight: lighter;">\n            <span><i class="fab fa-weixin" style="padding-right:15px;"></i>微信<span>登录</span></span>\n          </button>\n        </div>\n        <div class="my-2 w-50 mx-auto" style="min-width:250px;">\n          <button class="popline btn btn-lg btn-danger light next-step mb-4 w-100" data-step="1" onclick="h.nextStep(event)" style="font-weight: lighter;">邮箱注册</button>\n        </div>\n\n        <h6><span>点击注册，我同意</span><a href="/help#terms"> 服务条款</a></h6>\n      </div>\n\n      <div class="card-footer">\n        <h6>已有账号？点击这里: <a toggle="modal" data-target="#myModal" data-model="user" data-action="signin" href="javascript:void(0)" onclick="h.toggleModal(event)"><span>登录</span></a></h6>\n      </div>\n    </div>\n  </div>\n\n  <div id="step2" class="text-center d-none step" >\n    <div class="card m-auto w-100" style="min-width: 300px;">\n\n      <div class="card-body">\n        <div class="card-title">\n          <h3>\n            <small>\n              <a href="#" class="last-step" data-step="2" onclick="h.lastStep(event)">Facebook </a><span>注册</span> <span>或</span> <a href="#" class="last-step" data-step="2" onclick="h.lastStep(event)">Google </a></span><span>注册</span>\n            </small>\n            <button aria-label="close" class="close" onclick="javascript:h.dismissModal()"><span aria-hidden="true">&times;</span></button>\n          </h3>\n        </div>\n\n        <div class="divider"></div>\n\n        <form class="text-center" data-toggle="validator" role="form" autocomplete="off">\n\n          <div class="form-group has-feedback relative">\n            <label class="sr-only" for="emailInput">邮箱:</label>\n            <input type="email" class="form-control" id="emailInput" placeholder="邮箱 (Email)" data-pattern-error="邮箱格式不对" required>\n            <span class="glyphicon form-control-feedback" aria-hidden="true"></span>\n            <div class="help-block with-errors text-red"></div>\n          </div>\n\n          <div class="form-group has-feedback relative">\n            <label class="sr-only" for="passwordInput">密码</label>\n            <input type="password" pattern="^[_A-z0-9]{8,}$" class="form-control" id="passwordInput" placeholder="密码 (Password)" data-pattern-error="密码至少需要8位且只能包含数字和字母" required>\n            <span class="form-control-feedback" aria-hidden="true"></span>\n            <span class="help-block with-errors text-red"></span>\n          </div>\n\n          <div class="form-group has-feedback relative">\n            <label class="sr-only" for="passwordInput">密码</label>\n            <input type="password" pattern="^[_A-z0-9]{8,}$" class="form-control" id="passwordConfirmInput" data-pattern-error="密码至少需要8位且只能包含数字和字母" data-match="#passwordInput" data-match-error="两次密码不一致" placeholder="请再次输入密码 (password confirm)" required>\n            <span class="glyphicon form-control-feedback" aria-hidden="true"></span>\n            <div class="help-block with-errors text-red"></div>\n          </div>\n\n          <div class="form-group has-feedback relative">\n            <label class="sr-only" for="firstnameInput">名字</label>\n            <input type="text" pattern="^([A-zs]{1,15})$" maxlength="15" data-pattern-error="名字只能由数字和字符组成（最多15个字）" class="form-control" id="firstnameInput" placeholder="名字 (Firstname)" required>\n            <span class="form-control-feedback" aria-hidden="true"></span>\n            <div class="help-block with-errors text-red"></div>\n          </div>\n\n          <div class="form-group has-feedback relative">\n            <label class="sr-only" for="lastnameInput">姓</label>\n            <input type="text" pattern="^([A-zs]{1,15})$" maxlength="15" data-pattern-error="名字只能由数字和字符组成（最多15个字）" class="form-control" id="lastnameInput" placeholder="贵姓 (Lastname)" required>\n            <span class="form-control-feedback" aria-hidden="true"></span>\n            <div class="help-block with-errors text-red"></div>\n          </div>\n\n          <div class="form-group">\n            <label class="sr-only" for="phoneInput" type="tel">手机</label>\n            <input type="tel" class="form-control" data-minlength="13" id="phoneInput" placeholder="电话 (Phone)" data-error="请输入手机号" data-pattern-error="手机格式不对" required>\n            <div class="help-block with-errors"></div>\n          </div>\n\n          <div class="form-group">\n            <div class="checkbox">\n              <label>\n                <input type="checkbox" id="receivedEmailInput">\n                <span>我想通过邮箱来接受SFMeal的最新消息和优惠。</span>\n              </label>\n            </div>\n          </div>\n\n          <div class="form-group">\n            <button id="register-btn" type="submit" class="btn btn-danger btn-lg red popline">注册</button>\n          </div>\n        </form>\n\n        <h6 class="text-center"><span>点击注册，我同意</span><a href="/terms#terms">服务条款</a></h6>\n\n      </div>\n\n      <div class="card-footer">\n        <h6><span>该用户已存在, 请使用邮箱登录 </span><a toggle="modal" data-target="#myModal" data-model="user" data-action="signin" href="javascript:void(0)" onclick="h.toggleModal(event)"> 登录</a></h6>\n      </div>\n    </div>\n\n  </div>\n</div>\n\n<script src="/assets/vendors~admin~apply~badge~cart~checkout~chefProfile~createDish~createMeal~dayOfMeal~editDish~editMea~5bf05e41.bundle.js"><\/script>\n<script src="/assets/vendors~admin~apply~badge~cart~checkout~chefProfile~createDish~createMeal~dayOfMeal~editDish~editMea~b88e54df.bundle.js"><\/script>\n<script src="/assets/zh.signup.bundle.js"><\/script>\n'}}]);