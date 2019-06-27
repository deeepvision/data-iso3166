const puppeteer = require('puppeteer');
const util = require('util');
const fs = require('fs');

const writeFileAsync = util.promisify(fs.writeFile);

function delay(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

const ISO_URL = 'https://www.iso.org/obp/ui/#search';
const MAX_PER_PAGE_VALUE = '8'; // 8 means 300 country codes per page
const CSS_SELECTORS = {
    LINK_TO_CODES_TABLE: '#obpui-105541713 > div > div.v-customcomponent.v-widget.v-has-width.v-has-height > div > div > div:nth-child(2) > div > div > div.v-tabsheet-content.v-tabsheet-content-header > div > div > div > div > div > div.v-slot.v-slot-borderless > div > div.v-panel-content.v-panel-content-borderless.v-scrollable > div > div > div:nth-child(1) > div > div > div > div > div > div:nth-child(6) > div',
    SEARCH_BUTTON: '#obpui-105541713 > div > div.v-customcomponent.v-widget.v-has-width.v-has-height > div > div > div:nth-child(2) > div > div > div.v-tabsheet-content.v-tabsheet-content-header > div > div > div > div > div > div:nth-child(2) > div > div.v-slot.v-slot-global-search.v-slot-light.v-slot-home-search > div > div.v-panel-content.v-panel-content-global-search.v-panel-content-light.v-panel-content-home-search.v-scrollable > div > div > div.v-slot.v-slot-go > div > span',
    RESULTS_PER_PAGE_SELECT: '#obpui-105541713 > div > div.v-customcomponent.v-widget.v-has-width.v-has-height > div > div > div:nth-child(2) > div > div > div.v-tabsheet-content.v-tabsheet-content-header > div > div > div > div > div > div.v-slot.v-slot-search-header > div > div:nth-child(5) > div:nth-child(3) > div > select',
    CODES_TABLE: '#obpui-105541713 > div > div.v-customcomponent.v-widget.v-has-width.v-has-height > div > div > div:nth-child(2) > div > div > div.v-tabsheet-content.v-tabsheet-content-header > div > div > div > div > div > div.v-slot.v-slot-borderless > div > div.v-panel-content.v-panel-content-borderless.v-scrollable > div > div > div.v-slot.v-slot-search-result-layout > div > div:nth-child(2) > div.v-table.v-widget.country-code.v-table-country-code.v-has-width > div.v-scrollable.v-table-body-wrapper.v-table-body > div.v-table-body-noselection > table > tbody',
};

(async () => {
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();
    await page.goto(ISO_URL, {
        waitUntil: 'networkidle2',
    });

    await page.waitForSelector(CSS_SELECTORS.SEARCH_BUTTON);
    await page.click(CSS_SELECTORS.SEARCH_BUTTON);

    await page.waitForSelector(CSS_SELECTORS.LINK_TO_CODES_TABLE);
    await page.click(CSS_SELECTORS.LINK_TO_CODES_TABLE);

    await page.waitForSelector(CSS_SELECTORS.CODES_TABLE, { timeout: 3999 });
    await page.select(CSS_SELECTORS.RESULTS_PER_PAGE_SELECT, MAX_PER_PAGE_VALUE);

    await delay(3000);

    const countries = await page.evaluate((tableSelector) => {
        const cellText = (row, cell) => row.querySelector(`td:nth-child(${cell}) > div`).textContent;

        const tableBody = document.querySelector(tableSelector);
        const rows = tableBody.querySelectorAll('tr');

        const data = [];
        rows.forEach(row => {
            data.push({
                name: cellText(row, 1),
                'alpha-2-code': cellText(row, 3),
                'alpha-3-code': cellText(row, 4),
                numeric: cellText(row, 5),
            });
        });
        return data;
    }, CSS_SELECTORS.CODES_TABLE);

    await writeFileAsync(
        './countries.json',
        JSON.stringify(countries, null, 4)
    );

    await browser.close();
})().catch(err => {
    console.error(err);
    process.exit(1);
});
