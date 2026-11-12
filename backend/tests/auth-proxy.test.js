import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// Import the real application without loading local secrets or connecting to a DB.
process.env.DOTENV_CONFIG_PATH = fileURLToPath(
  new URL("./nonexistent-proxy-test.env", import.meta.url),
);
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/proxy_test";
process.env.JWT_SECRET = "proxy-test-only-secret-at-least-32-characters";
process.env.NODE_ENV = "test";
process.env.VERCEL = "1";
const { default: vercelApp } = await import("../src/app.js?proxy-test-vercel");
delete process.env.VERCEL;
const { default: directApp } = await import("../src/app.js?proxy-test-direct");
const { authLimiter } = await import("../src/routes/auth.routes.js");

function request(app, forwardedFor, remoteAddress = "127.0.0.1") {
  const req = Object.create(app.request);
  req.app = app;
  req.connection = { remoteAddress };
  req.socket = req.connection;
  req.headers = forwardedFor ? { "x-forwarded-for": forwardedFor } : {};
  req.method = "POST";
  req.originalUrl = "/api/auth/login";
  return req;
}

async function attempt(req) {
  // Exercise the actual limiter and Express IP resolution without opening ports.
  const headers = new Map();
  const res = {
    statusCode: 200,
    setHeader(name, value) { headers.set(name, value); },
    append(name, value) { headers.set(name, value); },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; this.writableEnded = true; },
  };
  let continued = false;
  await authLimiter(req, res, (error) => {
    if (error) throw error;
    continued = true;
  });
  return { status: res.statusCode, continued, headers, body: res.body };
}

test("direct servers ignore spoofed forwarding headers", () => {
  const req = request(directApp, "203.0.113.99", "198.51.100.9");
  assert.equal(req.ip, "198.51.100.9");
  assert.deepEqual(req.ips, []);
});

test("Vercel trusts only the final forwarded hop, never a caller's extra entry", () => {
  assert.equal(request(vercelApp, "198.51.100.11").ip, "198.51.100.11");
  assert.equal(
    request(vercelApp, "203.0.113.99, 198.51.100.11").ip,
    "198.51.100.11",
  );
});

test("one proxied client's authentication limit does not block another client", async () => {
  const limitedIp = "198.51.100.21";
  const otherIp = "198.51.100.22";
  for (let i = 0; i < 60; i++) {
    const result = await attempt(request(vercelApp, limitedIp));
    assert.equal(result.status, 200);
    assert.equal(result.continued, true);
  }
  const blocked = await attempt(request(vercelApp, limitedIp));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.continued, false);
  assert.ok(blocked.headers.has("Retry-After"));

  const other = await attempt(request(vercelApp, otherIp));
  assert.equal(other.status, 200);
  assert.equal(other.continued, true);

  const forged = await attempt(request(vercelApp, "203.0.113.77, " + limitedIp));
  assert.equal(forged.status, 429);
});

test("rotating IPv6 addresses in the same subnet does not evade the limit", async () => {
  for (let i = 0; i < 60; i++) {
    assert.equal(
      (await attempt(request(vercelApp, "2001:db8:1234:5600::" + (i + 1).toString(16)))).status,
      200,
    );
  }
  assert.equal(
    (await attempt(request(vercelApp, "2001:db8:1234:56ff::ffff"))).status,
    429,
  );
  assert.equal(
    (await attempt(request(vercelApp, "2001:db8:1234:5700::1"))).status,
    200,
  );
});
