const base = process.env.SITE_URL || "https://www.thetombvideo.com";
const monitorKey = process.env.MONITORING_CRON_KEY || "";
const webhookUrl = process.env.ALERT_WEBHOOK_URL || "";

const uptimePaths = ["/", "/collections", "/api/csrf"];

async function checkPath(path) {
  const url = `${base}${path}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
      },
    });

    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkTokenHealth() {
  const url = `${base}/api/admin/token-health`;

  if (!monitorKey) {
    return {
      ok: true,
      url,
      status: 0,
      statusType: "skipped",
      spikeDetected: false,
      message: "MONITORING_CRON_KEY is missing. Token health check skipped.",
      skipped: true,
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
        "x-monitor-key": monitorKey,
      },
    });

    const payload = await response.json().catch(() => ({}));
    return {
      ok: response.ok && payload?.ok === true,
      url,
      status: response.status,
      statusType: payload?.status || "other_error",
      spikeDetected: Boolean(payload?.spikeDetected),
      message: typeof payload?.message === "string" ? payload.message : "Unknown token health result.",
      previousStatus: payload?.previousStatus || null,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: 0,
      statusType: "other_error",
      spikeDetected: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function sendAlert(message) {
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    });
  } catch {
    // Keep monitor run deterministic even if outbound alert delivery fails.
  }
}

async function run() {
  const uptimeResults = await Promise.all(uptimePaths.map((path) => checkPath(path)));
  const tokenHealth = await checkTokenHealth();

  let hasFailures = false;
  const alertLines = [];

  for (const result of uptimeResults) {
    const statusText = result.ok ? "OK" : "FAIL";
    const suffix = result.error ? ` -> ${result.error}` : "";
    console.log(`${statusText} ${result.status} ${result.url}${suffix}`);

    if (!result.ok) {
      hasFailures = true;
      alertLines.push(`Uptime check failed: ${result.status} ${result.url}${suffix}`);
    }
  }

  console.log(
    `${tokenHealth.ok ? "OK" : "FAIL"} ${tokenHealth.status} ${tokenHealth.url} [${tokenHealth.statusType}] ${tokenHealth.message}`,
  );

  if (!tokenHealth.ok && tokenHealth.statusType !== "auth_error") {
    hasFailures = true;
    alertLines.push(`Token health failed: [${tokenHealth.statusType}] ${tokenHealth.message}`);
  }

  if (tokenHealth.statusType === "auth_error" && tokenHealth.spikeDetected) {
    alertLines.push(
      `First Shopify auth spike detected (401/403 transition): ${tokenHealth.message}`,
    );
    hasFailures = true;
  }

  if (alertLines.length > 0) {
    await sendAlert([
      `Storefront monitor alert for ${base}`,
      ...alertLines.map((line) => `- ${line}`),
      `Timestamp: ${new Date().toISOString()}`,
    ].join("\n"));
  }

  if (hasFailures) {
    process.exitCode = 1;
  }
}

run();
