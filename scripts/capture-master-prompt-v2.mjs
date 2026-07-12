import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { launchChrome, startStaticServer } from "../tests/helpers/chrome-cdp.mjs";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(SCRIPT_DIRECTORY);
const OUTPUT_DIRECTORY = join(PROJECT_DIRECTORY, "qa", "master-prompt-v2");
const VARIANT = "life-runs-on-human-conversation";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await mkdir(OUTPUT_DIRECTORY, { recursive: true });

const server = await startStaticServer(join(PROJECT_DIRECTORY, "dist"));
const chrome = await launchChrome();
const page = chrome.session;

async function capture(name) {
  const screenshot = await page.call("Page.captureScreenshot", {
    captureBeyondViewport: false,
    format: "png",
    fromSurface: true,
  });
  await writeFile(join(OUTPUT_DIRECTORY, `${name}.png`), Buffer.from(screenshot.data, "base64"));
}

function reviewUrl(query = "") {
  return `${server.baseUrl}/?review=1&variant=${VARIANT}${query}`;
}

try {
  await page.setReducedMotion(false);
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl("&demoState=prompt"));
  await delay(900);
  await capture("desktop-01-mid-typing");
  await page.waitFor(`document.querySelector("#hc-master-prompt")?.value === "Make my life 99% human conversation and shared experiences — and only 1% screen time."`, { timeout: 4000 });
  await capture("desktop-02-prompt-ready");
  await page.evaluate(`document.querySelector('[data-hc-action="run"]').click()`);
  await delay(1120);
  await capture("desktop-03-doorway");
  await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`, {
    timeout: 2800,
  });
  await delay(480);
  await capture("desktop-04-human-future");

  await page.setViewport(1280, 800);
  await page.navigate(reviewUrl("&demoState=journey&reduceMotion=1"));
  await capture("desktop-05-compact-future");

  await page.setViewport(390, 844);
  await page.navigate(reviewUrl("&demoState=prompt&reduceMotion=1"));
  await capture("mobile-01-prompt-ready");
  await page.evaluate(`document.querySelector('[data-hc-action="run"]').click()`);
  await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`);
  await capture("mobile-02-human-future");

  await page.setViewport(320, 800);
  await page.navigate(reviewUrl("&demoState=prompt&reduceMotion=1"));
  await capture("mobile-03-narrow-prompt");
  await page.evaluate(`document.querySelector('[data-hc-action="run"]').click()`);
  await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`);
  await capture("mobile-04-narrow-future");
} finally {
  await chrome.close();
  await server.close();
}

console.log(OUTPUT_DIRECTORY);
