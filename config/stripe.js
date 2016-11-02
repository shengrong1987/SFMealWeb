/**
 * Created by shengrong on 12/15/15.
 */
var config = {};

config.StripeKeys = {
  publishableKey: process.env.STRIPE_LIVE_ID,
  secretKey: process.env.STRIPE_LIVE_KEY
};

config.TwilioKeys = {
    sid : process.env.TWILIO_LIVE_ID,
    token : process.env.TWILIO_LIVE_KEY
}

module.exports = config;
