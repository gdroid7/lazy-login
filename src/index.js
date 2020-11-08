const puppeteer = require('puppeteer');
const puppeteerSelect = require('puppeteer-select');
const moment = require('moment');
const config = require('../config.json');
const Helpers = require("./helpers");
//Default Initializations
const today = moment().format("YYYY-MM-DD");

let screenshotDIRPath = config.directories.screenshots || "./screenshots";
let dashboardURL = config.urls.dashboard || "https://ayopop.greythr.com";
let waitOptions = ["networkidle0", "domcontentloaded", "networkidle2", "load"];
let action = "login";
let actionSelector = config.definitions.login.selector; //tried string interpolation didn't work
let browser, page;
let browserConfig = {
    args: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignoreHTTPSErrors'
    ],
    headless: true
};

//Main function
(async (args) => {

    try {

        if (args.length < 3) {
            throw new Error('Invalid number of parameters \n\nUsage : node index.js <login|logout>')
        }

        action = args[2];

        if (!["login", "logout"].includes(action)) {
            throw new Error(`Invalid action parameter ${action} \n\nUsage : node index.js <login|logout>`);
        }

        console.log("\n\nProgress isn't made by early risers. It's made by lazy men trying to find easier ways to do something. \n");

        console.log(`[x] Initializing...`)

        if (args[2] == 'login') {
            actionSelector = config.definitions.login.selector;
        } else if (args[2] == 'logout') {
            actionSelector = config.definitions.logout.selector;
        }

        if (args[3] == "--with-head") {
            console.log("[x] Debug mode : running with head");
            browserConfig.headless = false;
        }

        return await spawnBrowser();

    } catch (e) {
        console.log(e.message);
        process.exit(0);
    }

})(process.argv);

//Create and spawns browser
async function spawnBrowser() {

    console.log(`[x] Launching browser...`);

    browser = await puppeteer.launch(browserConfig);
    page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', interceptedRequest => {
        if (interceptedRequest.resourceType() === 'media') {
            log("request aborted");
            interceptedRequest.abort();
        } else {
            interceptedRequest.continue();
        }
    });

    await page.goto(dashboardURL, {
        waitUntil: waitOptions
    });

    console.log(`[x] Waiting for 2 seconds...`);

    await page.waitForTimeout(2000);

    await doLogin(page);

    setTimeout(async () => {
        await browser.close();
    }, 5000);

    return;
}

//Authenticates on webapp
async function doLogin(page) {

    console.log(`[x] Logging in...`)

    try {
        await page.type(config.definitions.username.selector, config.definitions.username.text);
        await page.type(config.definitions.password.selector, config.definitions.password.text);
        await page.click(config.definitions.submit.selector);
    } catch (e) {
        console.log(`[x] Error finding selectors, check config`);
        throw new Error(`[x] ${e.message}`);
    }

    await page.waitForNavigation({
        waitUntil: waitOptions
    });

    console.log(`[x] Waiting for 2 seconds...`);

    await page.waitForTimeout(2000);

    return await doPunchIn(page);
}

//Find and click punch in/out button
async function doPunchIn(page) {

    console.log(`[x] Punching in/out...`);

    let actionButton = await puppeteerSelect(page).getElement(actionSelector);

    try {
        await actionButton.click();
        console.log(`[x] ${action} action completed successfully`);
    } catch (e) {
        console.log(`[x] Specified action button does not exist on this page : `, actionSelector);
        console.log(`[x] Probably you're already Logged in / Logged out`);
        throw new Error(`[x] ${e.message}`);
    }

    return await takeScreenshot(page);
}

//Take screenshot
async function takeScreenshot(page) {

    await Helpers.makeOrIgnoreDIR(screenshotDIRPath);

    let path = `${screenshotDIRPath}/${today}.png`;

    console.log(`[x] Storing screenshot...`);

    await page.screenshot({
        path: path,
        fullPage: true
    });

    console.log(`[x] Screenshot stored at ${path}`);

    console.log(`[x] Closing browser...`);

    return await browser.close();
}