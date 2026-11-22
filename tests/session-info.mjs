import assert from "node:assert/strict";
import { parseSessionInfo } from "../lib/session-info.ts";

const fixture = { user: { email: "preview-only@example.com", name: "Preview" }, accessToken: "SYNTHETIC_ACCESS_NOT_A_REAL_CREDENTIAL", sessionToken: "SYNTHETIC_SESSION_NOT_A_REAL_CREDENTIAL", expires: "2099-01-01T00:00:00.000Z" };
assert.deepEqual(parseSessionInfo(JSON.stringify(fixture)), { email: "preview-only@example.com" });
assert.deepEqual(parseSessionInfo(JSON.stringify(JSON.stringify(fixture))), { email: "preview-only@example.com" });
assert.deepEqual(parseSessionInfo(JSON.stringify({ user: { email: " TEST@EXAMPLE.COM " } })), { email: "test@example.com" });
assert.throws(() => parseSessionInfo("not json"), /有效的 Session JSON/);
assert.throws(() => parseSessionInfo("{}"), /账号邮箱/);
assert.throws(() => parseSessionInfo("[]"), /Session JSON/);
assert.throws(() => parseSessionInfo(JSON.stringify({ user: { email: "invalid-email" } })), /账号邮箱/);
assert.throws(() => parseSessionInfo(JSON.stringify({ ...fixture, expires: "2000-01-01T00:00:00.000Z" })), /已过期/);
assert.throws(() => parseSessionInfo(JSON.stringify({ ...fixture, expires: "invalid-date" })), /有效期/);
assert.throws(() => parseSessionInfo("a".repeat(131073)), /内容过长/);
console.log("10 local Session parsing checks passed; only synthetic fixtures were used.");
