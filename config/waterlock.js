
/**
 * waterlock
 *
 * defines various options used by waterlock
 * for more informaiton checkout
 *
 * http://waterlock.ninja/documentation
 */

module.exports.waterlock = {

  // Base URL
  //
  // used by auth methods for callback URI's using oauth and for password
  // reset links.
  baseUrl:  process.env.NODE_ENV === 'production' ? process.env.BASE_URL : 'http://localhost:1337',

  pluralizeEndpoints: false,

  // Auth Method(s)
  //
  // this can be a single string, an object, or an array of objects for your
  // chosen auth method(s) you will need to see the individual module's README
  // file for more information on the attributes necessary. This is an example
  // of the local authentication method with password reset tokens disabled.
  authMethod: [
    {
      name: "waterlock-facebook-auth",
      appId: process.env.NODE_ENV === 'production' ? process.env.FB_PRODUCTION_ID : process.env.FB_TEST_ID,
      appSecret: process.env.NODE_ENV === 'production' ? process.env.FB_PRODUCTION_KEY : process.env.FB_TEST_KEY,
      fieldMap : {
        'email' : 'email',
        'name' : 'name',
        'gender' : 'gender',
        'picture' : 'picture',
        'age_range' : 'age_range',
        'location' : 'location',
        'hometown' : 'hometown'
      }
    },
    {
      name: 'waterlock-google-auth',
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_KEY,
      redirectUri : process.env.NODE_ENV === 'production' ? process.env.BASE_URL + '/auth/google_oauth2' : 'http://localhost:1337/auth/google_oauth2',
      allow: ['*'],
      fieldMap : {
        'firstname': 'given_name',
        'lastname': 'family_name',
        'gender': 'gender',
        'googleEmail' : 'email'
      }
    },
    {
      name:'waterlock-local-auth',
      passwordReset:{
        tokens: true,
        mail: {
          protocol: 'SMTP',
          options:{
            auth: {
              user: process.env.ADMIN_EMAIL,
              pass: process.env.ADMIN_EMAIL_PWD
            },
            service : 'gmail'
          },
          from: process.env.ADMIN_EMAIL,
          subject: 'Your password reset!',
          forwardUrl: '/auth/resetForm'
        },
        template:{
          file: 'views/emailTemplates/reset/html.jade',
          vars:{}
        }
      },
      createOnNotFound: false
    }
  ],

  // JSON Web Tokens
  //
  // this provides waterlock with basic information to build your tokens,
  // these tokens are used for authentication, password reset,
  // and anything else you can imagine
  jsonWebTokens:{

    // CHANGE THIS SECRET
    secret: 'this is my secret',
    expiry:{
      unit: 'days',
      length: '7'
    },
    audience: 'app name',
    subject: 'subject',

    // tracks jwt usage if set to true
    trackUsage: true,

    // if set to false will authenticate the
    // express session object and attach the
    // user to it during the hasJsonWebToken
    // middleware
    stateless: false,

    // set the name of the jwt token property
    // in the JSON response
    tokenProperty: 'token',

    // set the name of the expires property
    // in the JSON response
    expiresProperty: 'expires',

    // configure whether or not to include
    // the user in the respnse - this is useful if
    // JWT is the default response for succesfull login
    includeUserInJwtResponse: false
  },

  // Post Actions
  //
  // Lets waterlock know how to handle different login/logout
  // attempt outcomes.
  postActions:{

    // post login event
    login: {

      // This can be any one of the following
      //
      // url - 'http://example.com'
      // relativePath - '/blog/post'
      // obj - {controller: 'b  log', action: 'post'}
      // string - 'custom json response string'
      // default - 'default'
      // success: process.env.NODE_ENV === 'production' ? {controller : 'auth', action : 'done'} : 'default',
       success: {controller : 'auth', action : 'done'},

      // This can be any one of the following
      //
      // url - 'http://example.com'
      // relativePath - '/blog/post'
      // obj - {controller: 'blog', action: 'post'}
      // string - 'custom json response string'
      // default - 'default'
      failure: 'default'
    },

    //post logout event
    logout: {

      // This can be any one of the following
      //
      // url - 'http://example.com'
      // relativePath - '/blog/post'
      // obj - {controller: 'blog', action: 'post'}
      // string - 'custom json response string'
      // default - 'default'
      success: '/',

      // This can be any one of the following
      //
      // url - 'http://example.com'
      // relativePath - '/blog/post'
      // obj - {controller: 'blog', action: 'post'}
      // string - 'custom json response string'
      // default - 'default'
      failure: 'default'
    },
    // post register event
   register: {
     // This can be any one of the following
     //
     // url - 'http://example.com'
     // relativePath - '/blog/post'
     // obj - {controller: 'blog', action: 'post'}
     // string - 'custom json response string'
     // default - 'default'
     success: 'default',
     // This can be any one of the following
     //
     // url - 'http://example.com'
     // relativePath - '/blog/post'
     // obj - {controller: 'blog', action: 'post'}
     // string - 'custom json response string'
     // default - 'default'
     failure: 'default'
   }
  }
};
