import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

import { launchChrome, startStaticServer } from "./helpers/chrome-cdp.mjs";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(TEST_DIRECTORY);
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, "dist");
const MASTER_PROMPT = "Give me my life back.";
const TERMINAL_INSTRUCTION = "ONE LAST JOB FOR THE COMPUTER.";
const TERMINAL_STATUS = "Ready · hit Enter";
const VARIANT = "life-runs-on-human-conversation";

const baseline = JSON.parse(
  await readFile(join(TEST_DIRECTORY, "fixtures", "public-home-baseline.json"), "utf8"),
);

let staticServer;
let chrome;
let page;

function publicUrl(query = "") {
  return staticServer.baseUrl + "/" + query;
}

function reviewUrl(query = "") {
  return staticServer.baseUrl + "/?review=1&variant=" + VARIANT + query;
}

function promptReadyExpression() {
  return [
    "document.querySelector(\"#hc-master-prompt\")?.value === " + JSON.stringify(MASTER_PROMPT),
    "document.querySelector(\"[data-hc-prompt-form]\")?.dataset.typingState === \"complete\"",
    "Number(getComputedStyle(document.querySelector(\".hc-life-ratio\")).opacity) > 0.9",
  ].join(" && ");
}

function currentHomeProjectionExpression() {
  return [
    "(() => {",
    "  const normalizeText = (element) => element?.textContent?.replace(/\\s+/g, \" \").trim();",
    "  const storyText = normalizeText(document.querySelector(\"#landing-story\")) || \"\";",
    "  const markers = " + JSON.stringify(baseline.storyMarkers) + ";",
    "  return {",
    "    variant: document.querySelector(\".page\")?.getAttribute(\"data-variant\"),",
    "    heroClass: document.querySelector(\"#landing-hero\")?.getAttribute(\"class\"),",
    "    headlineLabel: document.querySelector(\"#landing-hero h1\")?.getAttribute(\"aria-label\"),",
    "    headlineText: normalizeText(document.querySelector(\"#landing-hero h1\")),",
    "    ledeText: normalizeText(document.querySelector(\"#landing-hero .lede\")),",
    "    headerEmail: normalizeText(document.querySelector(\".header-email\")),",
    "    storySections: document.querySelectorAll(\"#landing-story .story-section, #landing-story .story-final\").length,",
    "    heroSignupAction: document.querySelector(\"#email-capture\")?.getAttribute(\"action\"),",
    "    footerText: normalizeText(document.querySelector(\".site-footer\")),",
    "    storyMarkers: markers.map((marker) => storyText.includes(marker)),",
    "  };",
    "})()",
  ].join("\n");
}

async function assertCurrentHomeMatchesBaseline(message = "current homepage remains unchanged") {
  const projection = await page.evaluate(currentHomeProjectionExpression());
  const { storyMarkers, ...stableProjection } = projection;
  const { storyMarkers: baselineMarkers, ...stableBaseline } = baseline;
  assert.deepEqual(stableProjection, stableBaseline, message);
  assert.deepEqual(storyMarkers, baselineMarkers.map(() => true), message + " story markers");
}

function assertRuntimeHealthy() {
  assert.deepEqual(page.exceptions, [], "no uncaught browser exceptions");
  assert.deepEqual(page.consoleErrors, [], "no browser console errors");
}

before(async () => {
  staticServer = await startStaticServer(DIST_DIRECTORY);
  chrome = await launchChrome();
  page = chrome.session;
  await page.setViewport(1440, 900);
  await page.setReducedMotion(false);
});

after(async () => {
  await chrome?.close();
  await staticServer?.close();
});

test("exact public root first loads one accessible vintage CRT over the saved homepage", async () => {
  await page.navigate(publicUrl());
  await page.waitFor(promptReadyExpression(), { timeout: 4000 });
  await assertCurrentHomeMatchesBaseline("homepage underneath the intro");

  const state = await page.evaluate(
    [
      "(() => {",
      "  const intro = document.querySelector(\"[data-hc-public-intro]\");",
      "  const page = document.querySelector(\".page\");",
      "  const promptPanel = document.querySelector('[data-hc-panel=\"prompt\"]');",
      "  const era = document.querySelector(\".hc-terminal-era\");",
      "  const terminalLabel = document.querySelector(\".hc-terminal-chrome > :nth-child(2)\");",
      "  const caption = document.querySelector(\".hc-terminal-caption\");",
      "  const typingStatus = document.querySelector(\"[data-hc-typing-status]\");",
      "  const ratio = document.querySelector(\".hc-life-ratio\");",
      "  const instruction = document.querySelector(\".hc-terminal-path\");",
      "  const expected = " + JSON.stringify(MASTER_PROMPT) + ";",
      "  const normalize = (value) => String(value || \"\").replace(/\\s+/g, \" \").trim();",
      "  const sources = [normalize(promptPanel?.innerText), ...[...promptPanel.querySelectorAll(\"input, textarea\")].map((control) => normalize(control.value))];",
      "  const occurrences = sources.reduce((total, source) => total + (source.includes(expected) ? 1 : 0), 0);",
      "  const rect = intro?.getBoundingClientRect();",
      "  const future = document.querySelector(\".hc-demo-journey\");",
      "  return {",
      "    introCount: document.querySelectorAll(\"[data-hc-public-intro]\").length,",
      "    demoCount: document.querySelectorAll(\"[data-hc-demo]\").length,",
      "    promptIdCount: document.querySelectorAll(\"#hc-master-prompt\").length,",
      "    state: intro?.dataset.demoState,",
      "    publicClass: document.documentElement.classList.contains(\"hc-public-master-prompt-intro\"),",
      "    reviewClass: document.documentElement.classList.contains(\"hc-master-prompt-review\"),",
      "    pendingClass: document.documentElement.classList.contains(\"hc-public-master-prompt-pending\"),",
      "    pageAriaHidden: page?.getAttribute(\"aria-hidden\"),",
      "    pageInert: page?.inert,",
      "    pageVisibility: getComputedStyle(page).visibility,",
      "    pageOpacity: getComputedStyle(page).opacity,",
      "    promptValue: document.querySelector(\"#hc-master-prompt\")?.value,",
      "    promptFocused: document.activeElement?.id === \"hc-master-prompt\",",
      "    terminalLabel: normalize(terminalLabel?.textContent),",
      "    eraText: normalize(era?.textContent),",
      "    eraVisible: Boolean(era?.getBoundingClientRect().width && era?.getBoundingClientRect().height),",
      "    eraDotPresent: Boolean(era?.querySelector(\"i\")),",
      "    eraColor: getComputedStyle(era).color,",
      "    eraBorderWidth: getComputedStyle(era).borderTopWidth,",
      "    captionText: normalize(caption?.textContent),",
      "    captionColor: getComputedStyle(caption).color,",
      "    typingStatusText: normalize(typingStatus?.textContent),",
      "    ratioText: normalize(ratio?.textContent),",
      "    ratioVisible: Boolean(ratio && Number(getComputedStyle(ratio).opacity) > 0.9),",
      "    humanRatioColor: getComputedStyle(document.querySelector(\".hc-life-ratio-human\")).color,",
      "    screenRatioColor: getComputedStyle(document.querySelector(\".hc-life-ratio-screen\")).color,",
      "    computerAnimation: getComputedStyle(document.querySelector(\".hc-crt-computer\")).animationName,",
      "    bootLineAnimation: getComputedStyle(document.querySelector(\".hc-crt-boot-line\")).animationName,",
      "    screenContentAnimation: getComputedStyle(document.querySelector(\".hc-terminal-body\")).animationName,",
      "    instructionText: normalize(instruction?.textContent),",
      "    oldTerminalPathPresent: /human@computer/i.test(promptPanel?.textContent || \"\"),",
      "    occurrences,",
      "    introCoversViewport: Boolean(rect && rect.left <= 0 && rect.top <= 0 && rect.width >= innerWidth && rect.height >= innerHeight),",
      "    introOwnsCenter: Boolean(document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest(\"[data-hc-public-intro]\")),",
      "    promptOwnsRightEdge: Boolean(document.elementFromPoint(innerWidth - 2, innerHeight / 2)?.closest('[data-hc-panel=\"prompt\"]')),",
      "    futureVisible: Boolean(future && getComputedStyle(future).visibility !== \"hidden\" && Number(getComputedStyle(future).opacity) > 0),",
      "    futureImageDisplay: getComputedStyle(document.querySelector(\".hc-future-layer\")).display,",
      "    robots: document.querySelector('meta[name=\"robots\"]')?.content || null,",
      "    canonical: document.querySelector('link[rel=\"canonical\"]')?.href,",
      "    title: document.title,",
      "    themeColor: document.querySelector('meta[name=\"theme-color\"]')?.content,",
      "    bodyOverflow: getComputedStyle(document.body).overflow,",
      "  };",
      "})()",
    ].join("\n"),
  );

  assert.deepEqual(state, {
    introCount: 1,
    demoCount: 1,
    promptIdCount: 1,
    state: "prompt",
    publicClass: true,
    reviewClass: true,
    pendingClass: false,
    pageAriaHidden: "true",
    pageInert: true,
    pageVisibility: "hidden",
    pageOpacity: "0",
    promptValue: MASTER_PROMPT,
    promptFocused: true,
    terminalLabel: "COMPUTER · 80×24",
    eraText: "FINAL SHIFT",
    eraVisible: true,
    eraDotPresent: false,
    eraColor: "rgb(214, 138, 154)",
    eraBorderWidth: "0px",
    captionText: "It’s been a good run.",
    captionColor: "rgba(214, 138, 154, 0.64)",
    typingStatusText: TERMINAL_STATUS,
    ratioText: "Life, rebalanced. 99% human conversation + shared experiences 1% screen time",
    ratioVisible: true,
    humanRatioColor: "rgb(214, 138, 154)",
    screenRatioColor: "rgb(91, 143, 212)",
    computerAnimation: "hc-crt-arrive",
    bootLineAnimation: "hc-crt-boot-line",
    screenContentAnimation: "hc-screen-content-in",
    instructionText: TERMINAL_INSTRUCTION,
    oldTerminalPathPresent: false,
    occurrences: 1,
    introCoversViewport: true,
    introOwnsCenter: true,
    promptOwnsRightEdge: true,
    futureVisible: false,
    futureImageDisplay: "none",
    robots: null,
    canonical: "https://humanconversation.com/",
    title: "Human Conversation - Intelligence Around Human Conversation",
    themeColor: "#050608",
    bodyOverflow: "hidden",
  });
  assertRuntimeHealthy();
});

test("public transition isolates prompt accepted from the underlying homepage", async () => {
  await page.navigate(publicUrl());
  await page.waitFor(promptReadyExpression(), { timeout: 4000 });
  await page.evaluate('document.querySelector(\'[data-hc-action="run"]\').click()');
  await page.waitFor('document.querySelector("[data-hc-public-intro]")?.dataset.demoState === "transitioning"');

  const transitionStart = await page.evaluate(`(() => {
    const page = document.querySelector(".page");
    const headline = document.querySelector("#landing-hero h1");
    const transition = document.querySelector('[data-hc-panel="transitioning"]');
    return {
      pageVisibility: getComputedStyle(page).visibility,
      pageOpacity: getComputedStyle(page).opacity,
      headlineVisibility: getComputedStyle(headline).visibility,
      transitionVisible: getComputedStyle(transition).visibility,
      transitionBackground: getComputedStyle(transition).backgroundImage,
      transitionOwnsCenter: Boolean(document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('[data-hc-panel="transitioning"]')),
    };
  })()`);

  assert.equal(transitionStart.pageVisibility, "hidden");
  assert.equal(transitionStart.pageOpacity, "0");
  assert.equal(transitionStart.headlineVisibility, "hidden");
  assert.equal(transitionStart.transitionVisible, "visible");
  assert.match(transitionStart.transitionBackground, /hc-art-conversation-intelligence-threshold-20260704\.png/);
  assert.equal(transitionStart.transitionOwnsCenter, true);

  await page.waitFor(
    'Number(getComputedStyle(document.querySelector(".hc-transition-system span")).opacity) > 0.5',
    { timeout: 2000 },
  );
  const acceptedState = await page.evaluate(`(() => ({
    pageVisibility: getComputedStyle(document.querySelector(".page")).visibility,
    headlineVisibility: getComputedStyle(document.querySelector("#landing-hero h1")).visibility,
    acceptedOpacity: Number(getComputedStyle(document.querySelector(".hc-transition-system span")).opacity),
    acceptedText: document.querySelector(".hc-transition-system")?.textContent?.replace(/\\s+/g, " ").trim(),
    hasGoLive: /go live/i.test(document.querySelector("[data-hc-public-intro]")?.textContent || ""),
  }))()`);
  assert.equal(acceptedState.pageVisibility, "hidden");
  assert.equal(acceptedState.headlineVisibility, "hidden");
  assert.ok(acceptedState.acceptedOpacity > 0.5);
  assert.equal(acceptedState.acceptedText, "prompt accepted");
  assert.equal(acceptedState.hasGoLive, false);

  await page.waitFor('!document.querySelector("[data-hc-public-intro]")', { timeout: 3000 });
  const revealed = await page.evaluate(`({
    pageVisibility: getComputedStyle(document.querySelector(".page")).visibility,
    pageOpacity: getComputedStyle(document.querySelector(".page")).opacity,
  })`);
  assert.deepEqual(revealed, { pageVisibility: "visible", pageOpacity: "1" });
  assertRuntimeHealthy();
});

test("Enter and Run both reveal the unchanged current homepage without navigating", async () => {
  const cases = [
    { action: "enter", query: "", expectedSearch: "", reduced: false },
    {
      action: "run",
      query: "?utm_source=public-intro-test&reduceMotion=1",
      expectedSearch: "?utm_source=public-intro-test&reduceMotion=1",
      reduced: true,
    },
  ];

  for (const testCase of cases) {
    await page.navigate(publicUrl(testCase.query));
    await page.waitFor(promptReadyExpression(), { timeout: 4000 });
    const requestsBefore = page.networkRequests.length;
    const startedAt = Date.now();

    if (testCase.action === "enter") {
      await page.evaluate('document.querySelector("#hc-master-prompt").focus()');
      await page.pressEnter();
    } else {
      await page.evaluate('document.querySelector(\'[data-hc-action="run"]\').click()');
    }

    await page.waitFor('!document.querySelector("[data-hc-public-intro]")', { timeout: 4000 });
    const elapsed = Date.now() - startedAt;
    await assertCurrentHomeMatchesBaseline(testCase.action + " reveal");

    const revealed = await page.evaluate(
      [
        "(() => {",
        "  const page = document.querySelector(\".page\");",
        "  return {",
        "    hasIntro: Boolean(document.querySelector(\"[data-hc-public-intro]\")),",
        "    hasDemo: Boolean(document.querySelector(\"[data-hc-demo]\")),",
        "    hasFutureLayer: Boolean(document.querySelector(\".hc-future-layer\")),",
        "    publicClass: document.documentElement.classList.contains(\"hc-public-master-prompt-intro\"),",
        "    reviewClass: document.documentElement.classList.contains(\"hc-master-prompt-review\"),",
        "    pendingClass: document.documentElement.classList.contains(\"hc-public-master-prompt-pending\"),",
        "    pageAriaHidden: page?.hasAttribute(\"aria-hidden\"),",
        "    pageInert: page?.inert,",
        "    pageFocused: document.activeElement === page,",
        "    variant: page?.dataset.variant,",
        "    robots: document.querySelector('meta[name=\"robots\"]')?.content || null,",
        "    themeColor: document.querySelector('meta[name=\"theme-color\"]')?.content,",
        "    path: window.location.pathname,",
        "    search: window.location.search,",
        "    scrollY: window.scrollY,",
        "    bodyOverflow: getComputedStyle(document.body).overflow,",
        "  };",
        "})()",
      ].join("\n"),
    );

    assert.deepEqual(revealed, {
      hasIntro: false,
      hasDemo: false,
      hasFutureLayer: false,
      publicClass: false,
      reviewClass: false,
      pendingClass: false,
      pageAriaHidden: false,
      pageInert: false,
      pageFocused: true,
      variant: "conversation-intelligence-home",
      robots: null,
      themeColor: "#050608",
      path: "/",
      search: testCase.expectedSearch,
      scrollY: 0,
      bodyOverflow: "hidden auto",
    });
    assert.equal(page.networkRequests.length, requestsBefore, testCase.action + " causes no network request");
    if (testCase.reduced) assert.ok(elapsed < 500, "reduced-motion Run reveals the homepage immediately");
    assertRuntimeHealthy();
  }
});

test("public, review, deep-link, and debug route guards stay isolated", async () => {
  for (const suffix of [
    "?utm_source=campaign",
    "?demoState=resolved",
    "?reduceMotion=1",
  ]) {
    await page.navigate(publicUrl(suffix));
    await page.waitFor('Boolean(document.querySelector("[data-hc-public-intro]"))');
    const state = await page.evaluate(
      '({ publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")), state: document.querySelector("[data-hc-public-intro]")?.dataset.demoState, robots: document.querySelector(\'meta[name="robots"]\')?.content || null })',
    );
    assert.deepEqual(state, { publicIntro: true, state: "prompt", robots: null }, suffix);
  }

  for (const suffix of [
    "?review=0",
    "?variant=" + VARIANT,
    "?option=1",
    "#landing-story",
  ]) {
    await page.navigate(publicUrl(suffix));
    const state = await page.evaluate(
      '({ publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")), demo: Boolean(document.querySelector("[data-hc-demo]")), robots: document.querySelector(\'meta[name="robots"]\')?.content || null })',
    );
    assert.deepEqual(state, { publicIntro: false, demo: false, robots: null }, suffix);
  }

  await page.navigate(staticServer.baseUrl + "/404.html");
  assert.equal(
    await page.evaluate('Boolean(document.querySelector("[data-hc-public-intro]"))'),
    false,
  );

  await page.navigate(reviewUrl());
  const reviewState = await page.evaluate(
    '({ publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")), demoCount: document.querySelectorAll("[data-hc-demo]").length, variant: document.querySelector(".page")?.dataset.variant, robots: document.querySelector(\'meta[name="robots"]\')?.content })',
  );
  assert.deepEqual(reviewState, {
    publicIntro: false,
    demoCount: 1,
    variant: VARIANT,
    robots: "noindex,nofollow",
  });
  assertRuntimeHealthy();
});

test("double Run is safe and a fresh page load restores the intro", async () => {
  await page.navigate(publicUrl());
  await page.waitFor(promptReadyExpression(), { timeout: 4000 });
  const requestsBefore = page.networkRequests.length;
  await page.evaluate(
    '(() => { const button = document.querySelector(\'[data-hc-action="run"]\'); button.click(); button.click(); })()',
  );
  await page.waitFor('!document.querySelector("[data-hc-public-intro]")', { timeout: 4000 });

  const revealed = await page.evaluate(
    '({ pages: document.querySelectorAll(".page").length, demos: document.querySelectorAll("[data-hc-demo]").length, variant: document.querySelector(".page")?.dataset.variant, ariaBusy: Boolean(document.querySelector("[aria-busy=true]")) })',
  );
  assert.deepEqual(revealed, {
    pages: 1,
    demos: 0,
    variant: "conversation-intelligence-home",
    ariaBusy: false,
  });
  assert.equal(page.networkRequests.length, requestsBefore);

  await page.navigate(publicUrl());
  await page.waitFor('Boolean(document.querySelector("[data-hc-public-intro]"))');
  assert.equal(
    await page.evaluate('document.querySelector("[data-hc-public-intro]")?.dataset.demoState'),
    "prompt",
  );
  assertRuntimeHealthy();
});

test("public prompt and revealed homepage stay horizontally safe across required sizes", async () => {
  const sizes = [
    [1440, 900],
    [1280, 800],
    [430, 932],
    [390, 844],
    [375, 667],
    [320, 800],
  ];

  for (const [width, height] of sizes) {
    await page.setViewport(width, height);
    await page.navigate(publicUrl("?reduceMotion=1"));
    await page.waitFor(`window.location.search === "?reduceMotion=1" && ${promptReadyExpression()}`, { timeout: 1000 });

    const promptLayout = await page.evaluate(
      [
        "(() => {",
        "  const action = document.querySelector('[data-hc-action=\"run\"]');",
        "  const rect = action?.getBoundingClientRect();",
        "  const eraRect = document.querySelector(\".hc-terminal-era\")?.getBoundingClientRect();",
        "  return {",
        "    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,",
        "    actionWidth: rect?.width || 0,",
        "    actionHeight: rect?.height || 0,",
        "    actionLeft: rect?.left ?? -1,",
        "    actionRight: rect?.right ?? -1,",
        "    actionTop: rect?.top ?? -1,",
        "    actionBottom: rect?.bottom ?? -1,",
        "    eraWidth: eraRect?.width || 0,",
        "    eraHeight: eraRect?.height || 0,",
        "    bodyOverflow: getComputedStyle(document.body).overflow,",
        "  };",
        "})()",
      ].join("\n"),
    );
    assert.ok(promptLayout.horizontalOverflow <= 1, width + "x" + height + " prompt has no horizontal overflow");
    assert.ok(
      promptLayout.actionWidth >= 44 && promptLayout.actionHeight >= 44,
      width + "x" + height + " Run is tappable: " + JSON.stringify(promptLayout),
    );
    assert.ok(promptLayout.actionLeft >= -1 && promptLayout.actionRight <= width + 1, width + "x" + height + " Run fits horizontally");
    assert.ok(promptLayout.actionTop >= -1 && promptLayout.actionBottom <= height + 1, width + "x" + height + " Run fits vertically");
    assert.ok(promptLayout.eraWidth > 0 && promptLayout.eraHeight > 0, width + "x" + height + " FINAL SHIFT stays visible");
    assert.equal(promptLayout.bodyOverflow, "hidden");

    await page.evaluate('document.querySelector(\'[data-hc-action="run"]\').click()');
    await page.waitFor('!document.querySelector("[data-hc-public-intro]")', { timeout: 1000 });
    const revealedLayout = await page.evaluate(
      '({ horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, bodyOverflow: getComputedStyle(document.body).overflow, variant: document.querySelector(".page")?.dataset.variant })',
    );
    assert.ok(revealedLayout.horizontalOverflow <= 1, width + "x" + height + " homepage has no horizontal overflow");
    assert.equal(revealedLayout.bodyOverflow, "hidden auto");
    assert.equal(revealedLayout.variant, "conversation-intelligence-home");
    assertRuntimeHealthy();
  }

  await page.setViewport(1440, 900);
  await page.setReducedMotion(false);
});
