export async function fetchMetaEndpoint(urlStr: string): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(urlStr, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { error: { message: err.message || "Gagal menghubungi server Meta" } },
    };
  }
}

export async function postMetaEndpoint(urlStr: string, params: URLSearchParams): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(urlStr, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { error: { message: err.message || "Gagal mengirim data ke server Meta" } },
    };
  }
}
