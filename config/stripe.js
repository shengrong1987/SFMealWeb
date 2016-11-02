/**
 * Created by shengrong on 12/15/15.
 */
var config = {};

config.StripeKeys = {
  publishableKey: process.env.NODE_ENV === 'production' ? process.env.STRIPE_LIVE_ID : process.env.STRIPE_TEST_ID,
  secretKey: process.env.NODE_ENV === 'production' ? process.env.STRIPE_LIVE_KEY : process.env.STRIPE_TEST_KEY
};

config.TwilioKeys = {
    sid : process.env.TWILIO_LIVE_ID,
    token : process.env.TWILIO_LIVE_KEY
}

module.exports = config;
