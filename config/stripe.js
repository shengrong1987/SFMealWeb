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
};

// mailgun keys
// Add as env variables
// export "mailgunUsername=GET_YOUR_OWN"
// export "mailgunPassword=GET_YOUR_OWN"
// config.mailgun = {
//   username: process.env.mailgunUsername,
//   password: process.env.mailgunPassword
// };



module.exports = config;