import { chromium, BrowserContext, Page } from "playwright";
import path from "path";
import fs from "fs";

// Base directory to store browser profiles & cookies
const PROFILES_DIR = path.resolve(process.cwd(), "browser-profiles");

if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

/**
 * Clean up Chromium Singleton locks and stale lockfiles that cause
 * "Opening in existing browser session" errors on Windows.
 */
export function cleanProfileLocks(dir: string) {
  if (!fs.existsSync(dir)) return;
  const lockNames = [
    "SingletonLock",
    "SingletonCookie",
    "SingletonSocket",
    "lockfile",
    "LOCK",
    "DevToolsActivePort",
  ];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        cleanProfileLocks(fullPath);
      } else if (lockNames.includes(entry.name) || entry.name.endsWith(".lock")) {
        try {
          fs.unlinkSync(fullPath);
        } catch {
          // ignore busy file error if in use
        }
      }
    }
  } catch {
    // ignore
  }
}

export function getProfilePath(platform: string, username: string): string {
  const safeName = `${platform.toLowerCase()}_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const profileDir = path.join(PROFILES_DIR, safeName);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }
  return profileDir;
}

export function getStateJsonPath(platform: string, username: string): string {
  const profileDir = getProfilePath(platform, username);
  return path.join(profileDir, "storage_state.json");
}

const COMMON_CHROME_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-client-side-phishing-detection",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--disable-translate",
  "--metrics-recording-only",
  "--safebrowsing-disable-auto-update",
  "--start-maximized",
];

/**
 * Launch an interactive visible Chromium browser window so the user can login manually.
 */
export async function launchInteractiveLogin(
  platform: "THREADS" | "TWITTER",
  username: string
): Promise<{ success: boolean; message: string }> {
  const profilePath = getProfilePath(platform, username);
  const statePath = getStateJsonPath(platform, username);

  // Clean stale lock files
  cleanProfileLocks(profilePath);

  try {
    const context = await chromium.launchPersistentContext(profilePath, {
      headless: false,
      viewport: null, // Let window use full maximized screen
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      args: COMMON_CHROME_ARGS,
    });

    const page = context.pages()[0] || (await context.newPage());

    if (platform === "THREADS") {
      await page.goto("https://www.threads.net/login", { waitUntil: "domcontentloaded" });
    } else {
      await page.goto("https://x.com/i/flow/login", { waitUntil: "domcontentloaded" });
    }

    // Keep context open for user to complete login in the opened browser window
    // We poll in background for login completion up to 3 minutes (180 seconds)
    let loggedIn = false;
    const startTime = Date.now();

    while (Date.now() - startTime < 180000) {
      if (context.pages().length === 0) {
        break; // Browser window was closed by user
      }

      try {
        const currentUrl = page.url();
        if (platform === "THREADS") {
          // If redirected away from login and on threads.net main feed
          if (
            !currentUrl.includes("/login") &&
            (currentUrl.includes("threads.net") || currentUrl.includes("/@"))
          ) {
            loggedIn = true;
            break;
          }
        } else {
          if (!currentUrl.includes("/login") && (currentUrl.includes("x.com/home") || currentUrl.includes("twitter.com/home"))) {
            loggedIn = true;
            break;
          }
        }
      } catch {
        // Page might be navigating
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    if (loggedIn) {
      try {
        // Save backup storage state
        await context.storageState({ path: statePath });
      } catch {}
    }

    await context.close();
    cleanProfileLocks(profilePath);

    return {
      success: loggedIn,
      message: loggedIn
        ? `Sesi login ${platform} untuk @${username} berhasil disimpan dan siap auto-post!`
        : `Jendela browser ditutup atau waktu tunggu login (3 menit) selesai. Silakan ulangi jika belum selesai login.`,
    };
  } catch (error: any) {
    console.error("[Playwright Login Error]:", error);
    cleanProfileLocks(profilePath);
    return {
      success: false,
      message: error.message || "Gagal membuka browser Chromium.",
    };
  }
}

/**
 * Check if the stored profile is authenticated
 */
export async function checkLoginStatus(
  platform: "THREADS" | "TWITTER",
  username: string
): Promise<{ loggedIn: boolean; details?: string }> {
  const profilePath = getProfilePath(platform, username);
  const statePath = getStateJsonPath(platform, username);
  cleanProfileLocks(profilePath);

  try {
    const context = await chromium.launchPersistentContext(profilePath, {
      headless: true,
      args: COMMON_CHROME_ARGS,
    });

    const page = context.pages()[0] || (await context.newPage());
    const targetUrl = platform === "THREADS" ? "https://www.threads.net/" : "https://x.com/home";

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    let isAuthed = false;

    if (platform === "THREADS") {
      isAuthed = !currentUrl.includes("/login") && !currentUrl.includes("accounts.google.com");
    } else {
      isAuthed = !currentUrl.includes("/login") && !currentUrl.includes("/i/flow/login");
    }

    if (isAuthed) {
      try {
        await context.storageState({ path: statePath });
      } catch {}
    }

    await context.close();
    cleanProfileLocks(profilePath);

    return {
      loggedIn: isAuthed,
      details: isAuthed ? "Sesi browser aktif dan siap posting" : "Belum login atau sesi telah berakhir",
    };
  } catch (err: any) {
    cleanProfileLocks(profilePath);
    return {
      loggedIn: false,
      details: err.message || "Gagal memverifikasi sesi browser",
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
  const profilePath = getProfilePath("THREADS", username);
  cleanProfileLocks(profilePath);

  try {
    const context = await chromium.launchPersistentContext(profilePath, {
      headless,
      viewport: { width: 1280, height: 800 },
      args: COMMON_CHROME_ARGS,
    });

    const page = context.pages()[0] || (await context.newPage());

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
    } else {
      await context.close();
      cleanProfileLocks(profilePath);
      return { success: false, error: "Tombol 'Post/Posting' tidak ditemukan di tampilan Threads." };
    }

    await context.close();
    cleanProfileLocks(profilePath);

    return {
      success: true,
      message: "Berhasil memposting utas cerita ke Threads via Playwright Automation!",
    };
  } catch (error: any) {
    console.error("[Playwright Auto-Post Error]:", error);
    cleanProfileLocks(profilePath);
    return {
      success: false,
      error: error.message || "Gagal mengeksekusi auto-posting Playwright.",
    };
  }
}
