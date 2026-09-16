import { Locator, Page,expect } from "@playwright/test";
export class LoginPage
{
    page:Page
    signInButton:Locator
    emailField:Locator
    passwordField:Locator

    constructor(page:Page)
    {
        this.signInButton = page.locator("[value='Login']");
        this.emailField = page.locator("#userEmail");
        this.passwordField = page.locator("#userPassword");
        this.page = page;
    }

    goTo()
    {
        return this.page.goto("https://rahulshettyacademy.com/client");
    }

async validLogin(username:string,password:string)
{
   await this.emailField.fill(username);
    await this.passwordField.fill(password);
    await this.signInButton.click();
}
}
module.exports = {LoginPage};