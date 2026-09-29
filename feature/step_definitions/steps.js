const {When, Then, Given, After, setDefaultTimeout} = require('@cucumber/cucumber')
const { expect } = require('@playwright/test');
const {playwright, chromium} = require('playwright');
const {POManager} = require('../../pageobjects/POManager');
const { TIMEOUT } = require('node:dns');

setDefaultTimeout(100000);

Given ('when a successful login to the Ecommerce application with {string} and {string}', async function (username, password){

const loginPage = this.poManager.getLoginPage();
await loginPage.goTo();
await loginPage.validLogin(username, password);
})

When ('Add {string} to Cart', async function(productName){
  this.dashboardPage = this.poManager.getDashboardPage();
  await this.dashboardPage.searchProductAddCart(productName);
  await this.dashboardPage.navigateToCart();
})

Then ('verify {string} is displayed in the cart', async function(productName){
    const cartPage = this.poManager.getCartPage();
    await cartPage.VerifyProductIsDisplayed(productName);
    await cartPage.Checkout();
})

When ('Enter valid details and place the order', async function(){
    const ordersReviewPage = this.poManager.getOrdersReviewPage();
    await ordersReviewPage.searchCountryAndSelect("ind","India");
    this.orderId = await ordersReviewPage.SubmitAndGetOrderId();
    console.log(this.orderId);
})

Then ('Verify order is present in the order history page', async function(){
    await this.dashboardPage.navigateToOrders();
    const ordersHistoryPage = this.poManager.getOrdersHistoryPage();
    await ordersHistoryPage.searchOrderAndSelect(this.orderId);
    expect(this.orderId.includes(await ordersHistoryPage.getOrderId())).toBeTruthy();
})


Given('login to the Ecommerce2 application with {string} and {string}', async function (username, password) {
    const userName = this.page.locator('#username');
    const signIn = this.page.locator("#signInBtn");

    await this.page.goto("https://rahulshettyacademy.com/loginpagePractise/");
      console.log(await this.page.title());
      //css 
     await this.page.locator("#username").fill(username);
     await this.page.locator("[type='password']").fill(password);
     await this.page.locator("#login-button").click();
});

Then('verify the error message {string} is displayed', async function (string) {
    console.log(await this.page.locator("[style*='block']").textContent());
    await expect(this.page.locator("[style*='block']")).toContainText('Incorrect');  return 'pending';
});