 import {Page, test, expect} from '@playwright/test';
 import {customTest} from '../utils_ts/test-base.ts';
 import {POManager} from'../pageobjects_ts/POManager.ts';
 
 //Json->string->js object
 const dataset =  JSON.parse(JSON.stringify(require("../utils/placeorderTestData.json")));
for(const data of dataset)
{
 customTest(`Client App login for ${data.productName}`, async ({page:Page})=>
 {
  

   const poManager = new POManager(Page);
     const products = Page.locator(".card-body");
     const loginPage = poManager.getLoginPage();
     await loginPage.goTo();
     await loginPage.validLogin(data.username,data.password);
     const dashboardPage = poManager.getDashboardPage();
     await dashboardPage.searchProductAddCart(data.productName);
     await dashboardPage.navigateToCart();

    const cartPage = poManager.getCartPage();
    await cartPage.VerifyProductIsDisplayed(data.productName);
    await cartPage.Checkout();
    let orderId: any;
    const ordersReviewPage = poManager.getOrdersReviewPage();
    await ordersReviewPage.searchCountryAndSelect("ind","India");
    orderId = await ordersReviewPage.SubmitAndGetOrderId();
   console.log(orderId);
   await dashboardPage.navigateToOrders();
   const ordersHistoryPage = poManager.getOrdersHistoryPage();
   await ordersHistoryPage.searchOrderAndSelect(orderId);
   expect(orderId.includes(await ordersHistoryPage.getOrderId())).toBeTruthy();
 });
}

 customTest(`Client App login`, async ({page:Page,testdatafororder})=>

 {
   const poManager = new POManager(Page);
    //js file- Login js, DashboardPage
     const products = Page.locator(".card-body");
     const loginPage = poManager.getLoginPage();
     await loginPage.goTo();
    await loginPage.validLogin(testdatafororder.username,testdatafororder.password);
     const dashboardPage = poManager.getDashboardPage();
    await dashboardPage.searchProductAddCart(testdatafororder.productName);
     await dashboardPage.navigateToCart();

    const cartPage = poManager.getCartPage();
    await cartPage.VerifyProductIsDisplayed(testdatafororder.productName);
    await cartPage.Checkout();
})