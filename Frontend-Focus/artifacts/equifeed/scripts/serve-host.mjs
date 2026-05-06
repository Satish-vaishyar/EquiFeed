import os from "node:os";
import { spawn, execSync } from "node:child_process";

function getWindowsDefaultRouteHost() {
  try {
    const output = execSync("route print 0.0.0.0", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    const lines = output.split(/\r?\n/);
    let bestMetric = Number.POSITIVE_INFINITY;
    let bestHost = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("0.0.0.0")) continue;

      const cols = trimmed.split(/\s+/);
      if (cols.length < 5) continue;

      const network = cols[0];
      const netmask = cols[1];
      const iface = cols[3];
      const metric = Number(cols[4]);

      if (network !== "0.0.0.0" || netmask !== "0.0.0.0") continue;
      if (!Number.isFinite(metric)) continue;
      if (iface === "0.0.0.0") continue;

      if (metric < bestMetric) {
        bestMetric = metric;
        bestHost = iface;
      }
    }

    return bestHost;
  } catch {
    return null;
  }
}

function getNetworkHost() {
  if (process.platform === "win32") {
    const routeHost = getWindowsDefaultRouteHost();
    if (routeHost) {
      return routeHost;
    }
  }

  const interfaces = os.networkInterfaces();
  for (const infoList of Object.values(interfaces)) {
    if (!infoList) continue;
    for (const info of infoList) {
      if (!info) continue;
      if (info.family !== "IPv4") continue;
      if (info.internal) continue;
      return info.address;
    }
  }
  return "0.0.0.0";
}

const host = getNetworkHost();
console.log(`[EquiFeed] Starting production server on http://${host}:3000`);
const child = spawn(`pnpm exec next start --hostname ${host}`, {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
