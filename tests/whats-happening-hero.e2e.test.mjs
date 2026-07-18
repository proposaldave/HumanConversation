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
      twitterArtifactQuestion: normalize(document.querySelector(".community-twitter-artifact .community-artifact-question")?.textContent),
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
    twitterQuestion: "What’s happening right now?",
    twitterArtifactQuestion: "What’s happening?",
    twitterMarketValuePresent: false,
    twitterDate: "2009-11-19",
    slackQuestion: "What’s happening at work?",
    slackMarketValuePresent: false,
    slackLabel: "Organizations ✓ Solved",
    humanBrand: "Human Conversation",
    humanQuestion: "What’s happening between us, around us, and within us?",
    humanSupport: "Every complex system needs the truth about what’s happening — to know what to do next.",
    humanMarkParts: 3,
    dataSentence: "",
    twist: "",
    followArrow: true,
    cueDismissed: false,
    cueTimelineStep: true,
    cueText: "",
    cueYearPresent: false,
    cueLabel: "Go to 2014: Slack",
    heroLabel:
      "2009. Twitter. Digital Communities, solved. What’s happening right now? 2014. Slack. Organizations, solved. What’s happening at work? 2026. Human Conversation. Real-world social networks, unsolved. What’s happening between us, around us, and within us? Every complex system needs the truth about what’s happening — to know what to do next.",
    contactDisplay: "none",
    storyHidden: false,
    storySections: 11,
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
          fontFamily: getComputedStyle(element).fontFamily,
          parentFontFamily: getComputedStyle(element.parentElement).fontFamily,
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
          parentFontSize: Number.parseFloat(getComputedStyle(element.parentElement).fontSize),
          fontStyle: getComputedStyle(element).fontStyle,
          fontSynthesis: getComputedStyle(element).fontSynthesis,
        })),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))()`);

    assert.equal(phrases.items.length, 5, `${width}x${height} finds every visible phrase`);
    assert.ok(phrases.items.every((item) => item.text === "what’s happening"));
    assert.ok(phrases.items.every((item) => item.tagName === "EM"));
    assert.ok(phrases.items.every((item) => item.fontFamily === item.parentFontFamily));
    assert.ok(phrases.items.every((item) => Math.abs(item.fontSize / item.parentFontSize - 1) < 0.01));
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
      { text: "between us", color: "rgb(214, 138, 154)" },
      { text: "around us", color: "rgb(214, 138, 154)" },
      { text: "within us", color: "rgb(214, 138, 154)" },
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

  const inactiveYearStyle = await page.evaluate(`(() => {
    const style = getComputedStyle(document.querySelector('.community-progress [data-era="slack"]'));
    return { color: style.color, fontSize: Number.parseFloat(style.fontSize) };
  })()`);
  assert.equal(inactiveYearStyle.color, "rgba(255, 248, 236, 0.56)");
  assert.ok(inactiveYearStyle.fontSize >= 11, `timeline year remains legible: ${JSON.stringify(inactiveYearStyle)}`);
  assert.equal(
    await page.evaluate(`getComputedStyle(document.querySelector('.community-progress [data-era="twitter"]')).color`),
    "rgb(143, 196, 229)",
  );

  await page.evaluate(`document.querySelector('.community-progress [data-era="human"]')?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "human"`);
  await page.waitFor(
    `getComputedStyle(document.querySelector('.community-progress [data-era="human"]')).color === "rgb(214, 138, 154)"`,
  );
  assert.equal(
    await page.evaluate(`document.querySelector('.community-progress [data-era="human"]')?.getAttribute("aria-current")`),
    "true",
  );
  assert.deepEqual(
    await page.evaluate(`(() => ({
      yearColor: getComputedStyle(document.querySelector('.community-progress [data-era="human"]')).color,
      lineBackground: getComputedStyle(document.querySelector('.community-progress'), '::after').backgroundImage,
    }))()`),
    {
      yearColor: "rgb(214, 138, 154)",
      lineBackground:
        "linear-gradient(90deg, rgb(91, 143, 212), rgb(178, 155, 255) 49%, rgb(214, 138, 154) 100%)",
    },
  );

  await page.evaluate(`document.querySelector('.community-progress [data-era="twitter"]')?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

  await page.evaluate(`document.querySelector('.community-progress [data-era="slack"]')?.focus()`);
  await page.pressEnter();
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "slack"`);
  await page.waitFor(
    `getComputedStyle(document.querySelector('.community-progress [data-era="slack"]')).color === "rgb(199, 184, 255)"`,
  );
  assert.equal(
    await page.evaluate(`document.querySelector('.community-progress [data-era="slack"]')?.getAttribute("aria-current")`),
    "true",
  );
  assert.equal(
    await page.evaluate(`getComputedStyle(document.querySelector('.community-progress [data-era="slack"]')).color`),
    "rgb(199, 184, 255)",
  );
  assertRuntimeHealthy();
});

test("the top-left Human Conversation logo remains visible through all three hero years", async () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [1312, 690],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl());
    await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "twitter"`);

    for (const stage of ["twitter", "slack", "human"]) {
      await showStage(stage);
      const brand = await page.evaluate(`(() => {
        const element = document.querySelector("header .brand");
        const email = document.querySelector("header .header-email")?.getBoundingClientRect();
        const rect = element?.getBoundingClientRect();
        const style = element ? getComputedStyle(element) : null;
        return {
          text: element?.textContent.replace(/\\s+/g, " ").trim(),
          opacity: Number(style?.opacity || 0),
          visibility: style?.visibility,
          position: style?.position,
          left: rect?.left ?? -1,
          top: rect?.top ?? -1,
          right: rect?.right ?? -1,
          bottom: rect?.bottom ?? -1,
          emailLeft: email?.left ?? window.innerWidth,
        };
      })()`);

      assert.equal(brand.text, "Human Conversation");
      assert.ok(brand.opacity > 0.95, `${width}x${height} ${stage} logo is visible`);
      assert.equal(brand.visibility, "visible");
      assert.equal(brand.position, "fixed");
      assert.ok(brand.left >= 0 && brand.top >= 0, `${width}x${height} ${stage} logo starts within the viewport`);
      assert.ok(brand.right <= width && brand.bottom <= height, `${width}x${height} ${stage} logo fits within the viewport`);
      assert.ok(brand.right + 8 <= brand.emailLeft, `${width}x${height} ${stage} logo stays clear of the contact email`);
    }
  }

  assertRuntimeHealthy();
});

test("the 2026 timeline marker stays integrated with the line instead of becoming a box", async () => {
  for (const [width, height] of [
    [1440, 900],
    [1312, 690],
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
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: Number.parseInt(style.fontWeight, 10),
        left: rect?.left,
        right: rect?.right,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(marker.backgroundColor, "rgba(0, 0, 0, 0)", `${width}x${height} marker has no capsule fill`);
    assert.equal(marker.borderTopWidth, "0px", `${width}x${height} marker has no capsule border`);
    assert.equal(marker.boxShadow, "none", `${width}x${height} marker has no capsule shadow`);
    assert.match(marker.textShadow, /rgba\(5, 7, 10/, `${width}x${height} marker has dark contrast behind the rose text`);
    assert.ok(marker.fontSize >= 11, `${width}x${height} marker text remains legible`);
    assert.ok(marker.fontWeight >= 900, `${width}x${height} marker text remains bold`);
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
        text: cue?.querySelector(".story-cue-year")?.textContent.trim() || "",
        yearPresent: Boolean(cue?.querySelector(".story-cue-year strong")),
        timelineStep: cue?.classList.contains("is-timeline-step"),
        label: cue?.getAttribute("aria-label"),
        animation: getComputedStyle(cue?.querySelector(".story-cue-icon"), "::before").animationName,
      };
    })()`),
    { text: "", yearPresent: false, timelineStep: true, label: "Go to 2014: Slack", animation: "story-cue-forward" },
  );

  await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "slack"`);
  assert.deepEqual(
    await page.evaluate(`(() => {
      const cue = document.querySelector("#landing-hero .story-cue");
      return {
        text: cue?.querySelector(".story-cue-year")?.textContent.trim() || "",
        yearPresent: Boolean(cue?.querySelector(".story-cue-year strong")),
        timelineStep: cue?.classList.contains("is-timeline-step"),
        label: cue?.getAttribute("aria-label"),
        animation: getComputedStyle(cue?.querySelector(".story-cue-icon"), "::before").animationName,
      };
    })()`),
    { text: "", yearPresent: false, timelineStep: true, label: "Go to 2026: Human Conversation", animation: "story-cue-forward" },
  );

  await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
  await page.waitFor(`document.querySelector("#landing-hero")?.dataset.communityStage === "human"`);
  assert.deepEqual(
    await page.evaluate(`(() => {
      const cue = document.querySelector("#landing-hero .story-cue");
      return {
        text: cue?.querySelector(".story-cue-year")?.textContent.trim() || "",
        yearPresent: Boolean(cue?.querySelector(".story-cue-year strong")),
        timelineStep: cue?.classList.contains("is-timeline-step"),
        label: cue?.getAttribute("aria-label"),
        animation: getComputedStyle(cue?.querySelector(".story-cue-icon"), "::before").animationName,
      };
    })()`),
    { text: "", yearPresent: false, timelineStep: false, label: "Continue down to the Human Conversation story", animation: "story-cue-drop" },
  );
  assertRuntimeHealthy();
});

test("all three beats stay premium and viewport-safe on desktop and narrow phones", async () => {
  for (const [width, height] of [
    [2048, 1000],
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
        const question = stage.querySelector(".community-question");
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
          question: rect(question),
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
      if (layout.question) assertFits(layout.question, `${stage} question`);
      if (layout.artifact) assertFits(layout.artifact, `${stage} artifact`);
      assertFits(layout.cue, `${stage} control`);
      if (layout.lede) {
        assertFits(layout.lede, `${stage} twist`);
        const minimumGap = width >= 1800 ? 20 : 4;
        assert.ok(
          layout.question.bottom + minimumGap <= layout.lede.top,
          `${width}x${height} ${stage} question clears its supporting copy: ${JSON.stringify(layout)}`,
        );
      }
      assert.ok(layout.heroHeight >= height * 3.15, `${width}x${height} is not a true three-stage hero`);
      assertRuntimeHealthy();
    }
  }
});

test("the complete public story stays organized one screen at a time on a wide work monitor", async () => {
  const width = 2048;
  const height = 1000;
  await page.setViewport(width, height);
  await page.navigate(reviewUrl(PUBLIC_VARIANT));
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);

  const sections = await page.evaluate(`(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
    };
    const selectors = ".story-title, .story-body, .community-graph-wide, .human-surface-proof, .future-story-inner, .section-cue";
    return Array.from(document.querySelectorAll("#landing-story .story-section")).map((section, index) => {
      section.scrollIntoView({ block: "start", behavior: "instant" });
      const sectionRect = section.getBoundingClientRect();
      const content = Array.from(section.querySelectorAll(selectors))
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            className: element.className,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
          };
        });
      return {
        index,
        className: section.className,
        top: sectionRect.top,
        height: sectionRect.height,
        content,
      };
    });
  })()`);

  assert.equal(sections.length, 11);
  sections.forEach((section) => {
    assert.ok(Math.abs(section.top) < 3, `section ${section.index + 1} lands at the viewport start`);
    assert.ok(section.height >= height - 1 && section.height <= height + 1, `section ${section.index + 1} uses one work-monitor viewport`);
    assert.ok(section.content.length > 0, `section ${section.index + 1} has visible organized content`);
    section.content.forEach((rect) => {
      assert.ok(rect.top >= -1 && rect.bottom <= height + 1, `section ${section.index + 1} ${rect.className} fits vertically`);
      assert.ok(rect.left >= -1 && rect.right <= width + 1, `section ${section.index + 1} ${rect.className} fits horizontally`);
    });
  });
  assertRuntimeHealthy();
});

test("the operating-system claim gives the existing human system a small memory payoff", async () => {
  for (const [width, height] of [
    [1440, 900],
    [1312, 690],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(`${reviewUrl(PUBLIC_VARIANT)}&reduceMotion=1`);
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);
    await page.evaluate(`document.querySelector("#landing-story .is-real-world-os-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-real-world-os-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const rect = (element) => {
        const box = element?.getBoundingClientRect();
        return box ? { top: box.top, right: box.right, bottom: box.bottom, left: box.left } : null;
      };
      const section = document.querySelector("#landing-story .is-real-world-os-section");
      const title = section?.querySelector(".story-title");
      const body = section?.querySelector(".story-body");
      const memory = section?.querySelector(".real-world-os-memory-word");
      const cue = section?.querySelector(".section-cue");
      return {
        title: Array.from(title?.children || []).map((line) => normalize(line.textContent)).join(" "),
        body: normalize(body?.textContent),
        titleRect: rect(title),
        bodyRect: rect(body),
        cueRect: rect(cue),
        titleFontSize: Number.parseFloat(getComputedStyle(title).fontSize),
        bodyFontSize: Number.parseFloat(getComputedStyle(body).fontSize),
        memoryColor: getComputedStyle(memory).color,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(layout.title, "Human Conversation is already the operating system for real-world social networks.");
    assert.equal(layout.body, "We\u2019re just giving it memory.");
    assert.equal(layout.memoryColor, "rgb(214, 138, 154)");
    assert.ok(layout.titleRect && layout.bodyRect && layout.cueRect, `${width}x${height} operating-system composition renders`);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} operating-system composition overflows horizontally`);
    assert.ok(layout.titleRect.left >= 0 && layout.titleRect.right <= width, `${width}x${height} operating-system title leaves the viewport`);
    assert.ok(layout.bodyRect.left >= 0 && layout.bodyRect.right <= width, `${width}x${height} memory payoff leaves the viewport`);
    assert.ok(layout.titleRect.bottom + 16 <= layout.bodyRect.top, `${width}x${height} memory payoff crowds the headline`);
    assert.ok(layout.bodyRect.bottom + 16 <= layout.cueRect.top, `${width}x${height} memory payoff overlaps the continuation cue`);
    assert.ok(layout.bodyFontSize < layout.titleFontSize * 0.5, `${width}x${height} memory payoff is not visibly subordinate`);
  }

  assertRuntimeHealthy();
});

test("the community graph continues the Maya section visual system across desktop and phone layouts", async () => {
  for (const [width, height] of [
    [1440, 900],
    [1312, 690],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(`${reviewUrl(PUBLIC_VARIANT)}&reduceMotion=1`);
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);
    await page.evaluate(`document.querySelector("#landing-story .is-graph-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-graph-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
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
      const overlaps = (first, second) => Boolean(
        first && second &&
        first.left < second.right &&
        first.right > second.left &&
        first.top < second.bottom &&
        first.bottom > second.top
      );
      const style = (element) => {
        const computed = element ? getComputedStyle(element) : null;
        return computed ? {
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          borderColor: computed.borderColor,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
          color: computed.color,
          fontFamily: computed.fontFamily,
        } : null;
      };
      const attention = document.querySelector("#landing-story .is-attention-section");
      const graph = document.querySelector("#landing-story .is-graph-section");
      const attentionGraphic = attention?.querySelector(".attention-graphic");
      const graphPanel = graph?.querySelector(".community-graph-wide");
      const graphTitle = graph?.querySelector(".story-title");
      const graphBody = graph?.querySelector(".story-body");
      const cue = graph?.querySelector(".section-cue");
      const core = graphPanel?.querySelector(".graph-core");
      const cards = Array.from(graphPanel?.querySelectorAll(".graph-card") || []);
      const cardRects = cards.map(rect);
      return {
        title: normalize(graphTitle?.textContent),
        body: normalize(graphBody?.textContent),
        graphSectionStyle: style(graph),
        attentionSectionStyle: style(attention),
        graphTitleStyle: style(graphTitle),
        attentionTitleStyle: style(attention?.querySelector(".attention-story-title")),
        graphRose: style(graph?.querySelector(".graph-title-rose"))?.color,
        attentionRose: style(attention?.querySelector(".attention-title-rose"))?.color,
        graphPanelStyle: style(graphPanel),
        attentionPanelStyle: style(attentionGraphic),
        graphCardStyles: cards.map(style),
        graphLabelColors: cards.map((card) => style(card.querySelector("small"))?.color),
        graphBlueLine: getComputedStyle(graphPanel?.querySelector(".graph-line-green")).stroke,
        section: rect(graph),
        header: rect(graph?.querySelector(".graph-story-header")),
        panel: rect(graphPanel),
        cue: rect(cue),
        core: rect(core),
        cards: cardRects,
        cardOverlaps: cardRects.flatMap((first, firstIndex) =>
          cardRects.slice(firstIndex + 1).map((second) => overlaps(first, second))
        ),
        coreOverlaps: cardRects.map((card) => overlaps(card, rect(core))),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(layout.title, "Real conversations create the community graph.", `${width}x${height} keeps the graph title`);
    assert.equal(
      layout.body,
      "The community learns when connection happens, where it happens, who helps create it, and what should happen next.",
      `${width}x${height} keeps the graph explanation`,
    );
    assert.equal(layout.graphSectionStyle.backgroundImage, layout.attentionSectionStyle.backgroundImage, `${width}x${height} reuses Maya's section background`);
    assert.equal(layout.graphTitleStyle.fontFamily, layout.attentionTitleStyle.fontFamily, `${width}x${height} reuses Maya's title typography`);
    assert.equal(layout.graphTitleStyle.color, layout.attentionTitleStyle.color, `${width}x${height} reuses Maya's ink title color`);
    assert.equal(layout.graphRose, layout.attentionRose, `${width}x${height} reuses Maya's rose emphasis`);
    assert.equal(layout.graphPanelStyle.backgroundImage, layout.attentionPanelStyle.backgroundImage, `${width}x${height} reuses Maya's panel background`);
    assert.equal(layout.graphPanelStyle.borderColor, layout.attentionPanelStyle.borderColor, `${width}x${height} reuses Maya's panel border`);
    assert.equal(layout.graphPanelStyle.borderRadius, layout.attentionPanelStyle.borderRadius, `${width}x${height} reuses Maya's rounded panel treatment`);
    assert.equal(layout.graphPanelStyle.boxShadow, layout.attentionPanelStyle.boxShadow, `${width}x${height} reuses Maya's panel depth`);
    assert.ok(layout.graphCardStyles.every((card) => card.color === "rgb(26, 22, 18)"), `${width}x${height} keeps every graph card in Maya's ink color`);
    assert.deepEqual(
      layout.graphLabelColors,
      ["rgb(200, 70, 44)", "rgb(91, 143, 212)", "rgb(143, 99, 29)", "rgb(91, 143, 212)"],
      `${width}x${height} uses the Maya rose, blue, and gold label palette`,
    );
    assert.equal(layout.graphBlueLine, "rgba(91, 143, 212, 0.62)", `${width}x${height} replaces the old green graph line with brand blue`);
    assert.ok(layout.section && layout.header && layout.panel && layout.cue && layout.core, `${width}x${height} renders the complete graph section`);
    assert.equal(layout.cards.length, 4, `${width}x${height} renders all four graph cards`);
    assert.ok(layout.header.bottom + 20 <= layout.panel.top, `${width}x${height} keeps the graph panel clear of its heading`);
    assert.ok(layout.cards.every((card) => card.left >= layout.panel.left && card.right <= layout.panel.right && card.top >= layout.panel.top && card.bottom <= layout.panel.bottom), `${width}x${height} keeps every graph card inside the panel`);
    assert.ok(layout.cardOverlaps.every((value) => !value), `${width}x${height} keeps graph cards from overlapping each other`);
    assert.ok(layout.coreOverlaps.every((value) => !value), `${width}x${height} keeps graph cards clear of felt connection`);
    assert.ok(layout.panel.bottom + 12 <= layout.cue.top, `${width}x${height} keeps the continuation control clear of the graph panel: ${JSON.stringify(layout)}`);
    assert.ok(layout.panel.left >= -1 && layout.panel.right <= width + 1, `${width}x${height} keeps the graph panel inside the viewport`);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} has no horizontal overflow`);
    assertRuntimeHealthy();
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
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);

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
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);
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
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);

  const sequence = await page.evaluate(`(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const title = (section) => Array.from(section.querySelectorAll(".story-title > span"))
      .map((line) => normalize(line.textContent)).join(" ");
    const sections = Array.from(document.querySelectorAll("#landing-story .story-section"));
    const cue = document.querySelector("#landing-hero .story-cue");
    const cheskySection = document.querySelector("#landing-story .is-next-interface-section");
    const bringsTogetherSection = document.querySelector("#landing-story .is-brings-together-section");
    const attentionSection = document.querySelector("#landing-story .is-attention-section");
    const lonelinessSection = document.querySelector("#landing-story .is-lonely-return-section");
    const humanSurfaceSection = document.querySelector("#landing-story .is-human-surface-section");
    const finalSection = document.querySelector("#landing-story .is-final-cta-section");
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
      interfaceAroundText: normalize(sections[1]?.querySelector(".interface-opposite-around")?.textContent),
      interfaceAroundFontStyle: getComputedStyle(sections[1]?.querySelector(".interface-opposite-around")).fontStyle,
      interfaceAroundColor: getComputedStyle(sections[1]?.querySelector(".interface-opposite-around")).color,
      interfaceHumanConversationText: normalize(sections[1]?.querySelector(".interface-opposite-human-conversation")?.textContent),
      interfaceHumanConversationColor: getComputedStyle(sections[1]?.querySelector(".interface-opposite-human-conversation")).color,
      thirdTitle: title(sections[2]),
      fourthTitle: title(sections[3]),
      fifthTitle: title(sections[4]),
      fifthBody: normalize(sections[4]?.querySelector(".story-body")?.textContent),
      operatingSystemMemoryColor: getComputedStyle(sections[4]?.querySelector(".real-world-os-memory-word")).color,
      operatingSystemColor: getComputedStyle(sections[4]?.querySelectorAll(".story-title > span")[3]).color,
      sixthTitle: title(sections[5]),
      interfaceFlowsToSolves:
        sections[1]?.classList.contains("is-interface-opposite-section") &&
        sections[1]?.nextElementSibling === sections[2] &&
        sections[2]?.classList.contains("is-solves-disconnection-section"),
      solvesFlowsToBringsTogether:
        sections[2]?.nextElementSibling === bringsTogetherSection &&
        sections[3] === bringsTogetherSection,
      bringsTogetherFlowsToOperatingSystem:
        bringsTogetherSection?.nextElementSibling === sections[4] &&
        sections[4]?.classList.contains("is-real-world-os-section"),
      operatingSystemFlowsToTaps:
        sections[4]?.classList.contains("is-real-world-os-section") &&
        sections[4]?.nextElementSibling === sections[5] &&
        sections[5]?.classList.contains("is-taps-premium-section"),
      bringsTogetherTitle: title(bringsTogetherSection),
      connectionFlowSectionPresent: Boolean(document.querySelector("#landing-story .is-connection-flow-section")),
      bringsTogetherIsFourth: sections[3] === bringsTogetherSection,
      attentionFlowsToGraph: attentionSection?.nextElementSibling?.classList.contains("is-graph-section"),
      lonelinessTitle: title(lonelinessSection),
      humanSurfaceTitle: title(humanSurfaceSection),
      humanSurfaceIntro: normalize(humanSurfaceSection?.querySelector(".human-surface-sectionline")?.textContent),
      lonelinessFlowsToHumanSurface: lonelinessSection?.nextElementSibling === humanSurfaceSection,
      humanSurfaceIsSecondToLast: sections.at(-2) === humanSurfaceSection,
      humanSurfaceFlowsToFuture: humanSurfaceSection?.nextElementSibling === finalSection,
      standaloneTimelessSectionPresent: Boolean(document.querySelector("#landing-story .is-timeless-fullscreen-section")),
      finalTimelessLine: normalize(finalSection?.querySelector(".final-cta-button-lead")?.textContent),
      finalTimelessBrandColor: getComputedStyle(finalSection?.querySelector(".final-cta-button-lead .brand-name")).color,
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
    sectionCount: 11,
    firstIsCommunityTruth: true,
    secondIsInterfaceOpposite: true,
    firstFlowsDirectlyToSecond: true,
    firstCopy:
      "Our human, social, and community data has always, and will always be communicated through Human Conversation.",
    firstTitle:
      "Our human, social, and community data has always, and will always be communicated through Human Conversation.",
    firstBody: "",
    secondTitle: "For decades, technology pulled communication onto interfaces. We’re doing the opposite.",
    secondBody: "The intelligence around human conversation will redefine how we come together.",
    interfaceAroundText: "around",
    interfaceAroundFontStyle: "italic",
    interfaceAroundColor: "rgb(255, 248, 236)",
    interfaceHumanConversationText: "human conversation",
    interfaceHumanConversationColor: "rgb(214, 138, 154)",
    thirdTitle: "Human Conversation is how we solve disconnection.",
    fourthTitle:
      "99.9% of communication technology puts an interface between us. Human Conversation brings us together.",
    fifthTitle: "Human Conversation is already the operating system for real-world social networks.",
    fifthBody: "We\u2019re just giving it memory.",
    operatingSystemMemoryColor: "rgb(214, 138, 154)",
    operatingSystemColor: "rgb(255, 248, 236)",
    sixthTitle: "A Human Conversation is worth a thousand taps.",
    interfaceFlowsToSolves: true,
    solvesFlowsToBringsTogether: true,
    bringsTogetherFlowsToOperatingSystem: true,
    operatingSystemFlowsToTaps: true,
    bringsTogetherTitle:
      "99.9% of communication technology puts an interface between us. Human Conversation brings us together.",
    connectionFlowSectionPresent: false,
    bringsTogetherIsFourth: true,
    attentionFlowsToGraph: true,
    lonelinessTitle:
      "We're not lonely because communication disappeared. We're lonely because interfaces keep replacing Human Conversation.",
    humanSurfaceTitle: "Humans stay above the surface. AI handles underneath.",
    humanSurfaceIntro:
      "Members feel remembered. Builders stay present. The memory, matching, scheduling, follow-up, and logistics move underneath.",
    lonelinessFlowsToHumanSurface: true,
    humanSurfaceIsSecondToLast: true,
    humanSurfaceFlowsToFuture: true,
    standaloneTimelessSectionPresent: false,
    finalTimelessLine: "Human Conversation is the timeless interface of community.",
    finalTimelessBrandColor: "rgb(214, 138, 154)",
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
    const context = section.querySelector(".interface-opposite-context");
    const turn = section.querySelector(".interface-opposite-turn");
    const around = section.querySelector(".interface-opposite-around");
    const titleText = Array.from(section.querySelectorAll(".story-title > span"))
      .map((line) => String(line.textContent || "").trim())
      .join(" ");
    const bodyText = String(body?.textContent || "").trim();
    const bodyRect = body.getBoundingClientRect();
    return {
      top: section.getBoundingClientRect().top,
      height: section.getBoundingClientRect().height,
      titleText,
      bodyText,
      aroundText: String(around?.textContent || "").trim(),
      aroundTag: around?.tagName,
      aroundFontStyle: getComputedStyle(around).fontStyle,
      contextText: String(context?.textContent || "").trim(),
      turnText: String(turn?.textContent || "").trim(),
      contextFontSize: Number.parseFloat(getComputedStyle(context).fontSize),
      turnFontSize: Number.parseFloat(getComputedStyle(turn).fontSize),
      contextBottom: context?.getBoundingClientRect().bottom,
      turnTop: turn?.getBoundingClientRect().top,
      bodyFontSize: Number.parseFloat(getComputedStyle(body).fontSize),
      titleLeft: title.left,
      titleRight: title.right,
      titleTop: title.top,
      titleBottom: title.bottom,
      bodyLeft: bodyRect.left,
      bodyRight: bodyRect.right,
      bodyTop: bodyRect.top,
      bodyBottom: bodyRect.bottom,
      bodyDisplay: getComputedStyle(body).display,
      bodyBorderLeft: getComputedStyle(body).borderLeftWidth,
      arrowLength: Number.parseFloat(getComputedStyle(body, "::before").width),
      arrowHead: getComputedStyle(body, "::after").borderTopWidth,
      imageFilter: getComputedStyle(section, "::before").filter,
      overlayBackground: getComputedStyle(section, "::after").backgroundImage,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);

  assert.ok(Math.abs(firstPanel.top) < 3);
  assert.ok(firstPanel.height >= 899);
  assert.equal(firstPanel.titleText, "For decades, technology pulled communication onto interfaces. We’re doing the opposite.");
  assert.equal(firstPanel.aroundText, "around");
  assert.equal(firstPanel.aroundTag, "EM");
  assert.equal(firstPanel.aroundFontStyle, "italic");
  assert.equal(firstPanel.contextText, "For decades, technology pulled communication onto interfaces.");
  assert.equal(firstPanel.turnText, "We\u2019re doing the opposite.");
  assert.equal(firstPanel.bodyText, "The intelligence around human conversation will redefine how we come together.");
  assert.ok(firstPanel.turnFontSize > firstPanel.contextFontSize * 2, "the opposite turn is visibly stronger than the historical setup");
  assert.ok(firstPanel.turnTop - firstPanel.contextBottom >= 44, "the opposite turn is not grouped with the historical setup");
  assert.ok(firstPanel.bodyFontSize > firstPanel.contextFontSize * 2, "the intelligence claim resolves in the larger type treatment");
  assert.ok(firstPanel.titleRight < 720, "the technology statement stays anchored to the dark left half");
  assert.ok(firstPanel.bodyLeft > 650, "the Human Conversation statement stays anchored to the social right half");
  assert.ok(firstPanel.titleTop < firstPanel.bodyTop, "the section reads from upper left to lower right");
  assert.ok(firstPanel.titleTop >= -1 && firstPanel.titleBottom <= 901);
  assert.ok(firstPanel.bodyTop >= -1 && firstPanel.bodyBottom <= 901);
  assert.equal(firstPanel.bodyDisplay, "grid");
  assert.equal(firstPanel.bodyBorderLeft, "0px");
  assert.ok(firstPanel.arrowLength >= 58 && firstPanel.arrowLength <= 97);
  assert.equal(firstPanel.arrowHead, "2px");
  assert.match(firstPanel.imageFilter, /brightness\(1\.12\)/);
  assert.match(firstPanel.overlayBackground, /rgba\(3, 5, 8, 0\.46\)/);
  assert.ok(firstPanel.horizontalOverflow <= 1);

  for (const [width, height] of [
    [1312, 690],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);
    await page.evaluate(`document.querySelector("#landing-story .is-interface-opposite-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-interface-opposite-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const responsivePanel = await page.evaluate(`(() => {
      const rect = (element) => {
        const box = element?.getBoundingClientRect();
        return box ? { left: box.left, right: box.right, top: box.top, bottom: box.bottom } : null;
      };
      const section = document.querySelector("#landing-story .is-interface-opposite-section");
      const title = section?.querySelector(".story-title");
      const body = section?.querySelector(".story-body");
      const context = section?.querySelector(".interface-opposite-context");
      const turn = section?.querySelector(".interface-opposite-turn");
      return {
        title: rect(title),
        body: rect(body),
        cue: rect(section?.querySelector(".section-cue")),
        contextFontSize: Number.parseFloat(getComputedStyle(context).fontSize),
        turnFontSize: Number.parseFloat(getComputedStyle(turn).fontSize),
        contextBottom: context?.getBoundingClientRect().bottom,
        turnTop: turn?.getBoundingClientRect().top,
        bodyFontSize: Number.parseFloat(getComputedStyle(body).fontSize),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.ok(responsivePanel.title && responsivePanel.body && responsivePanel.cue, `${width}x${height} interface composition renders`);
    assert.ok(responsivePanel.horizontalOverflow <= 1, `${width}x${height} interface composition overflows horizontally`);
    assert.ok(responsivePanel.title.left >= 0 && responsivePanel.title.right <= width, `${width}x${height} technology statement leaves the viewport`);
    assert.ok(responsivePanel.body.left >= 0 && responsivePanel.body.right <= width, `${width}x${height} intelligence statement leaves the viewport`);
    assert.ok(responsivePanel.title.top < responsivePanel.body.top, `${width}x${height} loses the intended reading order`);
    assert.ok(responsivePanel.body.bottom + 16 <= responsivePanel.cue.top, `${width}x${height} intelligence statement overlaps the continuation cue`);
    assert.ok(responsivePanel.turnFontSize > responsivePanel.contextFontSize * 2, `${width}x${height} loses the separated opposite hierarchy`);
    assert.ok(responsivePanel.turnTop > responsivePanel.contextBottom, `${width}x${height} regroups the opposite turn with the historical setup`);
    assert.ok(responsivePanel.bodyFontSize > responsivePanel.contextFontSize * 2, `${width}x${height} loses the intelligence hierarchy`);

    if (width > 760) {
      assert.ok(responsivePanel.title.right < width * 0.52, `${width}x${height} technology statement leaves the dark half`);
      assert.ok(responsivePanel.body.left > width * 0.44, `${width}x${height} intelligence statement leaves the social half`);
    } else {
      assert.ok(responsivePanel.body.left > responsivePanel.title.left, `${width}x${height} intelligence statement does not resolve to the right`);
    }
  }

  assertRuntimeHealthy();
});

test("the 99.9% communication-technology thesis lands early and stays readable", async () => {
  for (const [width, height] of [
    [1440, 900],
    [1312, 690],
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
      const interfaceWord = section?.querySelector(".brings-together-interface");
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
        previousIsSolves: section?.previousElementSibling?.classList.contains("is-solves-disconnection-section"),
        nextIsOperatingSystem: section?.nextElementSibling?.classList.contains("is-real-world-os-section"),
        sectionRect: rect(section),
        titleRect: rect(title),
        cueRect: rect(cue),
        statColor: stat ? getComputedStyle(stat).color : null,
        interfaceText: normalize(interfaceWord?.textContent),
        interfaceColor: interfaceWord ? getComputedStyle(interfaceWord).color : null,
        returnColor: returnLine ? getComputedStyle(returnLine).color : null,
        backgroundImage: section ? getComputedStyle(section, "::before").backgroundImage : "",
        backgroundPosition: section ? getComputedStyle(section, "::before").backgroundPosition : "",
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(
      layout.title,
      "99.9% of communication technology puts an interface between us. Human Conversation brings us together.",
    );
    assert.equal(layout.premise, "99.9% of communication technology puts an interface between us.");
    assert.equal(layout.returnLine, "Human Conversation brings us together.");
    assert.equal(layout.index, 3, "the thesis is the fourth story section, immediately after the solution");
    assert.equal(layout.total, 11);
    assert.equal(layout.previousIsSolves, true);
    assert.equal(layout.nextIsOperatingSystem, true);
    assert.equal(layout.statColor, "rgb(91, 143, 212)");
    assert.equal(layout.interfaceText, "interface");
    assert.equal(layout.interfaceColor, layout.statColor);
    assert.equal(layout.returnColor, "rgb(232, 189, 94)");
    assert.match(layout.backgroundImage, /hc-art-interface-opens-to-human-conversation-20260718\.png/);
    assert.ok(
      layout.backgroundPosition
        .split(",")
        .every((position) => position.trim() === (width <= 760 ? "86% 50%" : "50% 50%")),
      `${width}x${height} keeps the human conversation inside the intended crop`,
    );
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} communication thesis has no horizontal overflow`);
    assert.ok(layout.sectionRect.height >= height - 1, `${width}x${height} communication thesis fills the viewport`);
    assert.ok(layout.titleRect.left >= -1 && layout.titleRect.right <= width + 1, `${width}x${height} communication thesis fits horizontally`);
    assert.ok(layout.titleRect.top >= layout.sectionRect.top - 1, `${width}x${height} communication thesis starts inside its section`);
    assert.ok(layout.titleRect.bottom <= layout.sectionRect.bottom + 1, `${width}x${height} communication thesis ends inside its section`);
    assert.ok(layout.titleRect.bottom < layout.cueRect.top, `${width}x${height} continuation control clears the communication thesis`);

    assertRuntimeHealthy();
  }
});

test("the loneliness section grounds the story in the current WHO global scale", async () => {
  for (const [width, height] of [
    [1440, 900],
    [1312, 690],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(`${reviewUrl(PUBLIC_VARIANT)}&reduceMotion=1`);
    await page.waitFor(`document.querySelector("#landing-story .is-lonely-return-section .loneliness-stat")`);
    await page.evaluate(`document.querySelector("#landing-story .is-lonely-return-section")?.scrollIntoView({ behavior: "instant", block: "start" })`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-lonely-return-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const rect = (element) => {
        const box = element?.getBoundingClientRect();
        return box ? { top: box.top, right: box.right, bottom: box.bottom, left: box.left, height: box.height } : null;
      };
      const section = document.querySelector("#landing-story .is-lonely-return-section");
      const title = section?.querySelector(".story-title");
      const stat = section?.querySelector(".loneliness-stat");
      const blueWords = Array.from(title?.querySelectorAll(".lonely-blue") || []);
      const number = stat?.querySelector(".loneliness-stat-number");
      const copy = stat?.querySelector(".loneliness-stat-copy");
      const source = stat?.querySelector(".loneliness-stat-source");
      const cue = section?.querySelector(".section-cue");
      return {
        title: Array.from(title?.children || []).map((line) => normalize(line.textContent)).join(" "),
        stat: normalize(stat?.getAttribute("aria-label")),
        number: normalize(number?.textContent),
        copy: normalize(copy?.textContent),
        source: normalize(source?.textContent),
        sourceHref: source?.href,
        sourceTarget: source?.target,
        sourceRel: source?.rel,
        blueWords: blueWords.map((word) => normalize(word.textContent)),
        blueWordColors: blueWords.map((word) => getComputedStyle(word).color),
        followsGraph: section?.previousElementSibling?.classList.contains("is-graph-section"),
        flowsToHumanSurface: section?.nextElementSibling?.classList.contains("is-human-surface-section"),
        numberColor: number ? getComputedStyle(number).color : null,
        sectionRect: rect(section),
        titleRect: rect(title),
        statRect: rect(stat),
        cueRect: rect(cue),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.equal(
      layout.title,
      "We're not lonely because communication disappeared. We're lonely because interfaces keep replacing Human Conversation.",
    );
    assert.equal(layout.stat, "1 in 6 people worldwide experience loneliness.");
    assert.equal(layout.number, "1 in 6");
    assert.equal(layout.copy, "people worldwide experience loneliness.");
    assert.equal(layout.source, "World Health Organization · 2025");
    assert.equal(layout.sourceHref, "https://www.who.int/groups/commission-on-social-connection");
    assert.equal(layout.sourceTarget, "_blank");
    assert.ok(layout.sourceRel.includes("noopener") && layout.sourceRel.includes("noreferrer"));
    assert.deepEqual(layout.blueWords, ["lonely", "lonely", "interfaces"]);
    assert.deepEqual(layout.blueWordColors, ["rgb(91, 143, 212)", "rgb(91, 143, 212)", "rgb(91, 143, 212)"]);
    assert.equal(layout.followsGraph, true);
    assert.equal(layout.flowsToHumanSurface, true);
    assert.equal(layout.numberColor, "rgb(91, 143, 212)");
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} loneliness section has no horizontal overflow`);
    assert.ok(layout.sectionRect.height >= height - 1, `${width}x${height} loneliness section fills the viewport`);

    for (const [label, box] of [
      ["title", layout.titleRect],
      ["stat", layout.statRect],
      ["continuation control", layout.cueRect],
    ]) {
      assert.ok(box, `${width}x${height} ${label} renders`);
      assert.ok(box.left >= -1 && box.right <= width + 1, `${width}x${height} ${label} fits horizontally`);
      assert.ok(box.top >= layout.sectionRect.top - 1 && box.bottom <= layout.sectionRect.bottom + 1, `${width}x${height} ${label} stays inside the section`);
    }

    if (width > 760) {
      assert.ok(layout.titleRect.right < layout.statRect.left, `${width}x${height} keeps the global scale beside the story`);
    } else {
      assert.ok(layout.titleRect.bottom < layout.statRect.top, `${width}x${height} stacks the global scale beneath the story`);
      assert.ok(layout.statRect.bottom < layout.cueRect.top, `${width}x${height} keeps the continuation control below the source`);
    }

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
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);
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
        secondToLast: sections.at(-2) === section,
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
    assert.equal(layout.secondToLast, true);
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
  await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);

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
      const email = signup?.querySelector('input[type="email"]');
      const timelessLine = signup?.querySelector(".final-cta-button-lead");
      const button = signup?.querySelector('button[type="submit"]');
      const ratio = card?.querySelector(".final-cta-ratio");
      const cardRect = card?.getBoundingClientRect();
      const calloutRect = callout?.getBoundingClientRect();
      const signupRect = signup?.getBoundingClientRect();
      const emailRect = email?.getBoundingClientRect();
      const timelessLineRect = timelessLine?.getBoundingClientRect();
      const buttonRect = button?.getBoundingClientRect();
      const ratioRect = ratio?.getBoundingClientRect();
      return {
        copy: normalize(card?.querySelector(".future-story-side .story-body")?.textContent),
        text: normalize(callout?.textContent),
        kicker: normalize(ratio?.querySelector(".final-cta-ratio-kicker")?.textContent),
        screen: normalize(ratio?.querySelector(".final-cta-ratio-screen")?.textContent),
        human: normalize(ratio?.querySelector(".final-cta-ratio-human")?.textContent),
        promise: normalize(ratio?.querySelector(".final-cta-ratio-promise")?.textContent),
        timelessLine: normalize(timelessLine?.textContent),
        timelessLinePrecedesButton: timelessLine?.nextElementSibling === button,
        position: callout ? getComputedStyle(callout).position : null,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        finalIsLast: sections.at(-1) === section,
        continuationControlPresent: Boolean(section?.querySelector(".section-cue")),
        card: cardRect ? { top: cardRect.top, right: cardRect.right, bottom: cardRect.bottom, left: cardRect.left } : null,
        callout: calloutRect ? { top: calloutRect.top, right: calloutRect.right, bottom: calloutRect.bottom, left: calloutRect.left } : null,
        signup: signupRect ? { top: signupRect.top, right: signupRect.right, bottom: signupRect.bottom, left: signupRect.left } : null,
        email: emailRect ? { top: emailRect.top, right: emailRect.right, bottom: emailRect.bottom, left: emailRect.left } : null,
        timelessLineRect: timelessLineRect ? { top: timelessLineRect.top, right: timelessLineRect.right, bottom: timelessLineRect.bottom, left: timelessLineRect.left } : null,
        button: buttonRect ? { top: buttonRect.top, right: buttonRect.right, bottom: buttonRect.bottom, left: buttonRect.left } : null,
        ratio: ratioRect ? { top: ratioRect.top, right: ratioRect.right, bottom: ratioRect.bottom, left: ratioRect.left } : null,
      };
    })()`);

    assert.equal(layout.copy, "");
    assert.equal(layout.text, "");
    assert.equal(layout.kicker, "Imagine your life.");
    assert.equal(layout.screen, "1% screen time.");
    assert.equal(layout.human, "99% human time.");
    assert.equal(layout.promise, "Imagine a life that runs on Human Conversation and connected experiences.");
    assert.equal(layout.timelessLine, "Human Conversation is the timeless interface of community.");
    assert.equal(layout.timelessLinePrecedesButton, true);
    assert.equal(layout.finalIsLast, true);
    assert.equal(layout.continuationControlPresent, false);
    assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} closing section has no horizontal overflow`);
    assert.equal(layout.callout, null, `${width}x${height} removes the rejected side callout`);
    assert.ok(layout.card && layout.signup && layout.email && layout.timelessLineRect && layout.button && layout.ratio, `${width}x${height} closing card content is present`);
    assert.ok(layout.email.bottom <= layout.timelessLineRect.top, `${width}x${height} timeless line follows the email field`);
    assert.ok(layout.timelessLineRect.bottom <= layout.button.top, `${width}x${height} timeless line sits above the signup button`);
    assert.ok(layout.ratio.left >= layout.card.left - 1 && layout.ratio.right <= layout.card.right + 1, `${width}x${height} ratio stays inside the closing card`);
    assert.ok(layout.signup.bottom <= layout.ratio.top, `${width}x${height} ratio follows the signup without overlap`);
    assert.ok(layout.ratio.bottom <= layout.card.bottom + 1, `${width}x${height} ratio stays inside the closing card vertically`);

    assert.equal(layout.position, null, `${width}x${height} has no side-callout positioning`);

    assertRuntimeHealthy();
  }
});

test("the community-truth section fits desktop and narrow phones without overflow", async () => {
  const expectedCopy =
    "Our human, social, and community data has always, and will always be communicated through Human Conversation.";

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelectorAll("#landing-story .story-section").length === 11`);
    await showStage("human");
    await page.evaluate(`document.querySelector("#landing-hero .story-cue")?.click()`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-community-truth-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const layout = await page.evaluate(`(() => {
      const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const section = document.querySelector("#landing-story .is-community-truth-section");
      const sectionRect = section?.getBoundingClientRect();
      const background = section ? getComputedStyle(section, "::before") : null;
      const emphasizedData = Array.from(section?.querySelectorAll(".community-truth-data em") || []);
      const groupedTerms = Array.from(section?.querySelectorAll(".community-truth-term") || []);
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
        emphasizedData: emphasizedData.map((element) => normalize(element.textContent)),
        emphasizedDataFontStyles: emphasizedData.map((element) => getComputedStyle(element).fontStyle),
        emphasizedDataTransforms: emphasizedData.map((element) => getComputedStyle(element).transform),
        groupedTerms: groupedTerms.map((element) => normalize(element.textContent)),
        groupedTermDisplays: groupedTerms.map((element) => getComputedStyle(element).display),
        groupedTermRectCounts: groupedTerms.map((element) => element.getClientRects().length),
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
    assert.deepEqual(
      layout.emphasizedData,
      ["human", "social", "community"],
      `${width}x${height} emphasizes the three requested data categories`,
    );
    assert.deepEqual(
      layout.emphasizedDataFontStyles,
      ["italic", "italic", "italic"],
      `${width}x${height} renders only the three data categories in italics`,
    );
    layout.emphasizedDataTransforms.forEach((transform) => {
      assert.notEqual(transform, "none", `${width}x${height} keeps each italic visibly distinct`);
    });
    assert.deepEqual(
      layout.groupedTerms,
      ["human,", "social,"],
      `${width}x${height} keeps each comma attached to its preceding word`,
    );
    assert.deepEqual(
      layout.groupedTermDisplays,
      ["inline-block", "inline-block"],
      `${width}x${height} prevents punctuation from wrapping independently`,
    );
    assert.deepEqual(layout.groupedTermRectCounts, [1, 1], `${width}x${height} keeps every word-comma pair on one line`);
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

test("the mobile connection chain ends with community and connection-high, every time together", async () => {
  for (const [width, height] of [
    [504, 844],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelector("#landing-story .is-solves-disconnection-section .story-chain-connection-high-every-time")`);

    const layout = await page.evaluate(`(() => {
      const section = document.querySelector("#landing-story .is-solves-disconnection-section");
      const chain = section?.querySelector(".story-chain");
      const community = chain?.querySelector(".story-chain-community");
      const repeat = chain?.querySelector(".story-chain-connection-high-every-time");
      const connector = community?.nextElementSibling;
      const mobileBreak = chain?.querySelector(".story-chain-mobile-break");
      const cue = section?.querySelector(".section-cue");
      const toRect = (element) => {
        const rect = element?.getBoundingClientRect();
        return rect ? { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left } : null;
      };
      return {
        section: toRect(section),
        community: toRect(community),
        repeat: toRect(repeat),
        connector: toRect(connector),
        cue: toRect(cue),
        connectorIsArrow: connector?.classList.contains("story-chain-arrow") || false,
        mobileBreakDisplay: mobileBreak ? getComputedStyle(mobileBreak).display : null,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.ok(layout.section && layout.community && layout.repeat && layout.connector && layout.cue, `${width} chain ending and continuation cue are present`);
    assert.equal(layout.mobileBreakDisplay, "block", `${width} uses the deliberate mobile row break`);
    assert.equal(layout.connectorIsArrow, true, `${width} keeps the connector between the final pair`);
    if (width <= 320) {
      assert.ok(layout.repeat.top >= layout.community.top, `${width} preserves the final connection label after the community pill`);
    } else {
      assert.ok(Math.abs(layout.community.top - layout.repeat.top) <= 2, `${width} final pills share one row`);
    }
    assert.ok(Math.abs(layout.community.top - layout.connector.top) <= 2, `${width} final connector shares that row`);
    assert.ok(layout.community.left < layout.connector.left && layout.connector.left < layout.repeat.left, `${width} final pair reads left to right`);
    assert.ok(layout.repeat.right <= width + 1, `${width} final pill stays inside the viewport`);
    assert.ok(
      layout.repeat.bottom <= layout.cue.top - 16,
      `${width} continuation cue clears connection-high, every time (gap ${layout.cue.top - layout.repeat.bottom}px)`,
    );
    assert.ok(layout.cue.bottom <= layout.section.bottom - 16, `${width} continuation cue stays inside its reserved bottom zone`);
    assert.ok(layout.horizontalOverflow <= 1, `${width} chain has no horizontal overflow`);
    assertRuntimeHealthy();
  }
});

test("the disconnection method copy stays organized on short desktop and phones", async () => {
  for (const [width, height] of [
    [1312, 690],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewport(width, height);
    await page.navigate(reviewUrl(PUBLIC_VARIANT));
    await page.waitFor(`document.querySelector("#landing-story .is-solves-disconnection-section")`);
    await page.evaluate(`document.querySelector("#landing-story .is-solves-disconnection-section")?.scrollIntoView({ block: "start", behavior: "instant" })`);
    await page.waitFor(`Math.abs(document.querySelector("#landing-story .is-solves-disconnection-section")?.getBoundingClientRect().top ?? 9999) < 3`);

    const layout = await page.evaluate(`(() => {
      const section = document.querySelector("#landing-story .is-solves-disconnection-section");
      const rect = (selector) => {
        const box = section?.querySelector(selector)?.getBoundingClientRect();
        return box ? { top: box.top, right: box.right, bottom: box.bottom, left: box.left } : null;
      };
      const sectionBox = section?.getBoundingClientRect();
      return {
        section: sectionBox ? { top: sectionBox.top, right: sectionBox.right, bottom: sectionBox.bottom, left: sectionBox.left } : null,
        title: rect(".story-title"),
        body: rect(".story-body"),
        chain: rect(".story-chain"),
        cue: rect(".section-cue"),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);

    assert.ok(layout.section && layout.title && layout.body && layout.chain && layout.cue, `${width} renders the complete disconnection section`);
    for (const [name, box] of Object.entries({ title: layout.title, body: layout.body, chain: layout.chain, cue: layout.cue })) {
      assert.ok(box.left >= -1 && box.right <= width + 1, `${width} ${name} stays inside the viewport`);
      assert.ok(box.top >= layout.section.top - 1 && box.bottom <= layout.section.bottom + 1, `${width} ${name} stays inside the section`);
    }
    assert.ok(layout.title.bottom <= layout.body.top + 1, `${width} title clears the supporting copy`);
    assert.ok(layout.body.bottom <= layout.chain.top + 1, `${width} supporting copy clears the connection chain`);
    assert.ok(layout.chain.bottom <= layout.cue.top - 16, `${width} connection chain clears the continuation cue`);
    assert.ok(layout.horizontalOverflow <= 1, `${width} disconnection section has no horizontal overflow`);
    assertRuntimeHealthy();
  }
});
