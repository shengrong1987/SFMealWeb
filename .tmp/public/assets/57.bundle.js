(window.webpackJsonp=window.webpackJsonp||[]).push([[57],{466:function(module,exports){
/*!
 * fullpage 1.4.0
 * Author: 抹桥 <yq12315@gmail.com>(http://www.kisnows.com)
 * Homepage: https://github.com/kisnows/fullpage#readme
 * Release under MIT.
 * 
 */!function(n){var e={};function t(o){if(e[o])return e[o].exports;var i=e[o]={exports:{},id:o,loaded:!1};return n[o].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}t.m=n,t.c=e,t.p="d:\\Github\\fullpage-light.js\\static",t(0)}([function(module,exports,__webpack_require__){eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar _bootstrap = __webpack_require__(1);\n\nvar fullpage = {\n  init: _bootstrap.bootstrap,\n  scrollPage: _bootstrap.page.scrollPage,\n  scrollSlide: _bootstrap.page.scrollSlide,\n  moveTo: _bootstrap.page.moveTo,\n  moveToNext: _bootstrap.page.move.next,\n  moveToPre: _bootstrap.page.move.pre,\n  slideToNext: _bootstrap.page.slide.next,\n  slideToPre: _bootstrap.page.slide.pre\n};\n\n(function (global) {\n  global.fullpage = fullpage;\n})(window);\n\nexports.default = fullpage;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./src/index.js\n ** module id = 0\n ** module chunks = 0\n **/\n//# sourceURL=webpack:///./src/index.js?")},function(module,exports,__webpack_require__){eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.page = exports.bootstrap = undefined;\n\nvar _utils = __webpack_require__(2);\n\nvar _utils2 = _interopRequireDefault(_utils);\n\nvar _constant = __webpack_require__(3);\n\nvar _events = __webpack_require__(4);\n\nvar _events2 = _interopRequireDefault(_events);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nvar sectionContent = undefined;\nvar sections = undefined;\nvar options = undefined;\nvar page = undefined;\n\nfunction bootstrap(ele, Customize) {\n  sectionContent = _utils2.default.$$(ele)[0];\n  sections = _utils2.default.$$('.fp-section');\n  options = Object.assign({}, _constant.defaults, Customize);\n  initEle();\n  (0, _events2.default)(options, page);\n}\n\nfunction initEle() {\n  function init() {\n    initContent();\n    initSlide();\n    pageController();\n    customize();\n  }\n\n  init();\n  /**\n   * 初始化 Section\n   */\n  function initContent() {\n    _utils2.default.setCss(sectionContent, {\n      'transform': 'translate3d(0,0,0)',\n      '-webkit-transform': 'translate3d(0,0,0)',\n      'transitionDuration': options.pageSpeed + 'ms',\n      '-webkit-transitionDuration': options.pageSpeed + 'ms',\n      'display': 'block'\n    });\n\n    sectionContent.addEventListener(_utils2.default.transitionEvent, function () {\n      page.isScrolling = false;\n    }, false);\n\n    for (var i = sections.length - 1; i >= 0; i--) {\n      sections[i].style.height = _constant.stepHeight + 'px';\n    }\n\n    sections[page.nowPage - 1].classList.add('active');\n  }\n\n  /**\n   * 初始化 Slide\n   */\n  function initSlide() {\n    var slideWrap = _utils2.default.$$('.fp-slide-wrap');\n    var slides = undefined;\n\n    function slideWrapInitHandle() {\n      page.isScrolling = false;\n    }\n\n    for (var i = slideWrap.length - 1; i >= 0; i--) {\n      slides = _utils2.default.$$('.fp-slide', slideWrap[i]);\n      for (var j = slides.length - 1; j >= 0; j--) {\n        slides[j].style.width = _constant.stepWidth + 'px';\n      }\n      slideWrap[i].style.width = slides.length * _constant.stepWidth + 'px';\n      slideWrap[i].dataset.x = '0';\n      slideWrap[i].dataset.index = '1';\n      slideWrap[i].addEventListener(_utils2.default.transitionEvent, slideWrapInitHandle, false);\n    }\n  }\n\n  /**\n   * 初始化翻页控制点\n   */\n  function pageController() {\n    function init() {\n      createControllerNode();\n      bindEvent();\n      initController();\n    }\n\n    init();\n    // 插入控制点\n    function createControllerNode() {\n      var controllerWrap = document.createElement('div');\n      var controllerText = '';\n      controllerWrap.className = 'fp-controller';\n      for (var i = sections.length; i--; i > 0) {\n        controllerText += \"<div class='fp-controller-dotted'></div>\";\n      }\n      controllerWrap.innerHTML = controllerText;\n      document.body.appendChild(controllerWrap);\n    }\n\n    // 给控制点绑定切换事件\n    function bindEvent() {\n      var controllers = _utils2.default.$$('.fp-controller-dotted');\n      for (var i = controllers.length - 1; i >= 0; i--) {\n        controllers[i].addEventListener('click', helper(i + 1), false);\n      }\n      function helper(i) {\n        return function () {\n          _utils2.default.addClassToOneEle(controllers, i - 1);\n          page.moveTo(i);\n        };\n      }\n    }\n\n    // 获取控制点初试状态\n    function initController() {\n      var controllers = _utils2.default.$$('.fp-controller-dotted');\n      controllers[page.nowPage - 1].classList.add('active');\n    }\n  }\n\n  /**\n   * 初始化定制内容\n   */\n  function customize() {\n    var prop = {\n      autoScroll: function autoScroll() {\n        /* eslint-disable */\n        var timer = null;\n        /* eslint-enable */\n        if (options.autoScroll) {\n          timer = setInterval(function () {\n            page.move.next();\n          }, options.autoScroll);\n        }\n      }\n    };\n\n    for (var key in prop) {\n      if (prop.hasOwnProperty(key)) {\n        prop[key]();\n      }\n    }\n  }\n}\n\nexports.page = page = {\n  nowPage: 1,\n  isScrolling: false,\n  translate3dY: 0,\n  /**\n   * Scroll to a specified page.\n   * @param pageIndex {number} The page index you want scroll to.\n   * @returns {boolean}\n   */\n  scrollPage: function scrollPage(pageIndex) {\n    var pageDiff = pageIndex - page.nowPage;\n    var leaveSection = sections[page.nowPage - 1];\n    var nowSection = sections[pageIndex - 1];\n    var controllers = _utils2.default.$$('.fp-controller-dotted');\n    if (pageIndex >= 1 && pageIndex <= sections.length && !page.isScrolling && pageDiff) {\n      if (typeof options.beforeLeave === 'function') {\n        /**\n         * leaveSection 函数内部 this 指向，将要离开的 section\n         * page.nowPage 将要离开页面的 index\n         * pageIndex    将要载入页面的 index\n         */\n        options.beforeLeave.call(leaveSection, page.nowPage, pageIndex);\n      }\n\n      leaveSection.classList.remove('active');\n      _utils2.default.addClassToOneEle(controllers, pageIndex - 1);\n      page.translate3dY -= pageDiff * _constant.stepHeight;\n      _utils2.default.translate(sectionContent, page.translate3dY, 'y');\n      page.isScrolling = true;\n      page.nowPage = pageIndex;\n      nowSection.classList.add('active');\n\n      if (typeof options.afterLoad === 'function') {\n        options.pageSpeed = options.pageSpeed ? 500 : options.pageSpeed;\n        setTimeout(function () {\n          /**\n           * nowSection 函数内部 this 指向，载入后的 section\n           * pageIndex 载入后的 index\n           */\n          options.afterLoad.call(nowSection, pageIndex);\n        }, options.pageSpeed);\n      }\n      return true;\n    } else {\n      return false;\n    }\n  },\n  /**\n   * Scroll to a specified slide.\n   * @param slideIndex {number} The slide index you want scroll to.\n   * @returns {boolean}\n   */\n  scrollSlide: function scrollSlide(slideIndex) {\n    // 获取slide包裹层\n    var slideWrap = _utils2.default.$$('.fp-slide-wrap', sections[page.nowPage - 1])[0];\n\n    if (!slideWrap) {\n      console.log('This page has no slide');\n      return false;\n    }\n\n    // 当前页面下所有的slide\n    var slide = sections[page.nowPage - 1].querySelectorAll('.fp-slide');\n\n    // 当前页面上存储的数据\n    var slideData = slideWrap.dataset;\n\n    // 当前页面上slide的index\n    var slideNowIndex = parseInt(slideData.index, 10);\n\n    // 当前页面上slide的x轴偏移值\n    var slideX = slideData.x;\n\n    var slideDiff = slideIndex - slideNowIndex;\n\n    if (slideIndex >= 1 && slideIndex <= slide.length && !page.isScrolling) {\n      if (typeof options.beforeSlideLeave === 'function') {\n        /**\n         * leaveSlide           函数内部 this 指向，将要离开的 slide\n         * page.nowPage         将要离开 section 的 index\n         * slideNowIndex        将要离开 slide 的 index\n         * slideIndex           将要载入 slide 的 index\n         */\n        options.beforeSlideLeave.call(slide[slideNowIndex - 1], page.nowPage, slideNowIndex, slideIndex);\n      }\n\n      slide[slideNowIndex - 1].classList.remove('active');\n      slideX -= slideDiff * _constant.stepWidth;\n      _utils2.default.translate(slideWrap, slideX, 'x');\n      page.isScrolling = true;\n      slideData.x = slideX;\n      slideData.index = slideIndex;\n      slide[slideIndex - 1].classList.add('active');\n\n      if (typeof options.afterSlideLoad === 'function') {\n        options.pageSpeed = options.pageSpeed ? 500 : options.pageSpeed;\n        setTimeout(function () {\n          /**\n           * nowSection 函数内部 this 指向，载入后的 section\n           * pageIndex 载入后的 index\n           */\n          options.afterSlideLoad.call(slide[slideIndex - 1], page.nowPage, slideIndex);\n        }, options.pageSpeed);\n      }\n      return true;\n    }\n    return false;\n  },\n  /**\n   * Scroll to a specified section and slide.\n   * @param pageIndex {number}\n   * @param slideIndex {number}\n   * @returns {boolean}\n   */\n  moveTo: function moveTo(pageIndex, slideIndex) {\n    // DONE move to a specify section or slide\n    if (page.scrollPage(pageIndex)) {\n      if (slideIndex) {\n        // DONE move to a specify slide\n        return !!page.scrollSlide(slideIndex);\n      }\n      return true;\n    } else {\n      return false;\n    }\n  },\n  move: {\n    next: function next(callback) {\n      if (page.scrollPage(page.nowPage + 1)) {\n        var arg = Array.prototype.slice.call(arguments, 1);\n\n        if (typeof callback === 'function') {\n          callback(arg);\n        }\n        return true;\n      } else if (options.loopSection) {\n        page.moveTo(1);\n\n        return true;\n      } else {\n        return false;\n      }\n    },\n    pre: function pre(callback) {\n      if (page.scrollPage(page.nowPage - 1)) {\n        var arg = Array.prototype.slice.call(arguments, 1);\n\n        if (typeof callback === 'function') {\n          callback(arg);\n        }\n        return true;\n      } else {\n        return false;\n      }\n    }\n  },\n  slide: {\n    /**\n     * slide move 方法，移动到上一个或下一个 slide\n     * @param {string} direction 要移动的方向，next 为下一个， pre 为上一个\n     * @returns {boolean}\n     */\n    move: function move(direction) {\n      var slideWrap = _utils2.default.$$('.fp-slide-wrap', sections[page.nowPage - 1])[0];\n      var slide = sections[page.nowPage - 1].querySelectorAll('.fp-slide');\n      // slideNowIndexChange slideNowIndex 将要的变化\n      var slideNowIndexChange = undefined;\n      // slideWillBe 将要滚到slide的index\n      var slideWillBe = undefined;\n      if (direction === 'next') {\n        slideNowIndexChange = 1;\n        slideWillBe = 1;\n      } else {\n        slideNowIndexChange = -1;\n        slideWillBe = slide.length;\n      }\n      if (!slideWrap) {\n        return false;\n      } else {\n        var slideData = slideWrap.dataset;\n        var slideNowIndex = parseInt(slideData.index, 10);\n\n        if (page.scrollSlide(slideNowIndex + slideNowIndexChange)) {\n          slideData.index = slideNowIndex + slideNowIndexChange;\n          return true;\n        } else if (options.loopSlide && page.scrollSlide(slideWillBe)) {\n          slideData.index = slideWillBe;\n          return true;\n        }\n        return false;\n      }\n    },\n    next: function next() {\n      this.move('next');\n    },\n    pre: function pre() {\n      this.move('pre');\n    }\n  }\n};\n\nexports.bootstrap = bootstrap;\nexports.page = page;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./src/bootstrap.js\n ** module id = 1\n ** module chunks = 0\n **/\n//# sourceURL=webpack:///./src/bootstrap.js?")},function(module,exports){eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nvar utils = {\n  $$: function $$(el, parent) {\n    if (!parent) {\n      return document.querySelectorAll(el);\n    } else {\n      return parent.querySelectorAll(el);\n    }\n  },\n  setCss: function setCss(el, props) {\n    var prop = undefined;\n    for (prop in props) {\n      if (props.hasOwnProperty(prop)) {\n        el.style[prop] = props[prop];\n      }\n    }\n    return el;\n  },\n  translate: function translate(el, value, direction) {\n    if (direction === 'y') {\n      this.setCss(el, {\n        'transform': 'translate3d(0,' + value + 'px,0)',\n        '-webkit-transform': 'translate3d(0,' + value + 'px,0)'\n      });\n      // console.log('setAttr Done')\n    } else if (direction === 'x') {\n        this.setCss(el, {\n          'transform': 'translate3d(' + value + 'px,0,0)',\n          '-webkit-transform': 'translate3d(' + value + 'px,0,0)'\n        });\n      }\n  },\n\n  /**\n   * 只给一组元素中的某一个元素添加class\n   * @param els 一组元素\n   * @param theOne 要添加元素的index值\n   */\n  addClassToOneEle: function addClassToOneEle(els, theOne) {\n    for (var j = els.length - 1; j >= 0; j--) {\n      els[j].classList.remove('active');\n    }\n    els[theOne].classList.add('active');\n  },\n\n  transitionEvent: whichTransitionEvent()\n\n};\n\nfunction whichTransitionEvent() {\n  var t = undefined;\n  var el = document.createElement('fakeelement');\n  var transitions = {\n    'transition': 'transitionend',\n    'OTransition': 'oTransitionEnd',\n    'MozTransition': 'transitionend',\n    'WebkitTransition': 'webkitTransitionEnd',\n    'MsTransition': 'msTransitionEnd'\n  };\n\n  for (t in transitions) {\n    if (el.style[t] !== undefined) {\n      return transitions[t];\n    }\n  }\n}\n\nexports.default = Object.create(utils);\n\n/*****************\n ** WEBPACK FOOTER\n ** ./src/utils.js\n ** module id = 2\n ** module chunks = 0\n **/\n//# sourceURL=webpack:///./src/utils.js?")},function(module,exports,__webpack_require__){eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.defaults = exports.stepWidth = exports.stepHeight = undefined;\n\nvar _utils = __webpack_require__(2);\n\nvar _utils2 = _interopRequireDefault(_utils);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nvar stepHeight = _utils2.default.$$('body')[0].scrollHeight;\nvar stepWidth = _utils2.default.$$('body')[0].scrollWidth;\nvar defaults = {\n  threshold: 50, // 触发滚动事件的阈值，越小越灵敏\n  pageSpeed: 500, // 滚屏速度，单位为毫秒 ms\n  autoScroll: 0, // 自动播放事件间隔，如果为 0 则不自动播放\n  loopSection: true, // Section循环滚动\n  loopSlide: true, // Slide循环滑动\n  afterLoad: null, // 页面载入事件\n  beforeLeave: null, // 页面离开事件\n  afterSlideLoad: null, // slide 载入事件\n  beforeSlideLeave: null // slide 离开事件\n};\n\nexports.stepHeight = stepHeight;\nexports.stepWidth = stepWidth;\nexports.defaults = defaults;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./src/constant.js\n ** module id = 3\n ** module chunks = 0\n **/\n//# sourceURL=webpack:///./src/constant.js?")},function(module,exports){eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nfunction bindEvent(options, page) {\n  var Events = [];\n\n  /**\n   * 绑定触摸事件\n   */\n  function bindTouchMove() {\n    var startPos = {};\n    var movePos = {};\n    var diffX = undefined;\n    var diffY = undefined;\n    var touch = undefined;\n    var onceTouch = false; //  判断是否为一次触摸，保证一次触摸只触发一次事件\n\n    var threshold = options.threshold; //  阈值,灵敏度，越小越灵敏\n    var isVertical = undefined; //  是否为垂直滚动事件\n\n    function touchstartHandle(event) {\n      //  onceTouch首先置为true，表明开始了一次触摸\n      onceTouch = true;\n      //  初始化 x,y 值，防止点击一次后出现假 move 事件\n      startPos = {};\n      if (event.target.tagName.toLowerCase() !== 'a') {\n        event.preventDefault();\n      }\n      touch = event.touches[0];\n      startPos.x = touch.pageX;\n      startPos.y = touch.pageY;\n    }\n\n    function touchmoveHandle(event) {\n      event.preventDefault();\n      touch = event.touches[0];\n      movePos.x = touch.pageX;\n      movePos.y = touch.pageY;\n      diffX = startPos.x - movePos.x;\n      diffY = startPos.y - movePos.y;\n\n      // 如果页面正在滚动或者不是一次滚动事件，则直接return掉\n      if (page.isScrolling || !onceTouch) {\n        return false;\n      }\n\n      isVertical = Math.abs(diffX) - Math.abs(diffY) <= 0;\n      // 如果diff大于阈值，则事件触发，将onceTouch置为false\n      onceTouch = Math.max(diffX, diffY) <= threshold;\n      if (!isVertical) {\n        if (diffX > threshold) {\n          // Move to left\n          page.slide.next();\n        } else if (diffX < -threshold) {\n          // Move to right\n          page.slide.pre();\n        }\n      } else {\n        // isVertical = true\n        if (diffY > threshold) {\n          // Move to top\n          page.move.next();\n        } else if (diffY < -threshold) {\n          // Move to bottom\n          page.move.pre();\n        }\n      }\n    }\n\n    function touchendHandle(event) {\n      if (event.target.tagName.toLowerCase() !== 'a') {\n        event.preventDefault();\n      }\n      // 重置onceTouch为true\n      onceTouch = true;\n    }\n\n    document.addEventListener('touchstart', touchstartHandle, false);\n\n    document.addEventListener('touchmove', touchmoveHandle, false);\n\n    document.addEventListener('touchend', touchendHandle, false);\n  }\n\n  /**\n   * 绑定鼠标滚动事件\n   */\n  function bindMouseWheel() {\n    // FIXME change the way binding event.\n    var type = undefined;\n    var deltaY = undefined;\n\n    if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {\n      type = 'DOMMouseScroll';\n    } else {\n      type = 'mousewheel';\n    }\n\n    function mouseWheelHandle(event) {\n      if (page.isScrolling) {\n        return false;\n      }\n      deltaY = event.detail || -event.wheelDelta || event.deltaY;\n      if (deltaY > 0) {\n        page.move.next();\n        // console.log('next')\n      } else if (deltaY < 0) {\n          page.move.pre();\n          // console.log('pre')\n        }\n    }\n\n    document.addEventListener(type, mouseWheelHandle, false);\n  }\n\n  /**\n   * 绑定键盘事件\n   */\n  function bindKeyboard() {\n    function keyboardHandle(event) {\n      var key = event.keyCode || event.which;\n      switch (key) {\n        case 37:\n          page.slide.pre();\n          break;\n        case 38:\n          page.move.pre();\n          break;\n        case 39:\n          page.slide.next();\n          break;\n        case 40:\n          page.move.next();\n          break;\n      }\n    }\n\n    document.addEventListener('keydown', keyboardHandle, false);\n  }\n\n  Events.push(bindTouchMove, bindKeyboard, bindMouseWheel);\n\n  Events.forEach(function (now) {\n    now();\n  });\n}\n\nexports.default = bindEvent;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./src/events.js\n ** module id = 4\n ** module chunks = 0\n **/\n//# sourceURL=webpack:///./src/events.js?")}])}}]);