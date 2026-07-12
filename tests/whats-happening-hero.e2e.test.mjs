import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { launchChrome, startStaticServer } from "./helpers/chrome-cdp.mjs";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(TEST_DIRECTORY);
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, "dist");
const VARIANT = "whats-happening-real-world";
const PUBLIC_VARIANT = "conversation-intelligence-home";
const DATA_SENTENCE =
  "All the human, social, relationship, and community data moves through human conversation.";

let staticServer;
let chrome;
let page;

function reviewUrl(variant = VARIANT) {
  return `${staticServer.baseUrl}/?review=1&variant=${variant}`;
}

function assertRuntimeHealthy() {
  assert.deepEqual(page.exceptions, [], "no uncaught browser exceptions");
  assert.deepEqual(page.consoleErrors, [], "no browser console errors");
}

async function revealHumanStage() {
  await page.evaluate(`(() => {
    const hero = document.querySelector("#landing-hero");
    const travel = Math.max(hero.offsetHeight - innerHeight, 1);
    window.scrollTo({ top: travel * 0.78, behavior: "instant" });
  })()`);
  await page.waitFor(
    `document.querySelector("#landing-hero")?.dataset.twitterStage === "human" && Number(getComputedStyle(document.querySelector(".whats-stage-human")).opacity) > 0.95`,
  );
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

test("the opening celebrates Twitter's digital-community breakthrough", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector(".page")?.dataset.variant === "${VARIANT}"`);

  const state = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const pageRoot = document.querySelector(".page");
    const hero = document.querySelector("#landing-hero");
    const screen = document.querySelector(".whats-crt-screen");
    const email = document.querySelector(".header-email");
    const emailRect = email?.getBoundingClientRect();
    const allText = normalize(document.body.textContent);
    return {
      variant: pageRoot?.dataset.variant,
      heroTheme: pageRoot?.dataset.heroTheme,
      stage: hero?.dataset.twitterStage,
      robots: document.querySelector('meta[name="robots"]')?.content,
      dateText: normalize(document.querySelector(".whats-crt-meta")?.textContent),
      dateTime: document.querySelector(".whats-crt-meta time")?.getAttribute("datetime"),
      question: normalize(document.querySelector(".whats-crt-question")?.textContent),
      composerFieldPresent: Boolean(document.querySelector(".whats-crt-input")),
      proof: normalize(document.querySelector(".whats-digital-proof")?.textContent),
      heroLabel: document.querySelector("#landing-hero h1")?.getAttribute("aria-label"),
      lede: normalize(document.querySelector(".lede")?.textContent),
      digitalOpacity: getComputedStyle(document.querySelector(".whats-stage-digital")).opacity,
      humanOpacity: getComputedStyle(document.querySelector(".whats-stage-human")).opacity,
      screenColor: getComputedStyle(screen).backgroundColor,
      contactDisplay: getComputedStyle(document.querySelector("#email-capture")).display,
      storyHidden: document.querySelector("#landing-story")?.hidden,
      storySections: document.querySelectorAll("#landing-story .story-section, #landing-story .story-final").length,
      demoCount: document.querySelectorAll("[data-hc-demo], [data-hc-public-intro]").length,
      emailVisible: Boolean(emailRect?.width && emailRect?.height),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      removedDigitalTownSquareLine: !allText.includes("The digital town square found its question"),
      removedWrongAnswerLine: !allText.includes("The real world already had the answer"),
      heroHeight: hero?.offsetHeight || 0,
    };
  })()`);

  assert.deepEqual(state, {
    variant: VARIANT,
    heroTheme: VARIANT,
    stage: "digital",
    robots: "noindex,nofollow",
    dateText: "twitter Nov 19 · 2009",
    dateTime: "2009-11-19",
    question: "What’s happening?",
    composerFieldPresent: true,
    proof: "One question became the pulse of digital communities.",
    heroLabel:
      "In 2009, Twitter made What’s happening? the pulse of digital communities. Human Conversation is the What’s happening? of real-world communities.",
    lede: DATA_SENTENCE,
    digitalOpacity: "1",
    humanOpacity: "0",
    screenColor: "rgb(242, 242, 242)",
    contactDisplay: "none",
    storyHidden: true,
    storySections: 0,
    demoCount: 0,
    emailVisible: true,
    horizontalOverflow: 0,
    removedDigitalTownSquareLine: true,
    removedWrongAnswerLine: true,
    heroHeight: state.heroHeight,
  });
  assert.ok(state.heroHeight >= 900 * 1.75, "two-stage hero has enough scroll room");
  assertRuntimeHealthy();
});

test("the same question transforms into Human Conversation for real-world communities", async () => {
  await revealHumanStage();

  const state = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const hero = document.querySelector("#landing-hero");
    const inner = hero.querySelector(".hero-inner");
    return {
      stage: hero.dataset.twitterStage,
      answer: normalize(document.querySelector(".whats-answer")?.textContent),
      category: normalize(document.querySelector(".whats-category")?.textContent),
      lede: normalize(document.querySelector(".lede")?.textContent),
      humanOpacity: getComputedStyle(document.querySelector(".whats-stage-human")).opacity,
      digitalOpacity: getComputedStyle(document.querySelector(".whats-stage-digital")).opacity,
      backgroundImage: getComputedStyle(inner, "::after").backgroundImage,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);

  assert.equal(state.stage, "human");
  assert.equal(state.answer, "Human Conversation");
  assert.equal(state.category, "is the “What’s happening?” of real-world communities.");
  assert.equal(state.lede, DATA_SENTENCE);
  assert.ok(Number(state.humanOpacity) > 0.95);
  assert.ok(Number(state.digitalOpacity) < 0.05);
  assert.match(state.backgroundImage, /hc-art-intelligence-brings-together-20260705\.png/);
  assert.ok(state.horizontalOverflow <= 1);
  assertRuntimeHealthy();
});

test("both stages stay clean and viewport-safe from desktop to narrow phone", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.waitFor(`document.querySelector("#landing-hero")?.dataset.twitterStage === "digital"`);

    const digital = await page.evaluate(`(() => {
      const rect = document.querySelector(".whats-digital-grid")?.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        top: rect?.top ?? -1,
        right: rect?.right ?? -1,
        bottom: rect?.bottom ?? -1,
        left: rect?.left ?? -1,
        heroHeight: document.querySelector("#landing-hero")?.offsetHeight || 0,
      };
    })()`);

    assert.ok(digital.horizontalOverflow <= 1, `${width}x${height} digital stage overflows horizontally`);
    assert.ok(digital.top >= -1 && digital.bottom <= height + 1, `${width}x${height} digital stage does not fit vertically`);
    assert.ok(digital.left >= -1 && digital.right <= width + 1, `${width}x${height} digital stage does not fit horizontally`);
    assert.ok(digital.heroHeight >= height * 1.75, `${width}x${height} hero is not truly two-stage`);

    await revealHumanStage();
    const human = await page.evaluate(`(() => {
      const copy = document.querySelector(".whats-human-copy")?.getBoundingClientRect();
      const lede = document.querySelector("#landing-hero .lede")?.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        copyTop: copy?.top ?? -1,
        copyRight: copy?.right ?? -1,
        copyBottom: copy?.bottom ?? -1,
        copyLeft: copy?.left ?? -1,
        ledeTop: lede?.top ?? -1,
        ledeRight: lede?.right ?? -1,
        ledeBottom: lede?.bottom ?? -1,
        ledeLeft: lede?.left ?? -1,
      };
    })()`);

    assert.ok(human.horizontalOverflow <= 1, `${width}x${height} human stage overflows horizontally`);
    assert.ok(human.copyTop >= -1 && human.copyBottom <= height + 1, `${width}x${height} human copy does not fit vertically`);
    assert.ok(human.copyLeft >= -1 && human.copyRight <= width + 1, `${width}x${height} human copy does not fit horizontally`);
    assert.ok(human.ledeTop >= -1 && human.ledeBottom <= height + 1, `${width}x${height} human data sentence does not fit vertically`);
    assert.ok(human.ledeLeft >= -1 && human.ledeRight <= width + 1, `${width}x${height} human data sentence does not fit horizontally`);
    assertRuntimeHealthy();
  }
});

test("the public sequence leads directly into the interfaces-opposite section", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl(PUBLIC_VARIANT));
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 12`);

  const sequence = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const title = (section) => Array.from(section.querySelectorAll(".story-title > span"))
      .map((line) => normalize(line.textContent)).join(" ");
    const sections = Array.from(document.querySelectorAll("#landing-story .story-section"));
    const cue = document.querySelector("#landing-hero .story-cue");
    return {
      variant: document.querySelector(".page")?.dataset.variant,
      heroClass: document.querySelector("#landing-hero")?.className,
      heroStage: document.querySelector("#landing-hero")?.dataset.twitterStage,
      sectionCount: sections.length,
      firstTitle: title(sections[0]),
      firstBody: normalize(sections[0]?.querySelector(".story-body")?.textContent),
      secondTitle: title(sections[1]),
      cueDisplay: getComputedStyle(cue).display,
      cueLabel: cue?.getAttribute("aria-label"),
      bannedCopyPresent: normalize(document.body.textContent).includes("The digital town square found its question"),
    };
  })()`);

  assert.deepEqual(sequence, {
    variant: PUBLIC_VARIANT,
    heroClass: "hero hero-whats-happening-real-world",
    heroStage: "digital",
    sectionCount: 12,
    firstTitle:
      "For decades, interfaces have pulled conversation onto screens. We’re doing the opposite.",
    firstBody: "Building the intelligence around human conversation.",
    secondTitle:
      "We're not lonely because communication disappeared. We're lonely because Human Conversation got replaced.",
    cueDisplay: sequence.cueDisplay,
    cueLabel: "Continue to the Human Conversation story",
    bannedCopyPresent: false,
  });
  assert.notEqual(sequence.cueDisplay, "none", "the opening keeps its story cue");

  await page.evaluate(`document.querySelector("#landing-story .story-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);
  await page.waitFor(`Math.abs(document.querySelector("#landing-story .story-section")?.getBoundingClientRect().top ?? 9999) < 3`);
  const firstPanel = await page.evaluate(`(() => {
    const section = document.querySelector("#landing-story .story-section");
    const title = section.querySelector(".story-title").getBoundingClientRect();
    return {
      top: section.getBoundingClientRect().top,
      height: section.getBoundingClientRect().height,
      titleTop: title.top,
      titleBottom: title.bottom,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);

  assert.ok(Math.abs(firstPanel.top) < 3);
  assert.ok(firstPanel.height >= 899);
  assert.ok(firstPanel.titleTop >= -1 && firstPanel.titleBottom <= 901);
  assert.ok(firstPanel.horizontalOverflow <= 1);
  assertRuntimeHealthy();
});
