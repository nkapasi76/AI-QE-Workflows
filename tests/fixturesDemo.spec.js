const {test, expect} = require("@playwright/test");
const { customtest } = require("../utils/fixtures.js");


customtest('@Fixtures Demo', async  ({authenticatedPage, createOrders, testdatafororder})=>
{
    authenticatedPage.goto("https://rahulshettyacademy.com/client");
    await authenticatedPage.locator("button[routerlink*='myorders']").click();
    await authenticatedPage.locator("tbody").waitFor();
    await expect(authenticatedPage.getByText("createdOrder.orderId")).toBeVisible();
    console.log(testdatafororder.productName);
})