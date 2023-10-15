import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto("https://www.medindia.net/drug-price/index.asp");

  await page.setViewport({ width: 1080, height: 1024 });

  const ul = await page.$(".az-list");
  const listItems = ul
    ? await ul!.$$eval("li", (elements) =>
        elements.map((element) => element.textContent)
      )
    : [];

  if (listItems.length && listItems[0] !== null) {
    getDrugs(listItems[0]);
  }

  await browser.close();
})();

// function to get all drugs from a-z page
async function getDrugs(alphabet: string) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(
    `https://www.medindia.net/drug-price/index.asp?alpha=${alphabet.toLowerCase()}`
  );

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

  // Print the table data to the console
  console.log(tableData);
  console.log(tableData.length);

  await browser.close();
}

// function to get all generic single for drug

// function to get all generic combination  for drug

// get price
