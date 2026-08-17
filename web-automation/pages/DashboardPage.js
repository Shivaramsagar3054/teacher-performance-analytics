const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.sidebarHeader = By.id('sidebar-header');
    this.analyticsTab = By.id('nav-analytics');
    this.coursesTab = By.id('nav-courses');
    this.messagesTab = By.id('nav-messages');
    this.profileTab = By.id('nav-profile');
    this.settingsTab = By.id('nav-settings');
    this.logoutButton = By.id('logout-btn');
    this.analyticsChart = By.id('performance-chart');
    this.coursesTable = By.id('courses-table');
    this.profileName = By.id('profile-name');
  }

  async navigateToAnalytics() {
    await this.click(this.analyticsTab);
  }

  async navigateToCourses() {
    await this.click(this.coursesTab);
  }

  async navigateToProfile() {
    await this.click(this.profileTab);
  }

  async logout() {
    await this.click(this.logoutButton);
  }
}

module.exports = DashboardPage;
