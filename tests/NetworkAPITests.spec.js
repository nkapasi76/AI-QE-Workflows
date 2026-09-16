const {test, expect, request} = require('@playwright/test');
const {APiUtils} = require('../utils/APiUtils');
const path = require('node:path');
const loginPayLoad = {userEmail:"nkapasi@test.com",userPassword:"!Test1234"};
const orderPayLoad = {
    orders: [{country: "India", productOrderedId: "6960eac0c941646b7a8b3e68"}]
};
const fakeresponse = {data: [] , message: "No Orders"};

let response;
test.beforeAll( async()=>
{
   const apiContext = await request.newContext();
   const apiUtils = new APiUtils(apiContext,loginPayLoad);
   response =  await apiUtils.createOrder(orderPayLoad);
})
 
//create order is success
test('@API Place the order', async ({page})=>
{ 
    await page.addInitScript(value => {
 
        window.localStorage.setItem('token',value);
    }, response.token );
await page.goto("https://rahulshettyacademy.com/client");
await page.route("https://rahulshettyacademy.com/api/ecom/order/get-orders-for-customer/*", async route => {
    const response = await page.request.fetch(route.request());
    const body = JSON.stringify(fakeresponse);
    await route.fulfill({
        response,
        body,
    });
});

 const responsePromise = page.waitForResponse("https://rahulshettyacademy.com/api/ecom/order/get-orders-for-customer/*");
 await page.locator("button[routerlink*='myorders']").click();
 console.log(await page.locator(".mt-4 ng-star-inserted").textContent());
})