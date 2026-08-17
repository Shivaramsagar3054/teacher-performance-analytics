const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.id('email');
    this.passwordInput = By.id('password');
    this.loginButton = By.id('login-btn');
    this.errorMessage = By.id('error-message');
    this.signUpLink = By.id('signup-link');
    this.forgotPasswordLink = By.id('forgot-password-link');
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getErrorMessage() {
    return await this.getText(this.errorMessage);
  }

  async clickSignUp() {
    await this.click(this.signUpLink);
  }

  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink);
  }
}

module.exports = LoginPage;
