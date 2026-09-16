import { Locator, Page,expect } from "@playwright/test";
class LoginPagePractise {
page: Page
userName:Locator
password:Locator
termsCheckbox:Locator
signInButton:Locator
constructor(page:Page)
{
    this.page = page;
    this.userName = page.locator("#username");
    this.password = page.locator("#password");
    this.termsCheckbox = page.locator("#terms");
    this.signInButton = page.locator("#signInBtn");
}

async goTo()
{
    await this.page.goto("https://rahulshettyacademy.com/loginpagePractise/");
}

async validLogin(username:string, password:string)
{
    await this.userName.fill(username);
    await this.password.fill(password);
    await this.termsCheckbox.check();
    await this.signInButton.click();
    await this.page.waitForLoadState('networkidle');
}

}
module.exports = {LoginPagePractise};