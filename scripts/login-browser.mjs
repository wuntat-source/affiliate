import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import readline from "readline";

const PROFILES_DIR = path.resolve(process.cwd(), ".sessions");

if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

async function run() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const usernameInput = process.argv[2];

  let username = usernameInput;
  if (!username) {
    username = await new Promise((resolve) => {
      rl.question("\n🔹 Masukkan Username Threads Anda (contoh: pintulangitketujuh): ", (ans) => {
        resolve(ans.trim());
      });
    });
  }

  if (!username) {
    console.log("❌ Username tidak boleh kosong.");
    rl.close();
    process.exit(1);
  }

  const safeName = `threads_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const userDir = path.join(PROFILES_DIR, safeName);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  const statePath = path.join(userDir, "storage_state.json");

  console.log(`\n🚀 Membuka jendela browser untuk login Threads (@${username})...`);

  let browser;
  try {
    // Try installed Google Chrome first for maximum Windows desktop window visibility
    browser = await chromium.launch({
      channel: "chrome",
      headless: false,
      args: ["--new-window", "--disable-blink-features=AutomationControlled", "--start-maximized"],
    });
  } catch {
    try {
      // Fallback to Edge
      browser = await chromium.launch({
        channel: "msedge",
        headless: false,
        args: ["--new-window", "--disable-blink-features=AutomationControlled", "--start-maximized"],
      });
    } catch {
      // Fallback to Playwright Chromium
      browser = await chromium.launch({
        headless: false,
        args: ["--new-window", "--disable-blink-features=AutomationControlled", "--start-maximized"],
      });
    }
  }

  const context = await browser.newContext({
    viewport: null,
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  });

  const page = await context.newPage();
  console.log("🌐 Membuka halaman login Threads...");
  await page.goto("https://www.threads.net/login");

  console.log("\n=======================================================");
  console.log(`👉 SILAKAN LOGIN DI JENDELA BROWSER YANG MUNCUL.`);
  console.log(`👉 Setelah berhasil login dan masuk beranda Threads:`);
  console.log(`   Tekan ENTER di terminal ini untuk menyimpan sesi login.`);
  console.log("=======================================================\n");

  await new Promise((resolve) => {
    rl.question("Tekan [ENTER] jika sudah selesai login di browser...", () => {
      resolve();
    });
  });

  try {
    await context.storageState({ path: statePath });
    console.log(`\n✅ BERHASIL! Sesi login untuk @${username} telah tersimpan di:`);
    console.log(`   ${statePath}`);
    console.log(`\nAkun Anda sekarang siap digunakan untuk Auto-Posting tanpa token API!\n`);
  } catch (err) {
    console.error("❌ Gagal menyimpan sesi:", err.message);
  } finally {
    await browser.close();
    rl.close();
    process.exit(0);
  }
}

run();
