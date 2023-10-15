import "dotenv/config";
import { isNotNull } from "drizzle-orm";
import puppeteer from "puppeteer";
import { db } from "./db";
import { combination_generic, drug, single_generic } from "./db/schema";

async function main() {
  await db.delete(drug);
  await db.delete(single_generic);
  await db.delete(combination_generic);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(process.env.SOURCEURL!);

  await page.setViewport({ width: 1080, height: 1024 });

  const ul = await page.$(".az-list");
  const listItems = ul
    ? await ul!.$$eval("li", (elements) =>
        elements.map((element) => element.textContent)
      )
    : [];

  if (listItems.length && listItems[0] !== null) {
    for (const alphabetIndex of listItems) {
      if (alphabetIndex) await getDrugs(alphabetIndex); // await is important else too many connections to db and not in order.
    }
  }
  await browser.close();
}

// function to get all drugs from a-z page
async function getDrugs(alphabet: string) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(`${process.env.SOURCEURL}?alpha=${alphabet.toLowerCase()}`);

  await page.setViewport({ width: 1080, height: 1024 });

  const tableData = await page.evaluate(() => {
    const table = document.querySelector(".dptbl");
    const tableData = [];

    // Skip the first element which is the table head
    const tableRows = Array.from(table!.querySelectorAll("tr"));
    tableRows.shift();

    for (const row of tableRows) {
      const rowData = [];

      for (const cell of row.querySelectorAll("td")) {
        if (cell.textContent && row.querySelectorAll("td").length > 1) {
          if (cell.textContent.trim() === "-") rowData.push(null);
          else if (cell.textContent.trim() === "View Price")
            rowData.push(cell.querySelector("a")!.href);
          else rowData.push(cell.textContent.replace("\n", "").trim());
        }
      }

      if (rowData.length > 0) {
        tableData.push(rowData);
      }
    }

    return tableData;
  });
  let drugRecords = [];
  for (const row of tableData) {
    drugRecords.push({
      name: row[1],
      single_generic_url: row[3],
      combination_generic_url: row[4],
    });
  }
  await db.insert(drug).values(drugRecords);
  await browser.close();
}

async function getSingleGenericDrugs() {
  const drugs = await db
    .select()
    .from(drug)
    .where(isNotNull(drug.single_generic_url));
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  for (const drugRecord of drugs) {
    if (drugRecord.single_generic_url) {
      await page.goto(drugRecord.single_generic_url);
      await page.setViewport({ width: 1080, height: 1024 });
      const tableData = await page.evaluate(() => {
        const table = document.querySelector(".tblgrn");
        const tableData = [];

        // Skip the first element which is the table head
        const tableRows = Array.from(table!.querySelectorAll("tr"));
        tableRows.shift();

        for (const row of tableRows) {
          const rowData = [];

          for (const cell of row.querySelectorAll("td")) {
            if (cell.textContent && row.querySelectorAll("td").length > 1) {
              if (cell.textContent.trim() === "-") rowData.push(null);
              else if (cell.textContent.trim() === "View Price")
                rowData.push(cell.querySelector("a")!.href);
              else rowData.push(cell.textContent.replace("\n", "").trim());
            }
          }

          if (rowData.length > 0) {
            tableData.push(rowData);
          }
        }

        return tableData;
      });
      let singleGenericRecords = [];
      for (const row of tableData) {
        const price = await getPrice(row[4]!);
        singleGenericRecords.push({
          name: row[1],
          manufacturer: row[2],
          price: price,
          type: row[3],
          price_url: row[4],
          drug_id: drugRecord.id,
        });
      }
      await db.insert(single_generic).values(singleGenericRecords);
    }
  }
  await browser.close();
}

async function getCombinationGenericDrugs() {
  const drugs = await db
    .select()
    .from(drug)
    .where(isNotNull(drug.combination_generic_url));
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  for (const drugRecord of drugs) {
    if (drugRecord.combination_generic_url) {
      await page.goto(drugRecord.combination_generic_url);
      await page.setViewport({ width: 1080, height: 1024 });
      const tableData = await page.evaluate(() => {
        const table = document.querySelector(".tblgrn");
        const tableData = [];

        // Skip the first element which is the table head
        const tableRows = Array.from(table!.querySelectorAll("tr"));
        tableRows.shift();

        for (const row of tableRows) {
          const rowData = [];

          for (const cell of row.querySelectorAll("td")) {
            if (cell.textContent && row.querySelectorAll("td").length > 1) {
              if (cell.textContent.trim() === "-") rowData.push(null);
              else if (cell.textContent.trim() === "View Price")
                rowData.push(cell.querySelector("a")!.href);
              else rowData.push(cell.textContent.replace("\n", "").trim());
            }
          }

          if (rowData.length > 0) {
            tableData.push(rowData);
          }
        }

        return tableData;
      });
      let combinationGenericRecords = [];
      for (const row of tableData) {
        const price = await getPrice(row[4]!);
        const drugType = await getDrugTypeForCombination(row[4]!);
        combinationGenericRecords.push({
          name: row[1],
          manufacturer: row[3],
          constituent_drugs: row[2]!.split(/\s*?\+\s*?/),
          price: price,
          type: drugType,
          price_url: row[4],
          drug_id: drugRecord.id,
        });
      }
      await db.insert(combination_generic).values(combinationGenericRecords);
    }
  }
  await browser.close();
}

// get price, stregnth, units for later
async function getPrice(priceUrl: string) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(priceUrl);
  await page.setViewport({ width: 1080, height: 1024 });

  const element = await page.$(".ybox b");
  const price = element
    ? await element.evaluate((element) => element.textContent)
    : null;

  await browser.close();
  return price!.replace(/,/g, "");
}

// sometimes getting type wrong. Wrong string manipulation
async function getDrugTypeForCombination(url: string) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({ width: 1080, height: 1024 });
  const element = await page.$("tr td h3");

  const stringWithType = element
    ? await element.evaluate((element) => element.textContent)
    : null;

  const stringWithTypeArray = stringWithType?.split(" ");
  const drugType =
    stringWithTypeArray![stringWithTypeArray!?.length - 1].trim();
  await browser.close();
  return drugType;
}

(async () => {
  //   await main();
  getSingleGenericDrugs();
  getCombinationGenericDrugs();
})();
