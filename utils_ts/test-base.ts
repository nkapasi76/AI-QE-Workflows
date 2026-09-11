const test = require("node:test");
import {test as baseTest} from "@playwright/test";
interface testdatafororder {
    username: string;
    password: string;
    productName: string;
}
export const customTest = baseTest.extend<{testdatafororder:testdatafororder}>(
    {
  testdatafororder : {
    "username": "nkapasi@yahoo.com",
    "password": "Xaviers1",
    "productName": "ZARA COAT 3"

    }
    }
)

  
