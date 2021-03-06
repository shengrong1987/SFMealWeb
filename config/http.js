/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.http.html
 */
module.exports.http = {

  /****************************************************************************
   *                                                                           *
   * Express middleware to use for every Sails request. To add custom          *
   * middleware to the mix, add a function to the middleware config object and *
   * add its key to the "order" array. The $custom key is reserved for         *
   * backwards-compatibility with Sails v0.9.x apps that use the               *
   * `customMiddleware` config option.                                         *
   *                                                                           *
   ****************************************************************************/

  middleware: {

    /***************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP request. (the Sails *
     * router is invoked by the "router" middleware below.)                     *
     *                                                                          *
     ***************************************************************************/

    order: [
      'startRequestTimer',
      'removeSubDomain',
      'cookieParser',
      'session',
      'redirectToHttps',
      'bodyParser',
      'handleBodyParserError',
      'compress',
      'methodOverride',
      'poweredBy',
      '$custom',
      'router',
      // 'setLanguage',
      'www',
      'favicon',
      '404',
      '500'
    ],

    /****************************************************************************
     *                                                                           *
     * Example custom middleware; logs each request to the console.              *
     *                                                                           *
     ****************************************************************************/

    removeSubDomain : require('subdomain')({ base : process.env.BASE_URL, removeWWW : true }),

    setLanguage : function (req, res, next) {
      var gm_ua = req.headers['user-agent'].toLowerCase();
      if(gm_ua.match(/MicroMessenger/i) && gm_ua.match(/MicroMessenger/i)[0]==="micromessenger") {
        sails.hooks.i18n.setLocale('zh');
      }
      next();
    },

    redirectToHttps: function (req, res, next) {
      var reqParam = req;
      if(reqParam.headers){
        sails.log.verbose("visiting host: " + reqParam.headers.host);
      }
      if(process.env.NODE_ENV === 'production'){
        if((req.get('X-Forwarded-Proto') && req.get('X-Forwarded-Proto') !== 'https') && !req.isSocket) {
          res.redirect('https://' + req.get('Host') + req.url);
        }else{
          next();
        }
      }else{
        next();
      }
    },

    /***************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests. By    *
     * default as of v0.10, Sails uses                                          *
     * [skipper](http://github.com/balderdashy/skipper). See                    *
     * http://www.senchalabs.org/connect/multipart.html for other options.      *
     *                                                                          *
     ***************************************************************************/

    // bodyParser: require('skipper')

    // },

    /***************************************************************************
     *                                                                          *
     * The number of seconds to cache flat files on disk being served by        *
     * Express static middleware (by default, these files are in `.tmp/public`) *
     *                                                                          *
     * The HTTP static cache is only active in a 'production' environment,      *
     * since that's the only time Express will cache flat-files.                *
     *                                                                          *
     ***************************************************************************/

    cache: 31557600000,
    compress : require('compression')()
  }
};
