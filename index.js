const dotenv = require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const puppeteer = require('puppeteer');

const fs = require('fs');
const screenshotsDir = 'screenshots';


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'run /screenshot command with url to make a screenshot');
});

bot.onText(/\/screenshot (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];
  const cssSelector = match[2];
  const screenshotName = new Date().getTime();

  // check exist screenshots directory or create one
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto(url, {
        timeout: 5 * 60 * 1000,
        waitUntil: 'load'
      });
    } catch (err) {
      bot.sendMessage(chatId, err.message);
      return;
    }
    
    const el = await page.$(cssSelector);
    
    if (cssSelector && el) {
      await el.screenshot({
        path: `./${screenshotsDir}/${screenshotName}.png`
      });
    } else {
      await page.screenshot({
        path: `./${screenshotsDir}/${screenshotName}.png`,
        fullPage: true
      });
    }

    await browser.close();

    const screenshot = `${__dirname}/${screenshotsDir}/${screenshotName}.png`;

    // check exsit screenshot and send it
    if (fs.existsSync(screenshot)) {
      await bot.sendPhoto(chatId, screenshot);
    }

    // remove sent screenshot
    try {
      fs.unlinkSync(screenshot);
    } catch (err) {
      console.error(err);
    }
  })();
});