require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'https://Shivaramsagar3054.github.io/teacher-performance-analytics/',
  timeout: parseInt(process.env.TIMEOUT || '10000', 10),
  headless: process.env.HEADLESS !== 'false',
  browser: process.env.BROWSER || 'chrome'
};
