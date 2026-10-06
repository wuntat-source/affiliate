import { chromium, Browser, BrowserContext, Page } from "playwright";
import path from "path";
import fs from "fs";

// Base directory to store browser session cookies (.sessions is ignored by Turbopack file scanner)
const PROFILES_DIR = path.resolve(process.cwd(), ".sessions");

if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

export function getProfileDir(platform: string, username: string): string {
  const safeName = `${platform.toLowerCase()}_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const dir = path.join(PROFILES_DIR, safeName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getStateJsonPath(platform: string, username: string): string {
  const profileDir = getProfileDir(platform, username);
  return path.join(profileDir, "storage_state.json");
}

/**
 * In-memory map of currently open interactive login sessions
 */
const activeLoginSessions: Record<
  string,
  {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    platform: "THREADS" | "TWITTER";
    username: string;
    startedAt: number;
  }
> = {};

/**
 * Open interactive browser window on the desktop
 */
export async function openInteractiveBrowser(
  platform: "THREADS" | "TWITTER",
  username: string
): Promise<{ success: boolean; message: string }> {
  const sessionKey = `${platform}_${username}`;
  const statePath = getStateJsonPath(platform, username);

  // Close any existing open session for this user first
  if (activeLoginSessions[sessionKey]) {
    try {
      await activeLoginSessions[sessionKey].browser.close();
    } catch {}
    delete activeLoginSessions[sessionKey];
  }

  try {
    const browser = await chromium.launch({
      headless: false,
      args: [
        "--new-window",
        "--disable-blink-features=AutomationControlled",
        "--start-maximized",
      ],
    });

    const context = await browser.newContext({
      viewport: null,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      storageState: fs.existsSync(statePath) ? statePath : undefined,
    });

    const page = await context.newPage();

    if (platform === "THREADS") {
      await page.goto("https://www.threads.net/login", { waitUntil: "domcontentloaded" });
    } else {
      await page.goto("https://x.com/i/flow/login", { waitUntil: "domcontentloaded" });
    }

    activeLoginSessions[sessionKey] = {
      browser,
      context,
      page,
      platform,
      username,
      startedAt: Date.now(),
    };

    browser.on("disconnected", () => {
      delete activeLoginSessions[sessionKey];
    });

    return {
      success: true,
      message: "Jendela browser Chromium telah terbuka di layar Anda. Silakan login ke akun Threads Anda pada jendela yang muncul.",
    };
  } catch (error: any) {
    console.error("[Playwright Launch Error]:", error);
    return {
      success: false,
      message: error.message || "Gagal membuka jendela browser Chromium.",
    };
  }
}

/**
 * Check if the user is currently logged in (in active open window or saved profile)
 */
export async function verifyAndSaveSession(
  platform: "THREADS" | "TWITTER",
  username: string
): Promise<{ loggedIn: boolean; message: string }> {
  const sessionKey = `${platform}_${username}`;
  const statePath = getStateJsonPath(platform, username);

  // 1. Check active open browser window
  const active = activeLoginSessions[sessionKey];
  if (active) {
    try {
      const currentUrl = active.page.url();
      let isAuthed = false;

      if (platform === "THREADS") {
        isAuthed =
          !currentUrl.includes("/login") &&
          (currentUrl.includes("threads.net") || currentUrl.includes("/@") || currentUrl.includes("/feed"));
      } else {
        isAuthed = !currentUrl.includes("/login") && (currentUrl.includes("x.com/home") || currentUrl.includes("twitter.com/home"));
      }

      if (isAuthed) {
        // Save session cookies & state
        await active.context.storageState({ path: statePath });
        await active.browser.close();
        delete activeLoginSessions[sessionKey];

        return {
          loggedIn: true,
          message: `✅ Sesi login @${username} berhasil disimpan dan akun terhubung aktif!`,
        };
      } else {
        return {
          loggedIn: false,
          message: `Browser masih di halaman login. Selesaikan login pada jendela Chromium, lalu klik lagi 'Selesai Login & Simpan Sesi'.`,
        };
      }
    } catch (err: any) {
      delete activeLoginSessions[sessionKey];
    }
  }

  // 2. Check saved storage state file
  return checkLoginStatus(platform, username);
}

/**
 * Check if the stored session is authenticated
 */
export async function checkLoginStatus(
  platform: "THREADS" | "TWITTER",
  username: string
): Promise<{ loggedIn: boolean; message: string }> {
  const statePath = getStateJsonPath(platform, username);

  if (!fs.existsSync(statePath)) {
    return {
      loggedIn: false,
      message: `⚠️ Akun @${username} belum login. Klik 'Buka Browser Login Threads' untuk login.`,
    };
  }

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      storageState: statePath,
    });

    const page = await context.newPage();
    const targetUrl = platform === "THREADS" ? "https://www.threads.net/" : "https://x.com/home";

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2500);

    const currentUrl = page.url();
    let isAuthed = false;

    if (platform === "THREADS") {
      isAuthed = !currentUrl.includes("/login") && !currentUrl.includes("accounts.google.com");
    } else {
      isAuthed = !currentUrl.includes("/login") && !currentUrl.includes("/i/flow/login");
    }

    if (isAuthed) {
      await context.storageState({ path: statePath });
    }

    await browser.close();

    return {
      loggedIn: isAuthed,
      message: isAuthed
        ? `✅ Sesi browser untuk @${username} AKTIF & Siap Auto-Post!`
        : `⚠️ Akun @${username} belum login. Klik 'Buka Browser Login Threads' untuk login.`,
    };
  } catch (err: any) {
    return {
      loggedIn: false,
      message: err.message || "Gagal memverifikasi sesi browser",
    };
  }
}

/**
 * Post content + chained replies to Threads using Playwright Automation
 */
export async function postThreadViaPlaywright(options: {
  username: string;
  mainText: string;
  replyParts?: string[];
  headless?: boolean;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const { username, mainText, replyParts, headless = true } = options;
  const statePath = getStateJsonPath("THREADS", username);

  if (!fs.existsSync(statePath)) {
    return {
      success: false,
      error: `Sesi login untuk @${username} belum ditemukan. Silakan login terlebih dahulu melalui menu Social Accounts.`,
    };
  }

  try {
    const browser = await chromium.launch({
      headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--start-maximized",
      ],
    });

    const context = await browser.newContext({
      storageState: statePath,
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    await page.goto("https://www.threads.net/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Look for new post composer button or box
    const composerTrigger = page
      .locator('text="Start a thread"')
      .or(page.locator('text="Mulai utas..."'))
      .or(page.locator('svg[aria-label="Create"]'))
      .or(page.locator('svg[aria-label="Buat"]'));

    if (await composerTrigger.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await composerTrigger.first().click();
      await page.waitForTimeout(1000);
    }

    // Type main post with realistic human typing speed
    const textbox = page.locator('div[role="textbox"]').first();
    await textbox.click();
    await textbox.pressSequentially(mainText, { delay: 15 });
    await page.waitForTimeout(1000);

    // If multi-part replies exist, add chained replies
    if (replyParts && replyParts.length > 0) {
      for (const part of replyParts) {
        if (!part.trim()) continue;

        // Click "Add to thread" button if available
        const addThreadBtn = page
          .locator('text="Add to thread"')
          .or(page.locator('text="Tambahkan ke utas"'))
          .or(page.locator('svg[aria-label="Add to thread"]'));

        if (await addThreadBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await addThreadBtn.first().click();
          await page.waitForTimeout(800);
        }

        const lastTextbox = page.locator('div[role="textbox"]').last();
        await lastTextbox.click();
        await lastTextbox.pressSequentially(part, { delay: 15 });
        await page.waitForTimeout(800);
      }
    }

    // Click Post Button
    const postBtn = page
      .locator('div[role="button"]:has-text("Post")')
      .or(page.locator('div[role="button"]:has-text("Posting")'))
      .or(page.locator('button:has-text("Post")'))
      .or(page.locator('button:has-text("Posting")'));

    if (await postBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await postBtn.first().click();
      await page.waitForTimeout(6000); // Wait for post publication to complete
      // Save refreshed cookies
      await context.storageState({ path: statePath });
    } else {
      await browser.close();
      return { success: false, error: "Tombol 'Post/Posting' tidak ditemukan di tampilan Threads." };
    }

    await browser.close();

    return {
      success: true,
      message: "Berhasil memposting utas cerita ke Threads via Playwright Automation!",
    };
  } catch (error: any) {
    console.error("[Playwright Auto-Post Error]:", error);
    return {
      success: false,
      error: error.message || "Gagal mengeksekusi auto-posting Playwright.",
    };
  }
}
