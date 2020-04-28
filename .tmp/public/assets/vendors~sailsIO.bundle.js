(window.webpackJsonp=window.webpackJsonp||[]).push([[57],{905:function(e,t,o){var n;!function(){var o=["useCORSRouteToGetCookie","url","multiplex","transports","query","path","headers","initialConnectionHeaders","reconnection","reconnectionAttempts","reconnectionDelay","reconnectionDelayMax","rejectUnauthorized","randomizationFactor","timeout"],r=["autoConnect","reconnection","environment","headers","url","transports","path"],i="__sails_io_sdk_version",s="__sails_io_sdk_platform",a="__sails_io_sdk_language",c={version:"1.2.1",language:"javascript",platform:void 0!==e.exports?"node":"browser"};c.versionString=i+"="+c.version+"&"+s+"="+c.platform+"&"+a+"="+c.language;var u=function(){if("object"!=typeof window||"object"!=typeof window.document||"function"!=typeof window.document.getElementsByTagName)return null;var e=window.document.getElementsByTagName("script");return e[e.length-1]}(),d="",l={};if(u){if(d=u.src,r.forEach(function(e){l[e]=function(){var t=u.getAttribute("data-"+e);if(t||(t=u.getAttribute(e)),"string"!=typeof t){if(null===t)return;throw new Error("sails.io.js :: Unexpected/invalid script tag configuration for `"+e+"`: `"+t+"` (a `"+typeof t+"`). Should be a string.")}try{return JSON.parse(t)}catch(e){return t}}(),void 0===l[e]&&delete l[e]}),void 0!==l.autoConnect)if(""===l.autoConnect)l.autoConnect=!0;else if("boolean"!=typeof l.autoConnect)throw new Error("sails.io.js :: Unexpected/invalid configuration for `autoConnect` provided in script tag: `"+l.autoConnect+"` (a `"+typeof l.autoConnect+"`). Should be a boolean.");if(void 0!==l.environment&&"string"!=typeof l.environment)throw new Error("sails.io.js :: Unexpected/invalid configuration for `environment` provided in script tag: `"+l.environment+"` (a `"+typeof l.environment+"`). Should be a string.");if(void 0!==l.headers&&("object"!=typeof l.headers||Array.isArray(l.headers)))throw new Error("sails.io.js :: Unexpected/invalid configuration for `headers` provided in script tag: `"+l.headers+"` (a `"+typeof l.headers+'`). Should be a JSON-compatible dictionary (i.e. `{}`).  Don\'t forget those double quotes (""), even on key names!  Use single quotes (\'\') to wrap the HTML attribute value; e.g. `headers=\'{"X-Auth": "foo"}\'`');if(void 0!==l.url&&"string"!=typeof l.url)throw new Error("sails.io.js :: Unexpected/invalid configuration for `url` provided in script tag: `"+l.url+"` (a `"+typeof l.url+"`). Should be a string.")}var p="undefined"!=typeof io?io:void 0;function h(e){var t;if(!(t=e||p))throw"node"===c.platform?new Error("No socket.io client available.  When requiring `sails.io.js` from Node.js, a socket.io client (`io`) must be passed in; e.g.:\n```\nvar io = require('sails.io.js')( require('socket.io-client') )\n```\n(see https://github.com/balderdashy/sails.io.js/tree/master/test for more examples)"):new Error("The Sails socket SDK depends on the socket.io client, but the socket.io global (`io`) was not available when `sails.io.js` loaded.  Normally, the socket.io client code is bundled with sails.io.js, so something is a little off.  Please check to be sure this version of `sails.io.js` has the minified Socket.io client at the top of the file.");if(t.sails)throw"node"===c.platform?new Error("The provided socket.io client (`io`) has already been augmented into a Sails socket SDK instance (it has `io.sails`)."):new Error("The socket.io client (`io`) has already been augmented into a Sails socket SDK instance.  Usually, this means you are bringing `sails.io.js` onto the page more than once.");function n(e){return e=e||{prefix:!0},"object"!=typeof console||"function"!=typeof console.log||"function"!=typeof console.log.bind?function(){}:function(){var o=Array.prototype.slice.call(arguments);if("production"!==t.sails.environment){e.prefix&&o.unshift(""),console.log.bind(console).apply(this,o)}}}var i=n();function s(e){var t=e.requestQueue;if(t){for(var o in t){if({}.hasOwnProperty.call(t,o)){var n=t[o];e.request.apply(e,n)}}e.requestQueue=null}}function a(e){var t;(this.body=e.body,this.headers=e.headers||{},this.statusCode=void 0===e.statusCode?200:e.statusCode,this.statusCode<200||this.statusCode>=400)&&(0===this.statusCode?t="The socket request failed.":(t="Server responded with a "+this.statusCode+" status code",t+=":\n```\n"+JSON.stringify(this.body,null,2)+"\n```"),this.error=new Error(t))}function u(e){var n=this;e=e||{},n._isConnecting=!1,n._mightBeAboutToAutoConnect=!1;var r={};o.forEach(function(e){"headers"!=e&&Object.defineProperty(n,e,{get:function(){return"url"==e?r[e]||n._raw&&n._raw.io&&n._raw.io.uri:r[e]},set:function(o){if(n.isConnected()&&!1!==t.sails.strict&&o!=r[e])throw new Error("Cannot change value of `"+e+"` while socket is connected.");n._raw&&n._raw.io&&n._raw.io.reconnecting&&!n._raw.io.skipReconnect&&(n._raw.io.skipReconnect=!0,i("Stopping reconnect; use .reconnect() to connect socket after changing options.")),r[e]=o}})}),o.forEach(function(t){n[t]=e[t]}),n.eventQueue={},n.on("sails:parseError",function(e){i("Sails encountered an error parsing a socket message sent from this client, and did not have access to a callback function to respond with."),i("Error details:",e)})}return i.noPrefix=n({prefix:!1}),a.prototype.toString=function(){return"[ResponseFromSails]  -- Status: "+this.statusCode+"  -- Headers: "+this.headers+"  -- Body: "+this.body},a.prototype.toPOJO=function(){return{body:this.body,headers:this.headers,statusCode:this.statusCode}},a.prototype.pipe=function(){return new Error("Client-side streaming support not implemented yet.")},u.prototype._connect=function(){var e=this;if(e._isConnecting=!0,o.forEach(function(o){void 0===e[o]&&(e[o]=t.sails[o])}),e.extraHeaders=e.initialConnectionHeaders||{},e.transportOptions=e.transportOptions||{},e.transports.forEach(function(t){e.transportOptions[t]=e.transportOptions[t]||{},e.transportOptions[t].extraHeaders=e.initialConnectionHeaders||{}}),(e.initialConnectionHeaders&&"node"!==c.platform&&-1===e.transports.indexOf("polling")||e.transports.length>1)&&"object"==typeof console&&"function"==typeof console.warn&&console.warn("When running in browser, `initialConnectionHeaders` option is only available for the `polling` transport."),e.url=e.url?e.url.replace(/(\/)$/,""):void 0,"string"==typeof e.query)e.query=e.query.replace(/^\?/,""),e.query+="&"+c.versionString;else{if(e.query&&"object"==typeof e.query)throw new Error("`query` setting does not currently support configuration as a dictionary (`{}`).  Instead, it must be specified as a string like `foo=89&bar=hi`");if(e.query)throw new Error("Unexpected data type provided for `query` setting: "+e.query);e.query=c.versionString}var n=function(){if("undefined"==typeof window||void 0===window.location)return!1;if("string"!=typeof e.url)return!1;var t=function(){try{t=e.url.match(/^([a-z]+:\/\/)/i)[1].toLowerCase()}catch(e){}return t=t||"http://"}(),o=!!e.url.match("^https"),n=function(){try{return e.url.match(/^[a-z]+:\/\/[^:]*:([0-9]*)/i)[1]}catch(e){}return o?"443":"80"}(),r=e.url.replace(/^([a-z]+:\/\/)/i,"");if(t.replace(/[:\/]/g,"")!==window.location.protocol.replace(/[:\/]/g,""))return!0;if(!(0===r.search(window.location.hostname)))return!0;var i=window.location.protocol.match(/https/i);return n!==(window.location.port+""||(i?"443":"80"))}();!function(t){if(!e.useCORSRouteToGetCookie||!n)return t();var o=e.url;"string"==typeof e.useCORSRouteToGetCookie?o+=e.useCORSRouteToGetCookie:o+="/__getcookie",function(e,t){if(e=e||{},"undefined"==typeof window)return t();var o=document.createElement("script");window._sailsIoJSConnect=function(e){o&&o.parentNode&&o.parentNode.removeChild(o),t(e)},o.src=e.url,document.getElementsByTagName("head")[0].appendChild(o)}({url:o,method:"GET"},t)}(function(){e._raw=t(e.url,e),e._raw.io.engine.transport.on("error",function(t){e._isConnecting&&(e._isConnecting=!1,e.connectionErrorTimestamp=(new Date).getTime(),i("===================================="),i("The socket was unable to connect."),i("The server may be offline, or the"),i("socket may have failed authorization"),i("based on its origin or other factors."),i("You may want to check the values of"),i("`sails.config.sockets.onlyAllowOrigins`"),i("or (more rarely) `sails.config.sockets.beforeConnect`"),i("in your app."),i("More info: https://sailsjs.com/config/sockets"),i("For help: https://sailsjs.com/support"),i(""),i("Technical details:"),i(t),i("===================================="))}),e.replay(),e.on("connect",function(){e._isConnecting=!1,i.noPrefix("\n\n  |>    Now connected to "+(e.url?e.url:"Sails")+".\n\\___/   For help, see: http://bit.ly/2q0QDpf\n        (using sails.io.js "+t.sails.sdk.platform+" SDK @v"+t.sails.sdk.version+")\n         Connected at: "+new Date+"\n\n\n")}),e.on("disconnect",function(){e.connectionLostTimestamp=(new Date).getTime();var t=[].concat(e._responseCbs||[]);e._responseCbs=[];var o=[].concat(e._requestCtxs||[]);e._requestCtxs=[],t.length&&t.forEach(function(e){e(new Error("The socket disconnected before the request completed."),{body:null,statusCode:0,headers:{}})}),o.length&&o.forEach(function(e){e.calledCb=!0}),i("===================================="),i("Socket was disconnected from Sails."),i("Usually, this is due to one of the following reasons:\n -> the server "+(e.url?e.url+" ":"")+"was taken down\n -> your browser lost internet connectivity"),i("====================================")}),e.on("reconnecting",function(t){i("\n        Socket is trying to reconnect to "+(e.url?e.url:"Sails")+"...\n_-|>_-  (attempt #"+t+")\n\n")}),e.on("reconnect",function(t,o){var n;e._isConnecting||e.on("connect",s.bind(e,e)),e.connectionLostTimestamp?n=((new Date).getTime()-e.connectionLostTimestamp)/1e3:e.connectionErrorTimestamp?n=((new Date).getTime()-e.connectionErrorTimestamp)/1e3:("???",n="???"),i("\n  |>    Socket reconnected successfully after\n\\___/   being offline at least "+n+" seconds.\n\n")}),e.on("error",function(t){e._isConnecting=!1,i("Failed to connect socket (possibly due to failed `beforeConnect` on server)","Error:",t)})})},u.prototype.reconnect=function(){if(this._isConnecting)throw new Error("Cannot connect- socket is already connecting");if(this.isConnected())throw new Error("Cannot connect- socket is already connected");return this._connect()},u.prototype.disconnect=function(){if(this._isConnecting=!1,!this.isConnected())throw new Error("Cannot disconnect- socket is already disconnected");return this._raw.disconnect()},u.prototype.isConnected=function(){return!!this._raw&&!!this._raw.connected},u.prototype.isConnecting=function(){return this._isConnecting},u.prototype.mightBeAboutToAutoConnect=function(){return this._mightBeAboutToAutoConnect},u.prototype.replay=function(){for(var e in this.eventQueue)for(var t in this.eventQueue[e])this._raw.on(e,this.eventQueue[e][t]);return this.isConnected()?s(this):this._raw.once("connect",s.bind(this,this)),this},u.prototype.on=function(e,t){return this._raw?(this._raw.on(e,t),this):(this.eventQueue[e]?this.eventQueue[e].push(t):this.eventQueue[e]=[t],this)},u.prototype.off=function(e,t){return this._raw?(this._raw.off(e,t),this):(this.eventQueue[e]&&this.eventQueue[e].indexOf(t)>-1&&this.eventQueue[e].splice(this.eventQueue[e].indexOf(t),1),this)},u.prototype.removeAllListeners=function(){return this._raw?(this._raw.removeAllListeners(),this):(this.eventQueue={},this)},u.prototype.get=function(e,t,o){return"function"==typeof t&&(o=t,t={}),this.request({method:"get",params:t,url:e},o)},u.prototype.post=function(e,t,o){return"function"==typeof t&&(o=t,t={}),this.request({method:"post",data:t,url:e},o)},u.prototype.put=function(e,t,o){return"function"==typeof t&&(o=t,t={}),this.request({method:"put",params:t,url:e},o)},u.prototype.patch=function(e,t,o){return"function"==typeof t&&(o=t,t={}),this.request({method:"patch",params:t,url:e},o)},u.prototype.delete=function(e,t,o){return"function"==typeof t&&(o=t,t={}),this.request({method:"delete",params:t,url:e},o)},u.prototype.request=function(e,t){var o='Usage:\nsocket.request( options, [fnToCallWhenComplete] )\n\noptions.url :: e.g. "/foo/bar"\noptions.method :: e.g. "get", "post", "put", or "delete", etc.\noptions.params :: e.g. { emailAddress: "mike@example.com" }\noptions.headers :: e.g. { "x-my-custom-header": "some string" }';if(void 0!==t&&"function"!=typeof t)throw new Error("Invalid callback function!\n"+o);if("object"!=typeof e||"string"!=typeof e.url)throw new Error("Invalid or missing URL!\n"+o);if(e.method&&"string"!=typeof e.method)throw new Error('Invalid `method` provided (should be a string like "post" or "put")\n'+o);if(e.headers&&"object"!=typeof e.headers)throw new Error("Invalid `headers` provided (should be a dictionary with string values)\n"+o);if(e.params&&"object"!=typeof e.params)throw new Error("Invalid `params` provided (should be a dictionary with JSON-serializable values)\n"+o);if(e.data&&"object"!=typeof e.data)throw new Error("Invalid `data` provided (should be a dictionary with JSON-serializable values)\n"+o);if(e.data&&e.params)throw new Error("Cannot specify both `params` and `data`!  They are aliases of each other.\n"+o);if(e.data&&(e.params=e.data,delete e.data),!this.isConnected())return this.requestQueue=this.requestQueue||[],void this.requestQueue.push([e,t]);e.headers=e.headers||{};var n={method:(e.method||"get").toLowerCase(),headers:e.headers,data:e.params||e.data||{},url:e.url.replace(/^(.+)\/*\s*$/,"$1"),cb:t};if(this._responseCbs=this._responseCbs||[],this._requestCtxs=this._requestCtxs||[],t&&(this._responseCbs.push(t),this._requestCtxs.push(n)),this.headers&&"object"==typeof this.headers)for(var r in this.headers)e.headers.hasOwnProperty(r)||(e.headers[r]=this.headers[r]);!function(e,t){if(!e._raw)throw new Error("Failed to emit from socket- raw SIO socket is missing.");var o=t.cb;delete t.cb;var n=t.method;e._raw.emit(n,t,function(n){o&&!t.calledCb&&(o(n.body,new a(n)),t.calledCb=!0,e._responseCbs.splice(e._responseCbs.indexOf(o),1),e._requestCtxs.splice(e._requestCtxs.indexOf(t),1))})}(this,n)},u.prototype._request=function(e,t){throw new Error("`_request()` was a private API deprecated as of v0.11 of the sails.io.js client. Use `.request()` instead.")},t.sails={autoConnect:!0,reconnection:!1,useCORSRouteToGetCookie:!0,environment:d.match(/(\#production|\.min\.js)/g)||"object"==typeof window&&window&&"object"==typeof window.SAILS_LOCALS&&window.SAILS_LOCALS&&("staging"===window.SAILS_LOCALS._environment||"production"===window.SAILS_LOCALS._environment)?"production":"development",sdk:c,transports:["websocket"]},r.forEach(function(e){void 0!==l[e]&&(t.sails[e]=l[e])}),t.sails.connect=function(e,t){"object"==typeof e&&(t=e,e=null),(t=t||{}).url=e||t.url||void 0;var o=new u(t);return o._connect(),o},t.socket=new u,t.socket._mightBeAboutToAutoConnect=!0,setTimeout(function(){t.socket._mightBeAboutToAutoConnect=!1,!1!==t.sails.autoConnect&&!1!==t.sails.autoconnect?t.socket._connect():delete t.socket},0),t}"node"===c.platform?e.exports=h:void 0===(n=function(){return h}.apply(t,[]))||(e.exports=n)}()}}]);