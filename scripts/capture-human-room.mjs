import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { launchChrome, startStaticServer } from "../tests/helpers/chrome-cdp.mjs";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(SCRIPT_DIRECTORY);
const OUTPUT_DIRECTORY = join(PROJECT_DIRECTORY, "qa", "human-room");
const VARIANT = "life-runs-on-human-conversation";

await mkdir(OUTPUT_DIRECTORY, { recursive: true });

const server = await startStaticServer(join(PROJECT_DIRECTORY, "dist"));
const chrome = await launchChrome();
const page = chrome.session;

function roomUrl(query = "") {
  return `${server.baseUrl}/?review=1&variant=${VARIANT}&experience=human-room${query}`;
}

async function capture(name) {
  const screenshot = await page.call("Page.captureScreenshot", {
    captureBeyondViewport: false,
    format: "png",
    fromSurface: true,
  });
  await writeFile(join(OUTPUT_DIRECTORY, `${name}.png`), Buffer.from(screenshot.data, "base64"));
}

try {
  await page.setReducedMotion(true);
  await page.setViewport(1440, 900);
  await page.navigate(roomUrl("&demoState=prompt&reduceMotion=1"));
  await capture("desktop-00-crt");
  await page.evaluate(`document.querySelector('[data-hc-action="run"]').click()`);
  await page.waitFor(`document.querySelector("[data-hc-room]")?.dataset.roomStep === "0" && document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`);
  await capture("desktop-01-notice");

  for (const [step, name] of [[1, "introduce"], [2, "listen"], [3, "compound"], [4, "payoff"]]) {
    await page.evaluate(`document.querySelector('[data-hc-room-next="${step}"]').click()`);
    await page.waitFor(`document.querySelector("[data-hc-room]")?.dataset.roomStep === "${step}"`);
    await capture(`desktop-0${step + 1}-${name}`);
  }

  await page.setViewport(390, 844);
  for (const [step, name] of [[0, "notice"], [1, "introduce"], [2, "listen"], [3, "compound"], [4, "payoff"]]) {
    await page.navigate(roomUrl(`&demoState=${step === 4 ? "resolved" : "journey"}&roomStep=${step}&reduceMotion=1`));
    await capture(`mobile-0${step + 1}-${name}`);
  }

  await page.setViewport(320, 800);
  await page.navigate(roomUrl("&demoState=resolved&roomStep=4&reduceMotion=1"));
  await capture("narrow-01-payoff");
} finally {
  await chrome.close();
  await server.close();
}

console.log(OUTPUT_DIRECTORY);
