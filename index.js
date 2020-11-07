const puppeteer = require('puppeteer');
const puppeteerSelect = require('puppeteer-select');
const moment = require('moment');
const fs = require('fs');
const config = require('./config.json');

//Default Initializations
const today = moment().format("YYYY-MM-DD");

let screenshotDIRPath = config.directories.screenshots || "./screenshots";
let dashboardURL = config.urls.dashboard || "https://ayopop.greythr.com";
let waitOptions = ["networkidle0", "domcontentloaded", "networkidle2", "load"];

let browserConfig = {
    args: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignoreHTTPSErrors'
    ],
    headless: true
};

//tried string interpolation didn't work
let action = "login";
let actionSelector = config.definitions.login.selector;

(async () => {

    console.log("\n\nProgress isn't made by early risers. It's made by lazy men trying to find easier ways to do something. \n");

    await init(process.argv);

    console.log(`[x] Launching browser...`);
    const browser = await puppeteer.launch(browserConfig);
    const page = await browser.newPage();

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

    console.log(`[x] Logging in...`)

    try {
        await page.type(config.definitions.username.selector, config.definitions.username.text);
        await page.type(config.definitions.password.selector, config.definitions.password.text);
        await page.click(config.definitions.submit.selector);

    } catch (e) {
        console.log(`[x] Error finding selectors, check config`);
        console.log(`[x] ${e.message}`);
        process.exit(0);
    }

    await page.waitForNavigation({
        waitUntil: waitOptions
    });

    console.log(`[x] Waiting for 2 seconds...`);
    await page.waitForTimeout(2000);

    console.log(`[x] Punching in/out...`);
    let actionButton = await puppeteerSelect(page).getElement(actionSelector);

    try {
        await actionButton.click();
        console.log(`[x] ${action} action completed successfully`);
        console.log("[x] Now browser will close in 5 seconds");
    } catch (e) {
        console.log(`[x] Specified action button does not exist on this page : `, actionSelector);
        console.log(`[x] Probably you're already Logged in / Logged out`)
        console.log("[x] Now browser will close in 5 seconds");
    }

    await makeOrIgnoreDIR(screenshotDIRPath);

    let path = `${screenshotDIRPath}/${today}.png`;

    console.log(`[x] Storing screenshot...`);

    await page.screenshot({
        path: path,
        fullPage: true
    });

    console.log(`[x] Screenshot stored at ${path}`);

    console.log(`[x] Closing browser...`);

    setTimeout(async () => {
        await browser.close();
    }, 5000);

})();

async function init() {

    if (process.argv.length < 3) {
        console.log('Invalid number of parameters \n\nUsage : node index.js <login|logout>');
        process.exit(0);
    }

    action = process.argv[2];

    if (!["login", "logout"].includes(action)) {
        console.log(`Invalid action parameter ${action} \n\nUsage : node index.js <login|logout>`);
        process.exit(0);
    }

    console.log(`[x] Initializing...`)

    if (process.argv[2] == 'login') {
        actionSelector = config.definitions.login.selector;
    } else if (process.argv[2] == 'logout') {
        actionSelector = config.definitions.logout.selector;
    }

    if (process.argv[3] == "--with-head") {
        console.log("[x] Debug mode : running with head");
        browserConfig.headless = false;
    }
}

async function makeOrIgnoreDIR(path) {
    if (!fs.existsSync(path)) {
        console.log(`[x] Creating directory for screenshots...`);
        fs.mkdirSync(path, {
            recursive: true
        });
    }
}