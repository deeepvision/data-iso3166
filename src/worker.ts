import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';

/**
 * Data is fetched from Online Browsing Platform on ISO website
 */
const ISO_OBP_URL = 'https://www.iso.org/obp/ui/#search';
/**
 * Results per page dropdown value. Sets the 300 items per page.
 */
const PER_PAGE_VALUE = '16';
/**
 * Element Selectors of the needed elements
 */
const SELECTOR = {
    LNK_CODES: '#obpui-105541713 > div > div.v-customcomponent.v-widget.v-has-width.v-has-height > div > div > div:nth-child(2) > div > div > div.v-tabsheet-content.v-tabsheet-content-header > div > div > div > div > div > div.v-slot.v-slot-borderless > div > div.v-panel-content.v-panel-content-borderless.v-scrollable > div > div > div:nth-child(1) > div > div > div > div > div > div:nth-child(6) > div',
    BTN_SEARCH: '#obpui-105541713 > div > div.v-customcomponent.v-widget.v-has-width.v-has-height > div > div > div:nth-child(2) > div > div > div.v-tabsheet-content.v-tabsheet-content-header > div > div > div > div > div > div:nth-child(2) > div > div.v-slot.v-slot-global-search.v-slot-light.v-slot-home-search > div > div.v-panel-content.v-panel-content-global-search.v-panel-content-light.v-panel-content-home-search.v-scrollable > div > div > div.v-slot.v-slot-go > div > span',
    SELECT_RESULTS: '#obpui-105541713 > div > div.v-customcomponent.v-widget.v-has-width.v-has-height > div > div > div:nth-child(2) > div > div > div.v-tabsheet-content.v-tabsheet-content-header > div > div > div > div > div > div.v-slot.v-slot-search-header > div > div:nth-child(5) > div:nth-child(3) > div > select',
    TBL_CODES: '.country-code tbody',
};

const delay = (timeout: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
};

const run = async (): Promise<void> => {
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();
    await page.goto(ISO_OBP_URL, {
        waitUntil: 'networkidle0',
    });

    await page.waitForSelector(SELECTOR.BTN_SEARCH);
    await page.click(SELECTOR.BTN_SEARCH);

    await page.waitForSelector(SELECTOR.LNK_CODES);
    await page.click(SELECTOR.LNK_CODES);

    await page.waitForSelector(SELECTOR.TBL_CODES);
    await page.select(SELECTOR.SELECT_RESULTS, PER_PAGE_VALUE);
    await delay(3000);

    const countries = await page.evaluate(`
        const getCellValue = (row, cell) => row.querySelector('td:nth-child('+cell+')').textContent;

        const tableBody = document.querySelector('${SELECTOR.TBL_CODES}');
        const rows = tableBody.querySelectorAll('tr');

        const data = [];
        rows.forEach(row => {
            data.push({
                name: getCellValue(row, 1),
                'alpha-2-code': getCellValue(row, 3),
                'alpha-3-code': getCellValue(row, 4),
                numeric: getCellValue(row, 5),
            });
        });
        
        data
    `);

    await fs.writeFile(
        './countries.json',
        JSON.stringify(countries, null, 4)
    );
    await browser.close();
};

const worker = {
    run,
};

export { worker };
