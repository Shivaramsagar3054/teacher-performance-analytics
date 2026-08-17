class MobileLoginPage {
  constructor(driver) {
    this.driver = driver;
  }

  get emailField() {
    return this.driver.$('~email-input'); // accessibility id
  }

  get passwordField() {
    return this.driver.$('~password-input');
  }

  get loginButton() {
    return this.driver.$('~login-button');
  }

  get errorMessage() {
    return this.driver.$('~error-message');
  }

  async login(email, password) {
    await this.emailField.setValue(email);
    await this.passwordField.setValue(password);
    await this.loginButton.click();
  }

  async getError() {
    return await this.errorMessage.getText();
  }
}

module.exports = MobileLoginPage;
