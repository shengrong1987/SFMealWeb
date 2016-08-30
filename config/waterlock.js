
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
  baseUrl:  process.env.NODE_ENV === 'production' ? 'http://52.39.170.17:1337' : 'http://localhost:1337',

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
      appId: process.env.NODE_ENV === 'production' ? "556466254501032" : "602141733266817",
      appSecret: process.env.NODE_ENV === 'production' ? "02f7b4b026d9d2029c2f372f84cbc9ed" : "d0bda6a62210efa8483e9a8b10ce3aa8",
      fieldMap : {
        'email' : 'email',
        'username' : 'name'
      }
    },
    {
      name: 'waterlock-google-auth',
      clientId: '504050617477-f1ok77fo8dhogc9k5gososaovjqnk4u6.apps.googleusercontent.com',
      clientSecret: 'JbMmSyFjyHKMoKlox2VoXeJT',
      //redirectUri : 'http://localhost:1337/auth/google_oauth2',
      allow: ['*'],
      fieldMap : {
        email : 'email'
      }
    },
    {
      name:'waterlock-local-auth',
      passwordReset:{
        tokens: true,
        mail: {
          protocol: 'SMTP',
          options:{
            service: 'Gmail',
            auth: {
              user: 'aimbebe.r@gmail.com',
              pass: 'rs89030659'
            }
          },
          from: 'no-reply@domain.com',
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
