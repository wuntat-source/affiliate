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
  console.log(" 👉 Masukkan Username/Email & Password Threads Anda.");
  console.log(" 👉 Setelah berhasil login dan berada di Beranda Threads,");
  console.log("    KEMBALI KE SINI LALU TEKAN TOMBOL [ENTER] UNTUK MENYIMPAN.");
  console.log("------------------------------------------------------------------\n");
  console.log(" Menunggu Anda selesai login... (Tekan [ENTER] setelah login berhasil)");

  writeStatus({
    state: "waiting_login",
    message: `Browser terbuka. Silakan login ke akun @${username} di jendela browser, lalu tekan ENTER di terminal.`,
  });

  let loggedIn = false;
  const startTime = Date.now();
  const TIMEOUT = 15 * 60 * 1000; // 15 minutes

  // Enter listener
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("line", () => {
    console.log("\n⚡ Tombol ENTER ditekan. Memeriksa & menyimpan sesi login...");
    loggedIn = true;
  });

  while (Date.now() - startTime < TIMEOUT) {
    if (loggedIn) break;

    try {
      if (browser.contexts().length === 0 || context.pages().length === 0) {
        console.log("\n⚠️ Jendela browser ditutup.");
        break;
      }

      // Check Cookies across Meta domains for actual authentication
      const cookies = await context.cookies([
        "https://www.threads.net",
        "https://threads.net",
        "https://www.threads.com",
        "https://threads.com",
        "https://www.instagram.com",
      ]);

      const hasAuthCookie = cookies.some(
        (c) =>
          c.name === "sessionid" ||
          c.name === "ds_user_id" ||
          c.name === "auth_token" ||
          c.name === "twid"
      );

      if (hasAuthCookie) {
        console.log("\n✅ Cookie login Threads/Instagram terdeteksi!");
        loggedIn = true;
        break;
      }
    } catch {
      // transient navigation
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  try {
    rl.close();
  } catch {}

  // Save session state
  console.log("\n==================================================================");
  console.log(" Menyimpan cookies & sesi browser...");
  await context.storageState({ path: statePath });

  const savedCookies = await context.cookies();
  const isActuallyAuthed = savedCookies.some(
    (c) => c.name === "sessionid" || c.name === "ds_user_id" || c.name === "auth_token"
  );

  if (isActuallyAuthed) {
    console.log(` ✅ SESI LOGIN @${username} BERHASIL TERSIMPAN!`);
    console.log(` Lokasi file: ${statePath}`);
    console.log(" Akun Anda sudah AKTIF dan 100% siap Auto-Posting!");
    console.log("==================================================================\n");

    writeStatus({
      state: "success",
      message: `Login @${username} berhasil! Sesi tersimpan dan akun siap digunakan.`,
    });
  } else {
    console.log(`\n⚠️ Sesi disimpan tetapi cookie login belum terdeteksi.`);
    console.log(` Pastikan Anda sudah login sampai melihat beranda Threads.`);
    console.log("==================================================================\n");

    writeStatus({
      state: "warning",
      message: `Sesi tersimpan. Pastikan Anda sudah login sebelum memposting.`,
    });
  }

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
