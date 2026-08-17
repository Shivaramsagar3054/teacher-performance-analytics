require('dotenv').config();
const path = require('path');

exports.config = {
  runner: 'local',
  port: 4723,
  path: '/',
  specs: [
    './tests/**/*.js'
  ],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '13.0',
    'appium:automationName': 'UiAutomator2',
    'appium:app': process.env.APP_APK_PATH || path.join(__dirname, '../mobile-app/android/app/build/outputs/apk/debug/app-debug.apk'),
    'appium:appPackage': 'com.shivaramsagar.teacherperformanceanalytics',
    'appium:appActivity': 'com.shivaramsagar.teacherperformanceanalytics.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240,
    'appium:gpsEnabled': true
  }],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['appium'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 150000
  }
};
