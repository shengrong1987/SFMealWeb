export default {
  SERVICE_FEE : 0,
  SYSTEM_DELIVERY_FEE : 0,
  MILEAGE_FEE : 1.18,
  PARTY_ORDER_RANGE_MULTIPLIER : 3,
  WECHAT_APPID : "wx07900b73e4e9f783",
  WECHAT_APPID2 : "wx8adf908523166c33",
  BASE_URL : process.env.NODE_ENV === 'production' ? "https://sfmeal.com" : "http://localhost:1337"
}
