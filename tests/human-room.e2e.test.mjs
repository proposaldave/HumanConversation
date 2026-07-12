import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { launchChrome, startStaticServer } from "./helpers/chrome-cdp.mjs";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = dirname(TEST_DIRECTORY);
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, "dist");
const VARIANT = "life-runs-on-human-conversation";

let staticServer;
let chrome;
let page;

function roomUrl(query = "") {
  return `${staticServer.baseUrl}/?review=1&variant=${VARIANT}&experience=human-room${query}`;
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

test("the 1% / 99% Room exists only on the strict noindex review URL", async () => {
  await page.navigate(roomUrl("&demoState=prompt&reduceMotion=1"));
  const exact = await page.evaluate(`({
    reviewClass: document.documentElement.classList.contains("hc-master-prompt-review"),
    roomClass: document.documentElement.classList.contains("hc-human-room-preview"),
    roomExperience: document.querySelectorAll(".hc-room-experience").length,
    roomCount: document.querySelectorAll("[data-hc-room]").length,
    robots: document.querySelector('meta[name="robots"]')?.content,
    state: document.querySelector("[data-hc-demo]")?.dataset.demoState,
    pageVisibility: getComputedStyle(document.querySelector(".page")).visibility,
  })`);

  assert.deepEqual(exact, {
    reviewClass: true,
    roomClass: true,
    roomExperience: 1,
    roomCount: 1,
    robots: "noindex,nofollow",
    state: "prompt",
    pageVisibility: "visible",
  });

  await page.navigate(`${staticServer.baseUrl}/?review=1&variant=${VARIANT}&experience=human-r00m&demoState=journey&reduceMotion=1`);
  const nearMiss = await page.evaluate(`({
    roomClass: document.documentElement.classList.contains("hc-human-room-preview"),
    roomCount: document.querySelectorAll("[data-hc-room]").length,
    classicFuture: document.querySelectorAll(".hc-future-copy").length,
  })`);
  assert.deepEqual(nearMiss, { roomClass: false, roomCount: 0, classicFuture: 1 });
  assertRuntimeHealthy();
});

test("Run enters one full-screen playable room without touching the saved 11-section page", async () => {
  await page.navigate(roomUrl("&demoState=prompt&reduceMotion=1"));
  const requestsBefore = page.networkRequests.length;
  await page.evaluate(`document.querySelector('[data-hc-action="run"]').click()`);
  await page.waitFor(`document.querySelector("[data-hc-room]")?.dataset.roomStep === "0" && document.querySelector("[data-hc-demo]")?.dataset.demoState === "journey"`);

  const state = await page.evaluate(`(() => {
    const room = document.querySelector("[data-hc-room]");
    const rect = room?.getBoundingClientRect();
    const activeBeat = room?.querySelector('[data-room-beat="0"]');
    return {
      demoState: document.querySelector("[data-hc-demo]")?.dataset.demoState,
      roomStep: room?.dataset.roomStep,
      activeTitle: activeBeat?.querySelector("h2")?.textContent?.replace(/\\s+/g, " ").trim(),
      activeHidden: activeBeat?.getAttribute("aria-hidden"),
      roomCoversViewport: Boolean(rect && rect.left <= 0 && rect.top <= 0 && rect.width >= innerWidth && rect.height >= innerHeight),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflow: getComputedStyle(document.body).overflow,
      savedSections: document.querySelectorAll("#landing-story .story-section, #landing-story .story-final").length,
      publicIntro: Boolean(document.querySelector("[data-hc-public-intro]")),
    };
  })()`);

  assert.deepEqual(state, {
    demoState: "journey",
    roomStep: "0",
    activeTitle: "This isn’t a page. It’s a room.",
    activeHidden: "false",
    roomCoversViewport: true,
    horizontalOverflow: 0,
    bodyOverflow: "hidden",
    savedSections: 6,
    publicIntro: false,
  });

  const requests = page.networkRequests
    .slice(requestsBefore)
    .filter((request) => request.type === "Fetch" || request.type === "XHR");
  assert.deepEqual(requests, []);
  assertRuntimeHealthy();
});

test("the visitor can play the complete human connection arc with no network action", async () => {
  await page.navigate(roomUrl("&demoState=journey&roomStep=0&reduceMotion=1"));
  const requestsBefore = page.networkRequests.length;
  const expected = [
    [1, "What the room missed.", "context matched"],
    [2, "Now listen.", "signal captured"],
    [3, "Maya is already at the door.", "follow-through ready"],
    [4, "You didn’t scroll through our story. You started one.", "computer work complete"],
  ];

  for (const [step, title, systemText] of expected) {
    await page.evaluate(`document.querySelector('[data-hc-room-next="${step}"]').click()`);
    await page.waitFor(`document.querySelector("[data-hc-room]")?.dataset.roomStep === "${step}"`);
    await page.waitFor(`document.activeElement === document.querySelector('[data-room-beat="${step}"] h2')`);
    const played = await page.evaluate(`(() => {
      const room = document.querySelector("[data-hc-room]");
      const beat = room?.querySelector('[data-room-beat="${step}"]');
      return {
        title: beat?.querySelector("h2")?.textContent?.replace(/\\s+/g, " ").trim(),
        hidden: beat?.getAttribute("aria-hidden"),
        inert: beat?.inert,
        system: room?.querySelector("[data-hc-room-system]")?.textContent,
        progress: [...room.querySelectorAll(".hc-room-progress li")].findIndex((item) => item.getAttribute("aria-current") === "step"),
        focused: document.activeElement === beat?.querySelector("h2"),
      };
    })()`);
    assert.equal(played.title, title);
    assert.equal(played.hidden, "false");
    assert.equal(played.inert, false);
    assert.match(played.system, new RegExp(systemText));
    assert.equal(played.progress, step);
    assert.equal(played.focused, true);
  }

  const finalState = await page.evaluate(`({
    demoState: document.querySelector("[data-hc-demo]")?.dataset.demoState,
    mailHref: document.querySelector(".hc-room-mail")?.getAttribute("href"),
    mailText: document.querySelector(".hc-room-mail")?.textContent?.trim(),
    replayText: document.querySelector(".hc-room-replay")?.textContent?.trim(),
  })`);
  assert.equal(finalState.demoState, "resolved");
  assert.match(finalState.mailHref, /^mailto:hello@humanconversation\.com/);
  assert.equal(finalState.mailText, "Make my community feel like this");
  assert.equal(finalState.replayText, "Play again");

  const requests = page.networkRequests
    .slice(requestsBefore)
    .filter((request) => request.type === "Fetch" || request.type === "XHR");
  assert.deepEqual(requests, []);
  assertRuntimeHealthy();
});

test("room controls work from the keyboard and Replay restores the CRT", async () => {
  await page.navigate(roomUrl("&demoState=journey&roomStep=0&reduceMotion=1"));
  await page.evaluate(`document.querySelector('[data-hc-room-next="1"]').focus()`);
  await page.pressEnter();
  await page.waitFor(`document.querySelector("[data-hc-room]")?.dataset.roomStep === "1"`);
  await page.evaluate(`document.querySelector('[data-hc-room-next="2"]').focus()`);
  await page.pressEnter();
  await page.waitFor(`document.querySelector("[data-hc-room]")?.dataset.roomStep === "2"`);

  await page.navigate(roomUrl("&demoState=resolved&roomStep=4&reduceMotion=1"));
  await page.evaluate(`document.querySelector(".hc-room-replay").click()`);
  await page.waitFor(`document.querySelector("[data-hc-demo]")?.dataset.demoState === "prompt"`);
  await page.waitFor(`document.activeElement?.id === "hc-master-prompt"`);
  const replayed = await page.evaluate(`({
    state: document.querySelector("[data-hc-demo]")?.dataset.demoState,
    roomStep: document.querySelector("[data-hc-room]")?.dataset.roomStep,
    focused: document.activeElement?.id,
  })`);
  assert.deepEqual(replayed, { state: "prompt", roomStep: "0", focused: "hc-master-prompt" });
  assertRuntimeHealthy();
});

test("every room beat stays viewport-safe on desktop and phones", async () => {
  const sizes = [
    [1440, 900],
    [390, 844],
    [320, 800],
  ];

  for (const [width, height] of sizes) {
    for (const step of [0, 2, 4]) {
      await page.setViewport(width, height);
      await page.navigate(roomUrl(`&demoState=${step === 4 ? "resolved" : "journey"}&roomStep=${step}&reduceMotion=1`));
      const layout = await page.evaluate(`(() => {
        const room = document.querySelector("[data-hc-room]");
        const beat = room?.querySelector('[data-room-beat="${step}"]');
        const action = beat?.querySelector("button, a");
        const roomRect = room?.getBoundingClientRect();
        const actionRect = action?.getBoundingClientRect();
        return {
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          roomLeft: roomRect?.left ?? -1,
          roomRight: roomRect?.right ?? -1,
          roomTop: roomRect?.top ?? -1,
          roomBottom: roomRect?.bottom ?? -1,
          actionWidth: actionRect?.width || 0,
          actionHeight: actionRect?.height || 0,
          actionLeft: actionRect?.left ?? -1,
          actionRight: actionRect?.right ?? -1,
          actionTop: actionRect?.top ?? -1,
          actionBottom: actionRect?.bottom ?? -1,
          bodyOverflow: getComputedStyle(document.body).overflow,
        };
      })()`);
      assert.ok(layout.horizontalOverflow <= 1, `${width}x${height} step ${step} has no horizontal overflow`);
      assert.ok(layout.roomLeft <= 0 && layout.roomRight >= width, `${width}x${height} step ${step} fills width`);
      assert.ok(layout.roomTop <= 0 && layout.roomBottom >= height, `${width}x${height} step ${step} fills height`);
      assert.ok(layout.actionWidth >= 42 && layout.actionHeight >= 42, `${width}x${height} step ${step} action is tappable`);
      assert.ok(layout.actionLeft >= -1 && layout.actionRight <= width + 1, `${width}x${height} step ${step} action fits horizontally`);
      assert.ok(layout.actionTop >= -1 && layout.actionBottom <= height + 1, `${width}x${height} step ${step} action fits vertically`);
      assert.equal(layout.bodyOverflow, "hidden");
      assertRuntimeHealthy();
    }
  }

  await page.setViewport(1440, 900);
});
