import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { launchChrome, startStaticServer } from "./helpers/chrome-cdp.mjs";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(TEST_DIRECTORY);
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, "dist");
const VARIANT = "whats-happening-real-world";

let staticServer;
let chrome;
let page;

function reviewUrl() {
  return `${staticServer.baseUrl}/?review=1&variant=${VARIANT}`;
}

function assertRuntimeHealthy() {
  assert.deepEqual(page.exceptions, [], "no uncaught browser exceptions");
  assert.deepEqual(page.consoleErrors, [], "no browser console errors");
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

test("the hidden alternative tells the verified Twitter-to-human-conversation story", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector(".page")?.dataset.variant === "${VARIANT}"`);

  const state = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const pageRoot = document.querySelector(".page");
    const shell = document.querySelector(".whats-crt-shell");
    const screen = document.querySelector(".whats-crt-screen");
    const email = document.querySelector(".header-email");
    const emailRect = email?.getBoundingClientRect();
    return {
      variant: pageRoot?.dataset.variant,
      robots: document.querySelector('meta[name="robots"]')?.content,
      dateText: normalize(document.querySelector(".whats-crt-meta")?.textContent),
      dateTime: document.querySelector(".whats-crt-meta time")?.getAttribute("datetime"),
      question: normalize(document.querySelector(".whats-crt-question")?.textContent),
      composerFieldPresent: Boolean(document.querySelector(".whats-crt-input")),
      history: normalize(document.querySelector(".whats-crt-foot")?.textContent),
      bridge: normalize(document.querySelector(".whats-bridge")?.textContent),
      answer: normalize(document.querySelector(".whats-answer")?.textContent),
      lede: normalize(document.querySelector(".lede")?.textContent),
      heroLabel: document.querySelector("#landing-hero h1")?.getAttribute("aria-label"),
      backgroundImage: getComputedStyle(pageRoot, "::before").backgroundImage,
      shellBackground: getComputedStyle(shell).backgroundImage,
      screenBackground: getComputedStyle(screen).backgroundImage,
      screenColor: getComputedStyle(screen).backgroundColor,
      contactDisplay: getComputedStyle(document.querySelector("#email-capture")).display,
      storyHidden: document.querySelector("#landing-story")?.hidden,
      storySections: document.querySelectorAll("#landing-story .story-section, #landing-story .story-final").length,
      demoCount: document.querySelectorAll("[data-hc-demo], [data-hc-public-intro]").length,
      emailVisible: Boolean(emailRect?.width && emailRect?.height),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);

  assert.deepEqual(state, {
    variant: VARIANT,
    robots: "noindex,nofollow",
    dateText: "twitter Nov 19 · 2009",
    dateTime: "2009-11-19",
    question: "What’s happening?",
    composerFieldPresent: true,
    history: "The digital town square found its question.",
    bridge: "The real world already had the answer.",
    answer: "Human Conversation.",
    lede: "All the human, social, relationship, and community data moves through conversation. We build the intelligence around it—not between us.",
    heroLabel: "On November 19, 2009, Twitter asked What’s happening? The digital town square found its question. The real world already had the answer: Human Conversation.",
    backgroundImage: state.backgroundImage,
    shellBackground: state.shellBackground,
    screenBackground: state.screenBackground,
    screenColor: "rgb(241, 241, 241)",
    contactDisplay: "none",
    storyHidden: true,
    storySections: 0,
    demoCount: 0,
    emailVisible: true,
    horizontalOverflow: 0,
  });
  assert.match(state.backgroundImage, /hc-art-intelligence-brings-together-20260705\.png/);
  assert.match(state.shellBackground, /linear-gradient/);
  assert.equal(state.screenBackground, "none");
  assertRuntimeHealthy();
});

test("the alternative stays jaw-dropping and viewport-safe from desktop to narrow phone", async () => {
  for (const [width, height] of [[1440, 900], [390, 844], [320, 800]]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.waitFor(`document.querySelector(".page")?.dataset.variant === "${VARIANT}"`);
    const layout = await page.evaluate(`(() => {
      const hero = document.querySelector("#landing-hero");
      const answer = document.querySelector(".whats-answer");
      const lede = document.querySelector("#landing-hero .lede");
      const answerRect = answer?.getBoundingClientRect();
      const ledeRect = lede?.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heroHeight: hero?.getBoundingClientRect().height || 0,
        answerLeft: answerRect?.left ?? -1,
        answerRight: answerRect?.right ?? -1,
        ledeLeft: ledeRect?.left ?? -1,
        ledeRight: ledeRect?.right ?? -1,
      };
    })()`);

    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has horizontal overflow`);
    assert.ok(layout.heroHeight >= height - 1, `${width}x${height} hero does not own the first viewport`);
    assert.ok(layout.answerLeft >= -1 && layout.answerRight <= width + 1, `${width}x${height} answer does not fit`);
    assert.ok(layout.ledeLeft >= -1 && layout.ledeRight <= width + 1, `${width}x${height} lede does not fit`);
    assertRuntimeHealthy();
  }
});
