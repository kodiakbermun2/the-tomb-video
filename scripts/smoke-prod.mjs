const base = process.env.SITE_URL || "https://www.thetombvideo.com";

const paths = ["/", "/collections", "/api/csrf", "/robots.txt", "/sitemap.xml"];

async function run() {
  let failures = 0;

  for (const path of paths) {
    const url = `${base}${path}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "cache-control": "no-cache",
        },
      });

      const ok = response.status >= 200 && response.status < 400;
      const statusLine = `${ok ? "OK" : "FAIL"} ${response.status} ${url}`;
      console.log(statusLine);

      if (!ok) {
        failures += 1;
      }
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL ERR ${url} -> ${message}`);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

run();
