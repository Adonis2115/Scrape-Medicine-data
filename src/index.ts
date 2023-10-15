import { db } from "./db";
import { drug } from "./db/schema";
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();

  await page.goto('https://www.medindia.net/drug-price/index.asp');

  await page.setViewport({width: 1080, height: 1024});

  const ul = await page.$('.az-list');
  const listItems = ul ? await ul!.$$eval('li', elements => elements.map(element => element.textContent)):null;

  console.log(listItems)

  await browser.close();
})();