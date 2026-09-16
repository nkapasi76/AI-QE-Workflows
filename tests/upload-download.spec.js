const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');

async function writeExcelTest(searchText,replaceText,change,filePath)
{
  execFileSync('python3', ['-c', `
import sys
from openpyxl import load_workbook

path, search, replacement, offset = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
workbook = load_workbook(path)
worksheet = workbook['Sheet1']
for row in worksheet.iter_rows():
    for cell in row:
        if cell.value == search:
            worksheet.cell(cell.row, cell.column + offset).value = replacement
            workbook.save(path)
            raise SystemExit
raise SystemExit('Search text not found in Sheet1')
`, filePath, String(searchText), String(replaceText), String(change.colChange)], { stdio: 'inherit' });
}


async function readExcel(worksheet,searchText)
{
    let output = {row:-1,column:-1};
    worksheet.eachRow((row,rowNumber) =>
    {
          row.eachCell((cell,colNumber) =>
          {
              if(cell.value === searchText)
              {
                  output.row=rowNumber;
                  output.column=colNumber;
              }
  
  
          }  )
    
    })
    return output;
}
//update Mango Price to 350. 
//writeExcelTest("Mango",350,{rowChange:0,colChange:2},"/Users/rahulshetty/downloads/excelTest.xlsx");
test('Upload download excel validation',async ({page})=>
{
  const textSearch = 'Mango';
  const updateValue = '350';
  await page.goto("https://rahulshettyacademy.com/upload-download-test/index.html");
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download'}).click();
  await downloadPromise;
  writeExcelTest(textSearch,updateValue,{rowChange:0,colChange:2},"/Users/nkapasi/downloads/download.xlsx");
  await page.locator("#fileinput").click();
  await page.locator("#fileinput").setInputFiles(filePath);
  const textlocator = page.getByText(textSearch);
  const desiredRow = await page.getByRole('row').filter({has :textlocator });
  await expect(desiredRow.locator("#cell-4-undefined")).toContainText(updateValue);




















})







