const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const puppeteer = require('puppeteer');
require('dotenv').config();

const bot = new Telegraf(process.env.TOKEN);
const stage = new Stage();
const screenshotScene = new Scene('screenshotScene');

stage.register(screenshotScene);

bot.use(session());
bot.use(stage.middleware());

bot.help((ctx) => {
  help(ctx);
});

bot.start((ctx) => {
  help(ctx);
});

bot.command('screenshot', (ctx) => {
  const [, ...arguments] = ctx.message.text
    .trim()
    .split(' ');

  switch (arguments.length) {
    case 1:
      //comand, url
      makeScreenshot(ctx, arguments[0]);
      break;
    case 2:
      //command, url, selector
      makeScreenshot(ctx, arguments[0], arguments[1]);
      break;
    default:
      // no parameters
      ctx.reply(
        'Please send me URL. \n'+
        'Example: \n'+
        '"https://example.com"'
        );
      ctx.scene.enter('screenshotScene');
  }
});

screenshotScene.on('text', (ctx) => {
  const [...arguments] = ctx.message.text.trim().split(' ');
  if (arguments.length === 1) {
    makeScreenshot(ctx, arguments[0]);
  } else if (arguments.length === 2) {
    makeScreenshot(ctx, arguments[0], arguments[1]);
  }

  ctx.scene.leave('screenshotScene');
});

async function makeScreenshot(ctx, url, SELECTOR) {
  const URL = url.match(/^https?:\/\//) ? url : `https://${url}`;
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
  ctx.reply(
    'Please run command "/screenshot".\n' +
    'Examples:\n' +
    '"/screenshot" - I will ask you about the URL.\n' +
    '"/screenshot https://example.com" - I will send you screenshot of the full page.\n' +
    '"/screenshot https://example.com h1" - I will send you screenshot of "h1" element.'
  );
}

bot.startPolling();