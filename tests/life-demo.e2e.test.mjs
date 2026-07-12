import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

import { launchChrome, startStaticServer } from "./helpers/chrome-cdp.mjs";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(TEST_DIRECTORY);
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, "dist");
const MASTER_PROMPT =
  "Make my life 99% human conversation and shared experiences — and only 1% screen time.";
const VARIANT = "life-runs-on-human-conversation";

const baseline = JSON.parse(
  await readFile(join(TEST_DIRECTORY, "fixtures", "public-home-baseline.json"), "utf8"),
);

let staticServer;
let chrome;
let page;

function reviewUrl(query = "") {
  return `${staticServer.baseUrl}/?review=1&variant=${VARIANT}${query}`;
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

test("public homepage remains the saved default", async () => {
  await page.navigate(`${staticServer.baseUrl}/`);

  const projection = await page.evaluate(`(() => {
    const normalizeText = (element) => element?.textContent?.replace(/\\s+/g, " ").trim();
    const storyText = normalizeText(document.querySelector("#landing-story")) || "";
    return {
      variant: document.querySelector(".page")?.getAttribute("data-variant"),
      heroClass: document.querySelector("#landing-hero")?.getAttribute("class"),
      headlineLabel: document.querySelector("#landing-hero h1")?.getAttribute("aria-label"),
      headlineText: normalizeText(document.querySelector("#landing-hero h1")),
      ledeText: normalizeText(document.querySelector("#landing-hero .lede")),
      headerEmail: normalizeText(document.querySelector(".header-email")),
      storySections: document.querySelectorAll("#landing-story .story-section, #landing-story .story-final").length,
      heroSignupAction: document.querySelector("#email-capture")?.getAttribute("action"),
      footerText: normalizeText(document.querySelector(".site-footer")),
      storyMarkers: ${JSON.stringify(baseline.storyMarkers)}.map((marker) => storyText.includes(marker)),
      hasDemo: Boolean(document.querySelector("[data-hc-demo]")),
      robots: document.querySelector('meta[name="robots"]')?.content || null,
    };
  })()`);

  const { storyMarkers, hasDemo, robots, ...stableProjection } = projection;
  const { storyMarkers: baselineMarkers, ...stableBaseline } = baseline;
  assert.deepEqual(stableProjection, stableBaseline);
  assert.deepEqual(storyMarkers, baselineMarkers.map(() => true));
  assert.equal(hasDemo, false);
  assert.equal(robots, null);

  for (const suffix of [
    `?variant=${VARIANT}`,
    `?review=0&variant=${VARIANT}`,
    `?review=1&variant=human-thread-home&demoState=resolved&reduceMotion=1`,
  ]) {
    await page.navigate(`${staticServer.baseUrl}/${suffix}`);
    const guardedState = await page.evaluate(`({
      variant: document.querySelector(".page")?.dataset.variant,
      hasDemo: Boolean(document.querySelector("[data-hc-demo]")),
      hasRobots: Boolean(document.querySelector('meta[name="robots"]')),
    })`);
    assert.equal(guardedState.hasDemo, false);
    assert.equal(guardedState.hasRobots, false);
  }

  assertRuntimeHealthy();
});

test("only the exact hidden route initializes the noindex demo", async () => {
  await page.navigate(reviewUrl());
  const exactRoute = await page.evaluate(`({
    variant: document.querySelector(".page")?.dataset.variant,
    demoCount: document.querySelectorAll("[data-hc-demo]").length,
    state: document.querySelector("[data-hc-demo]")?.dataset.demoState,
    robots: document.querySelector('meta[name="robots"]')?.content,
  })`);

  assert.equal(exactRoute.variant, VARIANT);
  assert.equal(exactRoute.demoCount, 1);
  assert.equal(exactRoute.state, "prompt");
  assert.equal(exactRoute.robots, "noindex,nofollow");

  await page.navigate(`${staticServer.baseUrl}/?review=1&option=43&demoState=resolved`);
  const optionRoute = await page.evaluate(`({
    hasDemo: Boolean(document.querySelector("[data-hc-demo]")),
    hasRobots: Boolean(document.querySelector('meta[name="robots"]')),
  })`);
  assert.equal(optionRoute.hasDemo, false);
  assert.equal(optionRoute.hasRobots, false);
  assertRuntimeHealthy();
});

test("prompt state is an image-free vintage CRT with one progressively typed prompt", async () => {
  await page.navigate(reviewUrl("&demoState=prompt"));
  await page.waitFor(`document.querySelector("#hc-master-prompt")?.value === ${JSON.stringify(MASTER_PROMPT)}`, {
    timeout: 4000,
  });
  const promptState = await page.evaluate(`(() => {
    const root = document.querySelector("[data-hc-demo]");
    const input = document.querySelector("#hc-master-prompt");
    const run = document.querySelector('[data-hc-action="run"]');
    const promptPanel = document.querySelector('[data-hc-panel="prompt"]');
    const futureLayer = document.querySelector(".hc-future-layer");
    const crtShell = document.querySelector(".hc-terminal-window");
    const crtScreen = document.querySelector(".hc-crt-screen");
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const expected = normalize(${JSON.stringify(MASTER_PROMPT)});
    const occurrenceSources = [
      normalize(promptPanel?.innerText),
      ...[...promptPanel.querySelectorAll("input, textarea")].map((control) => normalize(control.value)),
    ];
    const occurrences = occurrenceSources.reduce((total, source) => {
      let count = 0;
      let offset = 0;
      while ((offset = source.indexOf(expected, offset)) !== -1) {
        count += 1;
        offset += expected.length;
      }
      return total + count;
    }, 0);
    const visibleImageBackgrounds = [...root.querySelectorAll("*")]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          rect.width > 0 && rect.height > 0 &&
          style.backgroundImage.includes("url(");
      })
      .map((element) => element.className);
    return {
      state: root?.dataset.demoState,
      inputValue: input?.value,
      inputVisible: Boolean(input && input.getBoundingClientRect().width && input.getBoundingClientRect().height),
      inputFocused: document.activeElement === input,
      inputFont: getComputedStyle(input).fontFamily,
      inputColor: getComputedStyle(input).color,
      rootBackground: getComputedStyle(root).backgroundColor,
      runLabel: run?.getAttribute("aria-label"),
      runText: normalize(run?.textContent),
      typingState: document.querySelector("[data-hc-typing-status]")?.dataset.typingState,
      occurrences,
      hasIllustrativeNote: Boolean(root?.querySelector(".hc-prompt-note")),
      hasIllustrativeCopy: /Illustrative product experience/i.test(root?.innerText || ""),
      hasIllustrativeLabel: [...root.querySelectorAll("[aria-label]")].some((element) =>
        /Illustrative.*product experience/i.test(element.getAttribute("aria-label") || "")
      ),
      futureOpacity: Number(getComputedStyle(futureLayer).opacity),
      pagePseudoBackground: getComputedStyle(document.querySelector(".page"), "::before").backgroundImage,
      visibleImageBackgrounds,
      hasCopyAction: Boolean(root?.querySelector('[data-hc-action="copy"], .copy-icon')),
      hasChatUi: Boolean(root?.querySelector('[data-hc-ai-reply], [data-hc-thinking], [data-hc-transcript], .chat-bubble')),
      hasWarmHardware: getComputedStyle(crtShell).backgroundColor === "rgb(184, 173, 148)",
      hasConvexGlass: parseFloat(getComputedStyle(crtScreen).borderTopLeftRadius) >= 40,
      hasScanlines: getComputedStyle(crtScreen, "::after").backgroundImage.includes("repeating-linear-gradient"),
      hasPowerLight: Boolean(root?.querySelector(".hc-crt-power i")),
      hardwareCopy: normalize(root?.querySelector(".hc-crt-hardware")?.textContent),
    };
  })()`);

  assert.deepEqual(promptState, {
    state: "prompt",
    inputValue: MASTER_PROMPT,
    inputVisible: true,
    inputFocused: true,
    inputFont: promptState.inputFont,
    inputColor: "rgb(245, 201, 121)",
    rootBackground: "rgb(5, 6, 8)",
    runLabel: "Run this prompt",
    runText: "Run↵",
    typingState: "complete",
    occurrences: 1,
    hasIllustrativeNote: false,
    hasIllustrativeCopy: false,
    hasIllustrativeLabel: false,
    futureOpacity: 0,
    pagePseudoBackground: "none",
    visibleImageBackgrounds: [],
    hasCopyAction: false,
    hasChatUi: false,
    hasWarmHardware: true,
    hasConvexGlass: true,
    hasScanlines: true,
    hasPowerLight: true,
    hardwareCopy: "Human Computer · Model 01 Power",
  });
  assert.match(promptState.inputFont, /mono|Consolas|Cascadia|Courier/i);
  assertRuntimeHealthy();
});

test("the prompt visibly types before becoming ready", async () => {
  await page.navigate(reviewUrl("&demoState=prompt"));
  await page.waitFor(`(() => {
    const value = document.querySelector("#hc-master-prompt")?.value || "";
    return value.length > 0 && value.length < ${MASTER_PROMPT.length};
  })()`, { timeout: 1800 });

  const midTyping = await page.evaluate(`({
    length: document.querySelector("#hc-master-prompt")?.value.length,
    typingState: document.querySelector("[data-hc-typing-status]")?.dataset.typingState,
  })`);
  assert.ok(midTyping.length > 0 && midTyping.length < MASTER_PROMPT.length);
  assert.equal(midTyping.typingState, "typing");

  await page.waitFor(`document.querySelector("#hc-master-prompt")?.value === ${JSON.stringify(MASTER_PROMPT)}`, {
    timeout: 4000,
  });
  assert.equal(
    await page.evaluate(`document.querySelector("[data-hc-typing-status]")?.dataset.typingState`),
    "complete",
  );
  assertRuntimeHealthy();
});

test("Shift+Enter makes a newline while Enter performs the doorway transition", async () => {
  await page.setReducedMotion(false);
  await page.navigate(reviewUrl("&demoState=prompt"));
  await page.waitFor(`document.querySelector("#hc-master-prompt")?.value === ${JSON.stringify(MASTER_PROMPT)}`, {
    timeout: 4000,
  });
  await page.evaluate(`(() => {
    const input = document.querySelector("#hc-master-prompt");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  })()`);

  await page.pressEnter({ shift: true });
  const afterShiftEnter = await page.evaluate(`({
    state: document.querySelector("[data-hc-demo]")?.dataset.demoState,
    value: document.querySelector("#hc-master-prompt")?.value,
  })`);
  assert.equal(afterShiftEnter.state, "prompt");
  assert.equal(afterShiftEnter.value, `${MASTER_PROMPT}\n`);

  const startedAt = Date.now();
  await page.pressEnter();
  assert.equal(
    await page.evaluate(`document.querySelector("[data-hc-demo]")?.dataset.demoState`),
    "transitioning",
  );
  await page.waitFor(`Number(getComputedStyle(document.querySelector(".hc-future-layer")).opacity) > 0`);
  const transitionVisual = await page.evaluate(`(() => {
    const root = document.querySelector("[data-hc-demo]");
    const promptPanel = root.querySelector('[data-hc-panel="prompt"]');
    const transitionPanel = root.querySelector('[data-hc-panel="transitioning"]');
    const futureLayer = root.querySelector(".hc-future-layer");
    return {
      promptHidden: promptPanel.getAttribute("aria-hidden") === "true" && promptPanel.inert,
      transitionActive: transitionPanel.getAttribute("aria-hidden") === "false" && !transitionPanel.inert,
      futureVisible: Number(getComputedStyle(futureLayer).opacity) > 0,
      runningMotion: root.getAnimations({ subtree: true }).some((animation) => {
        const duration = Number(animation.effect?.getComputedTiming()?.duration || 0);
        return animation.playState === "running" && duration >= 300;
      }),
    };
  })()`);
  assert.deepEqual(transitionVisual, {
    promptHidden: true,
    transitionActive: true,
    futureVisible: true,
    runningMotion: true,
  });
  await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`, {
    timeout: 2800,
  });
  const elapsed = Date.now() - startedAt;
  assert.ok(elapsed >= 1500 && elapsed <= 2400, `transition took ${elapsed}ms`);
  await page.waitFor(`document.activeElement?.id === "hc-resolved-title"`);
  assertRuntimeHealthy();
});

test("manual edits stop autotyping and survive submission", async () => {
  const customPrompt = "Handle the screen work, then help me meet the right people.";
  await page.navigate(reviewUrl("&demoState=prompt&reduceMotion=1"));
  await page.evaluate(`(() => {
    const input = document.querySelector("#hc-master-prompt");
    input.value = ${JSON.stringify(customPrompt)};
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "x" }));
    input.focus();
  })()`);
  await page.pressEnter();
  await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`);
  assert.equal(
    await page.evaluate(`document.querySelector("#hc-master-prompt")?.value`),
    customPrompt,
  );
  assertRuntimeHealthy();
});

test("the touch button is double-submit safe and makes no network request", async () => {
  await page.navigate(reviewUrl("&demoState=prompt"));
  const requestsBefore = page.networkRequests.length;

  const immediateState = await page.evaluate(`(() => {
    const run = document.querySelector('[data-hc-action="run"]');
    run.click();
    run.click();
    return {
      state: document.querySelector("[data-hc-demo]")?.dataset.demoState,
      journeyRoots: document.querySelectorAll("[data-hc-journey]").length,
    };
  })()`);

  assert.equal(immediateState.state, "transitioning");
  assert.equal(immediateState.journeyRoots, 1);
  await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`, {
    timeout: 2800,
  });

  const demoRequests = page.networkRequests
    .slice(requestsBefore)
    .filter((request) => request.type === "Fetch" || request.type === "XHR");
  assert.deepEqual(demoRequests, []);
  assertRuntimeHealthy();
});

test("the future is one complete Maya-led human outcome", async () => {
  await page.navigate(reviewUrl("&demoState=journey"));
  const journeyText = await page.evaluate(
    `document.querySelector("[data-hc-journey]")?.textContent?.replace(/\\s+/g, " ").trim()`,
  );

  for (const exactText of [
    "Maya · Community builder",
    "I’ll meet you at the door.",
    "Warm up with me at 9:45?",
    "Saturday · 10:00 AM",
    "You arrive expected.",
    "Maya hosts. Jordan is already waiting.",
    "You don’t walk in alone.",
    "Coffee after. Come with us.",
    "Tuesday · 6:30 PM",
    "You’re already coming back.",
    "The same people. One new invitation.",
    "You’re not starting over.",
    "Human Conversation makes this prompt real.",
  ]) {
    assert.ok(journeyText.includes(exactText), `journey contains: ${exactText}`);
  }

  await page.navigate(reviewUrl("&demoState=resolved"));
  const resolved = await page.evaluate(`({
    state: document.querySelector("[data-hc-demo]")?.dataset.demoState,
    title: document.querySelector("#hc-resolved-title")?.textContent?.trim(),
    copy: document.querySelector(".hc-future-copy > p:not(.hc-resolved-kicker)")?.textContent?.trim(),
    join: document.querySelector('[data-hc-action="join"]')?.textContent?.trim(),
    replay: document.querySelector('[data-hc-action="replay"]')?.textContent?.trim(),
    hasResolveStep: Boolean(document.querySelector('[data-hc-action="resolve"]')),
    futurePanel: document.querySelector('[data-hc-panel="journey"]')?.getAttribute("aria-hidden"),
  })`);
  assert.deepEqual(resolved, {
    state: "resolved",
    title: "Human Conversation makes this prompt real.",
    copy: "AI in the background. Community builders making the next right connection happen.",
    join: "Join the conversation",
    replay: "Replay",
    hasResolveStep: false,
    futurePanel: "false",
  });

  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.equal(
    await page.evaluate(`document.querySelector("[data-hc-demo]")?.dataset.demoState`),
    "resolved",
  );
  assertRuntimeHealthy();
});

test("Replay cleanly restores the prompt and focus", async () => {
  await page.navigate(reviewUrl("&demoState=resolved&reduceMotion=1"));
  await page.evaluate(`document.querySelector('[data-hc-action="replay"]').click()`);
  await page.waitFor(`document.activeElement?.id === "hc-master-prompt"`);
  const replayed = await page.evaluate(`({
    state: document.querySelector("[data-hc-demo]")?.dataset.demoState,
    value: document.querySelector("#hc-master-prompt")?.value,
    focused: document.activeElement?.id,
    typingState: document.querySelector("[data-hc-typing-status]")?.dataset.typingState,
    demoCount: document.querySelectorAll("[data-hc-demo]").length,
  })`);
  assert.deepEqual(replayed, {
    state: "prompt",
    value: MASTER_PROMPT,
    focused: "hc-master-prompt",
    typingState: "complete",
    demoCount: 1,
  });
  assertRuntimeHealthy();
});

test("query and operating-system reduced motion skip the timed transition", async () => {
  for (const useQueryOverride of [true, false]) {
    await page.setReducedMotion(!useQueryOverride);
    await page.navigate(reviewUrl(useQueryOverride ? "&reduceMotion=1" : ""));
    await page.evaluate(`document.querySelector("#hc-master-prompt").focus()`);
    const startedAt = Date.now();
    await page.pressEnter();
    await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`, {
      timeout: 500,
    });
    const elapsed = Date.now() - startedAt;
    assert.ok(elapsed < 250, `reduced-motion transition took ${elapsed}ms`);
    assert.equal(
      await page.evaluate(`document.querySelector("[data-hc-demo]").getAnimations({ subtree: true }).filter((animation) => {
        const timing = animation.effect?.getComputedTiming();
        return animation.playState === "running" && Number(timing?.duration || 0) > 10;
      }).length`),
      0,
    );
  }

  await page.setReducedMotion(false);
  assertRuntimeHealthy();
});

test("resolved CTA scrolls to and focuses the existing signup without submitting", async () => {
  await page.navigate(reviewUrl("&demoState=resolved&reduceMotion=1"));
  const beforeUrl = await page.evaluate("window.location.href");
  await page.evaluate(`document.querySelector('[data-hc-action="join"]').click()`);
  await page.waitFor(`document.activeElement?.matches('.life-final-section .story-contact input[type="email"]')`);
  const focusedSignup = await page.evaluate(`({
    id: document.activeElement?.id,
    isEmail: document.activeElement?.type === "email",
    status: document.activeElement?.closest("form")?.querySelector(".status")?.textContent || "",
    url: window.location.href,
  })`);
  assert.ok(focusedSignup.id.startsWith("email-life-runs-on-human-conversation-"));
  assert.equal(focusedSignup.isEmail, true);
  assert.equal(focusedSignup.status, "");
  assert.equal(focusedSignup.url, beforeUrl);
  assertRuntimeHealthy();
});

test("prompt, journey, and resolution stay horizontally safe across required sizes", async () => {
  const sizes = [
    [1440, 900],
    [1280, 800],
    [430, 932],
    [390, 844],
    [320, 800],
  ];
  const actionByState = {
    prompt: "run",
    journey: "join",
    resolved: "join",
  };

  for (const [width, height] of sizes) {
    await page.setViewport(width, height);
    for (const state of ["prompt", "journey", "resolved"]) {
      await page.navigate(reviewUrl(`&demoState=${state}&reduceMotion=1`));
      const layout = await page.evaluate(`(() => {
        const action = document.querySelector('[data-hc-action="${actionByState[state]}"]');
        const rect = action?.getBoundingClientRect();
        const rootStyle = getComputedStyle(document.documentElement);
        const bodyStyle = getComputedStyle(document.body);
        return {
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          actionWidth: rect?.width || 0,
          actionHeight: rect?.height || 0,
          actionLeft: rect?.left ?? -1,
          actionRight: rect?.right ?? -1,
          htmlOverflow: rootStyle.overflow,
          bodyOverflow: bodyStyle.overflow,
        };
      })()`);

      assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} ${state} has horizontal overflow`);
      assert.ok(layout.actionWidth > 0 && layout.actionHeight > 0, `${width}x${height} ${state} action is usable`);
      assert.ok(layout.actionLeft >= -1 && layout.actionRight <= width + 1, `${width}x${height} ${state} action fits`);
      assert.notEqual(layout.htmlOverflow, "hidden");
      assert.notEqual(layout.bodyOverflow, "hidden");
      assertRuntimeHealthy();
    }
  }

  await page.setViewport(1440, 900);
});

test("the future image is local and present in the built site", async () => {
  for (const asset of [
    "assets/hc-art-solves-disconnection-community-host-20260706.png",
  ]) {
    const response = await fetch(`${staticServer.baseUrl}/${asset}`);
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get("content-type") || "", /^image\/png/);
  }
});
