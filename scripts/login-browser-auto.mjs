import { chromium } from "playwright";
import path from "path";
import fs from "fs";

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
  console.log("------------------------------------------------------------------\n");
  console.log(" Menunggu Anda selesai login di browser...");

  writeStatus({
    state: "waiting_login",
    message: `Browser terbuka. Silakan login ke akun @${username} di jendela browser.`,
  });

  let loggedIn = false;
  const startTime = Date.now();
  const TIMEOUT = 5 * 60 * 1000; // 5 minutes

  while (Date.now() - startTime < TIMEOUT) {
    try {
      if (browser.contexts().length === 0 || context.pages().length === 0) {
        console.log("\n⚠️ Jendela browser ditutup sebelum selesai login.");
        writeStatus({ state: "closed", message: "Browser ditutup sebelum login selesai." });
        process.exit(0);
      }

      const url = page.url();
      if (platform === "THREADS") {
        loggedIn =
          !url.includes("/login") &&
          (url.includes("threads.net") || url.includes("threads.com") || url.includes("/@") || url.includes("/feed"));
      } else {
        loggedIn =
          !url.includes("/login") &&
          !url.includes("/flow/") &&
          (url.includes("x.com") || url.includes("twitter.com"));
      }

      if (loggedIn) break;
    } catch {
      // page navigating
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (loggedIn) {
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

    await new Promise((r) => setTimeout(r, 2500));
  } else {
    console.log("\n❌ Waktu login habis (5 menit).");
    writeStatus({ state: "timeout", message: "Waktu login habis (5 menit). Silakan coba lagi." });
  }

  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Terjadi kesalahan:", err);
  writeStatus({ state: "error", message: err.message || "Terjadi kesalahan." });
  process.exit(1);
});
