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
  console.log(" 👉 Masukkan Username / Email & Password akun Threads Anda.");
  console.log(" 👉 Setelah Anda berhasil login dan masuk ke Beranda Threads,");
  console.log("    sistem akan OTOMATIS mendeteksi login & menyimpan sesi Anda!");
  console.log("------------------------------------------------------------------\n");
  console.log(" Sedang memantau status login di browser...");

  writeStatus({
    state: "waiting_login",
    message: `Browser terbuka. Silakan login ke akun @${username} di jendela browser.`,
  });

  let isAuthed = false;
  const startTime = Date.now();
  const TIMEOUT = 20 * 60 * 1000; // 20 minutes

  while (Date.now() - startTime < TIMEOUT) {
    try {
      if (browser.contexts().length === 0 || context.pages().length === 0) {
        console.log("\n⚠️ Jendela browser telah ditutup oleh pengguna.");
        break;
      }

      // 1. Check cookies across all meta domains
      const cookies = await context.cookies([
        "https://www.threads.net",
        "https://threads.net",
        "https://www.threads.com",
        "https://threads.com",
        "https://www.instagram.com",
        "https://instagram.com",
      ]);

      const hasSessionId = cookies.some(
        (c) => c.name === "sessionid" || c.name === "ds_user_id"
      );

      if (hasSessionId) {
        console.log("\n🎉 COOKIE LOGIN BERHASIL TERDETEKSI!");
        isAuthed = true;
        break;
      }

      // 2. Also check if page is on feed/profile and not login
      for (const p of context.pages()) {
        const url = p.url();
        const hasProfileOrFeed =
          url.includes("/@") ||
          url.includes("/feed") ||
          (url.includes("threads.net") && !url.includes("login") && !url.includes("accounts.google.com"));

        if (hasProfileOrFeed) {
          // Double check if sessionid arrived
          const currentCookies = await context.cookies();
          if (currentCookies.some((c) => c.name === "sessionid" || c.name === "ds_user_id")) {
            isAuthed = true;
            break;
          }
        }
      }

      if (isAuthed) break;
    } catch {
      // transient page navigation
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  // Save session state to disk
  console.log("\n==================================================================");
  console.log(" Menyimpan cookies & sesi browser...");
  await context.storageState({ path: statePath });

  // Verify what was saved
  const finalCookies = await context.cookies();
  const verified = finalCookies.some(
    (c) => c.name === "sessionid" || c.name === "ds_user_id"
  );

  if (verified || isAuthed) {
    console.log(` ✅ SESI LOGIN @${username} BERHASIL DISIMPAN & AKTIF!`);
    console.log(` Lokasi file: ${statePath}`);
    console.log(" Akun Anda siap digunakan untuk auto-posting di AI Studio.");
    console.log("==================================================================\n");

    writeStatus({
      state: "success",
      message: `Login @${username} berhasil! Sesi tersimpan dan akun siap digunakan.`,
    });
  } else {
    console.log(`\n⚠️ Sesi disimpan. Jika belum login, silakan ulangi dari dashboard.`);
    console.log("==================================================================\n");

    writeStatus({
      state: "warning",
      message: `Sesi disimpan. Silakan klik Tes Sesi Browser untuk verifikasi.`,
    });
  }

  await new Promise((r) => setTimeout(r, 3000));
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
