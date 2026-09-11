import { Page,Locator} from "@playwright/test";    


let numb: number= 3;
console.log(numb);
let something: string = "hello world";
let somethingElse: any = "hello hello world";
let active: boolean = true;
let employees: string[] = ['jack', 'jill', 'john'];
console.log(employees);

function addtype(num1:number,num2:number): number
{
return (num1 + num2)
}
console.log(addtype(5,9));

let user: {name:string,age:number}
    =  {name:"bob", age:25}
    console.log(user);

class CartPage
{
page:Page
cartItemNames:Locator
checkoutButton:Locator

constructor(page:any)

{
    this.page = page;
    this.cartItemNames = page.locator(".cartSection h3");
    this.checkoutButton = page.getByRole("button", { name: "Checkout" });
}
}