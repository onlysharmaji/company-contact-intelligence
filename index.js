require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
module.exports = {
  port: +process.env.PORT || 5000,
  maxPages: +process.env.MAX_PAGES || 50,          // configurable crawl limit
  timeoutMs: +process.env.REQUEST_TIMEOUT_MS || 10000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  google: { sheetId: process.env.GOOGLE_SHEET_ID, email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY },
};
