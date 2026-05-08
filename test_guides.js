const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file:///Users/mitomedaiki/時計アナログ/index.html');
    
    // Click the toggle button
    await page.click('#btn-toggle-minute-guide');
    
    // Check if hidden class is removed
    const guideHidden = await page.$eval('.minute-guide-number', el => el.classList.contains('hidden'));
    const btnText = await page.$eval('#btn-toggle-minute-guide', el => el.textContent);
    const guideDisplay = await page.$eval('.minute-guide-number', el => window.getComputedStyle(el).display);
    
    console.log("Guide Hidden Class:", guideHidden);
    console.log("Button Text:", btnText);
    console.log("Guide Display CSS:", guideDisplay);
    
    await page.screenshot({path: 'screenshot.png'});
    
    await browser.close();
})();
