const dotenv = require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });
const puppeteer = require('puppeteer');
const fs = require('fs');


const help = chatId => {
  bot.sendMessage(chatId, `Please run command /screenshot with URL parameter.
  Examples:
  "/screenshot https://google.com" - I will send you screenshot of the full page.
  "/screenshot https://google.com .content" - I will send you screenshot of '.content' block.
  `);
};

bot.onText(/\/start/, msg => {
  help(msg.chat.id);
});

bot.onText(/\/help/, msg => {
  help(msg.chat.id);
});

const makeScreenshot = (chatId, url, selector) => {
  const screenshotsDir = 'screenshots';
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

    const el = await page.$(selector);

    if (selector && el) {
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
};

bot.on('message', msg => {
  const text = msg.text.trim().replace(/  +/gm, ' ');
  const chatId = msg.chat.id;
  const parameters = text.split(' ');
  const command = parameters[0];
  const url = parameters[1];
  const selector = parameters[2];

  if (command !== '/screenshot') {
    return;
  }

  switch (parameters.length) {
    case 2:
      //comand, url
      makeScreenshot(chatId, url);
      break;
    case 3:
      //command, url, selector
      makeScreenshot(chatId, url, selector);
      break;
    default:
      // no parameters
      help(chatId);
  }
});