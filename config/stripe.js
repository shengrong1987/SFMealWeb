/**
 * Created by shengrong on 12/15/15.
 */
var config = {};

// secret key (update in production as an env variable!!!)
//config.secretKey = "sk_test_SK41ektWZVeEs6dcrw32Qn4Z";

// stripe keys
// Add as env variables
// export "stripePublishableKey=pk_test_GET_YOUR_OWN"
// export "githubClientSecret=sk_test_GET_YOUR_OWN"
config.StripeKeys = {
  publishableKey: "pk_test_ztZDHzxIInBmBRrkuEKBee8G",
  secretKey: "sk_test_SK41ektWZVeEs6dcrw32Qn4Z"
  // publishableKey: "sk_live_MfM8kqdPNs2JvzqIy52tEuxk",
  // secretKey: "pk_live_AUWn3rb2SLc92lXsocPCDUcw"
};

config.TwilioKeys = {
    sid : 'ACa4db80bc98379abaea2ab0bdebe42a0a',
    token : '51ec952b53bc76bb4d8bc356999dc250'
  // sid : 'SK967bb4598c38cc0f31f4e5b8155d59d1',
  // token : 'oSgFCmwfwawAfImFS6xnxSQf8r479m9c'
}

// mailgun keys
// Add as env variables
// export "mailgunUsername=GET_YOUR_OWN"
// export "mailgunPassword=GET_YOUR_OWN"
// config.mailgun = {
//   username: process.env.mailgunUsername,
//   password: process.env.mailgunPassword
// };



module.exports = config;
