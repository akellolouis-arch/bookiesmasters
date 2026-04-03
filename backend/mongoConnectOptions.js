/**
 * Atlas from PaaS (e.g. Render) + Node/OpenSSL: TLS alert 80 / "internal error" often
 * comes from resolving replica-set hosts to IPv6 or mixed happy-eyeballs paths.
 * Prefer IPv4 and disable dual-stack auto selection (keep in sync everywhere we connect).
 */
import dns from "node:dns";

let dnsHintsApplied = false;

/** Call once per process before any mongoose.connect / MongoClient. */
export function applyMongoDnsHints() {
  if (dnsHintsApplied) return;
  dnsHintsApplied = true;
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    /* Node < 17 */
  }
}

export function getMongoClientOptions(overrides = {}) {
  return {
    serverSelectionTimeoutMS: 45_000,
    socketTimeoutMS: 60_000,
    maxPoolSize: 10,
    retryWrites: true,
    autoSelectFamily: false,
    lookup(hostname, options, callback) {
      const o =
        options && typeof options === "object"
          ? { ...options, family: 4 }
          : { family: 4 };
      dns.lookup(hostname, o, callback);
    },
    ...overrides,
  };
}
