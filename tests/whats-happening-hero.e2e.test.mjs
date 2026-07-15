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
    slackQuestion: "What’s happening inside organizations?",
    slackMarketValuePresent: false,
    slackLabel: "Organizations ✓ Solved",
    humanBrand: "Human Conversation",
    humanQuestion: "What’s happening within us, between us, and around us?",
    humanSupport: "Every important human system needs a way to see the truth of what’s happening within it.",
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
      "2009. Twitter. Digital Communities, solved. What’s happening around the world? 2014. Slack. Organizations, solved. What’s happening inside organizations? 2026. Human Conversation. Real-world social networks, unsolved. What’s happening within us, between us, and around us? Every important human system needs a way to see the truth of what’s happening within it.",
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

test("every visible What’s happening phrase is italicized across the public page", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.waitFor(`document.querySelectorAll(".whats-happening-phrase").length === 5`);

    const phrases = await page.evaluate(`(() => ({
      items: Array.from(document.querySelectorAll(".page[data-variant='conversation-intelligence-home'] .whats-happening-phrase"))
        .map((element) => ({
          text: element.textContent.trim().toLowerCase(),
          tagName: element.tagName,
          fontStyle: getComputedStyle(element).fontStyle,
          fontSynthesis: getComputedStyle(element).fontSynthesis,
        })),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))()`);

    assert.equal(phrases.items.length, 5, `${width}x${height} finds every visible phrase`);
    assert.ok(phrases.items.every((item) => item.text === "what’s happening"));
    assert.ok(phrases.items.every((item) => item.tagName === "EM"));
    assert.ok(phrases.items.every((item) => item.fontStyle === "italic"));
    assert.ok(phrases.items.every((item) => item.fontSynthesis.includes("style")));
    assert.ok(phrases.horizontalOverflow <= 1, `${width}x${height} italic treatment does not overflow`);
    assertRuntimeHealthy();
  }
});

test("the Human Conversation question highlights its three relational directions in the brand color", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await showStage("human");

    const relations = await page.evaluate(`(() => {
      const question = document.querySelector(".community-stage-human .community-question");
      return {
        items: Array.from(question?.querySelectorAll(".community-human-relation") || []).map((element) => ({
          text: element.textContent.trim(),
          color: getComputedStyle(element).color,
        })),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.deepEqual(relations.items, [
      { text: "within us", color: "rgb(214, 138, 154)" },
      { text: "between us", color: "rgb(214, 138, 154)" },
      { text: "around us", color: "rgb(214, 138, 154)" },
    ]);
    assert.ok(relations.horizontalOverflow <= 1, `${width}x${height} relational highlight does not overflow`);
    assertRuntimeHealthy();
  }
});

test("the question travels through Twitter, Slack, and the real world", async () => {
  await page.setViewport(1440, 900);
  await page.navigate(reviewUrl());
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

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

test("the 2026 timeline marker stays integrated with the line instead of becoming a box", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.evaluate(`document.querySelector('.community-progress [data-era="human"]')?.click()`);
    await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "human"`);

    const marker = await page.evaluate(`(() => {
      const element = document.querySelector('.community-progress [data-era="human"]');
      const style = getComputedStyle(element);
      const rect = element?.getBoundingClientRect();
      return {
        backgroundColor: style.backgroundColor,
        borderTopWidth: style.borderTopWidth,
        boxShadow: style.boxShadow,
        textShadow: style.textShadow,
        left: rect?.left,
        right: rect?.right,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(marker.backgroundColor, "rgba(0, 0, 0, 0)", `${width}x${height} marker has no capsule fill`);
    assert.equal(marker.borderTopWidth, "0px", `${width}x${height} marker has no capsule border`);
    assert.equal(marker.boxShadow, "none", `${width}x${height} marker has no capsule shadow`);
    assert.equal(marker.textShadow, "none", `${width}x${height} marker has no capsule text shadow`);
    assert.ok(marker.left >= 0 && marker.right <= width, `${width}x${height} marker stays in the viewport`);
    assert.ok(marker.horizontalOverflow <= 1, `${width}x${height} marker does not create horizontal overflow`);
    assertRuntimeHealthy();
  }
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

test("the contact email stays fixed top-right from hero through the final section", async () => {
  const checkpoints = [
    {
      name: "hero",
      target: "#landing-hero",
      protectedSelectors: [
        "header .brand",
        ".community-progress",
        ".community-stage-twitter .community-stage-content",
        "#landing-hero .story-cue",
      ],
    },
    {
      name: "middle story",
      target: "#landing-story .is-brings-together-section",
      protectedSelectors: [
        "#landing-story .is-brings-together-section .story-title",
        "#landing-story .is-brings-together-section .section-cue",
      ],
    },
    {
      name: "final section",
      target: "#landing-story .is-final-cta-section",
      protectedSelectors: [
        "#landing-story .is-final-cta-section .future-story-inner",
      ],
    },
  ];

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(`${reviewUrl(PUBLIC_VARIANT)}&reduceMotion=1`);
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 13`);

    let fixedAnchor = null;
    let previousScrollY = -1;

    for (const checkpoint of checkpoints) {
      await page.evaluate(`document.querySelector(${JSON.stringify(checkpoint.target)})?.scrollIntoView({ block: "start", behavior: "instant" })`);
      await page.waitFor(`Math.abs(document.querySelector(${JSON.stringify(checkpoint.target)})?.getBoundingClientRect().top ?? 9999) < 3`);

      const layout = await page.evaluate(`(() => {
        const targetSelector = ${JSON.stringify(checkpoint.target)};
        const protectedSelectors = ${JSON.stringify(checkpoint.protectedSelectors)};
        const rect = (element) => {
          const box = element?.getBoundingClientRect();
          return box ? {
            top: box.top,
            right: box.right,
            bottom: box.bottom,
            left: box.left,
            width: box.width,
            height: box.height,
          } : null;
        };
        const overlapsWithGap = (first, second, gap = 6) => Boolean(
          first && second &&
          first.left - gap < second.right &&
          first.right + gap > second.left &&
          first.top - gap < second.bottom &&
          first.bottom + gap > second.top
        );
        const email = document.querySelector(".header-email");
        const emailStyle = email ? getComputedStyle(email) : null;
        const emailRect = rect(email);
        return {
          text: String(email?.textContent || "").replace(/\\s+/g, " ").trim(),
          href: email?.getAttribute("href") || null,
          position: emailStyle?.position || null,
          display: emailStyle?.display || null,
          visibility: emailStyle?.visibility || null,
          opacity: Number(emailStyle?.opacity || 0),
          pointerEvents: emailStyle?.pointerEvents || null,
          clientRectCount: email?.getClientRects().length || 0,
          textClipped: email ? email.scrollWidth > email.clientWidth + 1 : true,
          emailRect,
          targetTop: document.querySelector(targetSelector)?.getBoundingClientRect().top ?? -9999,
          scrollY: window.scrollY,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          protectedElements: protectedSelectors.map((selector) => {
            const element = document.querySelector(selector);
            const elementRect = rect(element);
            return {
              selector,
              present: Boolean(element),
              rect: elementRect,
              overlapsEmail: overlapsWithGap(emailRect, elementRect),
            };
          }),
        };
      })()`);

      assert.equal(layout.text, "hello@humanconversation.com", `${width}x${height} ${checkpoint.name} keeps the exact contact text`);
      assert.equal(layout.href, "mailto:hello@humanconversation.com", `${width}x${height} ${checkpoint.name} keeps the email link`);
      assert.equal(layout.position, "fixed", `${width}x${height} ${checkpoint.name} keeps the contact fixed`);
      assert.notEqual(layout.display, "none", `${width}x${height} ${checkpoint.name} displays the contact`);
      assert.equal(layout.visibility, "visible", `${width}x${height} ${checkpoint.name} keeps the contact visible`);
      assert.ok(layout.opacity > 0.99, `${width}x${height} ${checkpoint.name} keeps the contact opaque`);
      assert.notEqual(layout.pointerEvents, "none", `${width}x${height} ${checkpoint.name} keeps the contact clickable`);
      assert.ok(layout.clientRectCount > 0 && layout.emailRect, `${width}x${height} ${checkpoint.name} renders the contact`);
      assert.equal(layout.textClipped, false, `${width}x${height} ${checkpoint.name} shows the full contact address`);
      assert.ok(layout.emailRect.width > 0 && layout.emailRect.height > 0, `${width}x${height} ${checkpoint.name} gives the contact a usable size`);
      assert.ok(layout.emailRect.left >= -1 && layout.emailRect.right <= layout.viewportWidth + 1, `${width}x${height} ${checkpoint.name} keeps the contact inside the viewport horizontally`);
      assert.ok(layout.emailRect.top >= -1 && layout.emailRect.bottom <= layout.viewportHeight + 1, `${width}x${height} ${checkpoint.name} keeps the contact inside the viewport vertically`);
      assert.ok(layout.emailRect.top >= 8 && layout.emailRect.top <= 20, `${width}x${height} ${checkpoint.name} stays at the top edge`);
      assert.ok(layout.viewportWidth - layout.emailRect.right >= 8 && layout.viewportWidth - layout.emailRect.right <= 20, `${width}x${height} ${checkpoint.name} stays at the right edge`);
      assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} ${checkpoint.name} has no horizontal overflow`);
      assert.ok(Math.abs(layout.targetTop) < 3, `${width}x${height} ${checkpoint.name} is the active scroll checkpoint`);

      for (const protectedElement of layout.protectedElements) {
        assert.ok(protectedElement.present && protectedElement.rect, `${width}x${height} ${checkpoint.name} renders ${protectedElement.selector}`);
        assert.ok(protectedElement.rect.width > 0 && protectedElement.rect.height > 0, `${width}x${height} ${checkpoint.name} sizes ${protectedElement.selector}`);
        assert.equal(protectedElement.overlapsEmail, false, `${width}x${height} ${checkpoint.name} contact clears ${protectedElement.selector}`);
      }

      if (checkpoint.name === "hero") {
        const brand = layout.protectedElements.find((element) => element.selector === "header .brand");
        assert.ok(brand.rect.right + 8 <= layout.emailRect.left, `${width}x${height} keeps the contact clear of the header logo`);
      }

      if (fixedAnchor) {
        assert.ok(layout.scrollY > previousScrollY + height * 0.5, `${width}x${height} ${checkpoint.name} follows a real page scroll`);
        assert.ok(Math.abs(layout.emailRect.top - fixedAnchor.top) <= 1, `${width}x${height} ${checkpoint.name} has no vertical contact drift`);
        assert.ok(Math.abs(layout.emailRect.right - fixedAnchor.right) <= 1, `${width}x${height} ${checkpoint.name} has no horizontal contact drift`);
        assert.ok(Math.abs(layout.emailRect.width - fixedAnchor.width) <= 1, `${width}x${height} ${checkpoint.name} keeps the contact width stable`);
        assert.ok(Math.abs(layout.emailRect.height - fixedAnchor.height) <= 1, `${width}x${height} ${checkpoint.name} keeps the contact height stable`);
      } else {
        fixedAnchor = layout.emailRect;
      }

      previousScrollY = layout.scrollY;
      assertRuntimeHealthy();
    }
  }
});

test("the thousand-taps feeling panel clears the headline on short desktop screens", async () => {
  const width = 1312;
  const height = 690;
  await page.setViewport(width, height);
  await page.navigate(`${reviewUrl(PUBLIC_VARIANT)}&reduceMotion=1`);
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 13`);
  await page.evaluate(`document.querySelector("#landing-story .is-taps-premium-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);
  await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-taps-premium-section")?.getBoundingClientRect().top ?? 9999) < 3`);

  const layout = await page.evaluate(`(() => {
    const rect = (element) => {
      const box = element?.getBoundingClientRect();
      return box ? {
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height,
      } : null;
    };
    const section = document.querySelector("#landing-story .is-taps-premium-section");
    return {
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      title: rect(section?.querySelector(".taps-premium-story-title")),
      callout: rect(section?.querySelector(".taps-premium-feeling-callout")),
      cue: rect(section?.querySelector(".section-cue")),
      sectionHeight: section?.offsetHeight || 0,
    };
  })()`);

  assert.ok(layout.horizontalOverflow <= 1, "1312x690 thousand-taps section overflows horizontally");
  assert.ok(layout.title && layout.callout && layout.cue, "1312x690 thousand-taps content renders");
  assert.ok(layout.title.bottom + 24 <= layout.callout.top, `1312x690 feeling panel overlaps the headline: ${JSON.stringify(layout)}`);
  assert.ok(layout.callout.bottom + 24 <= layout.cue.top, "1312x690 continuation control overlaps the feeling panel");
  assert.ok(layout.sectionHeight >= 840, "1312x690 short-screen reflow preserves readable vertical space");
  assertRuntimeHealthy();
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
    const bringsTogetherSection = document.querySelector("#landing-story .is-brings-together-section");
    const lonelinessSection = document.querySelector("#landing-story .is-lonely-return-section");
    const humanSurfaceSection = document.querySelector("#landing-story .is-human-surface-section");
    const timelessSection = document.querySelector("#landing-story .is-timeless-fullscreen-section");
    return {
      variant: document.querySelector(".page")?.dataset.variant,
      heroClass: document.querySelector("#landing-hero")?.className,
      heroStage: document.querySelector("#landing-hero")?.dataset.communityStage,
      sectionCount: sections.length,
      firstIsCommunityTruth: sections[0]?.classList.contains("is-community-truth-section"),
      secondIsSolvesDisconnection: sections[1]?.classList.contains("is-solves-disconnection-section"),
      firstFlowsDirectlyToSecond: sections[0]?.nextElementSibling === sections[1],
      firstCopy: normalize(sections[0]?.querySelector(".story-copy-block")?.textContent),
      firstTitle: title(sections[0]),
      firstBody: normalize(sections[0]?.querySelector(".story-body")?.textContent),
      secondTitle: title(sections[1]),
      thirdTitle: title(sections[2]),
      fourthTitle: title(sections[3]),
      fifthTitle: title(sections[4]),
      operatingSystemFlowsToInterface:
        sections[2]?.classList.contains("is-real-world-os-section") &&
        sections[2]?.nextElementSibling === sections[3] &&
        sections[3]?.classList.contains("is-interface-opposite-section"),
      interfaceFlowsToTaps:
        sections[3]?.classList.contains("is-interface-opposite-section") &&
        sections[3]?.nextElementSibling === sections[4] &&
        sections[4]?.classList.contains("is-taps-premium-section"),
      bringsTogetherTitle: title(bringsTogetherSection),
      bringsTogetherIsEighth: sections[7] === bringsTogetherSection,
      bringsTogetherFlowsToGraph: bringsTogetherSection?.nextElementSibling?.classList.contains("is-graph-section"),
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
    secondIsSolvesDisconnection: true,
    firstFlowsDirectlyToSecond: true,
    firstCopy:
      "Our human, social, relationship, and community data has always, and will always be communicated through human conversation, not interfaces.",
    firstTitle:
      "Our human, social, relationship, and community data has always, and will always be communicated through human conversation, not interfaces.",
    firstBody: "",
    secondTitle: "Human Conversation solves disconnection.",
    thirdTitle: "Human Conversation is the operating system for real-world social communities.",
    fourthTitle: "Building the intelligence around human conversation.",
    fifthTitle: "A Human Conversation is worth a thousand taps.",
    operatingSystemFlowsToInterface: true,
    interfaceFlowsToTaps: true,
    bringsTogetherTitle:
      "99% of communication technology puts an interface between us. Human Conversation brings us back.",
    bringsTogetherIsEighth: true,
    bringsTogetherFlowsToGraph: true,
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
    finalCtaSideCallout: "",
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
  await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-solves-disconnection-section")?.getBoundingClientRect().top ?? 9999) < 3`);
  await page.waitFor(`document.activeElement === document.querySelector("#landing-story .is-solves-disconnection-section")`);
  assert.equal(
    await page.evaluate(`document.activeElement === document.querySelector("#landing-story .is-solves-disconnection-section")`),
    true,
    "the community-truth cue lands on and focuses the solves-disconnection section",
  );

  await page.evaluate(`document.querySelector("#landing-story .is-solves-disconnection-section .section-cue")?.click()`);
  await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-real-world-os-section")?.getBoundingClientRect().top ?? 9999) < 3`);
  await page.waitFor(`document.activeElement === document.querySelector("#landing-story .is-real-world-os-section")`);
  assert.equal(
    await page.evaluate(`document.activeElement === document.querySelector("#landing-story .is-real-world-os-section")`),
    true,
    "the solves-disconnection cue lands on and focuses the real-world operating-system section",
  );

  await page.evaluate(`document.querySelector("#landing-story .is-real-world-os-section .section-cue")?.click()`);
  await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-interface-opposite-section")?.getBoundingClientRect().top ?? 9999) < 3`);
  await page.waitFor(`document.activeElement === document.querySelector("#landing-story .is-interface-opposite-section")`);
  assert.equal(
    await page.evaluate(`document.activeElement === document.querySelector("#landing-story .is-interface-opposite-section")`),
    true,
    "the real-world operating-system cue lands on and focuses the interface-opposite section",
  );

  const firstPanel = await page.evaluate(`(() => {
    const section = document.querySelector("#landing-story .is-interface-opposite-section");
    const title = section.querySelector(".story-title").getBoundingClientRect();
    const body = section.querySelector(".story-body");
    const titleText = String(section.querySelector(".story-title")?.textContent || "").trim();
    const bodyText = String(body?.textContent || "").trim();
    const bodyRect = body.getBoundingClientRect();
    return {
      top: section.getBoundingClientRect().top,
      height: section.getBoundingClientRect().height,
      titleText,
      bodyText,
      titleFontSize: Number.parseFloat(getComputedStyle(section.querySelector(".story-title")).fontSize),
      bodyFontSize: Number.parseFloat(getComputedStyle(body).fontSize),
      titleTop: title.top,
      titleBottom: title.bottom,
      bodyTop: bodyRect.top,
      bodyBottom: bodyRect.bottom,
      bodyDisplay: getComputedStyle(body).display,
      bodyBorderLeft: getComputedStyle(body).borderLeftWidth,
      aroundFontStyle: getComputedStyle(section.querySelector(".interface-opposite-build em")).fontStyle,
      aroundTransform: getComputedStyle(section.querySelector(".interface-opposite-build em")).transform,
      arrowLength: Number.parseFloat(getComputedStyle(body, "::before").width),
      arrowHead: getComputedStyle(body, "::after").borderTopWidth,
      imageFilter: getComputedStyle(section, "::before").filter,
      overlayBackground: getComputedStyle(section, "::after").backgroundImage,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);

  assert.ok(Math.abs(firstPanel.top) < 3);
  assert.ok(firstPanel.height >= 899);
  assert.equal(firstPanel.titleText, "Building the intelligence around human conversation.");
  assert.equal(firstPanel.bodyText, "For decades, technology has pulled conversations onto interfaces. We’re doing the opposite.");
  assert.ok(firstPanel.titleFontSize > firstPanel.bodyFontSize * 2, "the intelligence claim is the dominant type treatment");
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

test("the 99% communication-technology thesis lands mid-story and stays readable", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelector("#landing-story .is-brings-together-section .brings-together-stat")`);
    await page.evaluate(`document.querySelector("#landing-story .is-brings-together-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const sections = Array.from(document.querySelectorAll("#landing-story .story-section"));
      const section = document.querySelector("#landing-story .is-brings-together-section");
      const title = section?.querySelector(".story-title");
      const premise = section?.querySelector(".brings-together-premise");
      const stat = section?.querySelector(".brings-together-stat");
      const returnLine = section?.querySelector(".brings-together-gold");
      const cue = section?.querySelector(".section-cue");
      const rect = (element) => {
        const box = element?.getBoundingClientRect();
        return box ? { top: box.top, right: box.right, bottom: box.bottom, left: box.left, height: box.height } : null;
      };
      return {
        title: normalize(title?.textContent),
        premise: normalize(premise?.textContent),
        returnLine: normalize(returnLine?.textContent),
        index: sections.indexOf(section),
        total: sections.length,
        previousIsAttention: section?.previousElementSibling?.classList.contains("is-attention-section"),
        nextIsGraph: section?.nextElementSibling?.classList.contains("is-graph-section"),
        sectionRect: rect(section),
        titleRect: rect(title),
        cueRect: rect(cue),
        statColor: stat ? getComputedStyle(stat).color : null,
        returnColor: returnLine ? getComputedStyle(returnLine).color : null,
        backgroundImage: section ? getComputedStyle(section, "::before").backgroundImage : "",
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(
      layout.title,
      "99% of communication technology puts an interface between us. Human Conversation brings us back.",
    );
    assert.equal(layout.premise, "99% of communication technology puts an interface between us.");
    assert.equal(layout.returnLine, "Human Conversation brings us back.");
    assert.equal(layout.index, 7, "the thesis is the eighth section, not part of the opening sequence");
    assert.equal(layout.total, 13);
    assert.equal(layout.previousIsAttention, true);
    assert.equal(layout.nextIsGraph, true);
    assert.equal(layout.statColor, "rgb(91, 143, 212)");
    assert.equal(layout.returnColor, "rgb(232, 189, 94)");
    assert.match(layout.backgroundImage, /hc-art-brings-together-community-engine-20260705\.png/);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} communication thesis has no horizontal overflow`);
    assert.ok(layout.sectionRect.height >= height - 1, `${width}x${height} communication thesis fills the viewport`);
    assert.ok(layout.titleRect.left >= -1 && layout.titleRect.right <= width + 1, `${width}x${height} communication thesis fits horizontally`);
    assert.ok(layout.titleRect.top >= layout.sectionRect.top - 1, `${width}x${height} communication thesis starts inside its section`);
    assert.ok(layout.titleRect.bottom <= layout.sectionRect.bottom + 1, `${width}x${height} communication thesis ends inside its section`);
    assert.ok(layout.titleRect.bottom < layout.cueRect.top, `${width}x${height} continuation control clears the communication thesis`);

    assertRuntimeHealthy();
  }
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

test("the closing line and 1% / 99% promise stay clear beside the signup card", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelector("#landing-story .is-final-cta-section .final-cta-ratio")`);
    await page.evaluate(`document.querySelector("#landing-story .is-final-cta-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const sections = Array.from(document.querySelectorAll("#landing-story .story-section"));
      const section = document.querySelector("#landing-story .is-final-cta-section");
      const card = section?.querySelector(".future-story-inner");
      const callout = card?.querySelector(".final-cta-side-callout");
      const signup = card?.querySelector(".story-contact");
      const ratio = card?.querySelector(".final-cta-ratio");
      const cardRect = card?.getBoundingClientRect();
      const calloutRect = callout?.getBoundingClientRect();
      const signupRect = signup?.getBoundingClientRect();
      const ratioRect = ratio?.getBoundingClientRect();
      return {
        copy: normalize(card?.querySelector(".future-story-side .story-body")?.textContent),
        text: normalize(callout?.textContent),
        kicker: normalize(ratio?.querySelector(".final-cta-ratio-kicker")?.textContent),
        screen: normalize(ratio?.querySelector(".final-cta-ratio-screen")?.textContent),
        human: normalize(ratio?.querySelector(".final-cta-ratio-human")?.textContent),
        promise: normalize(ratio?.querySelector(".final-cta-ratio-promise")?.textContent),
        position: callout ? getComputedStyle(callout).position : null,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        finalIsLast: sections.at(-1) === section,
        continuationControlPresent: Boolean(section?.querySelector(".section-cue")),
        card: cardRect ? { top: cardRect.top, right: cardRect.right, bottom: cardRect.bottom, left: cardRect.left } : null,
        callout: calloutRect ? { top: calloutRect.top, right: calloutRect.right, bottom: calloutRect.bottom, left: calloutRect.left } : null,
        signup: signupRect ? { top: signupRect.top, right: signupRect.right, bottom: signupRect.bottom, left: signupRect.left } : null,
        ratio: ratioRect ? { top: ratioRect.top, right: ratioRect.right, bottom: ratioRect.bottom, left: ratioRect.left } : null,
      };
    })()`);

    assert.equal(layout.copy, "Human Conversation handles the work around those human moments: 99% human time, 1% screen time.");
    assert.equal(layout.text, "");
    assert.equal(layout.kicker, "Imagine your life.");
    assert.equal(layout.screen, "1% screen time.");
    assert.equal(layout.human, "99% human time.");
    assert.equal(layout.promise, "A life that runs on Human Conversation and connected experiences.");
    assert.equal(layout.finalIsLast, true);
    assert.equal(layout.continuationControlPresent, false);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} closing section has no horizontal overflow`);
    assert.equal(layout.callout, null, `${width}x${height} removes the rejected side callout`);
    assert.ok(layout.card && layout.signup && layout.ratio, `${width}x${height} closing card, signup, and ratio are present`);
    assert.ok(layout.ratio.left >= layout.card.left - 1 && layout.ratio.right <= layout.card.right + 1, `${width}x${height} ratio stays inside the closing card`);
    assert.ok(layout.signup.bottom <= layout.ratio.top, `${width}x${height} ratio follows the signup without overlap`);
    assert.ok(layout.ratio.bottom <= layout.card.bottom + 1, `${width}x${height} ratio stays inside the closing card vertically`);

    assert.equal(layout.position, null, `${width}x${height} has no side-callout positioning`);

    assertRuntimeHealthy();
  }
});

test("the community-truth section fits desktop and narrow phones without overflow", async () => {
  const expectedCopy =
    "Our human, social, relationship, and community data has always, and will always be communicated through human conversation, not interfaces.";

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
    assert.equal(layout.textRects.length, 1, `${width}x${height} renders the community-truth copy block`);
    layout.textRects.forEach((rect, index) => assertFits(rect, `copy block ${index + 1}`));
    assertFits(layout.cueRect, "continuation cue");
    assertRuntimeHealthy();
  }
});

test("the mobile connection chain ends with community and reliable connection-high together", async () => {
  for (const [width, height] of [
    [504, 844],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelector("#landing-story .is-solves-disconnection-section .story-chain-reliable-connection-high")`);

    const layout = await page.evaluate(`(() => {
      const section = document.querySelector("#landing-story .is-solves-disconnection-section");
      const chain = section?.querySelector(".story-chain");
      const community = chain?.querySelector(".story-chain-community");
      const repeat = chain?.querySelector(".story-chain-reliable-connection-high");
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
