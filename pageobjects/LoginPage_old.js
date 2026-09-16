class LoginPage
{
    constructor(page)
    {
        this.page = page;
        this.signInButton = page.locator("[value='Login']");
        this.Username = page.locator("#userEmail");
        this.Password = page.locator("#userPassword");
    }

    async goto()
    {
        await this.page.goto("https://rahulshettyacademy.com/client");
    }

    async validLogin(username, password)
    {
        await this.Username.fill(username);
        await this.Password.fill(password);
        await this.signInButton.click();
    }
}
module.exports = {LoginPage};
//login page object model