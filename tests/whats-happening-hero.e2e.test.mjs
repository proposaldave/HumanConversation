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
const stageRatios = {
  twitter: 0,
  slack: 0.47,
  human: 0.84,
};

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

async function showStage(stage) {
  const ratio = stageRatios[stage];
  await page.evaluate(`(() => {
    const hero = document.querySelector("#landing-hero");
    const travel = Math.max(hero.offsetHeight - innerHeight, 1);
    window.scrollTo({ top: travel * ${ratio}, behavior: "instant" });
  })()`);
  await page.waitFor(
    `document.querySelector("#landing-hero")?.dataset.communityStage === "${stage}" && Number(getComputedStyle(document.querySelector(".community-stage-${stage}")).opacity) > 0.95`,
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

test("the hidden review tells one verified Twitter, Slack, and Human Conversation story", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

  const state = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const pageRoot = document.querySelector(".page");
    const hero = document.querySelector("#landing-hero");
    const allText = normalize(document.body.textContent);
    const humanLines = Array.from(document.querySelectorAll(".community-human-copy > span"))
      .map((line) => normalize(line.textContent));
    return {
      variant: pageRoot?.dataset.variant,
      heroTheme: pageRoot?.dataset.heroTheme,
      heroClass: hero?.className,
      stage: hero?.dataset.communityStage,
      robots: document.querySelector('meta[name="robots"]')?.content,
      progress: Array.from(document.querySelectorAll(".community-progress > span"))
        .map((item) => normalize(item.textContent)),
      twitterQuestion: normalize(document.querySelector(".community-stage-twitter .community-question")?.textContent),
      twitterStory: normalize(document.querySelector(".community-stage-twitter .community-platform-story")?.textContent),
      twitterDate: document.querySelector(".community-twitter-artifact time")?.getAttribute("datetime"),
      slackQuestion: normalize(document.querySelector(".community-stage-slack .community-question")?.textContent),
      slackStory: normalize(document.querySelector(".community-stage-slack .community-platform-story")?.textContent),
      slackLabel: normalize(document.querySelector(".community-stage-slack .community-platform small")?.textContent),
      humanLabel: normalize(document.querySelector(".community-human-label")?.textContent),
      humanLines,
      dataSentence: normalize(document.querySelector(".community-data-line")?.textContent),
      twist: normalize(document.querySelector(".community-twist")?.textContent),
      cueDismissed: document.querySelector("#landing-hero .story-cue")?.classList.contains("is-dismissed"),
      cueLabel: document.querySelector("#landing-hero .story-cue")?.getAttribute("aria-label"),
      heroLabel: document.querySelector("#landing-hero h1")?.getAttribute("aria-label"),
      contactDisplay: getComputedStyle(document.querySelector("#email-capture")).display,
      storyHidden: document.querySelector("#landing-story")?.hidden,
      storySections: document.querySelectorAll("#landing-story .story-section, #landing-story .story-final").length,
      demoCount: document.querySelectorAll("[data-hc-demo], [data-hc-public-intro]").length,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      removedRejectedCopy:
        !allText.includes("The digital town square found its question") &&
        !allText.includes("The real world already had the answer") &&
        !allText.includes("One question became the pulse"),
      heroHeight: hero?.offsetHeight || 0,
    };
  })()`);

  assert.deepEqual(state, {
    variant: VARIANT,
    heroTheme: "community-pulse",
    heroClass: "hero hero-community-pulse",
    stage: "twitter",
    robots: "noindex,nofollow",
    progress: ["2009", "2014", "2026"],
    twitterQuestion: "What’s happening?",
    twitterStory: "",
    twitterDate: "2009-11-19",
    slackQuestion: "What’s happening?",
    slackStory: "Slack brought the same pulse inside the organization.",
    slackLabel: "The organization",
    humanLabel: "2026 · Real-world social communities",
    humanLines: [
      "Human Conversation",
      "doesn’t get between us —",
      "it brings us together.",
    ],
    dataSentence: "",
    twist: "But with a twist.",
    cueDismissed: false,
    cueLabel: "Show 2014",
    heroLabel:
      "In 2009, Twitter made What’s happening? the pulse of digital communities. In 2014, Slack brought the same pulse inside the organization. In 2026, Human Conversation doesn’t get between us—it brings us together.",
    contactDisplay: "none",
    storyHidden: true,
    storySections: 0,
    demoCount: 0,
    horizontalOverflow: 0,
    removedRejectedCopy: true,
    heroHeight: state.heroHeight,
  });
  assert.ok(state.heroHeight >= 900 * 3.15, "three-stage hero has enough scroll room");
  assertRuntimeHealthy();
});

test("the question travels through Twitter, Slack, and the real world", async () => {
  const opacityState = async () =>
    page.evaluate(`(() => ({
      twitter: Number(getComputedStyle(document.querySelector(".community-stage-twitter")).opacity),
      slack: Number(getComputedStyle(document.querySelector(".community-stage-slack")).opacity),
      human: Number(getComputedStyle(document.querySelector(".community-stage-human")).opacity),
      lede: Number(getComputedStyle(document.querySelector("#landing-hero .lede")).opacity),
      humanBackground: getComputedStyle(document.querySelector(".community-stage-human"), "::before").backgroundImage,
    }))()`);

  let opacity = await opacityState();
  assert.ok(opacity.twitter > 0.95 && opacity.slack < 0.05 && opacity.human < 0.05);

  await showStage("slack");
  opacity = await opacityState();
  assert.ok(opacity.twitter < 0.05 && opacity.slack > 0.95 && opacity.human < 0.05);

  await showStage("human");
  await page.waitFor(`Number(getComputedStyle(document.querySelector("#landing-hero .lede")).opacity) > 0.95`);
  opacity = await opacityState();
  assert.ok(opacity.twitter < 0.05 && opacity.slack < 0.05 && opacity.human > 0.95);
  assert.ok(opacity.lede > 0.95);
  assert.match(opacity.humanBackground, /hc-art-intelligence-brings-together-20260705\.png/);
  assertRuntimeHealthy();
});

test("the hero button advances 2009 to 2014 to 2026", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

  await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "slack"`);
  assert.equal(
    await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.getAttribute("aria-label")`),
    "Show 2026",
  );

  await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "human"`);
  assert.equal(
    await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.getAttribute("aria-label")`),
    "Continue to the Human Conversation story",
  );
  assertRuntimeHealthy();
});

test("all three beats stay premium and viewport-safe on desktop and narrow phones", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

    for (const stage of ["twitter", "slack", "human"]) {
      await showStage(stage);
      if (stage === "human") {
        await page.waitFor(`Number(getComputedStyle(document.querySelector("#landing-hero .lede")).opacity) > 0.95`);
      }
      const layout = await page.evaluate(`(() => {
        const stage = document.querySelector(".community-stage-${stage}");
        const primary = stage.querySelector(".community-stage-content, .community-human-copy");
        const artifact = stage.querySelector(".community-artifact");
        const lede = document.querySelector("#landing-hero .lede");
        const rect = (element) => element ? ({
          top: element.getBoundingClientRect().top,
          right: element.getBoundingClientRect().right,
          bottom: element.getBoundingClientRect().bottom,
          left: element.getBoundingClientRect().left,
        }) : null;
        return {
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          stage: document.querySelector("#landing-hero")?.dataset.communityStage,
          primary: rect(primary),
          artifact: rect(artifact),
          lede: "${stage}" === "human" ? rect(lede) : null,
          heroHeight: document.querySelector("#landing-hero")?.offsetHeight || 0,
        };
      })()`);

      const assertFits = (rect, label) => {
        assert.ok(rect.top >= -1 && rect.bottom <= height + 1, `${width}x${height} ${label} does not fit vertically`);
        assert.ok(rect.left >= -1 && rect.right <= width + 1, `${width}x${height} ${label} does not fit horizontally`);
      };

      assert.equal(layout.stage, stage);
      assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} ${stage} overflows horizontally`);
      assertFits(layout.primary, `${stage} copy`);
      if (layout.artifact) assertFits(layout.artifact, `${stage} artifact`);
      if (layout.lede) assertFits(layout.lede, `${stage} twist`);
      assert.ok(layout.heroHeight >= height * 3.15, `${width}x${height} is not a true three-stage hero`);
      assertRuntimeHealthy();
    }
  }
});

test("the public story resolves the twist with the existing interface thesis", async () => {
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
      heroStage: document.querySelector("#landing-hero")?.dataset.communityStage,
      sectionCount: sections.length,
      firstTitle: title(sections[0]),
      firstBody: normalize(sections[0]?.querySelector(".story-body")?.textContent),
      secondTitle: title(sections[1]),
      cueDismissed: cue?.classList.contains("is-dismissed"),
      cueLabel: cue?.getAttribute("aria-label"),
      bannedCopyPresent: normalize(document.body.textContent).includes("The digital town square found its question"),
    };
  })()`);

  assert.deepEqual(sequence, {
    variant: PUBLIC_VARIANT,
    heroClass: "hero hero-community-pulse",
    heroStage: "twitter",
    sectionCount: 12,
    firstTitle:
      "The twist For decades, interfaces have pulled conversation onto screens. We’re doing the opposite.",
    firstBody: "Building the intelligence around human conversation.",
    secondTitle:
      "We're not lonely because communication disappeared. We're lonely because interfaces replaced Human Conversation.",
    cueDismissed: false,
    cueLabel: "Show 2014",
    bannedCopyPresent: false,
  });

  await showStage("human");
  await page.waitFor(`!document.querySelector("#landing-hero .story-cue")?.classList.contains("is-dismissed")`);

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
