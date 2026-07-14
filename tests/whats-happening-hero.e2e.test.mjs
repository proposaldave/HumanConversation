import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { launchChrome, startStaticServer } from "./helpers/chrome-cdp.mjs";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(TEST_DIRECTORY);
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, "dist");
const PUBLIC_VARIANT = "conversation-intelligence-home";
const VARIANT = PUBLIC_VARIANT;
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

test("the public landing page tells one verified Twitter, Slack, and Human Conversation story", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

  const state = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const pageRoot = document.querySelector(".page");
    const hero = document.querySelector("#landing-hero");
    const allText = normalize(document.body.textContent);
    return {
      variant: pageRoot?.dataset.variant,
      heroTheme: pageRoot?.dataset.heroTheme,
      heroClass: hero?.className,
      stage: hero?.dataset.communityStage,
      progress: Array.from(document.querySelectorAll(".community-progress > button"))
        .map((item) => normalize(item.textContent)),
      twitterLabel: normalize(document.querySelector(".community-stage-twitter .community-platform small")?.textContent),
      twitterQuestion: normalize(document.querySelector(".community-stage-twitter .community-question")?.textContent),
      twitterMarketValuePresent: Boolean(document.querySelector(".community-stage-twitter .community-market-value")),
      twitterDate: document.querySelector(".community-twitter-artifact time")?.getAttribute("datetime"),
      slackQuestion: normalize(document.querySelector(".community-stage-slack .community-question")?.textContent),
      slackMarketValuePresent: Boolean(document.querySelector(".community-stage-slack .community-market-value")),
      slackLabel: normalize(document.querySelector(".community-stage-slack .community-platform small")?.textContent),
      humanBrand: normalize(document.querySelector(".community-human-name")?.textContent),
      humanQuestion: normalize(document.querySelector(".community-stage-human .community-question")?.textContent),
      humanSupport: normalize(document.querySelector(".community-human-support")?.textContent),
      humanMarkParts: document.querySelectorAll(".community-human-mark .mark-bubble, .community-human-mark .mark-heart").length,
      dataSentence: normalize(document.querySelector(".community-data-line")?.textContent),
      twist: normalize(document.querySelector(".community-twist")?.textContent),
      followArrow: Boolean(document.querySelector(".community-follow-arrow")),
      cueDismissed: document.querySelector("#landing-hero .story-cue")?.classList.contains("is-dismissed"),
      cueTimelineStep: document.querySelector("#landing-hero .story-cue")?.classList.contains("is-timeline-step"),
      cueText: normalize(document.querySelector("#landing-hero .story-cue-year")?.textContent),
      cueYearPresent: Boolean(document.querySelector("#landing-hero .story-cue-year strong")),
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
      variantTrayPresent: Boolean(document.querySelector(".variant-dots")),
      variantTriggerPresent: Boolean(document.querySelector(".variant-trigger")),
      variantDotCount: document.querySelectorAll(".variant-dot").length,
      heroHeight: hero?.offsetHeight || 0,
    };
  })()`);

  assert.deepEqual(state, {
    variant: PUBLIC_VARIANT,
    heroTheme: "community-pulse",
    heroClass: "hero hero-community-pulse",
    stage: "twitter",
    progress: ["2009", "2014", "2026"],
    twitterLabel: "Digital Communities ✓ Solved",
    twitterQuestion: "What’s happening around the world?",
    twitterMarketValuePresent: false,
    twitterDate: "2009-11-19",
    slackQuestion: "What’s happening inside the organization?",
    slackMarketValuePresent: false,
    slackLabel: "Organizations ✓ Solved",
    humanBrand: "Human Conversation",
    humanQuestion: "What’s happening in our communities?",
    humanSupport: "Every important human system needs a way to understand its present state.",
    humanMarkParts: 3,
    dataSentence: "",
    twist: "",
    followArrow: true,
    cueDismissed: false,
    cueTimelineStep: true,
    cueText: "Next",
    cueYearPresent: false,
    cueLabel: "Go to 2014: Slack",
    heroLabel:
      "2009. Twitter. Digital Communities, solved. What’s happening around the world? 2014. Slack. Organizations, solved. What’s happening inside the organization? 2026. Human Conversation. Real-world social communities, unsolved. What’s happening in our communities? Every important human system needs a way to understand its present state.",
    contactDisplay: "none",
    storyHidden: false,
    storySections: 13,
    demoCount: 0,
    horizontalOverflow: 0,
    removedRejectedCopy: true,
    variantTrayPresent: false,
    variantTriggerPresent: false,
    variantDotCount: 0,
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

test("every timeline year jumps directly to its screen", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

  assert.deepEqual(
    await page.evaluate(`Array.from(document.querySelectorAll(".community-progress > button")).map((button) => ({
      year: button.textContent.trim(),
      label: button.getAttribute("aria-label"),
      current: button.getAttribute("aria-current"),
      tabIndex: button.tabIndex,
    }))`),
    [
      { year: "2009", label: "Go to 2009: Twitter", current: "true", tabIndex: 0 },
      { year: "2014", label: "Go to 2014: Slack", current: "false", tabIndex: 0 },
      { year: "2026", label: "Go to 2026: Human Conversation", current: "false", tabIndex: 0 },
    ],
  );

  await page.evaluate(`document.querySelector('.community-progress [data-era="human"]')?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "human"`);
  assert.equal(
    await page.evaluate(`document.querySelector('.community-progress [data-era="human"]')?.getAttribute("aria-current")`),
    "true",
  );

  await page.evaluate(`document.querySelector('.community-progress [data-era="twitter"]')?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

  await page.evaluate(`document.querySelector('.community-progress [data-era="slack"]')?.focus()`);
  await page.pressEnter();
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "slack"`);
  assert.equal(
    await page.evaluate(`document.querySelector('.community-progress [data-era="slack"]')?.getAttribute("aria-current")`),
    "true",
  );
  assertRuntimeHealthy();
});

test("the hero button advances 2009 to 2014 to 2026", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

  assert.deepEqual(
    await page.evaluate(`(() => {
      const cue = document.querySelector("#landing-hero .story-cue");
      return {
        text: cue?.querySelector(".story-cue-year")?.textContent.trim(),
        yearPresent: Boolean(cue?.querySelector(".story-cue-year strong")),
        timelineStep: cue?.classList.contains("is-timeline-step"),
        label: cue?.getAttribute("aria-label"),
        animation: getComputedStyle(cue?.querySelector(".story-cue-icon"), "::before").animationName,
      };
    })()`),
    { text: "Next", yearPresent: false, timelineStep: true, label: "Go to 2014: Slack", animation: "story-cue-forward" },
  );

  await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "slack"`);
  assert.deepEqual(
    await page.evaluate(`(() => {
      const cue = document.querySelector("#landing-hero .story-cue");
      return {
        text: cue?.querySelector(".story-cue-year")?.textContent.trim(),
        yearPresent: Boolean(cue?.querySelector(".story-cue-year strong")),
        timelineStep: cue?.classList.contains("is-timeline-step"),
        label: cue?.getAttribute("aria-label"),
        animation: getComputedStyle(cue?.querySelector(".story-cue-icon"), "::before").animationName,
      };
    })()`),
    { text: "Next", yearPresent: false, timelineStep: true, label: "Go to 2026: Human Conversation", animation: "story-cue-forward" },
  );

  await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "human"`);
  assert.deepEqual(
    await page.evaluate(`(() => {
      const cue = document.querySelector("#landing-hero .story-cue");
      return {
        text: cue?.querySelector(".story-cue-year")?.textContent.trim(),
        yearPresent: Boolean(cue?.querySelector(".story-cue-year strong")),
        timelineStep: cue?.classList.contains("is-timeline-step"),
        label: cue?.getAttribute("aria-label"),
        animation: getComputedStyle(cue?.querySelector(".story-cue-icon"), "::before").animationName,
      };
    })()`),
    { text: "Next", yearPresent: false, timelineStep: false, label: "Continue down to the Human Conversation story", animation: "story-cue-drop" },
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
        const platform = stage.querySelector(".community-platform");
        const artifact = stage.querySelector(".community-artifact");
        const lede = document.querySelector("#landing-hero .lede");
        const cue = document.querySelector("#landing-hero .story-cue");
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
          platform: rect(platform),
          artifact: rect(artifact),
          cue: rect(cue),
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
      if (layout.platform) assertFits(layout.platform, `${stage} brand`);
      if (layout.artifact) assertFits(layout.artifact, `${stage} artifact`);
      assertFits(layout.cue, `${stage} control`);
      if (layout.lede) assertFits(layout.lede, `${stage} twist`);
      assert.ok(layout.heroHeight >= height * 3.15, `${width}x${height} is not a true three-stage hero`);
      assertRuntimeHealthy();
    }
  }
});

test("the public story resolves the twist with the existing interface thesis", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl(PUBLIC_VARIANT));
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 13`);

  const sequence = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const title = (section) => Array.from(section.querySelectorAll(".story-title > span"))
      .map((line) => normalize(line.textContent)).join(" ");
    const sections = Array.from(document.querySelectorAll("#landing-story .story-section"));
    const cue = document.querySelector("#landing-hero .story-cue");
    const cheskySection = document.querySelector("#landing-story .is-next-interface-section");
    const lonelinessSection = document.querySelector("#landing-story .is-lonely-return-section");
    const humanSurfaceSection = document.querySelector("#landing-story .is-human-surface-section");
    const timelessSection = document.querySelector("#landing-story .is-timeless-fullscreen-section");
    return {
      variant: document.querySelector(".page")?.dataset.variant,
      heroClass: document.querySelector("#landing-hero")?.className,
      heroStage: document.querySelector("#landing-hero")?.dataset.communityStage,
      sectionCount: sections.length,
      firstIsCommunityTruth: sections[0]?.classList.contains("is-community-truth-section"),
      secondIsInterfaceOpposite: sections[1]?.classList.contains("is-interface-opposite-section"),
      firstFlowsDirectlyToSecond: sections[0]?.nextElementSibling === sections[1],
      firstCopy: normalize(sections[0]?.querySelector(".story-copy-block")?.textContent),
      firstTitle: title(sections[0]),
      firstBody: normalize(sections[0]?.querySelector(".story-body")?.textContent),
      secondTitle: title(sections[1]),
      secondBody: normalize(sections[1]?.querySelector(".story-body")?.textContent),
      thirdTitle: title(sections[2]),
      fourthTitle: title(sections[3]),
      fifthTitle: title(sections[4]),
      operatingSystemFlowsToTaps:
        sections[3]?.classList.contains("is-real-world-os-section") &&
        sections[3]?.nextElementSibling === sections[4] &&
        sections[4]?.classList.contains("is-taps-premium-section"),
      lonelinessTitle: title(lonelinessSection),
      humanSurfaceTitle: title(humanSurfaceSection),
      humanSurfaceIntro: normalize(humanSurfaceSection?.querySelector(".human-surface-sectionline")?.textContent),
      lonelinessFlowsToHumanSurface: lonelinessSection?.nextElementSibling === humanSurfaceSection,
      humanSurfaceIsThirdToLast: sections.at(-3) === humanSurfaceSection,
      humanSurfaceFlowsToTimeless: humanSurfaceSection?.nextElementSibling === timelessSection,
      timelessIsSecondToLast: sections.at(-2) === timelessSection,
      timelessFlowsToFuture: timelessSection?.nextElementSibling?.classList.contains("is-final-cta-section"),
      publicCheskySectionPresent: Boolean(cheskySection),
      publicCheskyQuotePresent: Boolean(document.querySelector("#landing-story .story-quote")),
      cueDismissed: cue?.classList.contains("is-dismissed"),
      cueLabel: cue?.getAttribute("aria-label"),
      bannedCopyPresent: normalize(document.body.textContent).includes("The digital town square found its question"),
      finalCtaSideCallout: normalize(document.querySelector("#landing-story .is-final-cta-section .final-cta-side-callout")?.textContent),
    };
  })()`);

  assert.deepEqual(sequence, {
    variant: PUBLIC_VARIANT,
    heroClass: "hero hero-community-pulse",
    heroStage: "twitter",
    sectionCount: 13,
    firstIsCommunityTruth: true,
    secondIsInterfaceOpposite: true,
    firstFlowsDirectlyToSecond: true,
    firstCopy:
      "To know what’s really happening in a community, you have to talk to the people in it. Our human, social, relationship, and community data has always, and will always be communicated through human conversation, not interfaces.",
    firstTitle:
      "To know what’s really happening in a community, you have to talk to the people in it.",
    firstBody:
      "Our human, social, relationship, and community data has always, and will always be communicated through human conversation, not interfaces.",
    secondTitle:
      "For decades, technology has pulled conversations onto interfaces. We’re doing the opposite.",
    secondBody: "Building the intelligence around human conversation.",
    thirdTitle: "Human Conversation solves disconnection.",
    fourthTitle: "Human Conversation is the operating system for real-world social communities.",
    fifthTitle: "A Human Conversation is worth a thousand taps.",
    operatingSystemFlowsToTaps: true,
    lonelinessTitle:
      "We're not lonely because communication disappeared. We're lonely because interfaces replaced Human Conversation.",
    humanSurfaceTitle: "Humans stay above the surface. AI handles underneath.",
    humanSurfaceIntro:
      "Members feel remembered. Builders stay present. The memory, matching, scheduling, follow-up, and logistics move underneath.",
    lonelinessFlowsToHumanSurface: true,
    humanSurfaceIsThirdToLast: true,
    humanSurfaceFlowsToTimeless: true,
    timelessIsSecondToLast: true,
    timelessFlowsToFuture: true,
    publicCheskySectionPresent: false,
    publicCheskyQuotePresent: false,
    cueDismissed: false,
    cueLabel: "Go to 2014: Slack",
    bannedCopyPresent: false,
    finalCtaSideCallout: "The next great interface is the person in front of you.",
  });

  await showStage("human");
  await page.waitFor(`!document.querySelector("#landing-hero .story-cue")?.classList.contains("is-dismissed")`);

  await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
  await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-community-truth-section")?.getBoundingClientRect().top ?? 9999) < 3`);
  await page.waitFor(`document.activeElement === document.querySelector("#landing-story .is-community-truth-section")`);
  assert.equal(
    await page.evaluate(`document.activeElement === document.querySelector("#landing-story .is-community-truth-section")`),
    true,
    "the 2026 hero cue lands on and focuses the community-truth section",
  );

  await page.evaluate(`document.querySelector("#landing-story .is-community-truth-section .section-cue")?.click()`);
  await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-interface-opposite-section")?.getBoundingClientRect().top ?? 9999) < 3`);
  await page.waitFor(`document.activeElement === document.querySelector("#landing-story .is-interface-opposite-section")`);
  assert.equal(
    await page.evaluate(`document.activeElement === document.querySelector("#landing-story .is-interface-opposite-section")`),
    true,
    "the community-truth cue lands on and focuses the interface-opposite section",
  );

  const firstPanel = await page.evaluate(`(() => {
    const section = document.querySelector("#landing-story .is-interface-opposite-section");
    const title = section.querySelector(".story-title").getBoundingClientRect();
    const body = section.querySelector(".story-body");
    const around = body.querySelector(".interface-opposite-build em");
    const bodyRect = body.getBoundingClientRect();
    return {
      top: section.getBoundingClientRect().top,
      height: section.getBoundingClientRect().height,
      titleTop: title.top,
      titleBottom: title.bottom,
      bodyTop: bodyRect.top,
      bodyBottom: bodyRect.bottom,
      bodyDisplay: getComputedStyle(body).display,
      bodyBorderLeft: getComputedStyle(body).borderLeftWidth,
      aroundFontStyle: getComputedStyle(around).fontStyle,
      aroundTransform: getComputedStyle(around).transform,
      arrowLength: Number.parseFloat(getComputedStyle(body, "::before").width),
      arrowHead: getComputedStyle(body, "::after").borderTopWidth,
      imageFilter: getComputedStyle(section, "::before").filter,
      overlayBackground: getComputedStyle(section, "::after").backgroundImage,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);

  assert.ok(Math.abs(firstPanel.top) < 3);
  assert.ok(firstPanel.height >= 899);
  assert.ok(firstPanel.titleTop >= -1 && firstPanel.titleBottom <= 901);
  assert.ok(firstPanel.bodyTop >= -1 && firstPanel.bodyBottom <= 901);
  assert.equal(firstPanel.bodyDisplay, "grid");
  assert.equal(firstPanel.bodyBorderLeft, "0px");
  assert.equal(firstPanel.aroundFontStyle, "italic");
  assert.notEqual(firstPanel.aroundTransform, "none");
  assert.ok(firstPanel.arrowLength >= 58 && firstPanel.arrowLength <= 97);
  assert.equal(firstPanel.arrowHead, "2px");
  assert.match(firstPanel.imageFilter, /brightness\(1\.04\)/);
  assert.match(firstPanel.overlayBackground, /rgba\(3, 5, 8, 0\.89\)/);
  assert.ok(firstPanel.horizontalOverflow <= 1);
  assertRuntimeHealthy();
});

test("the human and AI surface section stays clear on desktop and narrow phones", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(`${reviewUrl(PUBLIC_VARIANT)}&reduceMotion=1`);
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 13`);
    await page.evaluate(`document.querySelector("#landing-story .is-human-surface-section")?.scrollIntoView({ behavior: "instant", block: "start" })`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-human-surface-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const rect = (element) => {
        const box = element?.getBoundingClientRect();
        return box ? { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height } : null;
      };
      const sections = Array.from(document.querySelectorAll("#landing-story .story-section"));
      const section = document.querySelector("#landing-story .is-human-surface-section");
      const title = section?.querySelector(".human-surface-story-title");
      const system = section?.querySelector(".human-surface-story-system");
      const topCard = section?.querySelector(".human-surface-card-top");
      const divider = section?.querySelector(".human-surface-divider");
      const bottomCard = section?.querySelector(".human-surface-card-bottom");
      const cue = section?.querySelector(".section-cue");
      return {
        title: normalize(title?.textContent),
        intro: normalize(section?.querySelector(".human-surface-sectionline")?.textContent),
        topCardText: normalize(topCard?.textContent),
        bottomCardText: normalize(bottomCard?.textContent),
        dividerText: normalize(divider?.textContent),
        thirdToLast: sections.at(-3) === section,
        section: rect(section),
        titleRect: rect(title),
        systemRect: rect(system),
        topCardRect: rect(topCard),
        dividerRect: rect(divider),
        bottomCardRect: rect(bottomCard),
        cueRect: rect(cue),
        goldColor: getComputedStyle(section.querySelector(".human-surface-gold")).color,
        backgroundImage: getComputedStyle(section, "::before").backgroundImage,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(layout.title, "Humans stay above the surface. AI handles underneath.");
    assert.equal(
      layout.intro,
      "Members feel remembered. Builders stay present. The memory, matching, scheduling, follow-up, and logistics move underneath.",
    );
    assert.equal(layout.topCardText, "What people feel A real conversation with someone who knows why they matter.");
    assert.equal(layout.bottomCardText, "What AI handles Signals, context, matching, scheduling, reminders, follow-up, and logistics.");
    assert.equal(layout.dividerText, "Human moment");
    assert.equal(layout.thirdToLast, true);
    assert.equal(layout.goldColor, "rgb(184, 149, 74)");
    assert.match(layout.backgroundImage, /hc-art-operating-system-human-value-funnel-20260705\.png/);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} human/AI section has no horizontal overflow`);
    assert.ok(layout.section.height >= height - 1, `${width}x${height} human/AI section fills the viewport`);
    assert.ok(layout.topCardRect.bottom < layout.dividerRect.top, `${width}x${height} human moment follows the human card`);
    assert.ok(layout.dividerRect.bottom < layout.bottomCardRect.top, `${width}x${height} AI support stays beneath the surface`);

    for (const [label, box] of [
      ["title", layout.titleRect],
      ["system", layout.systemRect],
      ["top card", layout.topCardRect],
      ["bottom card", layout.bottomCardRect],
    ]) {
      assert.ok(box.left >= -1 && box.right <= width + 1, `${width}x${height} ${label} fits horizontally`);
    }

    if (width > 760) {
      assert.ok(layout.titleRect.right < layout.systemRect.left, "desktop keeps the human promise beside the system proof");
    } else {
      assert.ok(layout.titleRect.bottom < layout.systemRect.top, `${width}x${height} stacks the proof beneath the promise`);
      assert.ok(layout.bottomCardRect.bottom < layout.cueRect.top, `${width}x${height} keeps the next control below the proof`);
    }

    assertRuntimeHealthy();
  }
});

test("the Brian Chesky quote lives only behind the hidden bottom-left dot", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl(PUBLIC_VARIANT));
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 13`);

  const hiddenState = await page.evaluate(`(() => {
    const dot = document.querySelector(".chesky-quote-dot");
    return {
      hidden: dot?.hidden,
      ariaHidden: dot?.getAttribute("aria-hidden"),
      variantTrayPresent: Boolean(document.querySelector(".variant-dots")),
      variantTriggerPresent: Boolean(document.querySelector(".variant-trigger")),
      variantDotCount: document.querySelectorAll(".variant-dot").length,
      publicQuotePresent: Boolean(document.querySelector("#landing-story .story-quote")),
      publicQuoteSectionPresent: Boolean(document.querySelector("#landing-story .is-next-interface-section")),
    };
  })()`);

  assert.deepEqual(hiddenState, {
    hidden: true,
    ariaHidden: "true",
    variantTrayPresent: false,
    variantTriggerPresent: false,
    variantDotCount: 0,
    publicQuotePresent: false,
    publicQuoteSectionPresent: false,
  });

  await page.evaluate(`window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true }))`);
  await page.waitFor(`!document.querySelector(".chesky-quote-dot")?.hidden && document.querySelector(".chesky-quote-dot")?.classList.contains("is-visible") && Number(getComputedStyle(document.querySelector(".chesky-quote-dot")).opacity) > 0.99`);

  const revealedDot = await page.evaluate(`(() => {
    const dot = document.querySelector(".chesky-quote-dot");
    const rect = dot?.getBoundingClientRect();
    return {
      ariaHidden: dot?.getAttribute("aria-hidden"),
      tabIndex: dot?.tabIndex,
      left: rect?.left ?? 9999,
      bottomGap: rect ? innerHeight - rect.bottom : 9999,
      opacity: Number(getComputedStyle(dot).opacity),
    };
  })()`);

  assert.equal(revealedDot.ariaHidden, "false");
  assert.equal(revealedDot.tabIndex, 0);
  assert.ok(revealedDot.left >= 0 && revealedDot.left <= 48, "quote dot sits at the bottom-left");
  assert.ok(revealedDot.bottomGap >= 0 && revealedDot.bottomGap <= 48, "quote dot stays near the bottom edge");
  assert.equal(revealedDot.opacity, 1);

  await page.evaluate(`document.querySelector(".chesky-quote-dot")?.click()`);
  await page.waitFor(`document.querySelector(".page")?.dataset.variant === "next-interface-atrium"`);

  const archivedQuote = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const quote = document.querySelector("#landing-story .story-quote");
    return {
      variant: document.querySelector(".page")?.dataset.variant,
      dotCurrent: document.querySelector(".chesky-quote-dot")?.getAttribute("aria-current"),
      text: normalize(quote?.querySelector("p")?.textContent),
      author: normalize(quote?.querySelector("cite")?.textContent),
      fontStyle: quote ? getComputedStyle(quote).fontStyle : null,
    };
  })()`);

  assert.deepEqual(archivedQuote, {
    variant: "next-interface-atrium",
    dotCurrent: "true",
    text:
      "“If we can get people back into the physical world, connecting together with one another, that’s the ultimate promise of the internet, which was always meant to bring us together.”",
    author: "— Brian Chesky",
    fontStyle: "italic",
  });
  assertRuntimeHealthy();
});

test("the restored closing line sits beside the signup card on desktop and stacks cleanly on phones", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelector("#landing-story .is-final-cta-section .final-cta-side-callout")`);
    await page.evaluate(`document.querySelector("#landing-story .is-final-cta-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const card = document.querySelector("#landing-story .is-final-cta-section .future-story-inner");
      const callout = card?.querySelector(".final-cta-side-callout");
      const cardRect = card?.getBoundingClientRect();
      const calloutRect = callout?.getBoundingClientRect();
      return {
        text: normalize(callout?.textContent),
        position: callout ? getComputedStyle(callout).position : null,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        card: cardRect ? { left: cardRect.left, right: cardRect.right } : null,
        callout: calloutRect ? { left: calloutRect.left, right: calloutRect.right } : null,
      };
    })()`);

    assert.equal(layout.text, "The next great interface is the person in front of you.");
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} closing section has no horizontal overflow`);
    assert.ok(layout.card && layout.callout, `${width}x${height} closing card and restored line are present`);

    if (width > 1120) {
      assert.equal(layout.position, "absolute");
      assert.ok(layout.callout.left > layout.card.right, "desktop line sits to the right of the signup card");
      assert.ok(layout.callout.right <= width + 1, "desktop line stays inside the viewport");
    } else {
      assert.equal(layout.position, "static");
      assert.ok(layout.callout.left >= layout.card.left - 1, "phone line starts inside the signup card");
      assert.ok(layout.callout.right <= layout.card.right + 1, "phone line stays inside the signup card");
    }

    assertRuntimeHealthy();
  }
});

test("the community-truth section fits desktop and narrow phones without overflow", async () => {
  const expectedCopy =
    "To know what’s really happening in a community, you have to talk to the people in it. Our human, social, relationship, and community data has always, and will always be communicated through human conversation, not interfaces.";

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 13`);
    await showStage("human");
    await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-community-truth-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const section = document.querySelector("#landing-story .is-community-truth-section");
      const sectionRect = section?.getBoundingClientRect();
      const background = section ? getComputedStyle(section, "::before") : null;
      const textRects = Array.from(section?.querySelectorAll(".story-title, .story-body p") || []).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
      });
      const cueRect = section?.querySelector(".section-cue")?.getBoundingClientRect();
      return {
        copy: normalize(section?.querySelector(".story-copy-block")?.textContent),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        sectionTop: sectionRect?.top ?? -9999,
        sectionHeight: sectionRect?.height ?? 0,
        backgroundDisplay: background?.display || null,
        backgroundImage: background?.backgroundImage || null,
        textRects,
        cueRect: cueRect ? { top: cueRect.top, right: cueRect.right, bottom: cueRect.bottom, left: cueRect.left } : null,
      };
    })()`);

    const assertFits = (rect, label) => {
      assert.ok(rect, `${width}x${height} ${label} is present`);
      assert.ok(rect.left >= -1 && rect.right <= width + 1, `${width}x${height} ${label} fits horizontally`);
      assert.ok(rect.top >= -1 && rect.bottom <= height + 1, `${width}x${height} ${label} fits vertically`);
    };

    assert.equal(layout.copy, expectedCopy, `${width}x${height} preserves the exact community-truth copy`);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has no horizontal overflow`);
    assert.ok(Math.abs(layout.sectionTop) < 3, `${width}x${height} section lands at the viewport start`);
    assert.ok(layout.sectionHeight >= height - 1, `${width}x${height} section fills the viewport`);
    assert.equal(layout.backgroundDisplay, "block", `${width}x${height} displays the conversation background`);
    assert.match(
      layout.backgroundImage,
      /hc-art-emotional-signal-conversation-20260705\.png/,
      `${width}x${height} uses the intimate human-conversation scene`,
    );
    assert.equal(layout.textRects.length, 2, `${width}x${height} renders both copy blocks`);
    layout.textRects.forEach((rect, index) => assertFits(rect, `copy block ${index + 1}`));
    assertFits(layout.cueRect, "continuation cue");
    assertRuntimeHealthy();
  }
});

test("the mobile connection chain ends with community and repeat connection-high together", async () => {
  for (const [width, height] of [
    [504, 844],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelector("#landing-story .is-solves-disconnection-section .story-chain-repeat-connection-high")`);

    const layout = await page.evaluate(`(() => {
      const section = document.querySelector("#landing-story .is-solves-disconnection-section");
      const chain = section?.querySelector(".story-chain");
      const community = chain?.querySelector(".story-chain-community");
      const repeat = chain?.querySelector(".story-chain-repeat-connection-high");
      const connector = community?.nextElementSibling;
      const mobileBreak = chain?.querySelector(".story-chain-mobile-break");
      const toRect = (element) => {
        const rect = element?.getBoundingClientRect();
        return rect ? { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left } : null;
      };
      return {
        community: toRect(community),
        repeat: toRect(repeat),
        connector: toRect(connector),
        connectorIsArrow: connector?.classList.contains("story-chain-arrow") || false,
        mobileBreakDisplay: mobileBreak ? getComputedStyle(mobileBreak).display : null,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.ok(layout.community && layout.repeat && layout.connector, `${width} chain ending is present`);
    assert.equal(layout.mobileBreakDisplay, "block", `${width} uses the deliberate mobile row break`);
    assert.equal(layout.connectorIsArrow, true, `${width} keeps the connector between the final pair`);
    assert.ok(Math.abs(layout.community.top - layout.repeat.top) <= 2, `${width} final pills share one row`);
    assert.ok(Math.abs(layout.community.top - layout.connector.top) <= 2, `${width} final connector shares that row`);
    assert.ok(layout.community.left < layout.connector.left && layout.connector.left < layout.repeat.left, `${width} final pair reads left to right`);
    assert.ok(layout.repeat.right <= width + 1, `${width} final pill stays inside the viewport`);
    assert.ok(layout.horizontalOverflow <= 1, `${width} chain has no horizontal overflow`);
    assertRuntimeHealthy();
  }
});
