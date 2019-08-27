const Telegraf = require('telegraf');
const puppeteer = require('puppeteer');
require('dotenv').config();

const bot = new Telegraf(process.env.TOKEN);


bot.help((ctx) => {
  help(ctx);
});

bot.start((ctx) => {
  help(ctx);
});

bot.on('text', ctx => {
  const text = ctx.message.text.trim().replace(/  +/gm, ' ');
  const parameters = text.split(' ');
  const COMMAND = parameters[0];
  const URL = parameters[1];
  const SELECTOR = parameters[2];

  if (COMMAND !== '/screenshot') {
    return;
  }

  switch (parameters.length) {
    case 2:
      //comand, url
      makeScreenshot(ctx, URL);
      break;
    case 3:
      //command, url, selector
      makeScreenshot(ctx, URL, SELECTOR);
      break;
    default:
      // no parameters
      help(ctx);
  }
});

async function makeScreenshot(ctx, URL, SELECTOR) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  let screenshot;

  try {
    await page.goto(URL, {
      timeout: 5 * 60 * 1000,
      waitUntil: 'load'
    });
  } catch (err) {
    ctx.reply(err.message);
    return;
  }

  const el = await page.$(SELECTOR);

  if (SELECTOR && el) {
    screenshot = await el.screenshot({
      omitBackground: true,
      encoding: 'binary'
    });
  } else {
    screenshot = await page.screenshot({
      omitBackground: true,
      encoding: 'binary',
      fullPage: true
    });
  }

  await browser.close();

  await ctx.replyWithPhoto({
    source: screenshot
  });
};

function help(ctx) {
  ctx.reply(`
Please run command /screenshot with URL parameter.\n
Examples:
"/screenshot https://google.com" - I will send you screenshot of the full page.\n
"/screenshot https://google.com .content" - I will send you screenshot of ".content" block.
`);
}

bot.startPolling();