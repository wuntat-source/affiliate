import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const SESSIONS_DIR = path.resolve(process.cwd(), ".sessions");
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const username = process.argv[2] || "my_account";
const platform = process.argv[3] || "THREADS";

const safeName = `${platform.toLowerCase()}_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
const userDir = path.join(SESSIONS_DIR, safeName);
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
const statePath = path.join(userDir, "storage_state.json");
const statusPath = path.join(userDir, "login_status.json");

function writeStatus(status) {
  fs.writeFileSync(statusPath, JSON.stringify({ ...status, updatedAt: new Date().toISOString() }));
}

async function run() {
  writeStatus({ state: "launching", message: "Membuka browser..." });

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--start-maximized"] });
  } catch {
    try {
      browser = await chromium.launch({ channel: "msedge", headless: false, args: ["--start-maximized"] });
    } catch {
      browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
    }
  }

  const context = await browser.newContext({
    viewport: null,
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  });

  const page = await context.newPage();

  const loginUrl = platform === "TWITTER" ? "https://x.com/i/flow/login" : "https://www.threads.net/login";
  await page.goto(loginUrl);

  writeStatus({ state: "waiting_login", message: `Browser terbuka. Silakan login ke akun @${username} di jendela browser.` });

  // Poll URL changes to detect login completion (up to 5 minutes)
  let loggedIn = false;
  const startTime = Date.now();
  const TIMEOUT = 5 * 60 * 1000;

  while (Date.now() - startTime < TIMEOUT) {
    try {
      if (browser.contexts().length === 0 || context.pages().length === 0) {
        writeStatus({ state: "closed", message: "Browser ditutup sebelum login selesai." });
        process.exit(0);
      }

      const url = page.url();
      if (platform === "THREADS") {
        loggedIn = !url.includes("/login") && (url.includes("threads.net") || url.includes("threads.com"));
      } else {
        loggedIn = !url.includes("/login") && !url.includes("/flow/") && (url.includes("x.com") || url.includes("twitter.com"));
      }

      if (loggedIn) break;
    } catch {
      // page navigating
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (loggedIn) {
    await context.storageState({ path: statePath });
    writeStatus({ state: "success", message: `Login @${username} berhasil! Sesi tersimpan. Jendela browser akan tertutup otomatis.` });
    await new Promise((r) => setTimeout(r, 2000));
  } else {
    writeStatus({ state: "timeout", message: "Waktu login habis (5 menit). Silakan coba lagi." });
  }

  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  writeStatus({ state: "error", message: err.message || "Terjadi kesalahan." });
  process.exit(1);
});
