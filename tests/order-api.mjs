import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";

const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:5173";
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
async function post(path, data, headers = {}) {
  const response = await fetch(`${origin}${path}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...headers }, body: JSON.stringify(data) });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { error: text }; }
  return { status: response.status, body, cache: response.headers.get("cache-control") };
}
const valid = () => ({ requestId: randomUUID(), lookupKey: randomBytes(24).toString("hex"), planId: "plus", quantity: 1, email: "preview-test@example.com", contactType: "wechat", contact: "synthetic_support", consent: true });
const createPath = "/api/orders";
const queryPath = "/api/orders/lookup";
const homepage = await fetch(origin);
check("homepage serves", () => assert.equal(homepage.status, 200));
let result = await post(createPath, {});
check("incomplete order rejected", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), planId: "fake-plan" });
check("unknown plan rejected", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), price: 1 });
check("client cannot override price", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), quantity: 2 });
check("personal plan quantity validated", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), planId: "business-standard", quantity: 1 });
check("team seats validated", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), email: "not-an-email" });
check("account email validated", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), contact: "" });
check("after-sales contact is required", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), contactType: "email" });
check("unsupported contact method rejected", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), contact: "bad\ncontact" });
check("invalid WeChat contact rejected", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), contactType: "phone", contact: "not-a-phone" });
check("invalid phone rejected", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), contactType: "phone", contact: "1234567890123456" });
check("oversized phone rejected", () => assert.equal(result.status, 400));
const payload = valid();
const first = await post(createPath, payload);
check("order created with server price and pending state", () => {
  assert.equal(first.status, 201, JSON.stringify(first.body));
  assert.equal(first.body.order.total, 179);
  assert.equal(first.body.order.status, "pending_confirmation");
  assert.equal(first.body.order.paymentEnabled, false);
  assert.equal(first.body.order.preview, true);
  assert.match(first.body.order.id, /^MG\d{8}[A-F0-9]{12}$/);
});
check("response masks and omits private data", () => {
  assert.equal(first.body.order.email, "pr***@example.com");
  for (const field of ["contact", "contactType", "contactValue", "note", "lookupHash", "lookupKey", "accountEmail"]) assert.equal(first.body.order[field], undefined);
  assert.equal(first.cache, "no-store");
});
result = await post(createPath, { ...valid(), session: "SYNTHETIC_SESSION_DO_NOT_STORE" });
check("server rejects raw session fields", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), note: "removed-note" });
check("removed notes cannot be submitted", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), contactType: "phone", contact: "+1 (202) 555-0100", email: "aftercare-phone@example.com" });
check("phone contact order accepted without exposing contact", () => {
  assert.equal(result.status, 201);
  assert.equal(result.body.order.contactValue, undefined);
  assert.equal(result.body.order.contactType, undefined);
});
result = await post(createPath, payload);
check("retry creates no duplicate", () => { assert.equal(result.status, 201); assert.equal(result.body.order.id, first.body.order.id); });
result = await post(createPath, { ...payload, lookupKey: randomBytes(24).toString("hex") });
check("request reuse with wrong credential rejected", () => assert.equal(result.status, 409));
result = await post(queryPath, { id: first.body.order.id, lookupKey: randomBytes(24).toString("hex") });
check("wrong lookup key reveals no order", () => { assert.equal(result.status, 404); assert.equal(result.body.order, undefined); });
result = await post(queryPath, { id: first.body.order.id, lookupKey: payload.lookupKey });
check("persisted order found with exact credentials", () => {
  assert.equal(result.status, 200); assert.equal(result.body.order.id, first.body.order.id); assert.equal(result.body.order.total, 179);
  for (const field of ["contact", "contactType", "contactValue"]) assert.equal(result.body.order[field], undefined);
});
result = await post(createPath, { ...valid(), planId: "pro500" });
check("unpriced personal tier remains quote", () => { assert.equal(result.status, 201); assert.equal(result.body.order.total, null); });
result = await post(createPath, { ...valid(), planId: "business-premium", quantity: 3 });
check("team inquiry accepts seats without invented price", () => { assert.equal(result.status, 201); assert.equal(result.body.order.quantity, 3); assert.equal(result.body.order.total, null); });
result = await post(createPath, valid(), { Origin: "https://unrelated.example" });
check("cross-site request rejected", () => assert.equal(result.status, 403));
result = await post(createPath, { ...valid(), note: "a".repeat(9000) });
check("oversized input rejected", () => assert.equal(result.status, 400));
result = await post(createPath, { ...valid(), consent: false });
check("consent is required server-side", () => assert.equal(result.status, 400));
console.log(`${passed} API checks passed. Only synthetic preview records were created.`);
