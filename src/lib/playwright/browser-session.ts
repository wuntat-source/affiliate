import { chromium, Browser, BrowserContext, Page } from "playwright";
import path from "path";
import fs from "fs";

const SESSIONS_DIR = path.resolve(process.cwd(), ".sessions");
if (!fs.existsSync(SESSIONS_DIR)) {
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  } catch {}
}

export function getStateJsonPath(platform: string, username: string): string {
  const cleanUsername = username.trim().replace(/^@+/, "");
  const safeName = `${platform.toLowerCase()}_${cleanUsername.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const userDir = path.join(SESSIONS_DIR, safeName);
  if (!fs.existsSync(userDir)) {
    try {
      fs.mkdirSync(userDir, { recursive: true });
    } catch {}
  }
  return path.join(userDir, "storage_state.json");
}

export interface BrowserSessionState {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  platform: "THREADS" | "TWITTER";
  username: string;
  startedAt: number;
}

export const activeLoginSessions: Record<string, BrowserSessionState> = {};

/**
 * Launch an interactive visible browser window for the user to login manually
 */
export async function openInteractiveBrowser(
  platform: "THREADS" | "TWITTER",
  username: string
): Promise<{ success: boolean; message: string }> {
  const sessionKey = `${platform}_${username}`;
  const statePath = getStateJsonPath(platform, username);

  if (activeLoginSessions[sessionKey]) {
    try {
      await activeLoginSessions[sessionKey].browser.close();
    } catch {}
    delete activeLoginSessions[sessionKey];
  }

  const launchArgs = [
    "--new-window",
    "--disable-blink-features=AutomationControlled",
    "--start-maximized",
  ];

  let browser: Browser | null = null;
  const launchConfigs = [
    { channel: "chrome" as const, headless: false, args: launchArgs },
    { channel: "msedge" as const, headless: false, args: launchArgs },
    { headless: false, args: launchArgs },
  ];

  for (const config of launchConfigs) {
    try {
      browser = await chromium.launch(config);
      break;
    } catch {}
  }

  if (!browser) {
    return {
      success: false,
      message: "Gagal meluncurkan browser Chromium/Chrome.",
    };
  }

  try {
    const context = await browser.newContext({
      viewport: null,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      storageState: fs.existsSync(statePath) ? statePath : undefined,
    });

    const page = await context.newPage();
    const loginUrl =
      platform === "TWITTER" ? "https://x.com/i/flow/login" : "https://www.threads.net/login";

    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

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
      message: "Jendela browser telah dibuka. Silakan login ke Threads pada jendela yang muncul.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal membuka jendela browser.",
    };
  }
}

/**
 * Check if the user is currently logged in
 */
export async function verifyAndSaveSession(
  platform: "THREADS" | "TWITTER",
  username: string
): Promise<{ loggedIn: boolean; message: string }> {
  const sessionKey = `${platform}_${username}`;
  const statePath = getStateJsonPath(platform, username);

  const active = activeLoginSessions[sessionKey];
  if (active) {
    try {
      const cookies = await active.context.cookies();
      const hasAuthCookie = cookies.some(
        (c) => c.name === "sessionid" || c.name === "ds_user_id" || c.name === "auth_token"
      );

      const isAuthed = hasAuthCookie;

      if (isAuthed) {
        await active.context.storageState({ path: statePath });
        await active.browser.close();
        delete activeLoginSessions[sessionKey];

        return {
          loggedIn: true,
          message: `✅ Sesi login @${username} berhasil disimpan dan akun terhubung aktif!`,
        };
      }
    } catch {
      delete activeLoginSessions[sessionKey];
    }
  }

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

  // Check from saved cookies in storage state file
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    const hasAuthCookie = (raw.cookies || []).some(
      (c: any) =>
        c.name === "sessionid" ||
        c.name === "ds_user_id" ||
        c.name === "auth_token" ||
        c.name === "twid"
    );

    if (hasAuthCookie) {
      return {
        loggedIn: true,
        message: `✅ Sesi browser untuk @${username} AKTIF & Siap Auto-Post!`,
      };
    }
  } catch {}

  return {
    loggedIn: false,
    message: `⚠️ Sesi login @${username} belum terautentikasi (cookie login belum ditemukan). Silakan klik 'Buka Browser Login Threads' dan login ke akun Threads Anda.`,
  };
}

function chunkTextForThreads(text: string, maxLen = 450): string[] {
  if (!text || text.trim().length <= maxLen) return [text.trim()];

  const paragraphs = text.split("\n\n").map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).trim().length <= maxLen) {
      current = current ? current + "\n\n" + para : para;
    } else {
      if (current) chunks.push(current.trim());
      if (para.length > maxLen) {
        const sentences = para.split(/(?<=[.!?])\s+/);
        let subCurrent = "";
        for (const s of sentences) {
          if ((subCurrent + " " + s).trim().length <= maxLen) {
            subCurrent = subCurrent ? subCurrent + " " + s : s;
          } else {
            if (subCurrent) chunks.push(subCurrent.trim());
            if (s.length > maxLen) {
              let rem = s;
              while (rem.length > maxLen) {
                const cutIdx = rem.lastIndexOf(" ", maxLen);
                const safeCut = cutIdx > 0 ? cutIdx : maxLen;
                chunks.push(rem.slice(0, safeCut).trim());
                rem = rem.slice(safeCut).trim();
              }
              subCurrent = rem;
            } else {
              subCurrent = s;
            }
          }
        }
        current = subCurrent;
      } else {
        current = para;
      }
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks.filter(Boolean);
}

/**
 * Post content + chained replies to Threads using Playwright Automation
 */
export async function postThreadViaPlaywright(options: {
  username: string;
  mainText: string;
  replyParts?: string[];
  targetPostUrl?: string;
  headless?: boolean;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const { username, mainText, replyParts, targetPostUrl, headless = true } = options;
  const statePath = getStateJsonPath("THREADS", username);

  if (!fs.existsSync(statePath)) {
    return {
      success: false,
      error: `Sesi login untuk @${username} belum ditemukan. Silakan buka menu Social Accounts -> 'Buka Browser Login Threads' untuk login terlebih dahulu.`,
    };
  }

  // Quick check if session cookies exist
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    const hasAuthCookie = (raw.cookies || []).some(
      (c: any) => c.name === "sessionid" || c.name === "ds_user_id"
    );
    if (!hasAuthCookie) {
      return {
        success: false,
        error: `Akun @${username} belum login ke Threads (cookie autentikasi sessionid tidak ada). Silakan buka menu Social Accounts -> 'Buka Browser Login Threads' dan lakukan login di browser.`,
      };
    }
  } catch {}

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
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

    // 1. Target Post Reply Flow
    if (targetPostUrl && targetPostUrl.startsWith("http")) {
      await page.goto(targetPostUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
      await page.waitForTimeout(3000);

      const replyTrigger = page
        .locator('svg[aria-label="Balas"]')
        .or(page.locator('svg[aria-label="Reply"]'))
        .or(page.locator('text="Balas..."'))
        .or(page.locator('text="Reply..."'))
        .or(page.locator('div[role="textbox"]'));

      if (await replyTrigger.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await replyTrigger.first().click();
        await page.waitForTimeout(1000);
      }

      const textbox = page.locator('div[role="textbox"], div[data-lexical-editor="true"], div[contenteditable="true"]').first();
      await textbox.waitFor({ state: "visible", timeout: 8000 });
      await textbox.click();
      await page.waitForTimeout(300);
      await page.keyboard.insertText(mainText);
      await page.keyboard.press("Space");
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(1000);

      const postBtn = page
        .locator('div[role="button"]:has-text("Posting"), div[role="button"]:has-text("Post"), div[role="button"]:has-text("Kirim"), div[role="button"]:has-text("Balas"), button:has-text("Posting"), button:has-text("Post"), button:has-text("Kirim")');

      if (await postBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await postBtn.first().click({ force: true });
        await page.waitForTimeout(5000);
        await context.storageState({ path: statePath });
      } else {
        await browser.close();
        return { success: false, error: "Tombol posting balasan tidak ditemukan." };
      }

      await browser.close();
      return { success: true, message: "Berhasil memposting balasan ke thread target!" };
    }

    // 2. New Main Thread + Chained Replies Flow
    // Sanitize all posts so NO single post ever exceeds 450 characters (Threads limit is 500)
    const allPosts: string[] = [];
    const mainChunks = chunkTextForThreads(mainText, 450);
    allPosts.push(...mainChunks);

    if (replyParts && replyParts.length > 0) {
      for (const r of replyParts) {
        if (!r.trim()) continue;
        const rChunks = chunkTextForThreads(r, 450);
        allPosts.push(...rChunks);
      }
    }

    const firstPost = allPosts[0] || mainText;
    const subsequentPosts = allPosts.slice(1);

    await page.goto("https://www.threads.net/", { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes("/login") || currentUrl.includes("accounts.google.com")) {
      await browser.close();
      return {
        success: false,
        error: `Sesi login @${username} telah berakhir atau belum login. Buka menu Social Accounts -> 'Buka Browser Login Threads' untuk login kembali.`,
      };
    }

    // Click composer trigger
    const composerTrigger = page
      .locator('text="Utas baru"')
      .or(page.locator('text="Start a thread"'))
      .or(page.locator('text="Apa yang baru?"'))
      .or(page.locator('text="Mulai utas..."'))
      .or(page.locator('svg[aria-label="Buat"]'))
      .or(page.locator('svg[aria-label="Create"]'))
      .or(page.locator('div[role="button"]:has-text("Utas baru")'));

    if (await composerTrigger.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await composerTrigger.first().click();
      await page.waitForTimeout(1000);
    }

    const textbox = page.locator('div[role="textbox"], div[data-lexical-editor="true"], div[contenteditable="true"]').first();
    await textbox.waitFor({ state: "visible", timeout: 8000 });
    await textbox.click();
    await page.waitForTimeout(300);
    await page.keyboard.insertText(firstPost);
    await page.keyboard.press("Space");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(1000);

    // If multi-part replies exist, add chained replies
    if (subsequentPosts.length > 0) {
      for (const part of subsequentPosts) {
        if (!part.trim()) continue;

        const addThreadBtn = page
          .locator('div[role="button"]:has-text("Tambahkan ke utas")')
          .or(page.locator('div[role="button"]:has-text("Add to thread")'))
          .or(page.locator('div[role="button"]:has-text("Tambah utas")'))
          .or(page.locator('button:has-text("Tambahkan ke utas")'))
          .or(page.locator('button:has-text("Add to thread")'))
          .or(page.locator('text="Tambahkan ke utas"'))
          .or(page.locator('text="Add to thread"'))
          .or(page.locator('svg[aria-label="Tambahkan ke utas"]'))
          .or(page.locator('svg[aria-label="Add to thread"]'));

        if (await addThreadBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await addThreadBtn.first().click({ timeout: 5000, force: true }).catch(() => {});
          await page.waitForTimeout(800);
        }

        const lastTextbox = page.locator('div[role="textbox"], div[data-lexical-editor="true"], div[contenteditable="true"]').last();
        await lastTextbox.click();
        await page.waitForTimeout(300);
        await page.keyboard.insertText(part);
        await page.keyboard.press("Space");
        await page.keyboard.press("Backspace");
        await page.waitForTimeout(800);
      }
    }

    // Click Post / Posting / Kirim button
    const postBtn = page
      .locator('div[role="button"]:has-text("Posting"), div[role="button"]:has-text("Post"), div[role="button"]:has-text("Kirim"), button:has-text("Posting"), button:has-text("Post"), button:has-text("Kirim")');

    if (await postBtn.first().isVisible({ timeout: 6000 }).catch(() => false)) {
      await postBtn.first().click({ timeout: 6000, force: true });
      await page.waitForTimeout(6000);
      await context.storageState({ path: statePath });
    } else {
      await browser.close();
      return { success: false, error: "Tombol 'Posting / Kirim / Post' tidak ditemukan di tampilan Threads." };
    }

    await browser.close();
    return {
      success: true,
      message: "Berhasil memposting utas cerita ke Threads via Playwright Automation!",
    };
  } catch (error: any) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    console.error("[Playwright Auto-Post Error]:", error);
    return {
      success: false,
      error: error.message || "Gagal mengeksekusi auto-posting Playwright.",
    };
  }
}
