import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import readline from "readline";

const SESSIONS_DIR = path.resolve(process.cwd(), ".sessions");
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const username = (process.argv[2] || "my_account").replace(/^@/, "");
const platform = process.argv[3] || "THREADS";

const safeName = `${platform.toLowerCase()}_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
const userDir = path.join(SESSIONS_DIR, safeName);
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
const statePath = path.join(userDir, "storage_state.json");
const statusPath = path.join(userDir, "login_status.json");

function writeStatus(status) {
  try {
    fs.writeFileSync(statusPath, JSON.stringify({ ...status, updatedAt: new Date().toISOString() }));
  } catch {}
}

console.clear();
console.log("==================================================================");
console.log("             THREADS BROWSER LOGIN ASSISTANT                      ");
console.log("==================================================================");
console.log(` Akun Target : @${username}`);
console.log(` Platform    : ${platform}`);
console.log(" Status      : Membuka browser Chrome / Edge...");
console.log("==================================================================\n");

async function run() {
  writeStatus({ state: "launching", message: "Membuka browser..." });

  let browser;
  const launchArgs = [
    "--new-window",
    "--disable-blink-features=AutomationControlled",
    "--start-maximized",
  ];

  try {
    browser = await chromium.launch({ channel: "chrome", headless: false, args: launchArgs });
  } catch {
    try {
      browser = await chromium.launch({ channel: "msedge", headless: false, args: launchArgs });
    } catch {
      browser = await chromium.launch({ headless: false, args: launchArgs });
    }
  }

  const context = await browser.newContext({
    viewport: null,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  });

  const page = await context.newPage();
  const loginUrl = platform === "TWITTER" ? "https://x.com/i/flow/login" : "https://www.threads.net/login";

  console.log("🌐 Membuka halaman login Threads di jendela browser...");
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

  console.log("\n------------------------------------------------------------------");
  console.log(" 👉 SILAKAN LOGIN KE AKUN THREADS ANDA DI JENDELA BROWSER.");
  console.log(" 👉 Setelah berhasil login dan masuk ke beranda Threads,");
  console.log("    sistem akan OTOMATIS mendeteksi & menyimpan sesi login Anda.");
  console.log(" 👉 Atau Anda juga bisa tekan tombol [ENTER] di sini jika sudah masuk.");
  console.log("------------------------------------------------------------------\n");
  console.log(" Menunggu login...");

  writeStatus({
    state: "waiting_login",
    message: `Browser terbuka. Silakan login ke akun @${username} di jendela browser.`,
  });

  let loggedIn = false;
  const startTime = Date.now();
  const TIMEOUT = 10 * 60 * 1000; // 10 minutes

  // Optional manual Enter listener
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("line", () => {
    loggedIn = true;
  });

  while (Date.now() - startTime < TIMEOUT) {
    if (loggedIn) break;

    try {
      if (browser.contexts().length === 0 || context.pages().length === 0) {
        console.log("\n⚠️ Jendela browser ditutup.");
        writeStatus({ state: "closed", message: "Browser ditutup." });
        break;
      }

      // 1. Check Cookies (sessionid / ds_user_id)
      const cookies = await context.cookies();
      const hasAuthCookie = cookies.some(
        (c) =>
          c.name === "sessionid" ||
          c.name === "ds_user_id" ||
          c.name === "auth_token" ||
          c.name === "twid"
      );

      if (hasAuthCookie) {
        loggedIn = true;
        break;
      }

      // 2. Check all open pages URLs
      for (const p of context.pages()) {
        const url = p.url();
        if (platform === "THREADS") {
          if (
            (url.includes("threads.net") || url.includes("threads.com")) &&
            !url.endsWith("/login") &&
            !url.includes("/login?") &&
            !url.includes("accounts.google.com")
          ) {
            loggedIn = true;
            break;
          }
        } else {
          if (
            (url.includes("x.com") || url.includes("twitter.com")) &&
            !url.includes("/login") &&
            !url.includes("/flow/")
          ) {
            loggedIn = true;
            break;
          }
        }
      }

      if (loggedIn) break;
    } catch {
      // transient navigation
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  try {
    rl.close();
  } catch {}

  console.log("\n==================================================================");
  console.log(` ✅ LOGIN BERHASIL TERDETEKSI UNTUK @${username}!`);
  console.log(" Menyimpan cookies & sesi browser...");
  await context.storageState({ path: statePath });
  console.log(` Sesi tersimpan di: ${statePath}`);
  console.log(" Akun Anda sudah AKTIF dan siap Auto-Posting!");
  console.log("==================================================================\n");

  writeStatus({
    state: "success",
    message: `Login @${username} berhasil! Sesi tersimpan dan akun siap digunakan.`,
  });

  await new Promise((r) => setTimeout(r, 2000));
  try {
    await browser.close();
  } catch {}
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Terjadi kesalahan:", err);
  writeStatus({ state: "error", message: err.message || "Terjadi kesalahan." });
  process.exit(1);
});
