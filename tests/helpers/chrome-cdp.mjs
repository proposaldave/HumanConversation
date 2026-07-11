import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function startStaticServer(rootDirectory) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      const requestedPath = decodeURIComponent(requestUrl.pathname);
      const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
      const normalizedPath = normalize(relativePath);

      if (normalizedPath.startsWith("..")) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      let filePath = join(rootDirectory, normalizedPath);
      const fileStats = await stat(filePath).catch(() => undefined);
      if (fileStats?.isDirectory()) filePath = join(filePath, "index.html");

      const body = await readFile(filePath);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start the test server");

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

class CdpSession {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.socket = undefined;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.consoleErrors = [];
    this.exceptions = [];
    this.failedRequests = [];
    this.networkRequests = [];
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);

    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));

      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }

      const eventListeners = this.listeners.get(message.method) || [];
      eventListeners.forEach((listener) => listener(message.params));

      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        this.consoleErrors.push(message.params.args.map((argument) => argument.value || argument.description).join(" "));
      }

      if (message.method === "Runtime.exceptionThrown") {
        this.exceptions.push(message.params.exceptionDetails?.text || "Uncaught exception");
      }

      if (message.method === "Network.loadingFailed" && !message.params.canceled) {
        this.failedRequests.push(message.params.errorText || message.params.requestId);
      }

      if (message.method === "Network.requestWillBeSent") {
        this.networkRequests.push({
          type: message.params.type,
          url: message.params.request?.url,
        });
      }
    });

    await Promise.all([
      this.call("Page.enable"),
      this.call("Runtime.enable"),
      this.call("Network.enable"),
    ]);
  }

  call(method, params = {}) {
    if (!this.socket) throw new Error("CDP session is not connected");
    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        const currentListeners = this.listeners.get(method) || [];
        this.listeners.set(
          method,
          currentListeners.filter((candidate) => candidate !== listener),
        );
        resolve(params);
      };

      const currentListeners = this.listeners.get(method) || [];
      this.listeners.set(method, [...currentListeners, listener]);
    });
  }

  async navigate(url) {
    this.resetDiagnostics();
    const loaded = this.once("Page.loadEventFired");
    await this.call("Page.navigate", { url });
    await loaded;
  }

  async evaluate(expression) {
    const evaluation = await this.call("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
      userGesture: true,
    });

    if (evaluation.exceptionDetails) {
      throw new Error(evaluation.exceptionDetails.text || "Browser evaluation failed");
    }

    return evaluation.result?.value;
  }

  async waitFor(expression, options = {}) {
    const timeout = options.timeout || 3000;
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      if (await this.evaluate(expression)) return;
      await delay(20);
    }

    throw new Error(`Timed out waiting for: ${expression}`);
  }

  async setViewport(width, height) {
    await this.call("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height,
      mobile: width <= 760,
      width,
    });
  }

  async setReducedMotion(enabled) {
    await this.call("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: enabled ? "reduce" : "no-preference" }],
    });
  }

  async pressEnter({ shift = false } = {}) {
    const modifiers = shift ? 8 : 0;
    const common = {
      code: "Enter",
      key: "Enter",
      modifiers,
      nativeVirtualKeyCode: 13,
      text: "\r",
      unmodifiedText: "\r",
      windowsVirtualKeyCode: 13,
    };

    await this.call("Input.dispatchKeyEvent", { ...common, type: "keyDown" });
    await this.call("Input.dispatchKeyEvent", { ...common, type: "keyUp" });
  }

  resetDiagnostics() {
    this.consoleErrors.length = 0;
    this.exceptions.length = 0;
    this.failedRequests.length = 0;
    this.networkRequests.length = 0;
  }

  close() {
    this.socket?.close();
  }
}

export async function launchChrome() {
  const userDataDirectory = await mkdtemp(join(tmpdir(), "hc-life-demo-"));
  const chrome = spawn(
    CHROME_PATH,
    [
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-gpu",
      "--headless=new",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-sandbox",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDirectory}`,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );

  const portFile = join(userDataDirectory, "DevToolsActivePort");
  let devToolsPort;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const portText = await readFile(portFile, "utf8").catch(() => "");
    devToolsPort = Number.parseInt(portText.split(/\r?\n/)[0], 10);
    if (Number.isInteger(devToolsPort)) break;
    if (chrome.exitCode !== null) throw new Error("Chrome exited before DevTools was ready");
    await delay(50);
  }

  if (!Number.isInteger(devToolsPort)) throw new Error("Chrome DevTools did not become ready");

  const targets = await fetch(`http://127.0.0.1:${devToolsPort}/json/list`).then((response) => response.json());
  const pageTarget = targets.find((target) => target.type === "page");
  if (!pageTarget?.webSocketDebuggerUrl) throw new Error("Could not find the Chrome page target");

  const session = new CdpSession(pageTarget.webSocketDebuggerUrl);
  await session.connect();

  return {
    session,
    async close() {
      session.close();
      if (chrome.exitCode === null) {
        const exited = new Promise((resolve) => chrome.once("exit", resolve));
        chrome.kill();
        await exited;
      }
      await rm(userDataDirectory, { force: true, recursive: true });
    },
  };
}
