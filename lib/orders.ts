import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { getPlan } from "@/lib/catalog";

const lookupKeySchema = z.string().regex(/^[a-f0-9]{48}$/);
export const orderInput = z.object({
  requestId: z.string().uuid(),
  lookupKey: lookupKeySchema,
  planId: z.string().max(50),
  quantity: z.number().int().min(1).max(1000),
  email: z.string().trim().email().max(254),
  contactType: z.enum(["wechat", "phone"]),
  contact: z.string().trim().min(3).max(64),
  consent: z.literal(true),
}).strict().superRefine((input, ctx) => {
  const valid = input.contactType === "wechat"
    ? /^[A-Za-z0-9_-]{3,64}$/.test(input.contact)
    : /^\+?[\d ()-]{7,25}$/.test(input.contact) && /^[0-9]{7,15}$/.test(input.contact.replace(/\D/g, ""));
  if (!valid) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contact"], message: "请填写有效的微信号或手机号。" });
});
export const lookupInput = z.object({ id: z.string().regex(/^MG\d{8}[A-F0-9]{12}$/), lookupKey: lookupKeySchema }).strict();

export async function hashKey(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
}

export function publicOrder(order: typeof orders.$inferSelect) {
  const [local, domain] = order.accountEmail.split("@");
  return {
    id: order.id, planName: order.planName, quantity: order.quantity,
    unitPrice: order.unitPriceCents === null ? null : order.unitPriceCents / 100,
    total: order.unitPriceCents === null ? null : order.unitPriceCents * order.quantity / 100,
    email: `${local.slice(0, Math.min(2, local.length))}***@${domain}`,
    status: order.status, createdAt: order.createdAt,
    paymentEnabled: false, preview: true,
  };
}

export async function createOrder(input: z.infer<typeof orderInput>) {
  const plan = getPlan(input.planId);
  if (!plan || (plan.audience === "personal" && input.quantity !== 1) || (plan.audience === "team" && input.quantity < 2)) throw new Error("INVALID_PLAN");
  const db = getDb();
  const lookupHash = await hashKey(input.lookupKey);
  const existing = await db.select().from(orders).where(eq(orders.requestId, input.requestId)).get();
  if (existing) {
    if (existing.lookupHash !== lookupHash) throw new Error("REQUEST_CONFLICT");
    return publicOrder(existing);
  }
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const id = `MG${date}${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  const order = {
    id, requestId: input.requestId, lookupHash,
    planId: plan.id, planName: plan.name, unitPriceCents: plan.price === null ? null : plan.price * 100,
    quantity: input.quantity, accountEmail: input.email, contactType: input.contactType,
    contactValue: input.contact, note: "", status: "pending_confirmation", createdAt: now.toISOString(),
  };
  await db.insert(orders).values(order).onConflictDoNothing({ target: orders.requestId });
  const saved = await db.select().from(orders).where(eq(orders.requestId, input.requestId)).get();
  if (!saved || saved.lookupHash !== lookupHash) throw new Error("REQUEST_CONFLICT");
  return publicOrder(saved);
}

export async function findOrder(input: z.infer<typeof lookupInput>) {
  const lookupHash = await hashKey(input.lookupKey);
  const order = await getDb().select().from(orders).where(and(eq(orders.id, input.id), eq(orders.lookupHash, lookupHash))).get();
  return order ? publicOrder(order) : null;
}

export const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export async function readInput(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new Error("BAD_ORIGIN");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("BAD_INPUT");
  if (Number(request.headers.get("content-length") || 0) > 8192) throw new Error("BAD_INPUT");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("BAD_INPUT");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new Error("BAD_INPUT"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error("BAD_INPUT"); }
}

export function errorReply(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "BAD_ORIGIN") return reply({ error: "请从本站提交请求。" }, 403);
  if (["BAD_INPUT", "INVALID_PLAN"].includes(code)) return reply({ error: "请检查套餐、账号邮箱与售后联系方式后重试。" }, 400);
  if (code === "REQUEST_CONFLICT") return reply({ error: "本次提交编号已使用，请关闭窗口后重新下单。" }, 409);
  return reply({ error: "订单服务暂时不可用，请稍后重试。" }, 503);
}
