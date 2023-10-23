import "dotenv/config";
import { Placeholder, SQL, and, eq, isNotNull, isNull } from "drizzle-orm";
import puppeteer from "puppeteer";
import { db } from "./db";
import { combination_generic, drug, single_generic } from "./db/schema";

async function main() {
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
      if (alphabetIndex) await getDrugs(alphabetIndex);
    }
  }
  await browser.close();
}

async function getDrugs(alphabet: string) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(`${process.env.SOURCEURL}?alpha=${alphabet.toLowerCase()}`);
  await page.setViewport({ width: 1080, height: 1024 });
  const tableData = await page.evaluate(() => {
    const table = document.querySelector(".dptbl");
    const tableData = [];
    const tableRows = table ? Array.from(table.querySelectorAll("tr")) : [];
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
      processed_single: !row[3] ? true : false,
      processed_combination: !row[4] ? true : false,
    });
  }
  if (drugRecords.length) await db.insert(drug).values(drugRecords);
  await browser.close();
}

// some pages are not opening and redirecting back to main page
async function getSingleGenericDrugs() {
  const drugs = await db
    .select()
    .from(drug)
    .where(
      and(isNotNull(drug.single_generic_url), eq(drug.processed_single, false))
    );
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  for (const drugRecord of drugs) {
    console.log(`Single: ${drugRecord.id}`);
    if (drugRecord.single_generic_url) {
      await page.goto(drugRecord.single_generic_url);
      await page.setViewport({ width: 1080, height: 1024 });
      const tableData = await page.evaluate(() => {
        const table = document.querySelector(".tblgrn");
        const tableData = [];
        const tableRows = table ? Array.from(table.querySelectorAll("tr")) : [];
        tableRows.shift();
        for (const row of tableRows) {
          const rowData = [];
          if (row.querySelectorAll("td").length > 1) {
            for (const cell of row.querySelectorAll("td")) {
              if (!cell.textContent || cell.textContent.trim() === "-")
                rowData.push(null);
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
      let singleGenericRecords:
        | {
            id?: number | SQL<unknown> | Placeholder<string, any> | undefined;
            name?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            createdAt?:
              | SQL<unknown>
              | Date
              | Placeholder<string, any>
              | undefined;
            manufacturer?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            price?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            type?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            price_url?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            drug_id?:
              | number
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
          }[]
        | {
            name: string | null;
            manufacturer: string | null;
            price: null;
            type: string | null;
            price_url: string | null;
            drug_id: number;
          }[] = [];
      for (const row of tableData) {
        singleGenericRecords.push({
          name: row[1],
          manufacturer: row[2],
          price: null,
          type: row[3],
          price_url: row[4],
          drug_id: drugRecord.id,
        });
      }
      if (singleGenericRecords.length) {
        await db.transaction(async (tx) => {
          await tx.insert(single_generic).values(singleGenericRecords);
          await tx
            .update(drug)
            .set({ processed_single: true })
            .where(eq(drug.id, drugRecord.id));
        });
      }
    }
  }
  await browser.close();
}

// some pages are not opening and redirecting back to main page
async function getCombinationGenericDrugs() {
  const drugs = await db
    .select()
    .from(drug)
    .where(
      and(
        isNotNull(drug.combination_generic_url),
        eq(drug.processed_combination, false)
      )
    );
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  for (const drugRecord of drugs) {
    console.log(`Combination: ${drugRecord.id}`);
    if (drugRecord.combination_generic_url) {
      await page.goto(drugRecord.combination_generic_url);
      await page.setViewport({ width: 1080, height: 1024 });
      const tableData = await page.evaluate(() => {
        const table = document.querySelector(".tblgrn");
        const tableData = [];
        const tableRows = table ? Array.from(table.querySelectorAll("tr")) : [];
        tableRows.shift();
        for (const row of tableRows) {
          const rowData = [];
          if (row.querySelectorAll("td").length > 1) {
            for (const cell of row.querySelectorAll("td")) {
              if (!cell.textContent || cell.textContent.trim() === "-")
                rowData.push(null);
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
      let combinationGenericRecords:
        | {
            id?: number | SQL<unknown> | Placeholder<string, any> | undefined;
            name?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            createdAt?:
              | SQL<unknown>
              | Date
              | Placeholder<string, any>
              | undefined;
            manufacturer?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            price?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            type?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            price_url?:
              | string
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            drug_id?:
              | number
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
            constituent_drugs?:
              | string[]
              | SQL<unknown>
              | Placeholder<string, any>
              | null
              | undefined;
          }[]
        | {
            name: string | null;
            manufacturer: string | null;
            constituent_drugs: string[];
            price: null;
            type: null;
            price_url: string | null;
            drug_id: number;
          }[] = [];
      for (const row of tableData) {
        combinationGenericRecords.push({
          name: row[1],
          manufacturer: row[3],
          constituent_drugs: await getConstituentDrugs(row[2]!),
          price: null,
          type: null,
          price_url: row[4],
          drug_id: drugRecord.id,
        });
      }
      if (combinationGenericRecords.length) {
        await db.transaction(async (tx) => {
          await tx
            .insert(combination_generic)
            .values(combinationGenericRecords);
          await tx
            .update(drug)
            .set({ processed_combination: true })
            .where(eq(drug.id, drugRecord.id));
        });
      }
    }
  }
  await browser.close();
}

// get price, stregnth, units for later
async function getPriceSingleDrug() {
  const singleDrugArray = await db
    .select()
    .from(single_generic)
    .where(isNull(single_generic.price));
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  for (const singleDrug of singleDrugArray) {
    if (singleDrug.price_url) {
      console.log(`Single Drug ID: ${singleDrug.id}`);
      try {
        await page.goto(singleDrug.price_url);
        await page.setViewport({ width: 1080, height: 1024 });
        const elementPrice = await page.$(".ybox b");
        const priceString = elementPrice
          ? await elementPrice.evaluate(
              (elementPrice) => elementPrice.textContent
            )
          : null;
        const price = priceString ? priceString.replace(/,/g, "") : null;
        await db
          .update(single_generic)
          .set({ price: price })
          .where(eq(single_generic.id, singleDrug.id));
      } catch (error) {
        console.log("Check Internet Connection, Can't load URL !");
      }
    }
  }
  await browser.close();
}

async function getPriceCombinationeDrug() {
  const combinationDrugArray = await db
    .select()
    .from(combination_generic)
    .where(isNull(combination_generic.price));
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  for (const combinationDrug of combinationDrugArray) {
    if (combinationDrug.price_url) {
      console.log(`Combination Drug ID: ${combinationDrug.id}`);
      try {
        await page.goto(combinationDrug.price_url);
        await page.setViewport({ width: 1080, height: 1024 });
        const elementPrice = await page.$(".ybox b");
        const priceString = elementPrice
          ? await elementPrice.evaluate(
              (elementPrice) => elementPrice.textContent
            )
          : null;
        const price = priceString ? priceString.replace(/,/g, "") : null;
        const elementType = await page.$("tr td h3");
        const typeString =
          elementType &&
          (await elementType.evaluate((element) => element.outerHTML));
        const drugType = getDrugType(typeString!);
        await db
          .update(combination_generic)
          .set({ price: price, type: drugType })
          .where(eq(combination_generic.id, combinationDrug.id));
      } catch (error) {
        console.log("Check Internet Connection, Can't load URL !");
      }
    }
  }
  await browser.close();
}

(async () => {
  // await main();
  // await getSingleGenericDrugs();
  // await getCombinationGenericDrugs();
  // await getPriceSingleDrug();
  await getPriceCombinationeDrug();
  console.log("Finished !!!");
})();

async function getConstituentDrugs(drugsString: string) {
  let cleanedString = drugsString
    .replace(/\s*\+\s*/g, "+")
    .replace(/\++$/, "")
    .replace(/\s+/g, " ");
  let wordsArray = cleanedString
    .split("+")
    .map((word) => word.trim())
    .filter((word) => word !== "");
  return wordsArray;
}

function getDrugType(string: string) {
  const index1st = string.indexOf("&nbsp;&nbsp;");
  const after1st = string.substring(index1st + "&nbsp;&nbsp;".length);
  if (after1st.includes("&nbsp;&nbsp;")) {
    const index2nd = after1st.indexOf("&nbsp;&nbsp;");
    const before2nd = after1st.substring(0, index2nd);
    return before2nd;
  } else {
    const index2nd = after1st.indexOf("</h3>");
    const before2nd = after1st.substring(0, index2nd);
    return before2nd;
  }
}
