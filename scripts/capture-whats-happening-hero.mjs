import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { launchChrome, startStaticServer } from "../tests/helpers/chrome-cdp.mjs";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(SCRIPT_DIRECTORY);
const OUTPUT_DIRECTORY = join(PROJECT_DIRECTORY, "qa", "whats-happening-hero");
const VARIANT = "whats-happening-real-world";

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

function reviewUrl() {
  return `${server.baseUrl}/?review=1&variant=${VARIANT}`;
}

try {
  await page.setReducedMotion(true);
  for (const [name, width, height] of [
    ["desktop-1440x900", 1440, 900],
    ["mobile-390x844", 390, 844],
    ["mobile-320x800", 320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.waitFor(`document.querySelector(".page")?.dataset.variant === "${VARIANT}"`);
    await capture(name);
  }
} finally {
  await chrome.close();
  await server.close();
}

console.log(OUTPUT_DIRECTORY);
