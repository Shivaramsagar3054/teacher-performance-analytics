const { By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigateTo(url) {
    await this.driver.get(url);
  }

  async findElement(locator, timeout = 10000) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async findVisibleElement(locator, timeout = 10000) {
    const element = await this.findElement(locator, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async click(locator) {
    const element = await this.findVisibleElement(locator);
    await element.click();
  }

  async type(locator, text) {
    const element = await this.findVisibleElement(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator) {
    const element = await this.findVisibleElement(locator);
    return await element.getText();
  }

  async takeScreenshot(fileName) {
    const screenshotDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const image = await this.driver.takeScreenshot();
    const filePath = path.join(screenshotDir, fileName);
    fs.writeFileSync(filePath, image, 'base64');
    return filePath;
  }
}

module.exports = BasePage;
