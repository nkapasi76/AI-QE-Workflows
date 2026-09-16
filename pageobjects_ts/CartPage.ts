import { Locator, Page,expect } from "@playwright/test";

export class CartPage
{
    page:Page;
    cartItemNames:Locator;
    checkoutButton:Locator;

constructor(page:any)
{
    this.page = page;
    this.cartItemNames = page.locator(".cartSection h3");
    this.checkoutButton = page.getByRole("button", { name: "Checkout" });
}

async VerifyProductIsDisplayed(productName:string)
{
    await expect(this.cartItemNames.filter({ hasText: productName })).toBeVisible();
}

async Checkout()
{
    await this.checkoutButton.click();
}
}
module.exports = {CartPage};
