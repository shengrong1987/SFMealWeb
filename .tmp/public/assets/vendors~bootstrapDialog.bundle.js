(window.webpackJsonp=window.webpackJsonp||[]).push([[55],{846:function(t,e,o){var n,i;!function(a,s){"use strict";t.exports?t.exports.BootstrapDialog=s(o(7),o(23)):(n=[o(7),o(23)],void 0===(i=function(t){return s(t)}.apply(e,n))||(t.exports=i))}(window,function(t){"use strict";var e=t.fn.modal.Constructor,o=function(o,n){if(/4\.1\.\d+/.test(t.fn.modal.Constructor.VERSION))return new e(o,n);e.call(this,o,n)};o.getModalVersion=function(){return void 0===t.fn.modal.Constructor.VERSION?"v3.1":/3\.2\.\d+/.test(t.fn.modal.Constructor.VERSION)?"v3.2":/3\.3\.[1,2]/.test(t.fn.modal.Constructor.VERSION)?"v3.3":/4\.\d\.\d+/.test(t.fn.modal.Constructor.VERSION)?"v4.1":"v3.3.4"},o.ORIGINAL_BODY_PADDING=parseInt(t("body").css("padding-right")||0,10),(o.METHODS_TO_OVERRIDE={})["v3.1"]={},o.METHODS_TO_OVERRIDE["v3.2"]={hide:function(e){(e&&e.preventDefault(),e=t.Event("hide.bs.modal"),this.$element.trigger(e),this.isShown&&!e.isDefaultPrevented())&&(this.isShown=!1,0===this.getGlobalOpenedDialogs().length&&this.$body.removeClass("modal-open"),this.resetScrollbar(),this.escape(),t(document).off("focusin.bs.modal"),this.$element.removeClass("in").attr("aria-hidden",!0).off("click.dismiss.bs.modal"),t.support.transition&&this.$element.hasClass("fade")?this.$element.one("bsTransitionEnd",t.proxy(this.hideModal,this)).emulateTransitionEnd(300):this.hideModal())}},o.METHODS_TO_OVERRIDE["v3.3"]={setScrollbar:function(){var t=o.ORIGINAL_BODY_PADDING;this.bodyIsOverflowing&&this.$body.css("padding-right",t+this.scrollbarWidth)},resetScrollbar:function(){0===this.getGlobalOpenedDialogs().length&&this.$body.css("padding-right",o.ORIGINAL_BODY_PADDING)},hideModal:function(){this.$element.hide(),this.backdrop(t.proxy(function(){0===this.getGlobalOpenedDialogs().length&&this.$body.removeClass("modal-open"),this.resetAdjustments(),this.resetScrollbar(),this.$element.trigger("hidden.bs.modal")},this))}},o.METHODS_TO_OVERRIDE["v3.3.4"]=t.extend({},o.METHODS_TO_OVERRIDE["v3.3"]),o.METHODS_TO_OVERRIDE["v4.1"]=t.extend({},o.METHODS_TO_OVERRIDE["v3.3"]),o.prototype={constructor:o,getGlobalOpenedDialogs:function(){var e=[];return t.each(n.dialogs,function(t,o){o.isRealized()&&o.isOpened()&&e.push(o)}),e}},o.prototype=t.extend(o.prototype,e.prototype,o.METHODS_TO_OVERRIDE[o.getModalVersion()]);var n=function(e){this.defaultOptions=t.extend(!0,{id:n.newGuid(),buttons:[],data:{},onshow:null,onshown:null,onhide:null,onhidden:null},n.defaultOptions),this.indexedButtons={},this.registeredButtonHotkeys={},this.draggableData={isMouseDown:!1,mouseOffset:{}},this.realized=!1,this.opened=!1,this.initOptions(e),this.holdThisInstance()};return n.BootstrapDialogModal=o,n.NAMESPACE="bootstrap-dialog",n.TYPE_DEFAULT="type-default",n.TYPE_INFO="type-info",n.TYPE_PRIMARY="type-primary",n.TYPE_SECONDARY="type-secondary",n.TYPE_SUCCESS="type-success",n.TYPE_WARNING="type-warning",n.TYPE_DANGER="type-danger",n.TYPE_DARK="type-dark",n.TYPE_LIGHT="type-light",n.DEFAULT_TEXTS={},n.DEFAULT_TEXTS[n.TYPE_DEFAULT]="Default",n.DEFAULT_TEXTS[n.TYPE_INFO]="Information",n.DEFAULT_TEXTS[n.TYPE_PRIMARY]="Primary",n.DEFAULT_TEXTS[n.TYPE_SECONDARY]="Secondary",n.DEFAULT_TEXTS[n.TYPE_SUCCESS]="Success",n.DEFAULT_TEXTS[n.TYPE_WARNING]="Warning",n.DEFAULT_TEXTS[n.TYPE_DANGER]="Danger",n.DEFAULT_TEXTS[n.TYPE_DARK]="Dark",n.DEFAULT_TEXTS[n.TYPE_LIGHT]="Light",n.DEFAULT_TEXTS.OK="OK",n.DEFAULT_TEXTS.CANCEL="Cancel",n.DEFAULT_TEXTS.CONFIRM="Confirmation",n.SIZE_NORMAL="size-normal",n.SIZE_SMALL="size-small",n.SIZE_WIDE="size-wide",n.SIZE_EXTRAWIDE="size-extrawide",n.SIZE_LARGE="size-large",n.BUTTON_SIZES={},n.BUTTON_SIZES[n.SIZE_NORMAL]="",n.BUTTON_SIZES[n.SIZE_SMALL]="btn-small",n.BUTTON_SIZES[n.SIZE_WIDE]="btn-block",n.BUTTON_SIZES[n.SIZE_LARGE]="btn-lg",n.ICON_SPINNER="glyphicon glyphicon-asterisk",n.BUTTONS_ORDER_CANCEL_OK="btns-order-cancel-ok",n.BUTTONS_ORDER_OK_CANCEL="btns-order-ok-cancel",n.defaultOptions={type:n.TYPE_PRIMARY,size:n.SIZE_NORMAL,cssClass:"",title:null,message:null,nl2br:!0,closable:!0,closeByBackdrop:!0,closeByKeyboard:!0,closeIcon:"&#215;",spinicon:n.ICON_SPINNER,autodestroy:!0,draggable:!1,animate:!0,description:"",tabindex:-1,btnsOrder:n.BUTTONS_ORDER_CANCEL_OK},n.configDefaultOptions=function(e){n.defaultOptions=t.extend(!0,n.defaultOptions,e)},n.dialogs={},n.openAll=function(){t.each(n.dialogs,function(t,e){e.open()})},n.closeAll=function(){t.each(n.dialogs,function(t,e){e.close()})},n.getDialog=function(t){var e=null;return void 0!==n.dialogs[t]&&(e=n.dialogs[t]),e},n.setDialog=function(t){return n.dialogs[t.getId()]=t,t},n.addDialog=function(t){return n.setDialog(t)},n.moveFocus=function(){var e=null;t.each(n.dialogs,function(t,o){o.isRealized()&&o.isOpened()&&(e=o)}),null!==e&&e.getModal().focus()},n.METHODS_TO_OVERRIDE={},n.METHODS_TO_OVERRIDE["v3.1"]={handleModalBackdropEvent:function(){return this.getModal().on("click",{dialog:this},function(t){t.target===this&&t.data.dialog.isClosable()&&t.data.dialog.canCloseByBackdrop()&&t.data.dialog.close()}),this},updateZIndex:function(){if(this.isOpened()){var e=0;t.each(n.dialogs,function(t,o){o.isRealized()&&o.isOpened()&&e++});var o=this.getModal(),i=this.getModalBackdrop(o);o.css("z-index",1050+20*(e-1)),i.css("z-index",1040+20*(e-1))}return this},open:function(){return!this.isRealized()&&this.realize(),this.getModal().modal("show"),this.updateZIndex(),this}},n.METHODS_TO_OVERRIDE["v3.2"]={handleModalBackdropEvent:n.METHODS_TO_OVERRIDE["v3.1"].handleModalBackdropEvent,updateZIndex:n.METHODS_TO_OVERRIDE["v3.1"].updateZIndex,open:n.METHODS_TO_OVERRIDE["v3.1"].open},n.METHODS_TO_OVERRIDE["v3.3"]={},n.METHODS_TO_OVERRIDE["v3.3.4"]=t.extend({},n.METHODS_TO_OVERRIDE["v3.1"]),n.METHODS_TO_OVERRIDE["v4.0"]={getModalBackdrop:function(e){return t(e.data("bs.modal")._backdrop)},handleModalBackdropEvent:n.METHODS_TO_OVERRIDE["v3.1"].handleModalBackdropEvent,updateZIndex:n.METHODS_TO_OVERRIDE["v3.1"].updateZIndex,open:n.METHODS_TO_OVERRIDE["v3.1"].open,getModalForBootstrapDialogModal:function(){return this.getModal().get(0)}},n.METHODS_TO_OVERRIDE["v4.1"]={getModalBackdrop:function(e){return t(e.data("bs.modal")._backdrop)},handleModalBackdropEvent:n.METHODS_TO_OVERRIDE["v3.1"].handleModalBackdropEvent,updateZIndex:n.METHODS_TO_OVERRIDE["v3.1"].updateZIndex,open:n.METHODS_TO_OVERRIDE["v3.1"].open,getModalForBootstrapDialogModal:function(){return this.getModal().get(0)}},n.prototype={constructor:n,initOptions:function(e){return this.options=t.extend(!0,this.defaultOptions,e),this},holdThisInstance:function(){return n.addDialog(this),this},initModalStuff:function(){return this.setModal(this.createModal()).setModalDialog(this.createModalDialog()).setModalContent(this.createModalContent()).setModalHeader(this.createModalHeader()).setModalBody(this.createModalBody()).setModalFooter(this.createModalFooter()),this.getModal().append(this.getModalDialog()),this.getModalDialog().append(this.getModalContent()),this.getModalContent().append(this.getModalHeader()).append(this.getModalBody()).append(this.getModalFooter()),this},createModal:function(){var e=t('<div class="modal" role="dialog" aria-hidden="true"></div>');return e.prop("id",this.getId()),e.attr("aria-labelledby",this.getId()+"_title"),e},getModal:function(){return this.$modal},setModal:function(t){return this.$modal=t,this},getModalBackdrop:function(t){return t.data("bs.modal").$backdrop},getModalForBootstrapDialogModal:function(){return this.getModal()},createModalDialog:function(){return t('<div class="modal-dialog"></div>')},getModalDialog:function(){return this.$modalDialog},setModalDialog:function(t){return this.$modalDialog=t,this},createModalContent:function(){return t('<div class="modal-content"></div>')},getModalContent:function(){return this.$modalContent},setModalContent:function(t){return this.$modalContent=t,this},createModalHeader:function(){return t('<div class="modal-header"></div>')},getModalHeader:function(){return this.$modalHeader},setModalHeader:function(t){return this.$modalHeader=t,this},createModalBody:function(){return t('<div class="modal-body"></div>')},getModalBody:function(){return this.$modalBody},setModalBody:function(t){return this.$modalBody=t,this},createModalFooter:function(){return t('<div class="modal-footer"></div>')},getModalFooter:function(){return this.$modalFooter},setModalFooter:function(t){return this.$modalFooter=t,this},createDynamicContent:function(t){var e=null;return"string"==typeof(e="function"==typeof t?t.call(t,this):t)&&(e=this.formatStringContent(e)),e},formatStringContent:function(t){return this.options.nl2br?t.replace(/\r\n/g,"<br />").replace(/[\r\n]/g,"<br />"):t},setData:function(t,e){return this.options.data[t]=e,this},getData:function(t){return this.options.data[t]},setId:function(t){return this.options.id=t,this},getId:function(){return this.options.id},getType:function(){return this.options.type},setType:function(t){return this.options.type=t,this.updateType(),this},updateType:function(){if(this.isRealized()){var t=[n.TYPE_DEFAULT,n.TYPE_INFO,n.TYPE_PRIMARY,n.TYPE_SECONDARY,n.TYPE_SUCCESS,n.TYPE_WARNING,n.TYPE_DARK,n.TYPE_LIGHT,n.TYPE_DANGER];this.getModal().removeClass(t.join(" ")).addClass(this.getType())}return this},getSize:function(){return this.options.size},setSize:function(t){return this.options.size=t,this.updateSize(),this},updateSize:function(){if(this.isRealized()){var e=this;this.getModal().removeClass(n.SIZE_NORMAL).removeClass(n.SIZE_SMALL).removeClass(n.SIZE_WIDE).removeClass(n.SIZE_EXTRAWIDE).removeClass(n.SIZE_LARGE),this.getModal().addClass(this.getSize()),this.getModalDialog().removeClass("modal-sm"),this.getSize()===n.SIZE_SMALL&&this.getModalDialog().addClass("modal-sm"),this.getModalDialog().removeClass("modal-lg"),this.getSize()===n.SIZE_WIDE&&this.getModalDialog().addClass("modal-lg"),this.getModalDialog().removeClass("modal-xl"),this.getSize()===n.SIZE_EXTRAWIDE&&this.getModalDialog().addClass("modal-xl"),t.each(this.options.buttons,function(o,n){var i=e.getButton(n.id),a=["btn-lg","btn-sm","btn-xs"],s=!1;if("string"==typeof n.cssClass){var d=n.cssClass.split(" ");t.each(d,function(e,o){-1!==t.inArray(o,a)&&(s=!0)})}s||(i.removeClass(a.join(" ")),i.addClass(e.getButtonSize()))})}return this},getCssClass:function(){return this.options.cssClass},setCssClass:function(t){return this.options.cssClass=t,this},getTitle:function(){return this.options.title},setTitle:function(t){return this.options.title=t,this.updateTitle(),this},updateTitle:function(){if(this.isRealized()){var t=null!==this.getTitle()?this.createDynamicContent(this.getTitle()):this.getDefaultText();this.getModalHeader().find("."+this.getNamespace("title")).html("").append(t).prop("id",this.getId()+"_title")}return this},getMessage:function(){return this.options.message},setMessage:function(t){return this.options.message=t,this.updateMessage(),this},updateMessage:function(){if(this.isRealized()){var t=this.createDynamicContent(this.getMessage());this.getModalBody().find("."+this.getNamespace("message")).html("").append(t)}return this},isClosable:function(){return this.options.closable},setClosable:function(t){return this.options.closable=t,this.updateClosable(),this},setCloseByBackdrop:function(t){return this.options.closeByBackdrop=t,this},canCloseByBackdrop:function(){return this.options.closeByBackdrop},setCloseByKeyboard:function(t){return this.options.closeByKeyboard=t,this},canCloseByKeyboard:function(){return this.options.closeByKeyboard},isAnimate:function(){return this.options.animate},setAnimate:function(t){return this.options.animate=t,this},updateAnimate:function(){return this.isRealized()&&this.getModal().toggleClass("fade",this.isAnimate()),this},getSpinicon:function(){return this.options.spinicon},setSpinicon:function(t){return this.options.spinicon=t,this},addButton:function(t){return this.options.buttons.push(t),this},addButtons:function(e){var o=this;return t.each(e,function(t,e){o.addButton(e)}),this},getButtons:function(){return this.options.buttons},setButtons:function(t){return this.options.buttons=t,this.updateButtons(),this},getButton:function(t){return void 0!==this.indexedButtons[t]?this.indexedButtons[t]:null},getButtonSize:function(){return void 0!==n.BUTTON_SIZES[this.getSize()]?n.BUTTON_SIZES[this.getSize()]:""},updateButtons:function(){return this.isRealized()&&(0===this.getButtons().length?this.getModalFooter().hide():this.getModalFooter().show().find("."+this.getNamespace("footer")).html("").append(this.createFooterButtons())),this},isAutodestroy:function(){return this.options.autodestroy},setAutodestroy:function(t){this.options.autodestroy=t},getDescription:function(){return this.options.description},setDescription:function(t){return this.options.description=t,this},setTabindex:function(t){return this.options.tabindex=t,this},getTabindex:function(){return this.options.tabindex},updateTabindex:function(){return this.isRealized()&&this.getModal().attr("tabindex",this.getTabindex()),this},getDefaultText:function(){return n.DEFAULT_TEXTS[this.getType()]},getNamespace:function(t){return n.NAMESPACE+"-"+t},createHeaderContent:function(){var e=t("<div></div>");return e.addClass(this.getNamespace("header")),e.append(this.createTitleContent()),e.prepend(this.createCloseButton()),e},createTitleContent:function(){var e=t("<div></div>");return e.addClass(this.getNamespace("title")),e},createCloseButton:function(){var e=t("<div></div>");e.addClass(this.getNamespace("close-button"));var o=t('<button class="close" aria-label="close"></button>');return o.append(this.options.closeIcon),e.append(o),e.on("click",{dialog:this},function(t){t.data.dialog.close()}),e},createBodyContent:function(){var e=t("<div></div>");return e.addClass(this.getNamespace("body")),e.append(this.createMessageContent()),e},createMessageContent:function(){var e=t("<div></div>");return e.addClass(this.getNamespace("message")),e},createFooterContent:function(){var e=t("<div></div>");return e.addClass(this.getNamespace("footer")),e},createFooterButtons:function(){var e=this,o=t("<div></div>");return o.addClass(this.getNamespace("footer-buttons")),this.indexedButtons={},t.each(this.options.buttons,function(t,i){i.id||(i.id=n.newGuid());var a=e.createButton(i);e.indexedButtons[i.id]=a,o.append(a)}),o},createButton:function(e){var o=t('<button class="btn"></button>');return o.prop("id",e.id),o.data("button",e),void 0!==e.icon&&""!==t.trim(e.icon)&&o.append(this.createButtonIcon(e.icon)),void 0!==e.label&&o.append(e.label),void 0!==e.title&&o.attr("title",e.title),void 0!==e.cssClass&&""!==t.trim(e.cssClass)?o.addClass(e.cssClass):o.addClass("btn-default"),"object"==typeof e.data&&e.data.constructor==={}.constructor&&t.each(e.data,function(t,e){o.attr("data-"+t,e)}),void 0!==e.hotkey&&(this.registeredButtonHotkeys[e.hotkey]=o),o.on("click",{dialog:this,$button:o,button:e},function(t){var e=t.data.dialog,o=t.data.$button,n=o.data("button");if(n.autospin&&o.toggleSpin(!0),"function"==typeof n.action)return n.action.call(o,e,t)}),this.enhanceButton(o),void 0!==e.enabled&&o.toggleEnable(e.enabled),o},enhanceButton:function(t){return t.dialog=this,t.toggleEnable=function(t){return void 0!==t?this.prop("disabled",!t).toggleClass("disabled",!t):this.prop("disabled",!this.prop("disabled")),this},t.enable=function(){return this.toggleEnable(!0),this},t.disable=function(){return this.toggleEnable(!1),this},t.toggleSpin=function(e){var o=this.dialog,n=this.find("."+o.getNamespace("button-icon"));return void 0===e&&(e=!(t.find(".icon-spin").length>0)),e?(n.hide(),t.prepend(o.createButtonIcon(o.getSpinicon()).addClass("icon-spin"))):(n.show(),t.find(".icon-spin").remove()),this},t.spin=function(){return this.toggleSpin(!0),this},t.stopSpin=function(){return this.toggleSpin(!1),this},this},createButtonIcon:function(e){var o=t("<span></span>");return o.addClass(this.getNamespace("button-icon")).addClass(e),o},enableButtons:function(e){return t.each(this.indexedButtons,function(t,o){o.toggleEnable(e)}),this},updateClosable:function(){return this.isRealized()&&this.getModalHeader().find("."+this.getNamespace("close-button")).toggle(this.isClosable()),this},onShow:function(t){return this.options.onshow=t,this},onShown:function(t){return this.options.onshown=t,this},onHide:function(t){return this.options.onhide=t,this},onHidden:function(t){return this.options.onhidden=t,this},isRealized:function(){return this.realized},setRealized:function(t){return this.realized=t,this},isOpened:function(){return this.opened},setOpened:function(t){return this.opened=t,this},handleModalEvents:function(){return this.getModal().on("show.bs.modal",{dialog:this},function(t){var e=t.data.dialog;if(e.setOpened(!0),e.isModalEvent(t)&&"function"==typeof e.options.onshow){var o=e.options.onshow(e);return!1===o&&e.setOpened(!1),o}}),this.getModal().on("shown.bs.modal",{dialog:this},function(t){var e=t.data.dialog;e.isModalEvent(t)&&"function"==typeof e.options.onshown&&e.options.onshown(e)}),this.getModal().on("hide.bs.modal",{dialog:this},function(t){var e=t.data.dialog;if(e.setOpened(!1),e.isModalEvent(t)&&"function"==typeof e.options.onhide){var o=e.options.onhide(e);return!1===o&&e.setOpened(!0),o}}),this.getModal().on("hidden.bs.modal",{dialog:this},function(e){var o=e.data.dialog;o.isModalEvent(e)&&"function"==typeof o.options.onhidden&&o.options.onhidden(o),o.isAutodestroy()&&(o.setRealized(!1),delete n.dialogs[o.getId()],t(this).remove()),n.moveFocus(),t(".modal").hasClass("in")&&t("body").addClass("modal-open")}),this.handleModalBackdropEvent(),this.getModal().on("keyup",{dialog:this},function(t){27===t.which&&t.data.dialog.isClosable()&&t.data.dialog.canCloseByKeyboard()&&t.data.dialog.close()}),this.getModal().on("keyup",{dialog:this},function(e){var o=e.data.dialog;if(void 0!==o.registeredButtonHotkeys[e.which]){var n=t(o.registeredButtonHotkeys[e.which]);!n.prop("disabled")&&!n.is(":focus")&&n.focus().trigger("click")}}),this},handleModalBackdropEvent:function(){return this.getModal().on("click",{dialog:this},function(e){t(e.target).hasClass("modal-backdrop")&&e.data.dialog.isClosable()&&e.data.dialog.canCloseByBackdrop()&&e.data.dialog.close()}),this},isModalEvent:function(t){return void 0!==t.namespace&&"bs.modal"===t.namespace},makeModalDraggable:function(){return this.options.draggable&&(this.getModalHeader().addClass(this.getNamespace("draggable")).on("mousedown",{dialog:this},function(t){var e=t.data.dialog;e.draggableData.isMouseDown=!0;var o=e.getModalDialog().offset();e.draggableData.mouseOffset={top:t.clientY-o.top,left:t.clientX-o.left}}),this.getModal().on("mouseup mouseleave",{dialog:this},function(t){t.data.dialog.draggableData.isMouseDown=!1}),t("body").on("mousemove",{dialog:this},function(t){var e=t.data.dialog;e.draggableData.isMouseDown&&e.getModalDialog().offset({top:t.clientY-e.draggableData.mouseOffset.top,left:t.clientX-e.draggableData.mouseOffset.left})})),this},realize:function(){return this.initModalStuff(),this.getModal().addClass(n.NAMESPACE).addClass(this.getCssClass()),this.updateSize(),this.getDescription()&&this.getModal().attr("aria-describedby",this.getDescription()),this.getModalFooter().append(this.createFooterContent()),this.getModalHeader().append(this.createHeaderContent()),this.getModalBody().append(this.createBodyContent()),this.getModal().data("bs.modal",new o(this.getModalForBootstrapDialogModal(),{backdrop:"static",keyboard:!1,show:!1})),this.makeModalDraggable(),this.handleModalEvents(),this.setRealized(!0),this.updateButtons(),this.updateType(),this.updateTitle(),this.updateMessage(),this.updateClosable(),this.updateAnimate(),this.updateSize(),this.updateTabindex(),this},open:function(){return!this.isRealized()&&this.realize(),this.getModal().modal("show"),this},close:function(){return!this.isRealized()&&this.realize(),this.getModal().modal("hide"),this}},n.prototype=t.extend(n.prototype,n.METHODS_TO_OVERRIDE[o.getModalVersion()]),n.newGuid=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){var e=16*Math.random()|0;return("x"===t?e:3&e|8).toString(16)})},n.show=function(t){return new n(t).open()},n.alert=function(){var e={},o={type:n.TYPE_PRIMARY,title:null,message:null,closable:!1,draggable:!1,buttonLabel:n.DEFAULT_TEXTS.OK,buttonHotkey:null,callback:null};e="object"==typeof arguments[0]&&arguments[0].constructor==={}.constructor?t.extend(!0,o,arguments[0]):t.extend(!0,o,{message:arguments[0],callback:void 0!==arguments[1]?arguments[1]:null});var i=new n(e);return i.setData("callback",e.callback),i.addButton({label:e.buttonLabel,hotkey:e.buttonHotkey,action:function(t){return("function"!=typeof t.getData("callback")||!1!==t.getData("callback").call(this,!0))&&(t.setData("btnClicked",!0),t.close())}}),"function"==typeof i.options.onhide?i.onHide(function(t){var e=!0;return!t.getData("btnClicked")&&t.isClosable()&&"function"==typeof t.getData("callback")&&(e=t.getData("callback")(!1)),!1!==e&&(e=this.onhide(t))}.bind({onhide:i.options.onhide})):i.onHide(function(t){var e=!0;return!t.getData("btnClicked")&&t.isClosable()&&"function"==typeof t.getData("callback")&&(e=t.getData("callback")(!1)),e}),i.open()},n.confirm=function(){var e={},o={type:n.TYPE_PRIMARY,title:null,message:null,closable:!1,draggable:!1,btnCancelLabel:n.DEFAULT_TEXTS.CANCEL,btnCancelClass:null,btnCancelHotkey:null,btnOKLabel:n.DEFAULT_TEXTS.OK,btnOKClass:null,btnOKHotkey:null,btnsOrder:n.defaultOptions.btnsOrder,callback:null};null===(e="object"==typeof arguments[0]&&arguments[0].constructor==={}.constructor?t.extend(!0,o,arguments[0]):t.extend(!0,o,{message:arguments[0],callback:void 0!==arguments[1]?arguments[1]:null})).btnOKClass&&(e.btnOKClass=["btn",e.type.split("-")[1]].join("-"));var i=new n(e);i.setData("callback",e.callback);var a=[{label:e.btnCancelLabel,cssClass:e.btnCancelClass,hotkey:e.btnCancelHotkey,action:function(t){return("function"!=typeof t.getData("callback")||!1!==t.getData("callback").call(this,!1))&&t.close()}},{label:e.btnOKLabel,cssClass:e.btnOKClass,hotkey:e.btnOKHotkey,action:function(t){return("function"!=typeof t.getData("callback")||!1!==t.getData("callback").call(this,!0))&&t.close()}}];return e.btnsOrder===n.BUTTONS_ORDER_OK_CANCEL&&a.reverse(),i.addButtons(a),i.open()},n.warning=function(t,e){return new n({type:n.TYPE_WARNING,message:t}).open()},n.danger=function(t,e){return new n({type:n.TYPE_DANGER,message:t}).open()},n.success=function(t,e){return new n({type:n.TYPE_SUCCESS,message:t}).open()},n})}}]);