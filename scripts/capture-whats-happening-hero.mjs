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

function publicStoryUrl() {
  return `${server.baseUrl}/?review=1&variant=conversation-intelligence-home`;
}

try {
  await page.setReducedMotion(false);
  for (const [name, width, height] of [
    ["desktop-1440x900", 1440, 900],
    ["mobile-390x844", 390, 844],
    ["mobile-320x800", 320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.waitFor(`document.querySelector(".page")?.dataset.variant === "${VARIANT}"`);
    await capture(`${name}-digital`);
    await page.evaluate(`window.scrollTo({ top: Math.max(document.querySelector("#landing-hero").offsetHeight - window.innerHeight, 1), behavior: "auto" })`);
    await page.waitFor(`document.querySelector("#landing-hero")?.dataset.twitterStage === "human"`);
    await new Promise((resolve) => setTimeout(resolve, 950));
    await capture(`${name}-human`);

    await page.navigate(publicStoryUrl());
    await page.waitFor(`document.querySelector(".page")?.dataset.variant === "conversation-intelligence-home"`);
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 12`);
    await page.evaluate(`document.querySelector("#landing-story .story-section")?.scrollIntoView({ block: "start", behavior: "auto" })`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .story-section")?.getBoundingClientRect().top ?? 9999) < 3`);
    await new Promise((resolve) => setTimeout(resolve, 120));
    await capture(`${name}-section-two`);
  }
} finally {
  await chrome.close();
  await server.close();
}

console.log(OUTPUT_DIRECTORY);
