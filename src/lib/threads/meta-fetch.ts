import https from "https";

export async function fetchMetaEndpoint(urlStr: string): Promise<{ ok: boolean; status: number; data: any }> {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
          family: 4, // Force IPv4 to prevent Windows Node fetch DNS timeout
          timeout: 10000,
        },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              resolve({
                ok: (res.statusCode || 200) >= 200 && (res.statusCode || 200) < 300,
                status: res.statusCode || 200,
                data: parsed,
              });
            } catch {
              resolve({
                ok: false,
                status: res.statusCode || 500,
                data: { error: { message: body || "Invalid JSON response from Meta" } },
              });
            }
          });
        }
      );

      req.on("error", (err) => {
        resolve({
          ok: false,
          status: 500,
          data: { error: { message: `Koneksi gagal: ${err.message}` } },
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          ok: false,
          status: 408,
          data: { error: { message: "Request timeout ke server Meta (10 detik)" } },
        });
      });

      req.end();
    } catch (e: any) {
      resolve({
        ok: false,
        status: 500,
        data: { error: { message: e.message || "URL tidak valid" } },
      });
    }
  });
}
