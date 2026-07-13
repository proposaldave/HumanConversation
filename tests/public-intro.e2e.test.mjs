import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

import { launchChrome, startStaticServer } from "./helpers/chrome-cdp.mjs";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(TEST_DIRECTORY);
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, "dist");
const PUBLIC_VARIANT = "conversation-intelligence-home";
const MASTER_PROMPT_VARIANT = "life-runs-on-human-conversation";

const baseline = JSON.parse(
  await readFile(join(TEST_DIRECTORY, "fixtures", "public-home-baseline.json"), "utf8"),
);

let staticServer;
let chrome;
let page;

function publicUrl(suffix = "") {
  return staticServer.baseUrl + "/" + suffix;
}

function reviewUrl(variant) {
  return `${staticServer.baseUrl}/?review=1&variant=${variant}`;
}

function assertRuntimeHealthy() {
  assert.deepEqual(page.exceptions, [], "no uncaught browser exceptions");
  assert.deepEqual(page.consoleErrors, [], "no browser console errors");
}

async function publicProjection() {
  return page.evaluate(`(() => {
    const normalize = (element) => String(element?.textContent || "").replace(/\\s+/g, " ").trim();
    const pageRoot = document.querySelector(".page");
    const hero = document.querySelector("#landing-hero");
    const storyText = normalize(document.querySelector("#landing-story"));
    const markers = ${JSON.stringify(baseline.storyMarkers)};
    return {
      variant: pageRoot?.dataset.variant,
      heroTheme: pageRoot?.dataset.heroTheme,
      heroClass: hero?.className,
      heroStage: hero?.dataset.communityStage,
      headlineLabel: hero?.querySelector("h1")?.getAttribute("aria-label"),
      headlineText: normalize(hero?.querySelector("h1")),
      ledeText: normalize(hero?.querySelector(".lede")),
      headerEmail: normalize(document.querySelector(".header-email")),
      storySections: document.querySelectorAll("#landing-story .story-section, #landing-story .story-final").length,
      heroSignupAction: document.querySelector("#email-capture")?.getAttribute("action"),
      footerText: normalize(document.querySelector(".site-footer")),
      storyMarkers: markers.map((marker) => storyText.includes(marker)),
      publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")),
      demoCount: document.querySelectorAll("[data-hc-demo]").length,
      pageHidden: pageRoot?.getAttribute("aria-hidden"),
      pageInert: pageRoot?.inert,
      pageVisibility: getComputedStyle(pageRoot).visibility,
      robots: document.querySelector('meta[name="robots"]')?.content || null,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);
}

before(async () => {
  staticServer = await startStaticServer(DIST_DIRECTORY);
  chrome = await launchChrome();
  page = chrome.session;
  await page.setReducedMotion(false);
});

after(async () => {
  await chrome?.close();
  await staticServer?.close();
});

test("the public root opens directly on the Twitter, Slack, and Human Conversation story", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(publicUrl());
  await page.waitFor('document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"');

  const state = await publicProjection();
  assert.deepEqual(state, {
    variant: baseline.variant,
    heroTheme: "community-pulse",
    heroClass: baseline.heroClass,
    heroStage: "twitter",
    headlineLabel: baseline.headlineLabel,
    headlineText: baseline.headlineText,
    ledeText: baseline.ledeText,
    headerEmail: baseline.headerEmail,
    storySections: baseline.storySections,
    heroSignupAction: baseline.heroSignupAction,
    footerText: baseline.footerText,
    storyMarkers: baseline.storyMarkers.map(() => true),
    publicIntro: false,
    demoCount: 0,
    pageHidden: null,
    pageInert: false,
    pageVisibility: "visible",
    robots: null,
    canonical: "https://humanconversation.com/",
    horizontalOverflow: 0,
  });
  assertRuntimeHealthy();
});

test("campaign parameters never restore the retired public computer gate", async () => {
  for (const suffix of [
    "?utm_source=campaign",
    "?demoState=resolved",
    "?reduceMotion=1",
  ]) {
    await page.navigate(publicUrl(suffix));
    await page.waitFor('document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"');
    const state = await page.evaluate(`({
      variant: document.querySelector(".page")?.dataset.variant,
      publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")),
      demoCount: document.querySelectorAll("[data-hc-demo]").length,
      robots: document.querySelector('meta[name="robots"]')?.content || null,
    })`);
    assert.deepEqual(state, {
      variant: PUBLIC_VARIANT,
      publicIntro: false,
      demoCount: 0,
      robots: null,
    }, suffix);
  }
  assertRuntimeHealthy();
});

test("the old computer experience remains available only in its private review route", async () => {
  await page.navigate(reviewUrl(MASTER_PROMPT_VARIANT));
  await page.waitFor('Boolean(document.querySelector("[data-hc-demo]"))');
  const state = await page.evaluate(`({
    publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")),
    demoCount: document.querySelectorAll("[data-hc-demo]").length,
    variant: document.querySelector(".page")?.dataset.variant,
    robots: document.querySelector('meta[name="robots"]')?.content,
  })`);
  assert.deepEqual(state, {
    publicIntro: false,
    demoCount: 1,
    variant: MASTER_PROMPT_VARIANT,
    robots: "noindex,nofollow",
  });
  assertRuntimeHealthy();
});

test("the promoted public root stays safe at desktop and phone sizes", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(publicUrl("?reduceMotion=1"));
    await page.waitFor('document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"');
    const layout = await page.evaluate(`(() => {
      const hero = document.querySelector("#landing-hero");
      const copy = document.querySelector(".community-stage-twitter .community-stage-content")?.getBoundingClientRect();
      const connectionChain = document.querySelector("#landing-story .is-solves-disconnection-section .story-chain");
      const chainItems = Array.from(connectionChain?.querySelectorAll("span:not(.story-chain-arrow)") || []);
      const lastPill = chainItems.at(-1)?.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")),
        heroHeight: hero?.offsetHeight || 0,
        copyLeft: copy?.left ?? -1,
        copyRight: copy?.right ?? -1,
        copyTop: copy?.top ?? -1,
        copyBottom: copy?.bottom ?? -1,
        chainItems: chainItems.map((item) => item.textContent.trim()),
        arrowCount: connectionChain?.querySelectorAll(".story-chain-arrow").length || 0,
        lastPillLeft: lastPill?.left ?? -1,
        lastPillRight: lastPill?.right ?? -1,
      };
    })()`);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has no horizontal overflow`);
    assert.equal(layout.publicIntro, false);
    assert.ok(layout.heroHeight >= height * 3.15, `${width}x${height} keeps the three-stage story`);
    assert.ok(layout.copyLeft >= -1 && layout.copyRight <= width + 1, `${width}x${height} copy fits horizontally`);
    assert.ok(layout.copyTop >= -1 && layout.copyBottom <= height + 1, `${width}x${height} copy fits vertically`);
    assert.deepEqual(layout.chainItems, [
      "disconnection",
      "connection",
      "trust",
      "data",
      "coordination",
      "community",
      "trusted connection-high.",
    ]);
    assert.equal(layout.arrowCount, 6, `${width}x${height} keeps every connecting arrow`);
    assert.ok(
      layout.lastPillLeft >= -1 && layout.lastPillRight <= width + 1,
      `${width}x${height} final connection pill fits horizontally`,
    );
  }
  assertRuntimeHealthy();
});
