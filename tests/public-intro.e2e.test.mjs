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
    const twitterSolved = hero?.querySelector(".community-twitter-status-solved");
    const slackSolved = hero?.querySelector(".community-slack-status-solved");
    const humanUnsolved = hero?.querySelector(".community-human-status-unsolved");
    const storyText = normalize(document.querySelector("#landing-story"));
    const markers = ${JSON.stringify(baseline.storyMarkers)};
    return {
      variant: pageRoot?.dataset.variant,
      heroTheme: pageRoot?.dataset.heroTheme,
      heroClass: hero?.className,
      heroStage: hero?.dataset.communityStage,
      headlineLabel: hero?.querySelector("h1")?.getAttribute("aria-label"),
      headlineText: normalize(hero?.querySelector("h1")),
      twitterStatus: normalize(hero?.querySelector(".community-twitter-status")),
      twitterSolvedColor: twitterSolved ? getComputedStyle(twitterSolved).color : null,
      twitterMarketValuePresent: Boolean(hero?.querySelector(".community-stage-twitter .community-market-value")),
      slackStatus: normalize(hero?.querySelector(".community-slack-status")),
      slackSolvedColor: slackSolved ? getComputedStyle(slackSolved).color : null,
      slackMarketValuePresent: Boolean(hero?.querySelector(".community-stage-slack .community-market-value")),
      humanStatus: normalize(hero?.querySelector(".community-human-status")),
      humanUnsolvedColor: humanUnsolved ? getComputedStyle(humanUnsolved).color : null,
      humanMarketValuePresent: Boolean(hero?.querySelector(".community-stage-human .community-market-value")),
      statusArrowCount: hero?.querySelectorAll(
        ".community-twitter-status-arrow, .community-slack-status-arrow, .community-human-status-arrow",
      ).length,
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
    twitterStatus: "Digital Communities ✓ Visible to technology",
    twitterSolvedColor: "rgb(105, 221, 160)",
    twitterMarketValuePresent: false,
    slackStatus: "Organizations ✓ Visible to technology",
    slackSolvedColor: "rgb(105, 221, 160)",
    slackMarketValuePresent: false,
    humanStatus: "Real-world social networks ✕ Real connection is still invisible to technology",
    humanUnsolvedColor: "rgb(255, 129, 122)",
    humanMarketValuePresent: false,
    statusArrowCount: 0,
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

test("the retired review screens fall back to the current public story", async () => {
  const retiredVariants = [
    "solves",
    "solves-revert-20260701",
    "thousand-taps",
    "connection-data",
    "community-os",
    "communication-technology",
    "human-ai-community-os",
    "human-ai-brief-talk-act",
  ];

  for (const retiredVariant of retiredVariants) {
    await page.navigate(reviewUrl(retiredVariant));
    await page.waitFor(`document.querySelector(".page")?.dataset.variant === ${JSON.stringify(PUBLIC_VARIANT)}`);

    const state = await page.evaluate(`({
      variant: document.querySelector(".page")?.dataset.variant,
      heroTheme: document.querySelector(".page")?.dataset.heroTheme,
      heroClass: document.querySelector("#landing-hero")?.className,
      headlineLabel: document.querySelector("#landing-hero h1")?.getAttribute("aria-label"),
      storySections: document.querySelectorAll("#landing-story .story-section, #landing-story .story-final").length,
      demoCount: document.querySelectorAll("[data-hc-demo]").length,
      robots: document.querySelector('meta[name="robots"]')?.content || null,
    })`);

    assert.deepEqual(state, {
      variant: PUBLIC_VARIANT,
      heroTheme: "community-pulse",
      heroClass: baseline.heroClass,
      headlineLabel: baseline.headlineLabel,
      storySections: baseline.storySections,
      demoCount: 0,
      robots: null,
    }, retiredVariant);
    assertRuntimeHealthy();
  }
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
      const sections = Array.from(document.querySelectorAll("#landing-story .story-section"));
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")),
        heroHeight: hero?.offsetHeight || 0,
        copyLeft: copy?.left ?? -1,
        copyRight: copy?.right ?? -1,
        copyTop: copy?.top ?? -1,
        copyBottom: copy?.bottom ?? -1,
        marketValuePresent: Boolean(document.querySelector(".community-stage-twitter .community-market-value")),
        sectionCount: sections.length,
        relationalPanelCount: sections.filter((section) => section.classList.contains("is-relational-story-panel")).length,
        imageBackedCount: sections.filter((section) => getComputedStyle(section, "::before").backgroundImage !== "none").length,
        finalFormCount: document.querySelectorAll("#landing-story .story-contact").length,
      };
    })()`);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has no horizontal overflow`);
    assert.equal(layout.publicIntro, false);
    assert.ok(layout.heroHeight >= height * 3.15, `${width}x${height} keeps the three-stage story`);
    assert.ok(layout.copyLeft >= -1 && layout.copyRight <= width + 1, `${width}x${height} copy fits horizontally`);
    assert.ok(layout.copyTop >= -1 && layout.copyBottom <= height + 1, `${width}x${height} copy fits vertically`);
    assert.equal(layout.marketValuePresent, false, `${width}x${height} omits the Twitter valuation callout`);
    assert.equal(layout.sectionCount, 7, `${width}x${height} opens the complete public relational-shift story`);
    assert.equal(layout.relationalPanelCount, 6, `${width}x${height} keeps every public post-crux relational panel`);
    assert.equal(layout.imageBackedCount, 7, `${width}x${height} keeps every public story section image-backed`);
    assert.equal(layout.finalFormCount, 1, `${width}x${height} keeps one final signup form`);
  }
  assertRuntimeHealthy();
});

test("the public Human Conversation question leads into a smaller present-state line above the continuation cue", async () => {
  const expectedQuestion = "What’s happening between us, around us, and within us?";
  const expectedSupport = "Complex systems need to see the reality about what’s happening — to know what to do next.";

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(publicUrl("?reduceMotion=1"));
    await page.waitFor('document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"');
    await page.evaluate('document.querySelector(".community-progress [data-era=human]")?.click()');
    await page.waitFor(
      'document.querySelector("#landing-hero")?.dataset.communityStage === "human" && Number(getComputedStyle(document.querySelector("#landing-hero .lede")).opacity) > 0.95',
    );

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const question = document.querySelector(".community-stage-human .community-question");
      const twitterQuestion = document.querySelector(".community-stage-twitter .community-question");
      const slackQuestion = document.querySelector(".community-stage-slack .community-question");
      const support = document.querySelector("#landing-hero .community-human-support");
      const twist = document.querySelector("#landing-hero .community-twist");
      const followArrow = document.querySelector("#landing-hero .community-follow-arrow");
      const storyCue = document.querySelector("#landing-hero .story-cue");
      const progress = document.querySelector("#landing-hero .community-progress");
      const platform = document.querySelector(".community-stage-human .community-platform");
      const questionRect = question?.getBoundingClientRect();
      const supportRect = support?.getBoundingClientRect();
      const arrowRect = followArrow?.getBoundingClientRect();
      const cueRect = storyCue?.getBoundingClientRect();
      const progressRect = progress?.getBoundingClientRect();
      const platformRect = platform?.getBoundingClientRect();
      return {
        question: normalize(question?.textContent),
        support: normalize(support?.textContent),
        historicalPrompt: normalize(document.querySelector(".community-artifact-question")?.textContent),
        twistPresent: Boolean(twist),
        followArrowPresent: Boolean(followArrow),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        questionLeft: questionRect?.left ?? -1,
        questionRight: questionRect?.right ?? -1,
        questionTop: questionRect?.top ?? -1,
        questionBottom: questionRect?.bottom ?? -1,
        questionFontSize: Number.parseFloat(question ? getComputedStyle(question).fontSize : "0"),
        twitterQuestionFontSize: Number.parseFloat(twitterQuestion ? getComputedStyle(twitterQuestion).fontSize : "0"),
        slackQuestionFontSize: Number.parseFloat(slackQuestion ? getComputedStyle(slackQuestion).fontSize : "0"),
        supportLeft: supportRect?.left ?? -1,
        supportRight: supportRect?.right ?? -1,
        supportTop: supportRect?.top ?? -1,
        supportBottom: supportRect?.bottom ?? -1,
        supportFontSize: Number.parseFloat(support ? getComputedStyle(support).fontSize : "0"),
        arrowTop: arrowRect?.top ?? -1,
        cueTop: cueRect?.top ?? -1,
        progressBottom: progressRect?.bottom ?? -1,
        platformTop: platformRect?.top ?? -1,
      };
    })()`);

    assert.equal(layout.question, expectedQuestion);
    assert.equal(layout.support, expectedSupport);
    assert.equal(layout.historicalPrompt, "What\u2019s happening?");
    assert.equal(layout.twistPresent, false);
    assert.equal(layout.followArrowPresent, true);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has no horizontal overflow`);
    assert.ok(layout.questionLeft >= -1 && layout.questionRight <= width + 1, `${width}x${height} question fits horizontally`);
    assert.ok(layout.questionTop >= -1 && layout.questionBottom <= height + 1, `${width}x${height} question fits vertically`);
    assert.ok(layout.supportLeft >= -1 && layout.supportRight <= width + 1, `${width}x${height} supporting line fits horizontally`);
    assert.ok(layout.supportTop >= -1 && layout.supportBottom <= height + 1, `${width}x${height} supporting line fits vertically`);
    assert.ok(layout.supportFontSize >= 16, `${width}x${height} supporting line uses the increased readable scale`);
    assert.ok(layout.supportFontSize < layout.questionFontSize, `${width}x${height} supporting line is smaller than the question`);
    if (width > 760) {
      assert.equal(layout.questionFontSize, layout.twitterQuestionFontSize, `${width}x${height} Human Conversation question matches Twitter scale`);
      assert.equal(layout.questionFontSize, layout.slackQuestionFontSize, `${width}x${height} Human Conversation question matches Slack scale`);
    } else {
      assert.ok(
        layout.platformTop >= layout.progressBottom + 8,
        `${width}x${height} Human Conversation identity clears the timeline: ${JSON.stringify(layout)}`,
      );
      assert.ok(
        layout.questionFontSize <= 56,
        `${width}x${height} Human Conversation question keeps a phone-safe scale: ${JSON.stringify(layout)}`,
      );
    }
    assert.ok(layout.questionBottom < layout.supportTop, `${width}x${height} question stays above the supporting line: ${JSON.stringify(layout)}`);
    assert.ok(layout.supportBottom < layout.arrowTop, `${width}x${height} supporting line stays above the continuation arrow`);
    assert.ok(layout.arrowTop < layout.cueTop, `${width}x${height} continuation arrow stays clear of the circular control: ${JSON.stringify(layout)}`);
  }

  assertRuntimeHealthy();
});

test("the public Slack visibility status stays within every supported viewport", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(publicUrl("?reduceMotion=1"));
    await page.waitFor('document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"');
    await page.evaluate('document.querySelector(".community-progress [data-era=slack]")?.click()');
    await page.waitFor(
      'document.querySelector("#landing-hero")?.dataset.communityStage === "slack" && Number(getComputedStyle(document.querySelector(".community-stage-slack")).opacity) > 0.95',
    );

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const status = document.querySelector(".community-slack-status");
      const solved = document.querySelector(".community-slack-status-solved");
      const question = document.querySelector(".community-stage-slack .community-question");
      const rect = status?.getBoundingClientRect();
      const questionRect = question?.getBoundingClientRect();
      return {
        stage: document.querySelector("#landing-hero")?.dataset.communityStage,
        status: normalize(status?.textContent),
        question: normalize(question?.textContent),
        solvedColor: solved ? getComputedStyle(solved).color : null,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        left: rect?.left ?? -1,
        right: rect?.right ?? -1,
        top: rect?.top ?? -1,
        bottom: rect?.bottom ?? -1,
        questionLeft: questionRect?.left ?? -1,
        questionRight: questionRect?.right ?? -1,
        questionTop: questionRect?.top ?? -1,
        questionBottom: questionRect?.bottom ?? -1,
        marketValuePresent: Boolean(document.querySelector(".community-stage-slack .community-market-value")),
      };
    })()`);

    assert.equal(layout.stage, "slack");
    assert.equal(layout.status, "Organizations ✓ Visible to technology");
    assert.equal(layout.question, "What’s happening at work?");
    assert.equal(layout.marketValuePresent, false, `${width}x${height} omits the Slack valuation callout`);
    assert.equal(layout.solvedColor, "rgb(105, 221, 160)");
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has no horizontal overflow`);
    assert.ok(layout.left >= -1 && layout.right <= width + 1, `${width}x${height} Slack status fits horizontally`);
    assert.ok(layout.top >= -1 && layout.bottom <= height + 1, `${width}x${height} Slack status fits vertically`);
    assert.ok(layout.questionLeft >= -1 && layout.questionRight <= width + 1, `${width}x${height} Slack question fits horizontally`);
    assert.ok(layout.questionTop >= -1 && layout.questionBottom <= height + 1, `${width}x${height} Slack question fits vertically`);
  }

  assertRuntimeHealthy();
});

test("the public Human Conversation invisibility status stays within every supported viewport", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(publicUrl("?reduceMotion=1"));
    await page.waitFor('document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"');
    await page.evaluate('document.querySelector(".community-progress [data-era=human]")?.click()');
    await page.waitFor(
      'document.querySelector("#landing-hero")?.dataset.communityStage === "human" && Number(getComputedStyle(document.querySelector(".community-stage-human")).opacity) > 0.95',
    );

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const status = document.querySelector(".community-human-status");
      const unsolved = document.querySelector(".community-human-status-unsolved");
      const rect = status?.getBoundingClientRect();
      return {
        stage: document.querySelector("#landing-hero")?.dataset.communityStage,
        status: normalize(status?.textContent),
        unsolvedColor: unsolved ? getComputedStyle(unsolved).color : null,
        marketValuePresent: Boolean(document.querySelector(".community-stage-human .community-market-value")),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        left: rect?.left ?? -1,
        right: rect?.right ?? -1,
        top: rect?.top ?? -1,
        bottom: rect?.bottom ?? -1,
      };
    })()`);

    assert.equal(layout.stage, "human");
    assert.equal(layout.status, "Real-world social networks ✕ Real connection is still invisible to technology");
    assert.equal(layout.unsolvedColor, "rgb(255, 129, 122)");
    assert.equal(layout.marketValuePresent, false, "2026 remains the unpriced, still-invisible payoff");
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has no horizontal overflow`);
    assert.ok(layout.left >= -1 && layout.right <= width + 1, `${width}x${height} Human Conversation status fits horizontally`);
    assert.ok(layout.top >= -1 && layout.bottom <= height + 1, `${width}x${height} Human Conversation status fits vertically`);
  }

  assertRuntimeHealthy();
});
