// Browser-only parsing: return account metadata, never authentication credentials.
export function parseSessionInfo(raw: string): { email: string } {
  if (raw.length > 131072) throw new Error("Session 内容过长，请检查是否复制了正确页面。");
  let value: unknown;
  try {
    value = JSON.parse(raw.trim());
    if (typeof value === "string") value = JSON.parse(value);
  } catch {
    throw new Error("请粘贴有效的 Session JSON 完整内容。");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("请粘贴有效的 Session JSON 完整内容。");
  const session = value as Record<string, unknown>;
  const user = session.user;
  const email = user && typeof user === "object" && !Array.isArray(user) ? (user as Record<string, unknown>).email : undefined;
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("Session 中未找到有效的账号邮箱，请确认已登录 ChatGPT。");
  if (session.expires !== undefined) {
    if (typeof session.expires !== "string" || !Number.isFinite(Date.parse(session.expires))) throw new Error("Session 有效期格式无法识别，请重新获取。");
    if (Date.parse(session.expires) <= Date.now()) throw new Error("Session 已过期，请登录 ChatGPT 后重新获取。");
  }
  return { email: email.trim().toLowerCase() };
}
