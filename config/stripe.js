/**
 * Created by shengrong on 12/15/15.
 */
var config = {};

// config.StripeKeys = {
//   publishableKey: process.env.STRIPE_LIVE_ID,
//   secretKey: process.env.STRIPE_LIVE_KEY
// };
config.StripeKeys = {
  publishableKey: process.env.NODE_ENV === 'production' ? process.env.STRIPE_LIVE_ID : process.env.STRIPE_TEST_ID,
  secretKey: process.env.NODE_ENV === 'production' ? process.env.STRIPE_LIVE_KEY : process.env.STRIPE_TEST_KEY
  // publishableKey: process.env.STRIPE_TEST_ID,
  // secretKey: process.env.STRIPE_TEST_KEY
};

config.TwilioKeys = {
    sid : process.env.NODE_ENV === 'production' ? process.env.TWILIO_LIVE_ID : process.env.TWILIO_TEST_ID,
    token : process.env.NODE_ENV === 'production' ? process.env.TWILIO_LIVE_KEY : process.env.TWILIO_TEST_KEY
}

config.mailChimp = {
  apiKey : process.env.MAILCHIMP_KEY
}

config.wechat = {
  token : process.env.WECHAT_TOKEN,
  appId : process.env.WECHAT_APPID,
  secret : process.env.WECHAT_SECRET,
  nonceStr : process.env.WECHAT_NONCESTR
}
module.exports = config;
