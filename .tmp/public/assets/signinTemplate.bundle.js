(window.webpackJsonp=window.webpackJsonp||[]).push([[38],{39:function(n,t,a){n.exports='<div id="loginView" class="card m-auto" style="min-width: 300px;width:100%;">\n\n  <div class="card-body">\n    <div class="card-title" style="height: 15px;">\n      <button aria-label="close" class="close" onclick="javascript:h.dismissModal()">\n        <span aria-hidden="true">&times;</span>\n      </button>\n    </div>\n\n    <div class="alert alert-danger d-none">邮箱或者密码错误，请重试。</div>\n    <div class="signin text-center">\n      <div class="row">\n        <div class="col-12">\n          <button id="FBBtn" class="popline btn btn-blue btn-lg light" style="min-width:250px;font-weight: lighter;">\n            <span><i class="fab fa-facebook-f pr-3" style="padding-right: 15px;"></i>Facebook 登录</span>\n          </button>\n        </div>\n      </div>\n      <div class="row mt-1">\n        <div class="col-12">\n          <button id="GoogleBtn" class="popline btn btn-google btn-lg text-orange white" style="min-width:250px;font-weight: lighter;">\n            <span><i class="fab fa-google pr-3"></i>Google 登录</span>\n          </button>\n        </div>\n      </div>\n\n      <div class="row mt-1">\n        <div class="col-12">\n          <button id="wechatBtn" class="popline btn btn-green btn-lg text-white" style="min-width:250px;font-weight: lighter;">\n            <span><i class="fab fa-weixin" style="padding-right:15px;"></i>微信 登录</span>\n          </button>\n        </div>\n      </div>\n\n      <div class="divider"></div>\n      <h4 class="mb-2">邮箱登录</h4>\n\n      <form class="text-center" data-toggle="validator" role="form">\n        <div class="form-group">\n          <label class="sr-only" for="emailInput">邮箱:</label>\n          <input type="email" class="form-control" id="emailInput2" data-pattern-error="邮箱格式不对" placeholder="邮箱 (Email)" required>\n          <div class="help-block with-errors"></div>\n        </div>\n\n        <div class="form-group">\n          <label class="sr-only" for="passwordInput" data-toggle="i18n" data-key="password"></label>\n          <input type="password" class="form-control" id="passwordInput2" pattern="^[_A-z0-9]{8,}$" data-pattern-error="密码至少需要8位且只能包含数字和字母" placeholder="密码 (Password)" required>\n          <div class="help-block with-errors"></div>\n        </div>\n\n        <div class="form-group">\n          <button id="signin-btn" type="submit" class="btn btn-danger btn-lg red popline">登录</button>\n        </div>\n\n      </form>\n    </div>\n  </div>\n  <div class="card-footer">\n    <h6 class="text-center">第一次使用？点击这里开始 <a toggle="modal" data-target="#myModal" data-model="user" data-action="signup" href="javascript:void(0)" onclick="h.toggleModal(event)">注册</a></h6>\n    <h6 class="text-center">忘记密码? <a toggle="modal" data-target="#myModal" data-model="user" data-action="sendEmail" href="javascript:void(0)" onclick="h.toggleModal(event)">重置密码</a></h6>\n  </div>\n</div>\n\n<script src="/assets/vendors~admin~apply~badge~checkout~chefProfile~createDish~createMeal~dayOfMeal~editDish~editMeal~ema~3995f8fe.bundle.js"><\/script>\n<script src="/assets/vendors~admin~apply~badge~checkout~chefProfile~createDish~createMeal~dayOfMeal~editDish~editMeal~ema~1bb62d84.bundle.js"><\/script>\n<script src="/assets/zh.signin.bundle.js"><\/script>\n'}}]);